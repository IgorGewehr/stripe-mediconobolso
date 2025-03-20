// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';
import {doc, setDoc} from "firebase/firestore";
import {useAuth} from "../../components/authProvider";

const auth = useAuth();
const user = auth?.user;
const uid = user.uid;

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
          // Atualiza o status de assinatura para "true" no documento do usuário,
          // utilizando o uid que foi passado na metadata da sessão.
          if (session.metadata && session.metadata.uid) {
            await firebaseService.editUserData(session.metadata.uid, { assinouPlano: true });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log(`Subscription canceled for customer: ${subscription.customer}`);
          // Se a assinatura for cancelada, atualize o status para "false"
          if (subscription.metadata && subscription.metadata.uid) {
            await firebaseService.editUserData(subscription.metadata.uid, { assinouPlano: false });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.log(`Payment failed for customer: ${invoice.customer}`);
          // Aqui você pode notificar o usuário ou atualizar outros campos conforme a necessidade
          break;
        }
        case 'customer.subscription.created': {
          const subscription = event.data.object;
          console.log(`Subscription created for customer: ${subscription.customer}`);
          // Atualiza o status para assinouPlano mesmo que seja período de testes gratuitos
          if (subscription.metadata && subscription.metadata.uid) {
            await firebaseService.editUserData(subscription.metadata.uid, { assinouPlano: true });
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
