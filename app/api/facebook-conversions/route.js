// app/api/facebook-conversions/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Função para fazer hash SHA-256
function hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(String(data).toLowerCase().trim()).digest('hex');
}

// Função para formatar telefone para o padrão internacional
function formatPhone(phone) {
    if (!phone) return null;
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    // Se não começar com 55, adiciona (código do Brasil)
    if (!cleaned.startsWith('55')) {
        return '+55' + cleaned;
    }
    return '+' + cleaned;
}

export async function POST(req) {
    try {
        const {
            eventName,
            eventTime,
            userData = {},
            customData = {},
            eventSourceUrl,
            actionSource = 'website',
            eventId
        } = await req.json();

        // Validações básicas
        if (!eventName) {
            return NextResponse.json(
                { error: 'eventName é obrigatório' },
                { status: 400 }
            );
        }

        // Preparar user_data com hashing
        const hashedUserData = {};

        if (userData.email) {
            hashedUserData.em = [hashData(userData.email)];
        }

        if (userData.phone) {
            const formattedPhone = formatPhone(userData.phone);
            if (formattedPhone) {
                hashedUserData.ph = [hashData(formattedPhone)];
            }
        }

        if (userData.firstName) {
            hashedUserData.fn = [hashData(userData.firstName)];
        }

        if (userData.lastName) {
            hashedUserData.ln = [hashData(userData.lastName)];
        }

        if (userData.city) {
            hashedUserData.ct = [hashData(userData.city)];
        }

        if (userData.state) {
            hashedUserData.st = [hashData(userData.state)];
        }

        if (userData.zipCode) {
            hashedUserData.zp = [hashData(userData.zipCode)];
        }

        if (userData.country) {
            hashedUserData.country = [hashData(userData.country)];
        }

        // Dados que NÃO devem ser hasheados
        if (userData.clientIpAddress) {
            hashedUserData.client_ip_address = userData.clientIpAddress;
        }

        if (userData.clientUserAgent) {
            hashedUserData.client_user_agent = userData.clientUserAgent;
        }

        if (userData.fbc) {
            hashedUserData.fbc = userData.fbc;
        }

        if (userData.fbp) {
            hashedUserData.fbp = userData.fbp;
        }

        // Montar o payload da API de Conversões
        const conversionData = {
            data: [{
                event_name: eventName,
                event_time: eventTime || Math.floor(Date.now() / 1000),
                action_source: actionSource,
                user_data: hashedUserData,
                custom_data: customData
            }]
        };

        // Adicionar event_source_url se for website
        if (actionSource === 'website' && eventSourceUrl) {
            conversionData.data[0].event_source_url = eventSourceUrl;
        }

        // Adicionar event_id se fornecido (para deduplicação)
        if (eventId) {
            conversionData.data[0].event_id = eventId;
        }

        console.log('📊 Enviando evento para Facebook Conversions API:', {
            eventName,
            actionSource,
            hasUserData: Object.keys(hashedUserData).length > 0
        });

        // Enviar para a API de Conversões do Facebook
        const fbResponse = await fetch(
            `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PIXEL_ID}/events`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...conversionData,
                    access_token: process.env.FACEBOOK_ACCESS_TOKEN
                })
            }
        );

        const fbResult = await fbResponse.json();

        if (!fbResponse.ok) {
            console.error('❌ Erro na API de Conversões do Facebook:', fbResult);
            return NextResponse.json(
                {
                    error: 'Erro ao enviar evento para Facebook',
                    details: fbResult
                },
                { status: 500 }
            );
        }

        console.log('✅ Evento enviado com sucesso para Facebook:', fbResult);

        return NextResponse.json({
            success: true,
            message: 'Evento enviado com sucesso',
            data: fbResult
        });

    } catch (error) {
        console.error('❌ Erro na API de Conversões:', error);
        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                message: error.message
            },
            { status: 500 }
        );
    }
}