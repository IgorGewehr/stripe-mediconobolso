// app/api/teste-email/route.js
import { NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendHelpVideoEmail,
    sendBothWelcomeEmails
} from '../../../lib/emailService';

export async function GET(request) {
    try {
        // Extrair parâmetros da URL
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const type = searchParams.get('type') || 'both'; // 'welcome', 'help', 'both'

        // Validar se o email foi fornecido
        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email não fornecido. Use ?email=seuemail@exemplo.com&type=both',
                    examples: [
                        '/api/teste-email?email=teste@exemplo.com (envia ambos os emails)',
                        '/api/teste-email?email=teste@exemplo.com&type=welcome (só boas-vindas)',
                        '/api/teste-email?email=teste@exemplo.com&type=help (só email de ajuda)',
                        '/api/teste-email?email=teste@exemplo.com&name=João&type=both (com nome personalizado)'
                    ],
                    availableTypes: ['welcome', 'help', 'both']
                },
                { status: 400 }
            );
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Formato de email inválido' },
                { status: 400 }
            );
        }

        // Parâmetros adicionais
        const userName = name || email.split('@')[0]; // Usa parte do email como nome se não fornecido
        const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        console.log(`📧 Teste de email - Tipo: ${type}, Para: ${email}, Nome: ${userName}`);

        let result;
        let emailTypeDescription;

        // Executar o tipo de teste solicitado
        switch (type.toLowerCase()) {
            case 'welcome':
                console.log('📧 Enviando apenas email de boas-vindas...');
                result = await sendWelcomeEmail(email, userName, appLink);
                emailTypeDescription = 'Email de boas-vindas';
                break;

            case 'help':
                console.log('📧 Enviando apenas email de ajuda com vídeo...');
                result = await sendHelpVideoEmail(email, userName, appLink);
                emailTypeDescription = 'Email de ajuda com vídeo';
                break;

            case 'both':
            default:
                console.log('📧 Enviando ambos os emails...');
                result = await sendBothWelcomeEmails(email, userName, appLink);
                emailTypeDescription = 'Ambos os emails (boas-vindas + ajuda)';
                break;
        }

        // Verificar se o envio foi bem-sucedido
        if (result.success) {
            console.log(`✅ ${emailTypeDescription} enviado(s) com sucesso para: ${email}`);

            let responseMessage = `${emailTypeDescription} enviado(s) com sucesso para ${email}`;
            let responseData = { type, email, userName, appLink };

            // Adicionar detalhes específicos baseado no tipo
            if (type === 'both' && result.welcomeEmail && result.helpEmail) {
                responseData.details = {
                    welcomeEmail: {
                        success: result.welcomeEmail.success,
                        messageId: result.welcomeEmail.messageId
                    },
                    helpEmail: {
                        success: result.helpEmail.success,
                        messageId: result.helpEmail.messageId
                    }
                };
            } else if (result.messageId) {
                responseData.messageId = result.messageId;
            }

            return NextResponse.json(
                {
                    success: true,
                    message: responseMessage,
                    data: responseData
                },
                { status: 200 }
            );
        } else {
            console.error(`❌ Falha ao enviar ${emailTypeDescription}:`, result.error);
            return NextResponse.json(
                {
                    success: false,
                    message: `Falha ao enviar ${emailTypeDescription.toLowerCase()}`,
                    error: result.error,
                    type,
                    email
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Erro ao processar solicitação de teste de email:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao processar solicitação',
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Método POST para testes mais avançados
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            email,
            name,
            type = 'both',
            appLink: customAppLink
        } = body;

        // Validação básica
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email é obrigatório no body da requisição' },
                { status: 400 }
            );
        }

        // Definir valores
        const userName = name || email.split('@')[0];
        const appLink = customAppLink || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        console.log(`📧 Teste de email via POST - Tipo: ${type}, Para: ${email}, Nome: ${userName}`);

        let result;

        // Executar o tipo de teste solicitado
        switch (type.toLowerCase()) {
            case 'welcome':
                result = await sendWelcomeEmail(email, userName, appLink);
                break;

            case 'help':
                result = await sendHelpVideoEmail(email, userName, appLink);
                break;

            case 'both':
            default:
                result = await sendBothWelcomeEmails(email, userName, appLink);
                break;
        }

        // Retornar resultado
        if (result.success) {
            return NextResponse.json(
                {
                    success: true,
                    message: `Teste de email (${type}) enviado com sucesso para ${email}`,
                    data: result
                },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Falha no teste de email',
                    error: result.error
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Erro no teste de email via POST:', error);
        return NextResponse.json(
            { success: false, message: 'Erro no teste', error: error.message },
            { status: 500 }
        );
    }
}