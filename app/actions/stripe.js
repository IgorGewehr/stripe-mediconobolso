'use server';

import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid, email }) {
  const origin = (await headers()).get('origin');

  // Define o priceId conforme o plano
  let priceId;
  if (plan === "annual") {
    priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl";
  } else {
    priceId = "price_1QyKrNI2qmEooUtqKfgYIemz";
  }

  // Cria a sessão e adiciona em metadata o uid do usuário
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer_email: email,
    metadata: { uid }, // vincula a sessão ao usuário
    return_url: `${origin}/`, // redireciona para a home
    subscription_data: {
      trial_period_days: 7, // Adiciona período de teste de 7 dias
      metadata: { uid }, // Também adiciona o uid nos metadados da subscription
    },
  });

  return session.client_secret;
}