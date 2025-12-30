// app/api/subscription-status/route.js - VERSÃO CORRIGIDA
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';

// Helper to fetch user data from the backend API
async function fetchUserDataFromBackend(authToken) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const response = await fetch(`${apiUrl}/account/me`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch user data: ${response.status} - ${error}`);
    }

    return response.json();
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const uid = searchParams.get('uid');

        // Get authorization token from header
        const authHeader = req.headers.get('authorization');
        const authToken = authHeader?.replace('Bearer ', '');

        if (!uid) {
            return NextResponse.json(
                { message: 'UID é obrigatório' },
                { status: 400 }
            );
        }

        if (!authToken) {
            return NextResponse.json(
                { message: 'Token de autorização é obrigatório' },
                { status: 401 }
            );
        }

        console.log(`🔍 Buscando status da assinatura para usuário: ${uid}`);

        // 1. Buscar dados do usuário via backend API
        let userData;
        try {
            userData = await fetchUserDataFromBackend(authToken);
        } catch (apiError) {
            console.error('Erro ao buscar dados do usuário via API:', apiError);
            return NextResponse.json(
                { message: 'Erro ao buscar dados do usuário' },
                { status: 500 }
            );
        }

        if (!userData) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // 2. Determinar status base do usuário
        // Note: Backend returns 'role' (admin/super_admin), 'assinouPlano', 'gratuito', 'planType'
        let baseStatus = 'free';
        let planType = 'free';
        const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';

        if (isAdmin) {
            baseStatus = 'admin';
            planType = 'admin';
        } else if (userData.assinouPlano === true) {
            baseStatus = 'active';
            planType = userData.planType || 'monthly';
        } else if (userData.gratuito === true || !userData.assinouPlano) {
            baseStatus = 'free';
            planType = 'free';
        }

        // 3. Buscar dados no Stripe se for usuário pago
        let stripeCustomer = null;
        let stripeSubscription = null;
        let invoices = { data: [] }; // Inicializar com estrutura padrão
        let subscriptionStatus = baseStatus;

        // Check Stripe data for active subscriptions or if the user has any subscription history
        if (baseStatus === 'active' || userData.assinouPlano) {
            try {
                const customers = await stripe.customers.list({
                    email: userData.email,
                    limit: 1
                });

                if (customers.data && customers.data.length > 0) {
                    stripeCustomer = customers.data[0];
                    console.log(`✅ Customer encontrado no Stripe: ${stripeCustomer.id}`);

                    // Buscar assinatura mais recente
                    const subscriptions = await stripe.subscriptions.list({
                        customer: stripeCustomer.id,
                        status: 'all',
                        limit: 10
                    });

                    if (subscriptions.data && subscriptions.data.length > 0) {
                        // Priorizar assinaturas ativas, depois outras
                        stripeSubscription = subscriptions.data.find(s => s.status === 'active') ||
                            subscriptions.data[0];

                        console.log(`📋 Assinatura encontrada: ${stripeSubscription.id} - Status: ${stripeSubscription.status}`);

                        // Usar status do Stripe se disponível
                        subscriptionStatus = stripeSubscription.status;
                    }

                    // Buscar faturas com verificação de erro
                    try {
                        const invoicesResponse = await stripe.invoices.list({
                            customer: stripeCustomer.id,
                            limit: 10
                        });

                        // Verificar se a resposta tem a estrutura esperada
                        if (invoicesResponse && invoicesResponse.data) {
                            invoices = invoicesResponse;
                            console.log(`📄 ${invoices.data.length} faturas encontradas`);
                        } else {
                            console.warn('⚠️ Resposta inesperada ao buscar faturas:', invoicesResponse);
                            invoices = { data: [] };
                        }
                    } catch (invoicesError) {
                        console.warn(`⚠️ Erro ao buscar faturas: ${invoicesError.message}`);
                        invoices = { data: [] };
                    }
                }
            } catch (stripeError) {
                console.warn(`⚠️ Erro ao buscar dados no Stripe: ${stripeError.message}`);
                // Continuar sem dados do Stripe
                invoices = { data: [] };
            }
        }

        // 4. Determinar método de pagamento
        let paymentMethod = userData.paymentMethod || 'unknown';
        if (stripeSubscription && stripeSubscription.default_payment_method) {
            try {
                const paymentMethodObj = await stripe.paymentMethods.retrieve(
                    stripeSubscription.default_payment_method
                );
                paymentMethod = paymentMethodObj.type; // 'card' ou 'boleto'
            } catch (pmError) {
                console.warn('Erro ao buscar método de pagamento:', pmError);
            }
        }

        // 5. Calcular datas importantes
        let nextBillingDate = null;
        let lastPaymentDate = null;
        let nextBoletoDate = null;

        if (stripeSubscription) {
            nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);

            // Para boletos, calcular próxima data baseada no ciclo
            if (paymentMethod === 'boleto' && subscriptionStatus === 'active') {
                const periodDays = planType === 'quarterly' ? 90 :
                    planType === 'annual' ? 365 : 30;

                if (lastPaymentDate) {
                    nextBoletoDate = new Date(lastPaymentDate);
                    nextBoletoDate.setDate(nextBoletoDate.getDate() + periodDays);
                }
            }
        }

        // Buscar último pagamento confirmado - COM VERIFICAÇÃO DE SEGURANÇA
        if (invoices && invoices.data && Array.isArray(invoices.data) && invoices.data.length > 0) {
            const paidInvoices = invoices.data.filter(inv => inv.status === 'paid');
            if (paidInvoices.length > 0) {
                const lastPaidInvoice = paidInvoices[0];
                if (lastPaidInvoice.status_transitions && lastPaidInvoice.status_transitions.paid_at) {
                    lastPaymentDate = new Date(lastPaidInvoice.status_transitions.paid_at * 1000);
                }
            }
        }

        // 6. Determinar ações disponíveis
        const canUpgrade = baseStatus === 'free' || baseStatus === 'admin';
        const canCancel = subscriptionStatus === 'active' && paymentMethod === 'card';
        const canGenerateBoleto = (planType === 'quarterly' || planType === 'annual') &&
            subscriptionStatus === 'active';

        // Verificar se há boleto pendente
        let pendingBoleto = false;
        if (paymentMethod === 'boleto' && invoices.data && invoices.data.length > 0) {
            const lastInvoice = invoices.data[0];
            if (lastInvoice && lastInvoice.status === 'open' && lastInvoice.payment_intent) {
                try {
                    const paymentIntent = await stripe.paymentIntents.retrieve(lastInvoice.payment_intent);
                    if (paymentIntent.payment_method_types?.includes('boleto') &&
                        paymentIntent.status === 'requires_action') {
                        pendingBoleto = true;
                    }
                } catch (piError) {
                    console.warn('Erro ao verificar payment intent:', piError);
                }
            }
        }

        // 7. Preparar histórico de pagamentos - COM VERIFICAÇÃO DE SEGURANÇA
        const paymentHistory = [];
        if (invoices && invoices.data && Array.isArray(invoices.data)) {
            invoices.data.forEach(invoice => {
                try {
                    // Determinar método de pagamento da invoice
                    let invoicePaymentMethod = 'card';
                    if (invoice.payment_intent) {
                        // Seria ideal buscar o payment intent, mas por performance vamos inferir
                        if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
                            invoicePaymentMethod = 'unknown'; // Pode ser boleto ou cartão
                        }
                    }

                    const paymentHistoryItem = {
                        id: invoice.id,
                        amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
                        currency: invoice.currency ? invoice.currency.toUpperCase() : 'BRL',
                        status: invoice.status || 'unknown',
                        date: invoice.created ? new Date(invoice.created * 1000) : new Date(),
                        paidDate: (invoice.status_transitions && invoice.status_transitions.paid_at) ?
                            new Date(invoice.status_transitions.paid_at * 1000) : null,
                        downloadUrl: invoice.hosted_invoice_url || null,
                        paymentMethod: invoicePaymentMethod,
                        description: invoice.description || `Assinatura ${planType}`
                    };

                    paymentHistory.push(paymentHistoryItem);
                } catch (invoiceError) {
                    console.warn('Erro ao processar invoice:', invoiceError);
                }
            });
        }

        // Ordenar por data mais recente primeiro
        paymentHistory.sort((a, b) => b.date - a.date);

        // 8. Calcular informações financeiras
        const totalPaid = paymentHistory
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const currentMonthPayments = paymentHistory.filter(p => {
            const paymentDate = p.paidDate || p.date;
            if (!paymentDate) return false;

            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() &&
                paymentDate.getFullYear() === now.getFullYear();
        }).length;

        // 9. Determinar próximas ações recomendadas
        const recommendedActions = [];

        if (canUpgrade) {
            recommendedActions.push({
                type: 'upgrade',
                title: 'Assinar Plano Premium',
                description: 'Desbloqueie todas as funcionalidades',
                priority: 'high'
            });
        }

        if (pendingBoleto) {
            recommendedActions.push({
                type: 'boleto_pending',
                title: 'Boleto Pendente',
                description: 'Você tem um boleto aguardando pagamento',
                priority: 'urgent'
            });
        }

        if (canGenerateBoleto && !pendingBoleto) {
            recommendedActions.push({
                type: 'generate_boleto',
                title: 'Gerar Novo Boleto',
                description: 'Renove sua assinatura via boleto',
                priority: 'medium'
            });
        }

        // 10. Preparar resposta final
        const response = {
            // Status geral
            subscriptionStatus,
            planType,
            isActive: subscriptionStatus === 'active',
            paymentMethod,

            // Informações do plano
            planInfo: {
                name: planType === 'free' ? 'Gratuito' :
                    planType === 'monthly' ? 'Essencial' :
                        planType === 'quarterly' ? 'Profissional' :
                            planType === 'annual' ? 'Premium' : 'Admin',
                price: planType === 'free' ? 'R$ 0' :
                    planType === 'monthly' ? 'R$ 127' :
                        planType === 'quarterly' ? 'R$ 345' :
                            planType === 'annual' ? 'R$ 1143' : 'N/A',
                period: planType === 'monthly' ? '/mês' :
                    planType === 'quarterly' ? '/trimestre' :
                        planType === 'annual' ? '/ano' : '',
                features: getPlanFeatures(planType)
            },

            // Datas importantes
            nextBillingDate,
            nextBoletoDate,
            lastPaymentDate,

            // Ações disponíveis
            canCancel,
            canGenerateBoleto,
            canUpgrade,
            pendingBoleto,
            recommendedActions,

            // Dados financeiros
            financialInfo: {
                totalPaid,
                currentMonthPayments,
                averageMonthlySpend: totalPaid > 0 && paymentHistory.length > 0 ?
                    totalPaid / paymentHistory.length : 0
            },

            // Dados do Stripe
            stripeCustomerId: stripeCustomer?.id || null,
            stripeSubscriptionId: stripeSubscription?.id || null,

            // Histórico
            paymentHistory,

            // Dados do usuário para referência (from backend API)
            userData: {
                assinouPlano: userData.assinouPlano,
                planType: userData.planType,
                paymentMethod: paymentMethod, // From Stripe detection
                lastLoginAt: userData.last_login_at,
                createdAt: userData.created_at,
                isAdmin: isAdmin,
                role: userData.role
            },

            // Metadados para debug
            metadata: {
                hasStripeCustomer: !!stripeCustomer,
                hasStripeSubscription: !!stripeSubscription,
                invoiceCount: invoices.data ? invoices.data.length : 0,
                subscriptionInStripe: stripeSubscription?.status || 'none',
                lastUpdated: new Date().toISOString(),
                apiVersion: '2.1',
                errorHandled: true
            }
        };

        console.log(`✅ Status da assinatura processado para ${uid}:`, {
            status: subscriptionStatus,
            plan: planType,
            hasStripeData: !!stripeCustomer,
            paymentMethod,
            actionsAvailable: recommendedActions.length,
            invoicesFound: invoices.data ? invoices.data.length : 0
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Erro ao buscar status da assinatura:', error);

        return NextResponse.json(
            {
                message: 'Erro interno do servidor',
                error: error.message,
                subscriptionStatus: 'error',
                planType: 'free',
                isActive: false,
                metadata: {
                    errorOccurred: true,
                    errorMessage: error.message,
                    errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            },
            { status: 500 }
        );
    }
}

// Função auxiliar para obter funcionalidades do plano
function getPlanFeatures(planType) {
    const features = {
        free: [
            'Funcionalidades básicas',
            'Até 5 pacientes',
            'Suporte limitado'
        ],
        monthly: [
            'Todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Relatórios avançados'
        ],
        quarterly: [
            'Todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Relatórios avançados',
            'Módulo financeiro',
            '9% de economia'
        ],
        annual: [
            'Todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte VIP',
            'Relatórios avançados',
            'Módulo financeiro',
            'Integrações premium',
            '25% de economia'
        ],
        admin: [
            'Acesso administrativo completo',
            'Todas as funcionalidades',
            'Suporte técnico direto'
        ]
    };

    return features[planType] || features.free;
}