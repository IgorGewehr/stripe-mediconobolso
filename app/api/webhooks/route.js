// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';
import { firestore } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log(`Checkout session completed, status: ${session.payment_status}`);
          console.log('Session metadata:', session.metadata);

          // Atualiza o status de assinatura para "true" no documento do usuário
          if (session.metadata && session.metadata.uid) {
            const uid = session.metadata.uid;
            console.log(`Atualizando usuário ${uid} para assinouPlano=true`);

            try {
              // Tentativa 1: Usando o firebaseService
              await firebaseService.editUserData(uid, { assinouPlano: true });
              console.log(`Usuário ${uid} atualizado com sucesso via firebaseService`);
            } catch (serviceError) {
              console.error(`Erro ao atualizar via firebaseService: ${serviceError.message}`);

              try {
                // Tentativa 2: Tentando diretamente via Firestore
                const userRef = doc(firestore, "users", uid);
                await updateDoc(userRef, { assinouPlano: true });
                console.log(`Usuário ${uid} atualizado com sucesso via Firestore direto`);
              } catch (directError) {
                console.error(`Erro ao atualizar diretamente via Firestore: ${directError.message}`);
                throw directError;
              }
            }
          } else {
            console.error('UID não encontrado nos metadados da sessão!');
            console.log('Metadados completos:', JSON.stringify(session.metadata));
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