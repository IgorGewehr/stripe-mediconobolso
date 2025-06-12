// app/api/create-subscription/route.js - VERSÃO COM BOLETO
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { headers } from 'next/headers';

export async function POST(req) {
    try {
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
            includeTrial = false,
            paymentMethod = 'card', // 🆕 NOVO CAMPO
            address = null // 🆕 OBRIGATÓRIO PARA BOLETO
        } = requestData;

        // Tratamento seguro do referralSource
        let referralSource = null;
        try {
            referralSource = requestData.referralSource;
            if (referralSource && (typeof referralSource !== 'string' || referralSource.length > 100)) {
                console.warn(`referralSource inválido, formato: ${typeof referralSource}, comprimento: ${referralSource?.length}`);
                referralSource = null;
            }
        } catch (refError) {
            console.error('Erro ao processar referralSource:', refError);
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

        // 🆕 VALIDAÇÃO ESPECÍFICA PARA BOLETO
        if (paymentMethod === 'boleto') {
            // Para boleto, CPF é obrigatório
            if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
                return NextResponse.json(
                    { message: 'CPF é obrigatório e deve ser válido para pagamento por boleto.' },
                    { status: 400 }
                );
            }

            // Para boleto, endereço completo é obrigatório
            if (!address || !address.street || !address.city || !address.state || !address.cep) {
                return NextResponse.json(
                    { message: 'Endereço completo é obrigatório para pagamento por boleto.' },
                    { status: 400 }
                );
            }

            // Nome completo é obrigatório para boleto
            if (!name || name.trim().split(' ').length < 2) {
                return NextResponse.json(
                    { message: 'Nome completo é obrigatório para pagamento por boleto.' },
                    { status: 400 }
                );
            }
        }

        console.log(`Iniciando criação de assinatura: UID=${uid}, Email=${email}, Plano=${plan}, Método=${paymentMethod}, Trial=${includeTrial}`);

        // Define o priceId conforme o plano
        let priceId;
        if (plan === "annual") {
            priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl";
        } else if (plan === "quarterly") {
            priceId = "price_1RIH5eI2qmEooUtqsdXyxnEP";
        } else {
            priceId = "price_1QyKrNI2qmEooUtqKfgYIemz";
        }

        // Verificar se o price existe
        try {
            await stripe.prices.retrieve(priceId);
        } catch (priceError) {
            console.error(`Erro ao verificar o preço (${priceId}):`, priceError);
            return NextResponse.json(
                { message: 'Configuração do plano inválida. Por favor, entre em contato com o suporte.' },
                { status: 400 }
            );
        }

        // Preparar metadados
        let customerMetadata = {
            uid,
            checkoutVersion: '2.0',
            paymentMethod: paymentMethod // 🆕 ADICIONAR MÉTODO DE PAGAMENTO
        };
        let subscriptionMetadata = {
            uid,
            plan,
            paymentMethod: paymentMethod, // 🆕 ADICIONAR MÉTODO DE PAGAMENTO
            hasTrial: includeTrial ? 'true' : 'false',
            checkoutVersion: '2.0'
        };

        try {
            // Adicionar CPF aos metadados
            if (cpf) {
                const sanitizedCpf = typeof cpf === 'string' ? cpf.replace(/\D/g, '') : '';
                if (sanitizedCpf) {
                    customerMetadata.cpf = sanitizedCpf;
                }
            }

            // Adicionar referralSource
            if (referralSource) {
                customerMetadata.referral_source = referralSource;
                subscriptionMetadata.referral_source = referralSource;
            }
        } catch (metadataError) {
            console.error('Erro ao processar campos de metadados opcionais:', metadataError);
        }

        // 🆕 PREPARAR ENDEREÇO PARA STRIPE (OBRIGATÓRIO PARA BOLETO)
        let stripeAddress = null;
        if (address && paymentMethod === 'boleto') {
            stripeAddress = {
                line1: `${address.street}, ${address.number}`,
                line2: address.complement || null,
                city: address.city,
                state: address.state,
                postal_code: address.cep.replace(/\D/g, ''),
                country: 'BR'
            };
        }

        // Buscar ou criar cliente no Stripe
        let customer;
        try {
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            const customerData = {
                email,
                metadata: customerMetadata,
                name: name || ''
            };

            // 🆕 ADICIONAR ENDEREÇO PARA BOLETO
            if (stripeAddress && paymentMethod === 'boleto') {
                customerData.address = stripeAddress;
            }

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                await stripe.customers.update(customer.id, customerData);
                console.log(`Cliente existente atualizado: ID=${customer.id}, Método=${paymentMethod}`);
            } else {
                customer = await stripe.customers.create(customerData);
                console.log(`Novo cliente criado: ID=${customer.id}, Método=${paymentMethod}`);
            }
        } catch (customerError) {
            console.error('Erro ao criar/atualizar cliente:', customerError);

            if (customerError.message && customerError.message.includes('metadata')) {
                console.warn('Erro nos metadados do cliente, tentando sem metadados opcionais');
                const basicMetadata = { uid, checkoutVersion: '2.0', paymentMethod: paymentMethod };

                const basicCustomerData = {
                    email,
                    metadata: basicMetadata,
                    name: name || ''
                };

                if (stripeAddress && paymentMethod === 'boleto') {
                    basicCustomerData.address = stripeAddress;
                }

                if (existingCustomers && existingCustomers.data && existingCustomers.data.length > 0) {
                    customer = existingCustomers.data[0];
                    await stripe.customers.update(customer.id, basicCustomerData);
                } else {
                    customer = await stripe.customers.create(basicCustomerData);
                }
            } else {
                throw customerError;
            }
        }

        // 🆕 CONFIGURAR DADOS DA ASSINATURA BASEADO NO MÉTODO DE PAGAMENTO
        const subscriptionData = {
            customer: customer.id,
            items: [{ price: priceId }],
            metadata: subscriptionMetadata
        };

        // 🆕 CONFIGURAÇÃO ESPECÍFICA POR MÉTODO DE PAGAMENTO
        if (paymentMethod === 'boleto') {
            // Configuração para boleto
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                payment_method_types: ['boleto'],
                save_default_payment_method: 'off' // Boleto não salva método
            };
            subscriptionData.expand = ['latest_invoice.payment_intent'];

            // 🆕 CONFIGURAÇÕES ESPECÍFICAS DO BOLETO BRASILEIRO
            subscriptionData.automatic_tax = { enabled: false };

            console.log(`📄 Configurando assinatura para BOLETO`);
        } else {
            // Configuração para cartão (mantida como estava)
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            };
            subscriptionData.expand = ['latest_invoice.payment_intent'];

            console.log(`💳 Configurando assinatura para CARTÃO`);
        }

        // Adicionar trial se solicitado
        if (includeTrial) {
            subscriptionData.trial_period_days = 1;
        }

        // Criar a assinatura
        let subscription;
        try {
            console.log(`Criando assinatura para cliente: ${customer.id} (${paymentMethod})`);
            subscription = await stripe.subscriptions.create(subscriptionData);
        } catch (subscriptionError) {
            if (subscriptionError.message && subscriptionError.message.includes('metadata')) {
                console.warn('Erro nos metadados da assinatura, tentando sem metadados opcionais');
                const basicMetadata = {
                    uid,
                    plan,
                    paymentMethod: paymentMethod,
                    hasTrial: includeTrial ? 'true' : 'false',
                    checkoutVersion: '2.0'
                };

                subscriptionData.metadata = basicMetadata;
                subscription = await stripe.subscriptions.create(subscriptionData);
            } else {
                throw subscriptionError;
            }
        }

        console.log(`Assinatura criada: ID=${subscription.id}, Status=${subscription.status}`);

        // Extrair o Payment Intent da fatura mais recente
        let paymentIntent = null;
        let clientSecret = null;

        try {
            const invoice = subscription.latest_invoice;
            paymentIntent = invoice && invoice.payment_intent;

            if (paymentIntent) {
                clientSecret = paymentIntent.client_secret;
                console.log(`Payment Intent: ID=${paymentIntent.id}, Status=${paymentIntent.status}, Método=${paymentMethod}`);
            }
        } catch (invoiceError) {
            console.error('Erro ao acessar invoice ou payment intent:', invoiceError);
        }

        if (paymentMethod === 'boleto') {
            // 🆕 CONFIGURAÇÃO CORRIGIDA PARA BOLETO
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                payment_method_types: ['boleto'],
                save_default_payment_method: 'off'
            };
            subscriptionData.expand = ['latest_invoice.payment_intent'];

            // 🔧 ADICIONAR: Configurações específicas do boleto brasileiro
            subscriptionData.automatic_tax = { enabled: false };

            // 🆕 CRITICAL: Configure o payment_intent com boleto
            subscriptionData.payment_settings.payment_method_options = {
                boleto: {
                    expires_after_days: 3 // Boleto expira em 3 dias
                }
            };

            console.log(`📄 Configurando assinatura para BOLETO com expiração em 3 dias`);
        } else {
            // Configuração para cartão (mantida como estava)
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            };
            subscriptionData.expand = ['latest_invoice.payment_intent'];
        }

// 🆕 ADICIONAR: Depois de criar a subscription, buscar o boleto
        if (paymentMethod === 'boleto' && subscription && subscription.latest_invoice?.payment_intent) {
            const paymentIntent = subscription.latest_invoice.payment_intent;

            // Buscar o método de pagamento para obter a URL do boleto
            if (paymentIntent.next_action?.boleto_display_details?.hosted_voucher_url) {
                return NextResponse.json({
                    subscriptionId: subscription.id,
                    clientSecret: paymentIntent.client_secret,
                    status: subscription.status,
                    paymentMethod: 'boleto',
                    paymentIntentId: paymentIntent.id,
                    boletoUrl: paymentIntent.next_action.boleto_display_details.hosted_voucher_url,
                    message: 'Boleto gerado com sucesso'
                });
            }
        }

    } catch (error) {
        console.error('Erro ao criar assinatura:', error);

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
                    errorMessage = 'Autenticação adicional necessária. Por favor, tente novamente ou use outro método de pagamento.';
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