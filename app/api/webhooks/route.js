// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';
import { firestore } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Função auxiliar para atualização com retry
async function updateUserWithRetry(uid, userData, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Tentar usar o método direto do Firestore primeiro (mais confiável)
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, userData);
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

export async function POST(req) {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
        await req.text(),
        (await headers()).get('stripe-signature'),
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
    'customer.subscription.created'
  ];

  if (permittedEvents.includes(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log(`✅ Checkout session completed, status: ${session.payment_status}`);
          console.log('📋 SESSÃO ID:', session.id);
          console.log('🔑 METADADOS:', JSON.stringify(session.metadata));

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
            } catch (updateError) {
              console.error('❌ Falha em todas as tentativas de atualização:', updateError);
              // Tentar pelo menos atualizar o status de assinatura
              try {
                await updateUserWithRetry(uid, { assinouPlano: true });
                console.log('⚠️ Apenas status de assinatura atualizado após falhas');
              } catch (finalError) {
                console.error('❌❌❌ Falha completa em atualizar o usuário:', finalError);
              }
            }
          } else {
            console.error('❌ UID não encontrado nos metadados da sessão!');
            console.log('🔍 Metadados completos:', JSON.stringify(session.metadata));
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log(`⛔ Subscription canceled for customer: ${subscription.customer}`);

          // Tentativa 1: Verificar metadados da subscription
          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;
            await updateUserWithRetry(uid, { assinouPlano: false });
            console.log(`✅ Assinatura cancelada para usuário ${uid}`);
          }
          // Tentativa 2: Buscar cliente no Stripe
          else {
            console.log('🔍 Buscando cliente no Stripe:', subscription.customer);
            try {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;
                await updateUserWithRetry(uid, { assinouPlano: false });
                console.log(`✅ Assinatura cancelada para usuário ${uid} (via customer)`);
              } else {
                console.log('❓ Não foi possível encontrar o UID nos metadados do customer');
              }
            } catch (err) {
              console.error('❌ Erro ao buscar cliente no Stripe:', err);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log(`⚠️ Payment failed for customer: ${invoice.customer}`);
          // Apenas log por enquanto, sem ação específica
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object;
          console.log(`✨ Subscription created for customer: ${subscription.customer}`);
          console.log('📋 Subscription metadata:', JSON.stringify(subscription.metadata));

          // Tentativa 1: Verificar metadados da subscription
          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;
            await updateUserWithRetry(uid, { assinouPlano: true });
            console.log(`✅ Assinatura criada para usuário ${uid}`);
          }
          // Tentativa 2: Buscar cliente no Stripe
          else {
            console.log('🔍 Buscando cliente no Stripe:', subscription.customer);
            try {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;
                await updateUserWithRetry(uid, { assinouPlano: true });
                console.log(`✅ Assinatura criada para usuário ${uid} (via customer)`);
              } else {
                console.log('❓ Não foi possível encontrar o UID nos metadados do customer');
              }
            } catch (err) {
              console.error('❌ Erro ao buscar cliente no Stripe:', err);
            }
          }
          break;
        }

        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.error("❌ Erro no processamento do webhook:", error);
      return NextResponse.json({ message: 'Webhook handler failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Received' }, { status: 200 });
}