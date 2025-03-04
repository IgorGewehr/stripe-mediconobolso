// actions/stripe.js
'use server';

import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid }) {
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
    metadata: { uid }, // vincula a sessão ao usuário
    return_url: `${origin}/`, // redireciona para a home
  });

  return session.client_secret;
}
