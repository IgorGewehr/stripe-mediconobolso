// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';
import { firestore } from '../../../lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { sendWelcomeEmail } from '../../../lib/emailService';

// Função auxiliar para atualização com retry
async function updateUserWithRetry(uid, userData, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Verificar se o documento existe antes de tentar atualizar
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Se existir, usar updateDoc
        await updateDoc(userRef, userData);
      } else {
        // Se não existir, usar setDoc com merge: true para criar
        await setDoc(userRef, userData, { merge: true });
      }

      console.log(`✅ Usuário ${uid} atualizado com sucesso (tentativa ${attempt + 1})`);
      return true;
    } catch (error) {
      attempt++;
      console.error(`❌ Tentativa ${attempt} falhou: ${error.message}`);

      if (attempt >= maxRetries) {
        // Última alternativa: tentar via firebaseService
        try {
          await firebaseService.editUserData(uid, userData);
          console.log(`✅ Usuário ${uid} atualizado via firebaseService após ${maxRetries} falhas diretas`);
          return true;
        } catch (serviceError) {
          console.error(`❌❌ Erro FATAL ao atualizar usuário: ${serviceError.message}`);
          throw serviceError;
        }
      }

      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Função para processar eventos com timeout
async function processEventWithTimeout(event, timeoutMs = 25000) {
  return Promise.race([
    processEvent(event),
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Webhook processing timeout')), timeoutMs)
    )
  ]);
}

// Função principal para processar o evento
async function processEvent(event) {
  console.log(`🔔 Processando evento Stripe: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Checkout session completed, status: ${session.payment_status}`);
        console.log('📋 SESSÃO ID:', session.id);
        console.log('🔑 METADADOS:', JSON.stringify(session.metadata));

        // Verificar idempotência - evitar processamento duplicado
        if (session.metadata && session.metadata.processed === 'true') {
          console.log(`⏭️ Evento já processado anteriormente: ${session.id}`);
          return { success: true, message: 'Já processado' };
        }

        // Obter email e nome do cliente
        let customerEmail = session.customer_email;
        let customerName = session.customer_details?.name;

        // Se não tiver o email na sessão, buscar do customer
        if (!customerEmail && session.customer) {
          try {
            const customer = await stripe.customers.retrieve(session.customer);
            customerEmail = customer.email;
            customerName = customerName || customer.name;
          } catch (err) {
            console.warn('Erro ao buscar dados do customer:', err);
          }
        }

        // Atualiza o status de assinatura e dados do usuário
        if (session.metadata && session.metadata.uid) {
          const uid = session.metadata.uid;
          console.log(`🔄 Atualizando usuário ${uid} com dados do checkout`);

          // Extrair informações de endereço do cliente
          const address = session.customer_details?.address || {};
          console.log('🏠 ENDEREÇO ENCONTRADO:', JSON.stringify(address));

          // Extrair CPF do campo personalizado
          console.log('🔑 CAMPOS PERSONALIZADOS:', JSON.stringify(session.custom_fields));
          let cpf = '';
          try {
            if (session.custom_fields && Array.isArray(session.custom_fields)) {
              const cpfField = session.custom_fields.find(field => field.key === 'cpf');
              cpf = cpfField?.text?.value || '';
              console.log('📝 CPF ENCONTRADO:', cpf);
            }
          } catch (cpfError) {
            console.error('❌ Erro ao extrair CPF:', cpfError);
          }

          // Preparar objeto de dados para atualização
          const userData = {
            assinouPlano: true,
            planType: session.metadata.plan || 'monthly',
            address: {
              street: address.line1 || '',
              complement: address.line2 || '',
              city: address.city || '',
              state: address.state || '',
              postalCode: address.postal_code || '',
              country: address.country || 'BR',
            },
            cpf: cpf,
            updatedAt: new Date()
          };

          console.log('📊 DADOS PARA ATUALIZAÇÃO:', JSON.stringify(userData));

          // Tenta atualizar com retry
          try {
            await updateUserWithRetry(uid, userData);

            // ✨ ENVIAR EMAIL DE BOAS-VINDAS ✨
            if (customerEmail) {
              console.log('📧 Enviando email de boas-vindas para:', customerEmail);
              const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/dashboard`;

              // Usar o nome encontrado ou um fallback baseado no email
              const welcomeName = customerName || customerEmail.split('@')[0];

              const emailResult = await sendWelcomeEmail(customerEmail, welcomeName, appLink);

              if (emailResult.success) {
                console.log('✅ Email de boas-vindas enviado com sucesso!');
              } else {
                console.error('❌ Falha ao enviar email de boas-vindas:', emailResult.error);
                // Não interrompe o processamento se o email falhar
              }
            } else {
              console.warn('⚠️ Email do cliente não encontrado para envio de boas-vindas');
            }

            // Marcar como processado para garantir idempotência
            try {
              await stripe.checkout.sessions.update(session.id, {
                metadata: { ...session.metadata, processed: 'true' }
              });
            } catch (markError) {
              console.error('⚠️ Erro ao marcar sessão como processada:', markError);
            }
          } catch (updateError) {
            console.error('❌ Falha em todas as tentativas de atualização:', updateError);
            // Tentar pelo menos atualizar o status de assinatura
            try {
              await updateUserWithRetry(uid, { assinouPlano: true });
              console.log('⚠️ Apenas status de assinatura atualizado após falhas');
            } catch (finalError) {
              console.error('❌❌❌ Falha completa em atualizar o usuário:', finalError);
              throw finalError;
            }
          }
        } else {
          console.error('❌ UID não encontrado nos metadados da sessão!');
          console.log('🔍 Metadados completos:', JSON.stringify(session.metadata));
          throw new Error('UID não encontrado nos metadados da sessão');
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log(`✨ Subscription created for customer: ${subscription.customer}`);
        console.log('📋 Subscription metadata:', JSON.stringify(subscription.metadata));

        // Obter email e nome do cliente
        let customerEmail = '';
        let customerName = '';
        let uid = '';

        // Tentativa 1: Verificar metadados da subscription
        if (subscription.metadata && subscription.metadata.uid) {
          uid = subscription.metadata.uid;
        }
        // Tentativa 2: Buscar cliente no Stripe
        else {
          console.log('🔍 Buscando cliente no Stripe:', subscription.customer);
          try {
            const customer = await stripe.customers.retrieve(subscription.customer);
            customerEmail = customer.email;
            customerName = customer.name;

            if (customer && customer.metadata && customer.metadata.uid) {
              uid = customer.metadata.uid;
            } else {
              console.log('❓ Não foi possível encontrar o UID nos metadados do customer');
              throw new Error('UID não encontrado para nova assinatura');
            }
          } catch (err) {
            console.error('❌ Erro ao buscar cliente no Stripe:', err);
            throw err;
          }
        }

        // Se temos UID, processar
        if (uid) {
          const subscriptionData = {
            assinouPlano: true,
            subscriptionCreatedAt: new Date(),
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            planType: subscription.metadata.plan || 'monthly'
          };

          await updateUserWithRetry(uid, subscriptionData);
          console.log(`✅ Assinatura criada para usuário ${uid}`);

          // ✨ ENVIAR EMAIL DE BOAS-VINDAS (se ainda não foi enviado no checkout.session.completed) ✨
          if (customerEmail) {
            console.log('📧 Enviando email de boas-vindas para:', customerEmail);
            const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/dashboard`;

            // Usar o nome encontrado ou um fallback baseado no email
            const welcomeName = customerName || customerEmail.split('@')[0];

            const emailResult = await sendWelcomeEmail(customerEmail, welcomeName, appLink);

            if (emailResult.success) {
              console.log('✅ Email de boas-vindas enviado com sucesso!');
            } else {
              console.error('❌ Falha ao enviar email de boas-vindas:', emailResult.error);
              // Não interrompe o processamento se o email falhar
            }
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`💰 Invoice paid for customer: ${invoice.customer}, amount: ${invoice.amount_paid}`);

        // Obter assinatura associada à fatura
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Tentar obter UID dos metadados da assinatura
          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;

            // Atualizar dados do usuário
            await updateUserWithRetry(uid, {
              assinouPlano: true,
              lastPaymentDate: new Date(),
              lastInvoiceId: invoice.id
            });

            console.log(`✅ Pagamento registrado para usuário ${uid}`);
          } else {
            // Se não encontrou nos metadados da assinatura, buscar no cliente
            const customer = await stripe.customers.retrieve(invoice.customer);
            if (customer && customer.metadata && customer.metadata.uid) {
              const uid = customer.metadata.uid;

              await updateUserWithRetry(uid, {
                assinouPlano: true,
                lastPaymentDate: new Date(),
                lastInvoiceId: invoice.id
              });

              console.log(`✅ Pagamento registrado para usuário ${uid} (via customer)`);
            } else {
              console.log('❓ Não foi possível encontrar o UID para registrar pagamento');
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`⛔ Subscription canceled for customer: ${subscription.customer}`);

        // Tentativa 1: Verificar metadados da subscription
        if (subscription.metadata && subscription.metadata.uid) {
          const uid = subscription.metadata.uid;
          await updateUserWithRetry(uid, {
            assinouPlano: false,
            canceledAt: new Date(),
            cancellationReason: subscription.cancellation_details?.reason || 'unknown'
          });
          console.log(`✅ Assinatura cancelada para usuário ${uid}`);
        }
        // Tentativa 2: Buscar cliente no Stripe
        else {
          console.log('🔍 Buscando cliente no Stripe:', subscription.customer);
          try {
            const customer = await stripe.customers.retrieve(subscription.customer);
            if (customer && customer.metadata && customer.metadata.uid) {
              const uid = customer.metadata.uid;
              await updateUserWithRetry(uid, {
                assinouPlano: false,
                canceledAt: new Date(),
                cancellationReason: subscription.cancellation_details?.reason || 'unknown'
              });
              console.log(`✅ Assinatura cancelada para usuário ${uid} (via customer)`);
            } else {
              console.log('❓ Não foi possível encontrar o UID nos metadados do customer');
              throw new Error('UID não encontrado para cancelamento');
            }
          } catch (err) {
            console.error('❌ Erro ao buscar cliente no Stripe:', err);
            throw err;
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`⚠️ Payment failed for customer: ${invoice.customer}, attempt: ${invoice.attempt_count}`);

        // Buscar cliente ou assinatura para atualizar o status
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            if (subscription.metadata && subscription.metadata.uid) {
              const uid = subscription.metadata.uid;
              await updateUserWithRetry(uid, {
                paymentIssue: true,
                lastFailedPayment: new Date(),
                paymentAttemptCount: invoice.attempt_count
              });
              console.log(`⚠️ Falha de pagamento registrada para usuário ${uid}`);
            } else {
              const customer = await stripe.customers.retrieve(invoice.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;
                await updateUserWithRetry(uid, {
                  paymentIssue: true,
                  lastFailedPayment: new Date(),
                  paymentAttemptCount: invoice.attempt_count
                });
                console.log(`⚠️ Falha de pagamento registrada para usuário ${uid} (via customer)`);
              }
            }
          } catch (err) {
            console.error('❌ Erro ao processar falha de pagamento:', err);
            throw err;
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`🔄 Subscription updated for customer: ${subscription.customer}`);

        // Dados atualizados da assinatura
        const updatedData = {
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status
        };

        // Verificar se o plano foi alterado
        if (subscription.items && subscription.items.data.length > 0) {
          const price = subscription.items.data[0].price;
          if (price && price.metadata && price.metadata.plan) {
            updatedData.planType = price.metadata.plan;
          }
        }

        // Tentativa 1: Verificar metadados da subscription
        if (subscription.metadata && subscription.metadata.uid) {
          const uid = subscription.metadata.uid;
          await updateUserWithRetry(uid, updatedData);
          console.log(`✅ Assinatura atualizada para usuário ${uid}`);
        }
        // Tentativa 2: Buscar cliente no Stripe
        else {
          try {
            const customer = await stripe.customers.retrieve(subscription.customer);
            if (customer && customer.metadata && customer.metadata.uid) {
              const uid = customer.metadata.uid;
              await updateUserWithRetry(uid, updatedData);
              console.log(`✅ Assinatura atualizada para usuário ${uid} (via customer)`);
            } else {
              console.log('❓ Não foi possível encontrar o UID nos metadados do customer');
            }
          } catch (err) {
            console.error('❌ Erro ao buscar cliente no Stripe:', err);
            throw err;
          }
        }
        break;
      }

      default:
        console.log(`⏭️ Evento não tratado: ${event.type}`);
        break;
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Erro processando evento ${event.type}:`, error);
    throw error;
  }
}

export async function POST(req) {
  let event;

  try {
    const payload = await req.text();
    const sig = (await headers()).get('stripe-signature');

    // Verificar se temos os dados necessários
    if (!payload || !sig) {
      console.error('❌ Webhook Error: Payload ou assinatura ausentes');
      return NextResponse.json(
          { message: 'Webhook Error: Payload ou assinatura ausentes' },
          { status: 400 }
      );
    }

    // Construir o evento com a assinatura verificada
    event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err.message;
    console.error(`❌ Webhook Error: ${errorMessage}`);
    return NextResponse.json(
        { message: `Webhook Error: ${errorMessage}` },
        { status: 400 }
    );
  }

  // Log para debug
  console.log(`🔔 Recebido evento Stripe: ${event.type}`);

  // Eventos que queremos tratar
  const permittedEvents = [
    'checkout.session.completed',
    'customer.subscription.deleted',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'invoice.paid'
  ];

  if (permittedEvents.includes(event.type)) {
    try {
      // Processar o evento com timeout
      await processEventWithTimeout(event);
      return NextResponse.json({ message: 'Processed' }, { status: 200 });
    } catch (error) {
      console.error("❌ Erro no processamento do webhook:", error);
      // Falhas no processamento de webhook retornam 200 para o Stripe não tentar novamente
      // O ideal é implementar uma fila para reprocessamento interno
      return NextResponse.json(
          { message: 'Webhook received but had processing errors' },
          { status: 200 }
      );
    }
  } else {
    // Eventos não tratados também retornam 200
    console.log(`⏭️ Evento não tratado: ${event.type}`);
    return NextResponse.json({ message: 'Received' }, { status: 200 });
  }
}