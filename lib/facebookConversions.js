// lib/facebookConversions.js

// Função para gerar um ID único para o evento (deduplicação)
export function generateEventId() {
    // Use crypto.randomUUID if available (modern browsers), otherwise fallback
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for older browsers or Node.js environments without randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Função para extrair dados do usuário de diferentes formatos
export function extractUserData(userData, req = null) {
    const result = {};

    // Email
    if (userData.email) {
        result.email = userData.email;
    }

    // Nome completo - dividir em primeiro e último nome
    if (userData.fullName) {
        const nameParts = userData.fullName.trim().split(' ');
        result.firstName = nameParts[0];
        result.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    }

    // Telefone
    if (userData.phone) {
        result.phone = userData.phone;
    }

    // Endereço
    if (userData.address) {
        result.city = userData.address.city;
        result.state = userData.address.state;
        result.zipCode = userData.address.cep || userData.address.postalCode;
        result.country = userData.address.country || 'BR';
    }

    // Dados diretos de cidade, estado, etc.
    if (userData.city) result.city = userData.city;
    if (userData.state) result.state = userData.state;
    if (userData.cep) result.zipCode = userData.cep;

    // Dados do navegador (se disponível)
    if (req) {
        const userAgent = req.headers.get('user-agent');
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');

        if (userAgent) {
            result.clientUserAgent = userAgent;
        }

        if (forwardedFor) {
            result.clientIpAddress = forwardedFor.split(',')[0].trim();
        } else if (realIp) {
            result.clientIpAddress = realIp;
        }
    }

    return result;
}

// Função principal para enviar eventos
export async function sendFacebookConversion({
                                                 eventName,
                                                 userData = {},
                                                 customData = {},
                                                 eventSourceUrl = null,
                                                 actionSource = 'website',
                                                 eventId = null,
                                                 req = null
                                             }) {
    try {
        // Extrair e processar dados do usuário
        const processedUserData = extractUserData(userData, req);

        // Gerar ID do evento se não fornecido
        const finalEventId = eventId || generateEventId();

        // Preparar payload
        const payload = {
            eventName,
            eventTime: Math.floor(Date.now() / 1000),
            userData: processedUserData,
            customData,
            actionSource,
            eventId: finalEventId
        };

        // Adicionar URL da fonte se for website
        if (actionSource === 'website' && eventSourceUrl) {
            payload.eventSourceUrl = eventSourceUrl;
        }

        console.log(`📊 Preparando evento Facebook: ${eventName}`, {
            hasUserData: Object.keys(processedUserData).length > 0,
            eventId: finalEventId
        });

        // Enviar para nossa API interna
        const response = await fetch('/api/facebook-conversions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao enviar evento');
        }

        console.log('✅ Evento Facebook enviado com sucesso:', eventName);
        return { success: true, eventId: finalEventId, data: result };

    } catch (error) {
        console.error('❌ Erro ao enviar evento Facebook:', error);
        return { success: false, error: error.message };
    }
}

// Eventos específicos pré-configurados
export const FacebookEvents = {
    // Evento de compra/assinatura
    Purchase: (userData, { value, currency = 'BRL', planType }) =>
        sendFacebookConversion({
            eventName: 'Purchase',
            userData,
            customData: {
                currency,
                value: parseFloat(value),
                content_category: 'subscription',
                content_name: `Plano ${planType}`,
                content_type: 'subscription'
            }
        }),

    // Evento de registro/cadastro
    CompleteRegistration: (userData, { method = 'email', planType = 'free' }) =>
        sendFacebookConversion({
            eventName: 'CompleteRegistration',
            userData,
            customData: {
                registration_method: method,
                content_category: 'signup',
                content_name: `Cadastro ${planType}`,
                status: true
            }
        }),

    // Evento de iniciar checkout
    InitiateCheckout: (userData, { value, currency = 'BRL', planType }) =>
        sendFacebookConversion({
            eventName: 'InitiateCheckout',
            userData,
            customData: {
                currency,
                value: parseFloat(value),
                content_category: 'subscription',
                content_name: `Plano ${planType}`,
                num_items: 1
            }
        }),

    // Evento de adicionar informações de pagamento
    AddPaymentInfo: (userData, { paymentMethod, planType }) =>
        sendFacebookConversion({
            eventName: 'AddPaymentInfo',
            userData,
            customData: {
                payment_method: paymentMethod,
                content_category: 'subscription',
                content_name: `Plano ${planType}`
            }
        }),

    // Evento de lead gerado
    Lead: (userData, { source = 'website' }) =>
        sendFacebookConversion({
            eventName: 'Lead',
            userData,
            customData: {
                lead_source: source,
                content_category: 'lead_generation'
            }
        })
};

// Função para uso server-side (webhooks)
export async function sendServerSideFacebookEvent({
                                                      eventName,
                                                      userData,
                                                      customData = {},
                                                      actionSource = 'website'
                                                  }) {
    try {
        const processedUserData = extractUserData(userData);

        // Para server-side, usar action_source apropriado
        const serverActionSource = actionSource === 'webhook' ? 'website' : actionSource;

        const payload = {
            eventName,
            userData: processedUserData,
            customData,
            actionSource: serverActionSource,
            eventId: generateEventId()
        };

        console.log(`📊 Enviando evento server-side: ${eventName}`);

        // Chamar diretamente a função da API (importar se necessário)
        // Ou fazer uma requisição HTTP interna
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/facebook-conversions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro ao enviar evento server-side');
        }

        console.log('✅ Evento server-side enviado:', eventName);
        return { success: true, data: result };

    } catch (error) {
        console.error('❌ Erro ao enviar evento server-side:', error);
        return { success: false, error: error.message };
    }
}