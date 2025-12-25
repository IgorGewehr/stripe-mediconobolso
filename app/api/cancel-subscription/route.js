// app/api/cancel-subscription/route.js
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { authService } from '../../../lib/services/firebase';

export async function POST(req) {
    try {
        const { uid, reason } = await req.json();

        if (!uid) {
            return NextResponse.json(
                { message: 'UID é obrigatório' },
                { status: 400 }
            );
        }

        console.log(`🚫 Iniciando cancelamento da assinatura para usuário: ${uid}`);

        // 1. Buscar dados do usuário
        const userData = await authService.getUserData(uid);

        if (!userData) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        if (!userData.assinouPlano) {
            return NextResponse.json(
                { message: 'Usuário não possui assinatura ativa' },
                { status: 400 }
            );
        }

        // 2. Buscar customer no Stripe
        const customers = await stripe.customers.list({
            email: userData.email,
            limit: 1
        });

        if (customers.data.length === 0) {
            return NextResponse.json(
                { message: 'Customer não encontrado no Stripe' },
                { status: 404 }
            );
        }

        const customer = customers.data[0];

        // 3. Buscar assinatura ativa
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            return NextResponse.json(
                { message: 'Assinatura ativa não encontrada no Stripe' },
                { status: 404 }
            );
        }

        const subscription = subscriptions.data[0];

        // 4. Verificar se é assinatura por cartão
        if (userData.paymentMethod === 'boleto') {
            return NextResponse.json(
                { message: 'Assinaturas por boleto não podem ser canceladas automaticamente. Entre em contato com o suporte.' },
                { status: 400 }
            );
        }

        // 5. Cancelar assinatura no Stripe
        console.log(`🔄 Cancelando assinatura ${subscription.id} no Stripe...`);

        const canceledSubscription = await stripe.subscriptions.cancel(subscription.id, {
            metadata: {
                canceledBy: 'user',
                cancelReason: reason || 'user_requested',
                canceledAt: new Date().toISOString()
            }
        });

        console.log(`✅ Assinatura cancelada no Stripe: ${canceledSubscription.id}`);

        // 6. Atualizar dados no Firebase
        const updateData = {
            assinouPlano: false,
            subscriptionCanceled: true,
            canceledAt: new Date(),
            cancelReason: reason || 'user_requested',
            lastSubscriptionId: subscription.id,
            planType: 'free', // Voltar para plano gratuito
            updatedAt: new Date()
        };

        await authService.editUserData(uid, updateData);

        console.log(`✅ Dados atualizados no Firebase para usuário ${uid}`);

        // 7. Preparar resposta
        const response = {
            success: true,
            message: 'Assinatura cancelada com sucesso',
            canceledSubscriptionId: subscription.id,
            effectiveUntil: new Date(canceledSubscription.current_period_end * 1000),
            accessEndsAt: new Date(canceledSubscription.current_period_end * 1000)
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Erro ao cancelar assinatura:', error);

        let errorMessage = 'Erro ao cancelar assinatura';
        let statusCode = 500;

        if (error.type) {
            switch (error.type) {
                case 'StripeInvalidRequestError':
                    errorMessage = 'Erro na solicitação de cancelamento: ' + error.message;
                    statusCode = 400;
                    break;
                case 'StripeAPIError':
                    errorMessage = 'Erro no serviço de pagamento. Tente novamente.';
                    break;
                case 'StripeConnectionError':
                    errorMessage = 'Problema de conexão. Verifique sua internet.';
                    break;
                case 'StripeAuthenticationError':
                    errorMessage = 'Erro interno de autenticação. Contate o suporte.';
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