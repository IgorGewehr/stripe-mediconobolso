// app/api/email/route.js
import { NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendHelpVideoEmail,
    sendBothWelcomeEmails,
    sendCustomEmail
} from '../../../lib/emailService';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            email,
            name,
            type = 'both', // 'welcome', 'help', 'both', 'custom'
            appLink,
            subject, // Para emails customizados
            body: emailBody // Para emails customizados
        } = body;

        // Validação básica
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email é obrigatório' },
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

        // Definir valores padrão
        const userName = name || email.split('@')[0];
        const finalAppLink = appLink || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}`;

        console.log(`📧 Solicitação de envio de email - Tipo: ${type}, Para: ${email}, Nome: ${userName}`);

        let result;

        // Executar o tipo de envio solicitado
        switch (type) {
            case 'welcome':
                result = await sendWelcomeEmail(email, userName, finalAppLink);
                break;

            case 'help':
                result = await sendHelpVideoEmail(email, userName, finalAppLink);
                break;

            case 'custom':
                // Validar campos obrigatorios para email customizado
                if (!subject || !emailBody) {
                    return NextResponse.json(
                        { success: false, message: 'Subject e body sao obrigatorios para emails customizados' },
                        { status: 400 }
                    );
                }
                result = await sendCustomEmail(email, userName, subject, emailBody);
                break;

            case 'both':
            default:
                result = await sendBothWelcomeEmails(email, userName, finalAppLink);
                break;
        }

        // Verificar se o envio foi bem-sucedido
        if (result.success) {
            console.log(`✅ Email(s) enviado(s) com sucesso para: ${email}`);
            return NextResponse.json(
                {
                    success: true,
                    message: `Email(s) enviado(s) com sucesso para ${email}`,
                    data: result
                },
                { status: 200 }
            );
        } else {
            console.error(`❌ Falha ao enviar email(s) para: ${email}`, result.error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Falha no envio do(s) email(s)',
                    error: result.error
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Erro ao processar solicitação de email:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Método GET para facilitar testes rápidos via URL
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const type = searchParams.get('type') || 'both';

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Parâmetro email é obrigatório. Exemplo: /api/email?email=teste@exemplo.com&name=João&type=both',
                    availableTypes: ['welcome', 'help', 'both']
                },
                { status: 400 }
            );
        }

        // Redirecionar para o método POST
        return await POST(new Request(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name,
                type
            })
        }));

    } catch (error) {
        console.error('❌ Erro no método GET:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao processar solicitação GET', error: error.message },
            { status: 500 }
        );
    }
}