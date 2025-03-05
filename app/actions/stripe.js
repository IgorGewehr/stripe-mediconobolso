// actions/stripe.js
'use server';

import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid, email, name }) {
  const origin = (await headers()).get('origin');

  // Define o priceId conforme o plano
  let priceId;
  if (plan === "annual") {
    priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl";
  } else {
    priceId = "price_1QyKrNI2qmEooUtqKfgYIemz";
  }

  // Cria a sessão e adiciona os parâmetros adicionais
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer_email: email,  // Preenche o email do cliente
    metadata: {
      uid,
      customer_name: name  // Armazena o nome para referência
    },
    return_url: `${origin}/`,

    // Customização do lado esquerdo (opcional)
    custom_text: {
      submit: {
        message: "Confirme sua assinatura para acessar todos os recursos!",
      },
    },
    custom_fields: [
      {
        key: 'plano',
        label: { type: 'custom', custom: 'Plano Selecionado' },
        type: 'text',
        text: {
          value: plan === "annual" ? "Plano Anual (25% de desconto)" : "Plano Mensal",
        },
      },
    ],
  });

  return session.client_secret;
}

