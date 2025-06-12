// app/api/webhook/route.js - VERSÃO COMPLETA COM SUPORTE A BOLETO
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
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, userData, { merge: true });
      }

      console.log(`✅ Usuário ${uid} atualizado com sucesso (tentativa ${attempt + 1})`);
      return true;
    } catch (error) {
      attempt++;
      console.error(`❌ Tentativa ${attempt} falhou: ${error.message}`);

      if (attempt >= maxRetries) {
        try {
          await firebaseService.editUserData(uid, userData);
          console.log(`✅ Usuário ${uid} atualizado via firebaseService após ${maxRetries} falhas diretas`);
          return true;
        } catch (serviceError) {
          console.error(`❌❌ Erro FATAL ao atualizar usuário: ${serviceError.message}`);
          throw serviceError;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Função para enviar emails de boas-vindas se necessário
async function sendWelcomeEmailIfNeeded(uid, customerEmail, customerName) {
  if (!customerEmail) {
    console.log('📧 Email não fornecido, não é possível enviar boas-vindas');
    return;
  }

  try {
    // Verificar se já enviamos email para este usuário
    const userData = await firebaseService.getUserData(uid);
    if (userData.welcomeEmailSent) {
      console.log(`📧 Email de boas-vindas já enviado para ${customerEmail}`);
      return;
    }

    console.log('📧 Enviando email de boas-vindas para:', customerEmail);
    const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;
    const welcomeName = customerName || customerEmail.split('@')[0];

    const emailResult = await sendWelcomeEmail(customerEmail, welcomeName, appLink);

    if (emailResult.success) {
      console.log('✅ Email de boas-vindas enviado com sucesso!');
      // Marcar como enviado
      await updateUserWithRetry(uid, { welcomeEmailSent: true });
    } else {
      console.error('❌ Falha ao enviar email de boas-vindas:', emailResult.error);
    }
  } catch (error) {
    console.error('❌ Erro ao processar envio de email:', error);
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

// Função principal para processar o evento - VERSÃO COMPLETA COM BOLETO
async function processEvent(event) {
  console.log(`🔔 Processando evento Stripe: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Checkout session completed, status: ${session.payment_status}`);
        console.log('📋 SESSÃO ID:', session.id);
        console.log('🔑 METADADOS:', JSON.stringify(session.metadata));
        console.log('💳 MÉTODO DE PAGAMENTO:', session.payment_method_types);

        // Verificar idempotência
        if (session.metadata && session.metadata.processed === 'true') {
          console.log(`⏭️ Evento já processado anteriormente: ${session.id}`);
          return { success: true, message: 'Já processado' };
        }

        // Obter email e nome do cliente
        let customerEmail = session.customer_email;
        let customerName = session.customer_details?.name;

        if (!customerEmail && session.customer) {
          try {
            const customer = await stripe.customers.retrieve(session.customer);
            customerEmail = customer.email;
            customerName = customerName || customer.name;
          } catch (err) {
            console.warn('Erro ao buscar dados do customer:', err);
          }
        }

        if (session.metadata && session.metadata.uid) {
          const uid = session.metadata.uid;
          console.log(`🔄 Atualizando usuário ${uid} com dados do checkout`);

          // Extrair informações de endereço do cliente
          const address = session.customer_details?.address || {};
          console.log('🏠 ENDEREÇO ENCONTRADO:', JSON.stringify(address));

          // Extrair CPF do campo personalizado
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

          // 🆕 DETECTAR TIPO DE PAGAMENTO
          const isCardPayment = session.payment_method_types?.includes('card');
          const isBoletoPayment = session.payment_method_types?.includes('boleto');

          console.log(`💳 Tipo de pagamento: ${isCardPayment ? 'CARTÃO' : ''} ${isBoletoPayment ? 'BOLETO' : ''}`);

          // Preparar dados baseado no status do pagamento
          let userData = {
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
            updatedAt: new Date(),
            paymentMethod: isBoletoPayment ? 'boleto' : 'card'
          };

          // 🆕 LÓGICA ESPECÍFICA PARA CADA TIPO DE PAGAMENTO
          if (session.payment_status === 'paid') {
            // Pagamento confirmado (cartão ou boleto pago)
            userData.assinouPlano = true;
            userData.paymentConfirmedAt = new Date();

            console.log(`✅ Pagamento confirmado para usuário ${uid}`);

            // 🔧 CORREÇÃO: Só enviar email de boas-vindas se pagamento foi confirmado
            await sendWelcomeEmailIfNeeded(uid, customerEmail, customerName);

          } else if (session.payment_status === 'unpaid' && isBoletoPayment) {
            // Boleto gerado mas não pago ainda
            userData.assinouPlano = false;
            userData.boletoGenerated = true;
            userData.boletoGeneratedAt = new Date();
            userData.awaitingBoletoPayment = true;

            console.log(`📄 Boleto gerado para usuário ${uid}, aguardando pagamento`);

            // ❌ NÃO enviar email de boas-vindas aqui para boleto não pago

          } else {
            // Outros status
            userData.assinouPlano = false;
            userData.checkoutStatus = session.payment_status;
            console.log(`⏳ Status de pagamento: ${session.payment_status} para usuário ${uid}`);
          }

          console.log('📊 DADOS PARA ATUALIZAÇÃO:', JSON.stringify(userData));

          try {
            await updateUserWithRetry(uid, userData);

            // Marcar como processado
            try {
              await stripe.checkout.sessions.update(session.id, {
                metadata: { ...session.metadata, processed: 'true' }
              });
            } catch (markError) {
              console.error('⚠️ Erro ao marcar sessão como processada:', markError);
            }
          } catch (updateError) {
            console.error('❌ Falha ao atualizar usuário:', updateError);
            throw updateError;
          }
        } else {
          console.error('❌ UID não encontrado nos metadados da sessão!');
          throw new Error('UID não encontrado nos metadados da sessão');
        }
        break;
      }

        // 🆕 EVENTO ESPECÍFICO PARA PAGAMENTO DE BOLETO
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💰 Invoice paid for customer: ${invoice.customer}, amount: ${invoice.amount_paid}`);

        // Verificar se é pagamento de boleto
        let paymentMethod = null;
        if (invoice.charge) {
          try {
            const charge = await stripe.charges.retrieve(invoice.charge);
            paymentMethod = charge.payment_method_details?.type;
            console.log(`💳 Método de pagamento da invoice: ${paymentMethod}`);
          } catch (chargeError) {
            console.warn('Erro ao buscar detalhes do charge:', chargeError);
          }
        }

        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;

            const paymentData = {
              assinouPlano: true,
              lastPaymentDate: new Date(),
              lastInvoiceId: invoice.id,
              paymentConfirmedAt: new Date()
            };

            // 🆕 Se foi boleto, marcar especificamente
            if (paymentMethod === 'boleto') {
              paymentData.boletoPaymentConfirmed = true;
              paymentData.awaitingBoletoPayment = false;
              console.log(`📄✅ Boleto pago confirmado para usuário ${uid}`);

              // 🆕 CRITICAL: Enviar email de boas-vindas quando boleto é pago
              try {
                const userData = await firebaseService.getUserData(uid);
                await sendWelcomeEmailIfNeeded(uid, userData.email, userData.fullName);
              } catch (userError) {
                console.warn('Erro ao buscar dados do usuário para email:', userError);
              }
            }

            await updateUserWithRetry(uid, paymentData);
            console.log(`✅ Pagamento registrado para usuário ${uid}`);
          } else {
            // Tentar via customer
            const customer = await stripe.customers.retrieve(invoice.customer);
            if (customer && customer.metadata && customer.metadata.uid) {
              const uid = customer.metadata.uid;

              const paymentData = {
                assinouPlano: true,
                lastPaymentDate: new Date(),
                lastInvoiceId: invoice.id,
                paymentConfirmedAt: new Date()
              };

              if (paymentMethod === 'boleto') {
                paymentData.boletoPaymentConfirmed = true;
                paymentData.awaitingBoletoPayment = false;

                // Enviar email de boas-vindas
                try {
                  await sendWelcomeEmailIfNeeded(uid, customer.email, customer.name);
                } catch (userError) {
                  console.warn('Erro ao enviar email via customer:', userError);
                }
              }

              await updateUserWithRetry(uid, paymentData);
              console.log(`✅ Pagamento registrado para usuário ${uid} (via customer)`);
            }
          }
        }
        break;
      }

        // 🆕 EVENTO PARA FALHA DE PAGAMENTO DE BOLETO
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`⚠️ Payment failed for customer: ${invoice.customer}, attempt: ${invoice.attempt_count}`);

        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            if (subscription.metadata && subscription.metadata.uid) {
              const uid = subscription.metadata.uid;

              const failureData = {
                paymentIssue: true,
                lastFailedPayment: new Date(),
                paymentAttemptCount: invoice.attempt_count
              };

              // Se era boleto, marcar especificamente
              if (invoice.payment_intent) {
                try {
                  const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
                  if (paymentIntent.payment_method_types?.includes('boleto')) {
                    failureData.boletoExpired = true;
                    failureData.awaitingBoletoPayment = false;
                    console.log(`📄❌ Boleto expirado para usuário ${uid}`);
                  }
                } catch (piError) {
                  console.warn('Erro ao verificar payment intent:', piError);
                }
              }

              await updateUserWithRetry(uid, failureData);
              console.log(`⚠️ Falha de pagamento registrada para usuário ${uid}`);
            } else {
              // Tentar via customer
              const customer = await stripe.customers.retrieve(invoice.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;

                const failureData = {
                  paymentIssue: true,
                  lastFailedPayment: new Date(),
                  paymentAttemptCount: invoice.attempt_count
                };

                await updateUserWithRetry(uid, failureData);
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

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log(`✨ Subscription created for customer: ${subscription.customer}`);

        let customerEmail = '';
        let customerName = '';
        let uid = '';

        if (subscription.metadata && subscription.metadata.uid) {
          uid = subscription.metadata.uid;
        } else {
          const customer = await stripe.customers.retrieve(subscription.customer);
          customerEmail = customer.email;
          customerName = customer.name;

          if (customer && customer.metadata && customer.metadata.uid) {
            uid = customer.metadata.uid;
          } else {
            throw new Error('UID não encontrado para nova assinatura');
          }
        }

        if (uid) {
          const subscriptionData = {
            subscriptionCreatedAt: new Date(),
            subscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            planType: subscription.metadata.plan || 'monthly'
          };

          // ⚠️ NÃO marcar como assinouPlano=true aqui para boleto
          // Só marcar quando o pagamento for confirmado

          await updateUserWithRetry(uid, subscriptionData);
          console.log(`✅ Assinatura criada para usuário ${uid}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`⛔ Subscription canceled for customer: ${subscription.customer}`);

        if (subscription.metadata && subscription.metadata.uid) {
          const uid = subscription.metadata.uid;
          await updateUserWithRetry(uid, {
            assinouPlano: false,
            canceledAt: new Date(),
            cancellationReason: subscription.cancellation_details?.reason || 'unknown'
          });
          console.log(`✅ Assinatura cancelada para usuário ${uid}`);
        } else {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer && customer.metadata && customer.metadata.uid) {
            const uid = customer.metadata.uid;
            await updateUserWithRetry(uid, {
              assinouPlano: false,
              canceledAt: new Date(),
              cancellationReason: subscription.cancellation_details?.reason || 'unknown'
            });
            console.log(`✅ Assinatura cancelada para usuário ${uid} (via customer)`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`🔄 Subscription updated for customer: ${subscription.customer}`);

        const updatedData = {
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status
        };

        if (subscription.items && subscription.items.data.length > 0) {
          const price = subscription.items.data[0].price;
          if (price && price.metadata && price.metadata.plan) {
            updatedData.planType = price.metadata.plan;
          }
        }

        if (subscription.metadata && subscription.metadata.uid) {
          const uid = subscription.metadata.uid;
          await updateUserWithRetry(uid, updatedData);
          console.log(`✅ Assinatura atualizada para usuário ${uid}`);
        } else {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer && customer.metadata && customer.metadata.uid) {
            const uid = customer.metadata.uid;
            await updateUserWithRetry(uid, updatedData);
            console.log(`✅ Assinatura atualizada para usuário ${uid} (via customer)`);
          }
        }
        break;
      }

        // 🆕 EVENTOS ADICIONAIS PARA PAYMENT INTENT (boleto)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`💰 Payment Intent succeeded: ${paymentIntent.id}`);

        // Este evento pode ser útil como backup para detectar pagamentos de boleto
        if (paymentIntent.payment_method_types?.includes('boleto')) {
          console.log(`📄 Boleto pago detectado via payment_intent: ${paymentIntent.id}`);
          // A lógica principal já está no invoice.payment_succeeded
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`❌ Payment Intent failed: ${paymentIntent.id}`);

        if (paymentIntent.payment_method_types?.includes('boleto')) {
          console.log(`📄❌ Boleto expirado detectado via payment_intent: ${paymentIntent.id}`);
          // A lógica principal já está no invoice.payment_failed
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        // Aqui o boleto foi pago
        const session = event.data.object;
        const uid = session.metadata.uid;
        console.log(`📄✅ Boleto confirmado via async_payment: session ${session.id}`);
        await updateUserWithRetry(uid, {
          assinouPlano: true,
          paymentConfirmedAt: new Date(),
          boletoPaymentConfirmed: true,
          awaitingBoletoPayment: false
        });
        await sendWelcomeEmailIfNeeded(uid, session.customer_email, session.customer_details?.name);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        // Aqui o boleto expirou / falhou
        const session = event.data.object;
        const uid = session.metadata.uid;
        console.log(`📄❌ Boleto expirado via async_payment: session ${session.id}`);
        await updateUserWithRetry(uid, {
          paymentIssue: true,
          boletoExpired: true,
          awaitingBoletoPayment: false
        });
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

    if (!payload || !sig) {
      console.error('❌ Webhook Error: Payload ou assinatura ausentes');
      return NextResponse.json(
          { message: 'Webhook Error: Payload ou assinatura ausentes' },
          { status: 400 }
      );
    }

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

  console.log(`🔔 Recebido evento Stripe: ${event.type}`);

  // 🆕 EVENTOS COMPLETOS PARA BOLETO E CARTÃO
  const permittedEvents = [
    'checkout.session.completed',
    'customer.subscription.deleted',
    'checkout.session.async_payment_failed',
    'checkout.session.async_payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'invoice.payment_succeeded',  // ✅ Essencial para boleto
    'payment_intent.succeeded',   // ✅ Backup para boleto
    'payment_intent.payment_failed' // ✅ Para boleto expirado
  ];

  if (permittedEvents.includes(event.type)) {
    try {
      await processEventWithTimeout(event);
      return NextResponse.json({ message: 'Processed' }, { status: 200 });
    } catch (error) {
      console.error("❌ Erro no processamento do webhook:", error);
      return NextResponse.json(
          { message: 'Webhook received but had processing errors' },
          { status: 200 }
      );
    }
  } else {
    console.log(`⏭️ Evento não tratado: ${event.type}`);
    return NextResponse.json({ message: 'Received' }, { status: 200 });
  }
}