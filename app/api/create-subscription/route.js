// app/api/create-subscription/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { headers } from 'next/headers';

export async function POST(req) {
    try {
        // Extrair dados da requisição com tratamento de erros
        let requestData;
        try {
            requestData = await req.json();
        } catch (parseError) {
            console.error('Erro ao analisar o JSON da requisição:', parseError);
            return NextResponse.json(
                { message: 'Formato de requisição inválido. Por favor, tente novamente.' },
                { status: 400 }
            );
        }

        const {
            plan,
            uid,
            email,
            name,
            cpf,
            includeTrial = false
        } = requestData;

        // Tratamento seguro do referralSource para evitar erro em metadados
        let referralSource = null;
        try {
            referralSource = requestData.referralSource;
            // Garantir que referralSource seja uma string válida e não muito longa
            if (referralSource && (typeof referralSource !== 'string' || referralSource.length > 100)) {
                console.warn(`referralSource inválido, formato: ${typeof referralSource}, comprimento: ${referralSource?.length}`);
                referralSource = null;
            }
        } catch (refError) {
            console.error('Erro ao processar referralSource:', refError);
            // Definimos como null em caso de erro, não interrompendo o fluxo principal
            referralSource = null;
        }

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

        console.log(`Iniciando criação de assinatura: UID=${uid}, Email=${email}, Plano=${plan}, Trial=${includeTrial}, Referência=${referralSource || 'Nenhuma'}`);

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

        // Preparar metadados com tratamento de erros
        let customerMetadata = { uid, checkoutVersion: '2.0' };
        let subscriptionMetadata = { uid, plan, hasTrial: includeTrial ? 'true' : 'false', checkoutVersion: '2.0' };

        try {
            // Adicionar CPF aos metadados com tratamento de erro
            if (cpf) {
                const sanitizedCpf = typeof cpf === 'string' ? cpf.replace(/\D/g, '') : '';
                if (sanitizedCpf) {
                    customerMetadata.cpf = sanitizedCpf;
                }
            }

            // Adicionar referralSource com tratamento de erro
            if (referralSource) {
                customerMetadata.referral_source = referralSource;
                subscriptionMetadata.referral_source = referralSource;
            }
        } catch (metadataError) {
            console.error('Erro ao processar campos de metadados opcionais:', metadataError);
            // Continua o fluxo mesmo com erro nos metadados opcionais
        }

        // Buscar ou criar cliente no Stripe com tratamento de erros robustos
        let customer;
        try {
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                // Atualiza os metadados e nome do cliente existente
                await stripe.customers.update(customer.id, {
                    metadata: customerMetadata,
                    name: name || ''
                });
                console.log(`Cliente existente atualizado: ID=${customer.id}, Nome=${name || 'N/A'}, Referência=${referralSource || 'Nenhuma'}`);
            } else {
                // Cria um novo cliente
                customer = await stripe.customers.create({
                    email,
                    metadata: customerMetadata,
                    name: name || ''
                });
                console.log(`Novo cliente criado: ID=${customer.id}, Nome=${name || 'N/A'}, Referência=${referralSource || 'Nenhuma'}`);
            }
        } catch (customerError) {
            console.error('Erro ao criar/atualizar cliente:', customerError);

            // Verifica se o erro ocorreu por causa dos metadados
            if (customerError.message && customerError.message.includes('metadata')) {
                console.warn('Erro nos metadados do cliente, tentando sem metadados opcionais');

                // Tenta novamente só com os metadados essenciais
                const basicMetadata = { uid, checkoutVersion: '2.0' };

                if (existingCustomers && existingCustomers.data && existingCustomers.data.length > 0) {
                    customer = existingCustomers.data[0];
                    await stripe.customers.update(customer.id, {
                        metadata: basicMetadata,
                        name: name || ''
                    });
                } else {
                    customer = await stripe.customers.create({
                        email,
                        metadata: basicMetadata,
                        name: name || ''
                    });
                }
            } else {
                // Se foi outro erro, repassamos para o tratamento geral
                throw customerError;
            }
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
            metadata: subscriptionMetadata
        };

        // Adicionar trial de 1 dia (24 horas) se solicitado
        if (includeTrial) {
            subscriptionData.trial_period_days = 1;
        }

        // Criar a assinatura com tratamento de erros específicos para metadados
        let subscription;
        try {
            console.log(`Criando assinatura para cliente: ${customer.id}`);
            subscription = await stripe.subscriptions.create(subscriptionData);
        } catch (subscriptionError) {
            // Verifica se o erro é devido aos metadados
            if (subscriptionError.message && subscriptionError.message.includes('metadata')) {
                console.warn('Erro nos metadados da assinatura, tentando sem metadados opcionais');

                // Remove os metadados opcionais e tenta novamente
                const basicMetadata = {
                    uid,
                    plan,
                    hasTrial: includeTrial ? 'true' : 'false',
                    checkoutVersion: '2.0'
                };

                subscriptionData.metadata = basicMetadata;
                subscription = await stripe.subscriptions.create(subscriptionData);
            } else {
                // Se foi outro erro, repassamos para o tratamento geral
                throw subscriptionError;
            }
        }

        console.log(`Assinatura criada: ID=${subscription.id}, Status=${subscription.status}`);

        // Extrair o Payment Intent da fatura mais recente com verificação de segurança
        let paymentIntent = null;

        try {
            const invoice = subscription.latest_invoice;
            paymentIntent = invoice && invoice.payment_intent;
        } catch (invoiceError) {
            console.error('Erro ao acessar invoice ou payment intent:', invoiceError);
            // Continua sem o payment intent se houver erro
        }

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
        let statusCode = 500;

        if (error.type) {
            switch (error.type) {
                case 'StripeCardError':
                    errorMessage = 'Erro no cartão: ' + error.message;
                    statusCode = 400;
                    break;
                case 'StripeInvalidRequestError':
                    errorMessage = 'Erro na solicitação: ' + error.message;
                    statusCode = 400;
                    break;
                case 'StripeAPIError':
                    errorMessage = 'Erro no serviço de pagamento. Por favor, tente novamente mais tarde.';
                    break;
                case 'StripeConnectionError':
                    errorMessage = 'Erro de conexão com o serviço de pagamento. Por favor, verifique sua conexão ou tente novamente mais tarde.';
                    break;
                case 'StripeAuthenticationError':
                    errorMessage = 'Erro interno de autenticação. Por favor, contate o suporte.';
                    break;
                case 'StripeRateLimitError':
                    errorMessage = 'Muitas solicitações. Por favor, aguarde um momento e tente novamente.';
                    statusCode = 429;
                    break;
            }
        } else if (error.code) {
            switch (error.code) {
                case 'resource_missing':
                    errorMessage = 'Recurso não encontrado: ' + error.message;
                    statusCode = 404;
                    break;
                case 'rate_limit':
                    errorMessage = 'Muitas solicitações. Por favor, tente novamente em alguns instantes.';
                    statusCode = 429;
                    break;
                case 'authentication_required':
                    errorMessage = 'Autenticação adicional necessária para este cartão. Por favor, tente novamente ou use outro cartão.';
                    statusCode = 402;
                    break;
                case 'card_declined':
                    errorMessage = 'O cartão foi recusado. Por favor, verifique os dados ou use outro cartão.';
                    statusCode = 402;
                    break;
                case 'expired_card':
                    errorMessage = 'O cartão está expirado. Por favor, use outro cartão.';
                    statusCode = 402;
                    break;
                case 'insufficient_funds':
                    errorMessage = 'Fundos insuficientes no cartão. Por favor, use outro método de pagamento.';
                    statusCode = 402;
                    break;
                case 'incorrect_cvc':
                    errorMessage = 'Código de segurança incorreto. Verifique o CVC do seu cartão.';
                    statusCode = 402;
                    break;
                case 'processing_error':
                    errorMessage = 'Erro ao processar o pagamento. Por favor, tente novamente.';
                    statusCode = 402;
                    break;
            }
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: statusCode }
        );
    }
}