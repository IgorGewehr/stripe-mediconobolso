// app/api/test-email/route.js
import { NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendHelpVideoEmail,
    sendBothWelcomeEmails,
    testEmailConfig
} from '../../../lib/emailService';

// Função auxiliar para criar resposta com CORS
function corsResponse(data, status = 200) {
    return NextResponse.json(data, {
        status,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

// GET para testes rápidos via navegador
export async function GET(request) {
    console.log('🚀 [TEST-EMAIL] Iniciando teste via GET...');

    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const name = searchParams.get('name') || 'Teste';
        const type = searchParams.get('type') || 'both';
        const testConfig = searchParams.get('testConfig') === 'true';

        // Se for apenas teste de configuração
        if (testConfig) {
            console.log('🔧 [TEST-EMAIL] Testando configuração...');
            const configResult = await testEmailConfig();
            return corsResponse({
                success: configResult.success,
                message: 'Teste de configuração',
                config: configResult,
                env: {
                    EMAIL_HOST: process.env.EMAIL_HOST || 'NÃO DEFINIDO',
                    EMAIL_PORT: process.env.EMAIL_PORT || 'NÃO DEFINIDO',
                    EMAIL_USER: process.env.EMAIL_USER || 'NÃO DEFINIDO',
                    EMAIL_FROM: process.env.EMAIL_FROM || 'NÃO DEFINIDO',
                    // Não expor a senha completa
                    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '***DEFINIDO***' : 'NÃO DEFINIDO'
                }
            });
        }

        // Validação de email
        if (!email) {
            return corsResponse({
                success: false,
                message: 'Email é obrigatório',
                examples: [
                    '/api/test-email?email=teste@example.com',
                    '/api/test-email?email=teste@example.com&name=João&type=welcome',
                    '/api/test-email?email=teste@example.com&type=help',
                    '/api/test-email?email=teste@example.com&type=both',
                    '/api/test-email?testConfig=true'
                ]
            }, 400);
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return corsResponse({
                success: false,
                message: 'Formato de email inválido',
                receivedEmail: email
            }, 400);
        }

        // Link da aplicação
        const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        console.log(`📧 [TEST-EMAIL] Enviando ${type} para ${email} (${name})`);

        let result;

        // Executar envio baseado no tipo
        switch (type) {
            case 'welcome':
                result = await sendWelcomeEmail(email, name, appLink);
                break;

            case 'help':
                result = await sendHelpVideoEmail(email, name, appLink);
                break;

            case 'both':
            default:
                result = await sendBothWelcomeEmails(email, name, appLink);
                break;
        }

        // Retornar resultado
        if (result.success) {
            console.log(`✅ [TEST-EMAIL] Sucesso no envio para ${email}`);
            return corsResponse({
                success: true,
                message: `Email(s) do tipo '${type}' enviado(s) com sucesso!`,
                details: result,
                sentTo: email,
                type: type
            });
        } else {
            console.error(`❌ [TEST-EMAIL] Falha no envio para ${email}:`, result.error);
            return corsResponse({
                success: false,
                message: `Falha ao enviar email(s) do tipo '${type}'`,
                error: result.error || 'Erro desconhecido',
                sentTo: email,
                type: type
            }, 500);
        }

    } catch (error) {
        console.error('❌ [TEST-EMAIL] Erro geral:', error);
        return corsResponse({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
}

// POST para testes via código/Postman
export async function POST(request) {
    console.log('🚀 [TEST-EMAIL] Iniciando teste via POST...');

    try {
        const body = await request.json();
        const { email, name = 'Teste', type = 'both' } = body;

        // Validação de email
        if (!email) {
            return corsResponse({
                success: false,
                message: 'Email é obrigatório no body da requisição'
            }, 400);
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return corsResponse({
                success: false,
                message: 'Formato de email inválido',
                receivedEmail: email
            }, 400);
        }

        // Link da aplicação
        const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        console.log(`📧 [TEST-EMAIL] POST - Enviando ${type} para ${email} (${name})`);

        let result;

        // Executar envio baseado no tipo
        switch (type) {
            case 'welcome':
                result = await sendWelcomeEmail(email, name, appLink);
                break;

            case 'help':
                result = await sendHelpVideoEmail(email, name, appLink);
                break;

            case 'both':
            default:
                result = await sendBothWelcomeEmails(email, name, appLink);
                break;
        }

        // Retornar resultado
        if (result.success) {
            console.log(`✅ [TEST-EMAIL] POST - Sucesso no envio para ${email}`);
            return corsResponse({
                success: true,
                message: `Email(s) enviado(s) com sucesso via POST!`,
                details: result,
                sentTo: email,
                type: type
            });
        } else {
            console.error(`❌ [TEST-EMAIL] POST - Falha no envio para ${email}:`, result.error);
            return corsResponse({
                success: false,
                message: `Falha ao enviar email(s) via POST`,
                error: result.error || 'Erro desconhecido',
                sentTo: email,
                type: type
            }, 500);
        }

    } catch (error) {
        console.error('❌ [TEST-EMAIL] POST - Erro geral:', error);
        return corsResponse({
            success: false,
            message: 'Erro interno do servidor no POST',
            error: error.message
        }, 500);
    }
}