'use server';

import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid, email }) {
  // Validação básica
  if (!uid) {
    console.error('fetchClientSecret called without uid!');
    throw new Error('Usuário não identificado. Por favor, faça login novamente.');
  }

  const origin = (await headers()).get('origin');
  console.log(`Criando checkout para usuário: ${uid}, email: ${email}, plano: ${plan}`);

  // Define o priceId conforme o plano
  let priceId;
  if (plan === "annual") {
    priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl";
  } else {
    priceId = "price_1QyKrNI2qmEooUtqKfgYIemz";
  }

  try {
    // Buscar ou criar cliente no Stripe
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      await stripe.customers.update(customer.id, {
        metadata: { uid }
      });
      console.log(`Cliente existente do Stripe atualizado: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { uid }
      });
      console.log(`Novo cliente do Stripe criado: ${customer.id}`);
    }

    // Criar a sessão de checkout com configuração simplificada de campos personalizados
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer: customer.id,
      metadata: { uid, plan },

      // Definir URL de retorno
      return_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,

      // Coletar endereço completo
      billing_address_collection: 'required',

      // Campo personalizado para CPF - CONFIGURAÇÃO SIMPLIFICADA
      custom_fields: [
        {
          key: 'cpf',
          label: {
            type: 'custom',
            custom: 'CPF (apenas números)',
          },
          type: 'text'
        }
      ],

      subscription_data: {
        metadata: { uid, plan },
      },

    });

    console.log(`Sessão de checkout criada: ${session.id}`);
    return session.client_secret;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao configurar o checkout. Por favor, tente novamente.');
  }
}