// app/api/upgrade-user/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { authService } from '../../../lib/services/firebase';

export async function POST(req) {
    try {
        const requestData = await req.json();
        const {
            plan,
            uid,
            email,
            name,
            cpf,
            paymentMethod = 'card',
            address = null,
            isUpgrade = true
        } = requestData;

        console.log(`🔄 Processando upgrade: UID=${uid}, Plano=${plan}, Método=${paymentMethod}`);

        // Validações básicas
        if (!uid || !email) {
            return NextResponse.json(
                { message: 'Usuário não identificado. Faça login novamente.' },
                { status: 400 }
            );
        }

        if (!["monthly", "quarterly", "annual"].includes(plan)) {
            return NextResponse.json(
                { message: 'Plano inválido selecionado' },
                { status: 400 }
            );
        }

        // 🚫 VALIDAÇÃO: Boleto não disponível para plano mensal
        if (plan === "monthly" && paymentMethod === 'boleto') {
            return NextResponse.json(
                { message: 'Pagamento por boleto não está disponível para o plano mensal. Utilize cartão de crédito.' },
                { status: 400 }
            );
        }

        // 🔍 BUSCAR DADOS DO USUÁRIO ATUAL
        let userData;
        try {
            userData = await authService.getUserData(uid);
            console.log('✅ Dados do usuário encontrados:', userData.email);
        } catch (error) {
            console.error('❌ Erro ao buscar dados do usuário:', error);
            return NextResponse.json(
                { message: 'Usuário não encontrado. Faça login novamente.' },
                { status: 404 }
            );
        }

        // 🔧 USAR DADOS EXISTENTES DO USUÁRIO QUANDO POSSÍVEL
        const finalName = name || userData.fullName || '';
        const finalCpf = cpf || userData.cpf || '';
        const finalAddress = address || userData.address || {};

        // Validação específica para boleto usando dados existentes + novos
        if (paymentMethod === 'boleto') {
            if (!finalCpf || finalCpf.replace(/\D/g, '').length !== 11) {
                return NextResponse.json(
                    { message: 'CPF é obrigatório e deve ser válido para pagamento por boleto. Atualize seus dados no perfil.' },
                    { status: 400 }
                );
            }

            if (!finalAddress.street || !finalAddress.city || !finalAddress.state || !finalAddress.cep) {
                return NextResponse.json(
                    { message: 'Endereço completo é obrigatório para pagamento por boleto. Atualize seus dados no perfil.' },
                    { status: 400 }
                );
            }

            if (!finalName || finalName.trim().split(' ').length < 2) {
                return NextResponse.json(
                    { message: 'Nome completo é obrigatório para pagamento por boleto. Atualize seus dados no perfil.' },
                    { status: 400 }
                );
            }
        }

        // 🎯 DEFINIÇÃO DOS PREÇOS REORGANIZADA
        // Estrutura: Essencial -> Profissional -> Premium
        let priceId;
        switch (plan) {
            case "monthly":
                // Plano Essencial (básico)
                priceId = "price_1QyKrNI2qmEooUtqKfgYIemz";
                break;
            case "quarterly":
                // Plano Profissional (do meio) - SEU PRICE ID AQUI
                priceId = "price_1RIH5eI2qmEooUtqsdXyxnEP";
                break;
            case "annual":
                // Plano Premium (avançado)
                priceId = "price_1QyKwWI2qmEooUtqOJ9lCFBl";
                break;
            default:
                // Fallback para o plano do meio se não especificado
                priceId = "price_1RIH5eI2qmEooUtqsdXyxnEP";
        }

        console.log(`📋 Plano selecionado: ${plan} (${priceId})`);

        // Preparar metadados
        const customerMetadata = {
            uid,
            upgradeVersion: '2.0', // Versão atualizada
            paymentMethod: paymentMethod,
            originalEmail: userData.email,
            upgradeDate: new Date().toISOString(),
            planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium'
        };

        const subscriptionMetadata = {
            uid,
            plan,
            planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium',
            paymentMethod: paymentMethod,
            isUpgrade: 'true',
            upgradeVersion: '2.0'
        };

        // Adicionar CPF aos metadados se disponível
        if (finalCpf) {
            const sanitizedCpf = finalCpf.replace(/\D/g, '');
            customerMetadata.cpf = sanitizedCpf;
        }

        // Preparar endereço para Stripe
        let stripeAddress = null;
        if (finalAddress && (finalAddress.street || finalAddress.city)) {
            stripeAddress = {
                line1: `${finalAddress.street || ''}, ${finalAddress.number || ''}`.trim(),
                line2: finalAddress.complement || null,
                city: finalAddress.city || '',
                state: finalAddress.state || '',
                postal_code: (finalAddress.cep || '').replace(/\D/g, ''),
                country: 'BR'
            };
        }

        // 🔍 BUSCAR OU CRIAR CLIENTE STRIPE
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1
        });

        const customerData = {
            email,
            metadata: customerMetadata,
            name: finalName || email.split('@')[0]
        };

        if (stripeAddress && paymentMethod === 'boleto') {
            customerData.address = stripeAddress;
        }

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            await stripe.customers.update(customer.id, customerData);
            console.log(`✅ Cliente Stripe existente atualizado: ${customer.id}`);
        } else {
            customer = await stripe.customers.create(customerData);
            console.log(`✅ Novo cliente Stripe criado: ${customer.id}`);
        }

        // 🔧 VERIFICAR ASSINATURAS EXISTENTES E CANCELAR SE NECESSÁRIO
        const existingSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 10
        });

        for (const subscription of existingSubscriptions.data) {
            console.log(`⚠️ Cancelando assinatura existente: ${subscription.id}`);
            await stripe.subscriptions.cancel(subscription.id);
        }

        // Configurar nova assinatura
        const subscriptionData = {
            customer: customer.id,
            items: [{ price: priceId }],
            metadata: subscriptionMetadata,
            expand: ['latest_invoice.payment_intent']
        };

        // Configuração específica por método de pagamento
        if (paymentMethod === 'boleto') {
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                payment_method_types: ['boleto'],
                save_default_payment_method: 'off',
                payment_method_options: {
                    boleto: {
                        expires_after_days: 3
                    }
                }
            };
            subscriptionData.automatic_tax = { enabled: false };
            console.log(`📄 Configurando upgrade para BOLETO - Plano: ${plan}`);
        } else {
            subscriptionData.payment_behavior = 'default_incomplete';
            subscriptionData.payment_settings = {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            };
            console.log(`💳 Configurando upgrade para CARTÃO - Plano: ${plan}`);
        }

        // Criar nova assinatura
        console.log(`🔄 Criando nova assinatura para upgrade...`);
        const subscription = await stripe.subscriptions.create(subscriptionData);

        console.log(`✅ Nova assinatura criada: ${subscription.id}`);

        // Extrair Payment Intent
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice?.payment_intent;

        if (!paymentIntent) {
            throw new Error('Payment Intent não encontrado na assinatura');
        }

        // 🔧 ATUALIZAR FIREBASE COM DADOS DO UPGRADE
        const upgradeData = {
            upgradeInProgress: true,
            newSubscriptionId: subscription.id,
            upgradePlan: plan,
            planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium',
            upgradeMethod: paymentMethod,
            upgradeStartedAt: new Date(),
            upgradeVersion: '2.0',
            // Manter dados atuais até confirmação
            previousPlan: userData.planType || 'free'
        };

        // Atualizar endereço e CPF se fornecidos
        if (finalAddress && Object.keys(finalAddress).length > 0) {
            upgradeData.address = finalAddress;
        }
        if (finalCpf) {
            upgradeData.cpf = finalCpf;
        }

        await authService.editUserData(uid, upgradeData);
        console.log(`✅ Dados de upgrade salvos no Firebase`);

        // 📊 LOG PARA MONITORAMENTO
        console.log(`🎯 Upgrade Summary:
        - UID: ${uid}
        - Plano: ${plan} (${plan === 'monthly' ? 'Essencial' : plan === 'quarterly' ? 'Profissional' : 'Premium'})
        - Price ID: ${priceId}
        - Método: ${paymentMethod}
        - Subscription: ${subscription.id}`);

        // Retorno específico para boleto
        if (paymentMethod === 'boleto') {
            if (paymentIntent.next_action?.boleto_display_details?.hosted_voucher_url) {
                return NextResponse.json({
                    success: true,
                    subscriptionId: subscription.id,
                    clientSecret: paymentIntent.client_secret,
                    paymentMethod: 'boleto',
                    plan: plan,
                    planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium',
                    boletoUrl: paymentIntent.next_action.boleto_display_details.hosted_voucher_url,
                    message: 'Boleto gerado com sucesso para upgrade'
                });
            } else {
                return NextResponse.json({
                    success: true,
                    subscriptionId: subscription.id,
                    clientSecret: paymentIntent.client_secret,
                    paymentMethod: 'boleto',
                    plan: plan,
                    planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium',
                    message: 'Boleto está sendo processado para upgrade'
                });
            }
        } else {
            // Retorno para cartão
            return NextResponse.json({
                success: true,
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
                paymentMethod: 'card',
                plan: plan,
                planCategory: plan === 'monthly' ? 'essencial' : plan === 'quarterly' ? 'profissional' : 'premium',
                message: 'Upgrade configurado com sucesso'
            });
        }

    } catch (error) {
        console.error('❌ Erro no upgrade:', error);

        let errorMessage = 'Erro ao processar upgrade. Tente novamente.';
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
                    errorMessage = 'Erro no serviço de pagamento. Tente novamente.';
                    break;
                case 'StripeConnectionError':
                    errorMessage = 'Problema de conexão. Verifique sua internet.';
                    break;
                case 'StripeAuthenticationError':
                    errorMessage = 'Erro interno. Contate o suporte.';
                    break;
                case 'StripeRateLimitError':
                    errorMessage = 'Muitas tentativas. Aguarde e tente novamente.';
                    statusCode = 429;
                    break;
            }
        }

        return NextResponse.json(
            { message: errorMessage },
            { status: statusCode }
        );
    }
}