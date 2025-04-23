// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';

// Função de retry para garantir a atualização
async function retryFirebaseUpdate(uid, userData, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await firebaseService.editUserData(uid, userData);
      console.log(`Usuário ${uid} atualizado com sucesso na tentativa ${attempt + 1}`);
      return true;
    } catch (error) {
      attempt++;
      console.error(`Tentativa ${attempt} falhou: ${error.message}`);

      if (attempt >= maxRetries) {
        // Última alternativa: tentar diretamente
        try {
          const userRef = doc(firestore, "users", uid);
          await updateDoc(userRef, userData);
          console.log(`Usuário ${uid} atualizado via Firestore direto após falhas`);
          return true;
        } catch (directError) {
          console.error(`Erro FATAL ao atualizar usuário: ${directError.message}`);
          throw directError;
        }
      }

      // Aguardar antes de tentar novamente
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
    console.error(`Webhook Error: ${errorMessage}`);
    return NextResponse.json(
        { message: `Webhook Error: ${errorMessage}` },
        { status: 400 }
    );
  }

  // Log para debug
  console.log(`Recebido evento Stripe: ${event.type}`);

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
          // No caso 'checkout.session.completed' do webhook
        case 'checkout.session.completed': {
          const session = event.data.object;

          // Log detalhado para debug
          console.log('DADOS COMPLETOS DA SESSÃO:', JSON.stringify(session, null, 2));
          console.log('CUSTOMER DETAILS:', JSON.stringify(session.customer_details, null, 2));
          console.log('CUSTOM FIELDS:', JSON.stringify(session.custom_fields, null, 2));

          console.log(`Checkout session completed, status: ${session.payment_status}`);

          // Atualiza o status de assinatura do usuário
          if (session.metadata && session.metadata.uid) {
            const uid = session.metadata.uid;
            console.log(`Atualizando usuário ${uid} com dados do checkout`);

            // Extrair informações de endereço do cliente
            const address = session.customer_details?.address || {};

            // Extrair CPF do campo personalizado
            let cpf = '';
            try {
              if (session.custom_fields && Array.isArray(session.custom_fields)) {
                const cpfField = session.custom_fields.find(field => field.key === 'cpf');
                cpf = cpfField?.text?.value || '';
                console.log('CPF encontrado:', cpf);
              }
            } catch (err) {
              console.error('Erro ao capturar CPF:', err);
            }

            // Dados completos para atualização
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

            console.log('DADOS PARA ATUALIZAÇÃO:', JSON.stringify(userData, null, 2));

            // MUDANÇA IMPORTANTE: Fazer apenas UMA atualização com TODOS os dados
            try {
              // Usar diretamente o Firestore para garantir a atualização
              const userRef = doc(firestore, "users", uid);
              await updateDoc(userRef, userData);
              console.log(`Usuário ${uid} atualizado com TODOS os dados`);
            } catch (error) {
              console.error(`Erro na atualização: ${error.message}`);

              // Se falhar, tentar apenas o campo assinouPlano como fallback
              try {
                const userRef = doc(firestore, "users", uid);
                await updateDoc(userRef, { assinouPlano: true });
                console.log(`Fallback: assinouPlano atualizado para o usuário ${uid}`);
              } catch (fallbackError) {
                console.error(`ERRO CRÍTICO: ${fallbackError.message}`);
              }
            }
          } else {
            console.error('UID não encontrado nos metadados da sessão!');
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log(`Subscription canceled for customer: ${subscription.customer}`);

          // Tentativa 1: Verificar metadados da subscription
          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;
            await firebaseService.editUserData(uid, { assinouPlano: false });
            console.log(`Assinatura cancelada para usuário ${uid}`);
          }
          // Tentativa 2: Buscar cliente no Stripe
          else {
            console.log('Buscando cliente no Stripe:', subscription.customer);
            try {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;
                await firebaseService.editUserData(uid, { assinouPlano: false });
                console.log(`Assinatura cancelada para usuário ${uid} (via customer)`);
              } else {
                console.log('Não foi possível encontrar o UID nos metadados do customer');
              }
            } catch (err) {
              console.error('Erro ao buscar cliente no Stripe:', err);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log(`Payment failed for customer: ${invoice.customer}`);
          // Apenas log, sem ação adicional por enquanto
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object;
          console.log(`Subscription created for customer: ${subscription.customer}`);
          console.log('Subscription metadata:', subscription.metadata);

          // Tentativa 1: Verificar metadados da subscription
          if (subscription.metadata && subscription.metadata.uid) {
            const uid = subscription.metadata.uid;
            await firebaseService.editUserData(uid, { assinouPlano: true });
            console.log(`Assinatura criada para usuário ${uid}`);
          }
          // Tentativa 2: Buscar cliente no Stripe
          else {
            console.log('Buscando cliente no Stripe:', subscription.customer);
            try {
              const customer = await stripe.customers.retrieve(subscription.customer);
              if (customer && customer.metadata && customer.metadata.uid) {
                const uid = customer.metadata.uid;
                await firebaseService.editUserData(uid, { assinouPlano: true });
                console.log(`Assinatura criada para usuário ${uid} (via customer)`);
              } else {
                console.log('Não foi possível encontrar o UID nos metadados do customer');
              }
            } catch (err) {
              console.error('Erro ao buscar cliente no Stripe:', err);
            }
          }
          break;
        }

        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.error("Erro no processamento do webhook:", error);
      return NextResponse.json({ message: 'Webhook handler failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Received' }, { status: 200 });
}