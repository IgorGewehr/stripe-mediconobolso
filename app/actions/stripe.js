'use server';

import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid, email }) {
  // Validação: não permitir que continue sem uid
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
    // Vamos criar ou atualizar o cliente do Stripe com o UID
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Atualizar os metadados do cliente existente
      await stripe.customers.update(customer.id, {
        metadata: { uid }
      });
      console.log(`Cliente existente do Stripe atualizado: ${customer.id}`);
    } else {
      // Criar um novo cliente com os metadados
      customer = await stripe.customers.create({
        email,
        metadata: { uid }
      });
      console.log(`Novo cliente do Stripe criado: ${customer.id}`);
    }

    // Cria a sessão com o cliente
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer: customer.id, // Usar o ID do cliente que já tem os metadados
      metadata: { uid }, // Também incluir no metadata da sessão
      return_url: `${origin}/`, // redireciona para a home
      subscription_data: {
        trial_period_days: 7, // Adiciona período de teste de 7 dias
        metadata: { uid }, // E também nos metadados da subscription
      },
    });

    console.log(`Sessão de checkout criada: ${session.id}`);
    return session.client_secret;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao configurar o checkout. Por favor, tente novamente.');
  }
}