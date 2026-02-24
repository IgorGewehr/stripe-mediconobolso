// app/api/create-subscription/route.js - VERSÃO CORRIGIDA
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { headers } from 'next/headers';

export async function POST(req) {
    try {
        const requestData = await req.json();
        const {
            plan,
            uid,
            email,
            name,
            cpf,
            includeTrial = false,
            paymentMethod = 'card',
            address = null
        } = requestData;

        // Validações existentes...
        if (!uid || !email) {
            return NextResponse.json(
                { message: 'Usuário não identificado. Por favor, faça login novamente.' },
                { status: 400 }
            );
        }

        if (!["monthly"].includes(plan)) {
            return NextResponse.json(
                { message: 'Plano inválido selecionado' },
                { status: 400 }
            );
        }

        // 🆕 VALIDAÇÃO ESPECÍFICA PARA BOLETO
        if (paymentMethod === 'boleto') {
            if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
                return NextResponse.json(
                    { message: 'CPF é obrigatório e deve ser válido para pagamento por boleto.' },
                    { status: 400 }
                );
            }

            if (!address || !address.street || !address.city || !address.state || !address.cep) {
                return NextResponse.json(
                    { message: 'Endereço completo é obrigatório para pagamento por boleto.' },
                    { status: 400 }
                );
            }

            if (!name || name.trim().split(' ').length < 2) {
                return NextResponse.json(
                    { message: 'Nome completo é obrigatório para pagamento por boleto.' },
                    { status: 400 }
                );
            }
        }

        console.log(`Criando assinatura: UID=${uid}, Email=${email}, Plano=${plan}, Método=${paymentMethod}`);

        // Define o priceId - Plano único de R$147/mês
        const priceId = "price_1SpgnZI2qmEooUtqtaCEw3jN";

        // Preparar metadados
        const customerMetadata = {
            uid,
            checkoutVersion: '2.0',
            paymentMethod: paymentMethod
        };

        const subscriptionMetadata = {
            uid,
            plan,
            paymentMethod: paymentMethod,
            hasTrial: includeTrial ? 'true' : 'false',
            checkoutVersion: '2.0'
        };

        // Adicionar CPF aos metadados se disponível
        if (cpf) {
            const sanitizedCpf = cpf.replace(/\D/g, '');
            if (sanitizedCpf) {
                customerMetadata.cpf = sanitizedCpf;
            }
        }

        // 🆕 PREPARAR ENDEREÇO PARA STRIPE
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

        // Buscar ou criar cliente
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1
        });

        const customerData = {
            email,
            metadata: customerMetadata,
            name: name || ''
        };

        if (stripeAddress && paymentMethod === 'boleto') {
            customerData.address = stripeAddress;
        }

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            await stripe.customers.update(customer.id, customerData);
            console.log(`Cliente existente atualizado: ID=${customer.id}`);
        } else {
            customer = await stripe.customers.create(customerData);
            console.log(`Novo cliente criado: ID=${customer.id}`);
        }

        // 🔧 CONFIGURAÇÃO CORRIGIDA DA ASSINATURA
        const subscriptionData = {
            customer: customer.id,
            items: [{ price: priceId }],
            metadata: subscriptionMetadata,
            expand: ['latest_invoice.payment_intent']
        };

        // 🆕 CONFIGURAÇÃO ESPECÍFICA POR MÉTODO DE PAGAMENTO
        if (paymentMethod === 'boleto') {
            // Configuração específica para boleto
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                payment_method_types: ['boleto'],
                save_default_payment_method: 'off',
                payment_method_options: {
                    boleto: {
                        expires_after_days: 3 // Boleto expira em 3 dias
                    }
                }
            };
            subscriptionData.automatic_tax = { enabled: false };

            console.log(`📄 Configurando assinatura para BOLETO com expiração em 3 dias`);
        } else {
            // Configuração para cartão
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            };

            console.log(`💳 Configurando assinatura para CARTÃO`);
        }

        // Adicionar trial se solicitado
        if (includeTrial) {
            subscriptionData.trial_period_days = 1;
        }

        // Criar a assinatura
        console.log(`Criando assinatura para cliente: ${customer.id}`);
        const subscription = await stripe.subscriptions.create(subscriptionData);

        console.log(`Assinatura criada: ID=${subscription.id}, Status=${subscription.status}`);

        // Extrair o Payment Intent da fatura mais recente
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice?.payment_intent;

        if (!paymentIntent) {
            throw new Error('Payment Intent não encontrado na assinatura');
        }

        console.log(`Payment Intent: ID=${paymentIntent.id}, Status=${paymentIntent.status}`);

        // 🆕 RETORNO ESPECÍFICO PARA BOLETO
        if (paymentMethod === 'boleto') {
            // Para boleto, verificar se há next_action com URL do boleto
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
            } else {
                // Se não tem URL ainda, retornar dados básicos
                console.log('📄 Boleto criado, URL será gerada posteriormente');
                return NextResponse.json({
                    subscriptionId: subscription.id,
                    clientSecret: paymentIntent.client_secret,
                    status: subscription.status,
                    paymentMethod: 'boleto',
                    paymentIntentId: paymentIntent.id,
                    message: 'Boleto está sendo processado'
                });
            }
        } else {
            // Retorno para cartão
            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
                status: subscription.status,
                paymentMethod: 'card'
            });
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