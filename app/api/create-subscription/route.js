// app/api/create-subscription/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { headers } from 'next/headers';

export async function POST(req) {
    try {
        const { plan, uid, email, name, cpf, includeTrial = false } = await req.json();
        const origin = (await headers()).get('origin');

        // Validação básica
        if (!uid || !email) {
            return NextResponse.json(
                { message: 'Usuário não identificado. Por favor, faça login novamente.' },
                { status: 400 }
            );
        }

        // Validação do plano
        if (!["monthly", "quarterly", "annual"].includes(plan)) {
            return NextResponse.json(
                { message: 'Plano inválido selecionado' },
                { status: 400 }
            );
        }

        console.log(`Iniciando criação de assinatura: UID=${uid}, Email=${email}, Plano=${plan}, Trial=${includeTrial}`);

        // Define o priceId conforme o plano
        let priceId;
        if (plan === "annual") {
            priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl"; // Plano anual
        } else if (plan === "quarterly") {
            priceId = "price_1RIH5eI2qmEooUtqsdXyxnEP"; // Plano trimestral
        } else {
            priceId = "price_1QyKrNI2qmEooUtqKfgYIemz"; // Plano mensal (padrão)
        }

        // Verificar se o price realmente existe
        try {
            await stripe.prices.retrieve(priceId);
        } catch (priceError) {
            console.error(`Erro ao verificar o preço (${priceId}):`, priceError);
            return NextResponse.json(
                { message: 'Configuração do plano inválida. Por favor, entre em contato com o suporte.' },
                { status: 400 }
            );
        }

        // Buscar ou criar cliente no Stripe
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            // Atualiza os metadados e nome do cliente existente
            await stripe.customers.update(customer.id, {
                metadata: {
                    uid,
                    checkoutVersion: '2.0',
                    cpf: cpf ? cpf.replace(/\D/g, '') : undefined // Armazenamos o CPF como metadado
                },
                name: name || ''
            });
            console.log(`Cliente existente atualizado: ID=${customer.id}, Nome=${name || 'N/A'}`);
        } else {
            // Cria um novo cliente
            customer = await stripe.customers.create({
                email,
                metadata: {
                    uid,
                    checkoutVersion: '2.0',
                    cpf: cpf ? cpf.replace(/\D/g, '') : undefined // Armazenamos o CPF como metadado
                },
                name: name || ''
            });
            console.log(`Novo cliente criado: ID=${customer.id}, Nome=${name || 'N/A'}`);
        }

        // Preparar os dados da assinatura
        const subscriptionData = {
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                uid,
                plan,
                hasTrial: includeTrial ? 'true' : 'false',
                checkoutVersion: '2.0'
            }
        };

        // Adicionar trial de 1 dia (24 horas) se solicitado
        if (includeTrial) {
            subscriptionData.trial_period_days = 1;
        }

        // Criar a assinatura
        console.log(`Criando assinatura para cliente: ${customer.id}`);
        const subscription = await stripe.subscriptions.create(subscriptionData);

        console.log(`Assinatura criada: ID=${subscription.id}, Status=${subscription.status}`);

        // Extrair o Payment Intent da fatura mais recente com verificação de segurança
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice && invoice.payment_intent;

        if (paymentIntent) {
            // Se existir um payment intent
            console.log(`Payment Intent: ID=${paymentIntent.id}, Status=${paymentIntent.status}`);

            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
                status: subscription.status
            });
        } else {
            // Se não existir payment intent (como em assinaturas trial)
            console.log('Sem payment intent para esta assinatura (possivelmente um trial)');

            return NextResponse.json({
                subscriptionId: subscription.id,
                status: subscription.status,
                success: true
            });
        }

    } catch (error) {
        // Log detalhado do erro para depuração
        console.error('Erro ao criar assinatura:', error);

        // Determinar mensagem de erro mais específica para o cliente
        let errorMessage = 'Erro ao configurar a assinatura. Por favor, tente novamente.';

        if (error.type === 'StripeCardError') {
            errorMessage = 'Erro no cartão: ' + error.message;
        } else if (error.type === 'StripeInvalidRequestError') {
            errorMessage = 'Erro na solicitação: ' + error.message;
        } else if (error.code === 'resource_missing') {
            errorMessage = 'Recurso não encontrado: ' + error.message;
        } else if (error.code === 'rate_limit') {
            errorMessage = 'Muitas solicitações. Por favor, tente novamente em alguns instantes.';
        } else if (error.code === 'authentication_required') {
            errorMessage = 'Autenticação adicional necessária para este cartão. Por favor, tente novamente ou use outro cartão.';
        } else if (error.code === 'card_declined') {
            errorMessage = 'O cartão foi recusado. Por favor, verifique os dados ou use outro cartão.';
        } else if (error.code === 'expired_card') {
            errorMessage = 'O cartão está expirado. Por favor, use outro cartão.';
        } else if (error.code === 'insufficient_funds') {
            errorMessage = 'Fundos insuficientes no cartão. Por favor, use outro método de pagamento.';
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}