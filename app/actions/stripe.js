// actions/stripe.js
'use server';
import { headers } from 'next/headers';
import { stripe } from '../../lib/stripe';

export async function fetchClientSecret({ plan, uid, email, includeTrial = false }) {
  // Validação básica
  if (!uid) {
    console.error('fetchClientSecret called without uid!');
    throw new Error('Usuário não identificado. Por favor, faça login novamente.');
  }

  const origin = (await headers()).get('origin');
  console.log(`Criando checkout para usuário: ${uid}, email: ${email}, plano: ${plan}, trial: ${includeTrial}`);

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

    // Preparar os dados de assinatura
    const subscriptionData = {
      metadata: { uid, plan, hasTrial: includeTrial ? 'true' : 'false' },
    };

    // Adicionar trial de 1 dia (24 horas) se solicitado
    if (includeTrial) {
      subscriptionData.trial_period_days = 1;
    }

    // Criar a sessão de checkout
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
      metadata: { uid, plan, hasTrial: includeTrial ? 'true' : 'false' },
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
      subscription_data: subscriptionData, // Usar os dados preparados
    });

    console.log(`Sessão de checkout criada: ${session.id}`);
    return session.client_secret;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao configurar o checkout. Por favor, tente novamente.');
  }
}