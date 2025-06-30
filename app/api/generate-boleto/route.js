// app/api/generate-boleto/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import firebaseService from '../../../lib/firebaseService';

export async function POST(req) {
    try {
        const { uid, planType } = await req.json();

        if (!uid) {
            return NextResponse.json(
                { message: 'UID é obrigatório' },
                { status: 400 }
            );
        }

        if (!planType || !['quarterly', 'annual'].includes(planType)) {
            return NextResponse.json(
                { message: 'Tipo de plano inválido. Boleto disponível apenas para planos trimestrais e anuais.' },
                { status: 400 }
            );
        }

        console.log(`📄 Gerando novo boleto para usuário: ${uid}, plano: ${planType}`);

        // 1. Buscar dados do usuário
        const userData = await firebaseService.getUserData(uid);

        if (!userData) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // 2. Validações específicas para boleto
        if (!userData.cpf || userData.cpf.replace(/\D/g, '').length !== 11) {
            return NextResponse.json(
                { message: 'CPF válido é obrigatório para pagamento por boleto' },
                { status: 400 }
            );
        }

        if (!userData.address || !userData.address.street || !userData.address.city) {
            return NextResponse.json(
                { message: 'Endereço completo é obrigatório para pagamento por boleto' },
                { status: 400 }
            );
        }

        if (!userData.fullName || userData.fullName.trim().split(' ').length < 2) {
            return NextResponse.json(
                { message: 'Nome completo é obrigatório para pagamento por boleto' },
                { status: 400 }
            );
        }

        // 3. Definir preço baseado no plano
        let priceId;
        let amount;
        let planName;

        switch (planType) {
            case 'quarterly':
                priceId = 'price_1RIH5eI2qmEooUtqsdXyxnEP';
                amount = 34500; // R$ 345,00 em centavos
                planName = 'Profissional (Trimestral)';
                break;
            case 'annual':
                priceId = 'price_1QyKwWI2qmEooUtqOJ9lCFBl';
                amount = 114300; // R$ 1143,00 em centavos
                planName = 'Premium (Anual)';
                break;
        }

        // 4. Buscar ou criar customer no Stripe
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: userData.email,
            limit: 1
        });

        const customerData = {
            email: userData.email,
            name: userData.fullName,
            metadata: {
                uid: uid,
                planType: planType,
                boletoGeneration: 'true',
                generatedAt: new Date().toISOString()
            },
            address: {
                line1: `${userData.address.street}, ${userData.address.number || 'S/N'}`,
                line2: userData.address.complement || null,
                city: userData.address.city,
                state: userData.address.state,
                postal_code: userData.address.cep?.replace(/\D/g, '') || '',
                country: 'BR'
            }
        };

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            await stripe.customers.update(customer.id, customerData);
            console.log(`✅ Customer atualizado: ${customer.id}`);
        } else {
            customer = await stripe.customers.create(customerData);
            console.log(`✅ Novo customer criado: ${customer.id}`);
        }

        // 5. Cancelar assinatura anterior se existir
        try {
            const existingSubscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 10
            });

            for (const subscription of existingSubscriptions.data) {
                console.log(`🚫 Cancelando assinatura existente: ${subscription.id}`);
                await stripe.subscriptions.cancel(subscription.id);
            }
        } catch (cancelError) {
            console.warn('⚠️ Erro ao cancelar assinaturas existentes:', cancelError);
        }

        // 6. Criar nova assinatura com boleto
        const subscriptionData = {
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                payment_method_types: ['boleto'],
                save_default_payment_method: 'off',
                payment_method_options: {
                    boleto: {
                        expires_after_days: 3
                    }
                }
            },
            automatic_tax: { enabled: false },
            metadata: {
                uid: uid,
                planType: planType,
                paymentMethod: 'boleto',
                boletoGeneration: 'true',
                generatedAt: new Date().toISOString()
            },
            expand: ['latest_invoice.payment_intent']
        };

        console.log(`🔄 Criando nova assinatura com boleto...`);
        const subscription = await stripe.subscriptions.create(subscriptionData);

        console.log(`✅ Assinatura criada: ${subscription.id}`);

        // 7. Extrair URL do boleto
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice?.payment_intent;
        let boletoUrl = null;

        if (paymentIntent?.next_action?.boleto_display_details?.hosted_voucher_url) {
            boletoUrl = paymentIntent.next_action.boleto_display_details.hosted_voucher_url;
            console.log(`✅ URL do boleto gerada: ${boletoUrl}`);
        }

        // 8. Atualizar dados no Firebase
        const updateData = {
            lastBoletoGenerated: new Date(),
            lastBoletoSubscriptionId: subscription.id,
            lastBoletoAmount: amount / 100,
            lastBoletoPlan: planType,
            boletoStatus: 'pending',
            awaitingBoletoPayment: true,
            paymentMethod: 'boleto',
            updatedAt: new Date()
        };

        await firebaseService.editUserData(uid, updateData);

        // 9. Enviar email com boleto (opcional)
        if (boletoUrl) {
            try {
                await fetch('/api/send-boleto-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userData.email,
                        name: userData.fullName,
                        boletoUrl: boletoUrl,
                        plan: planType,
                        amount: `R$ ${(amount / 100).toFixed(2).replace('.', ',')}`
                    })
                });
                console.log(`📧 Email do boleto enviado para: ${userData.email}`);
            } catch (emailError) {
                console.warn('⚠️ Erro ao enviar email do boleto:', emailError);
            }
        }

        // 10. Preparar resposta
        const response = {
            success: true,
            message: 'Boleto gerado com sucesso',
            subscriptionId: subscription.id,
            invoiceId: invoice?.id,
            amount: amount / 100,
            currency: 'BRL',
            expiresAt: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 dias
            boletoUrl: boletoUrl,
            planName: planName,
            planType: planType
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Erro ao gerar boleto:', error);

        let errorMessage = 'Erro ao gerar boleto';
        let statusCode = 500;

        if (error.type) {
            switch (error.type) {
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
            {
                success: false,
                message: errorMessage,
                error: error.message
            },
            { status: statusCode }
        );
    }
}