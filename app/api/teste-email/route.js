// app/api/teste-email/route.js
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '../../../lib/emailService';

export async function GET(request) {
    try {
        // Extrair parâmetros da URL
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        // Validar se o email foi fornecido
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email não fornecido. Use ?email=seuemail@exemplo.com' },
                { status: 400 }
            );
        }

        // Parâmetros adicionais (opcional)
        const name = searchParams.get('name') || email.split('@')[0]; // Usa parte do email como nome se não fornecido
        const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/`;

        console.log(`📧 Tentando enviar email de teste para: ${email}`);

        // Enviar o email usando o serviço existente
        const result = await sendWelcomeEmail(email, name, appLink);

        if (result.success) {
            return NextResponse.json(
                { success: true, message: `Email enviado com sucesso para ${email}`, messageId: result.messageId },
                { status: 200 }
            );
        } else {
            console.error('❌ Falha ao enviar email:', result.error);
            return NextResponse.json(
                { success: false, message: 'Falha ao enviar email', error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('❌ Erro ao processar solicitação de teste de email:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao processar solicitação', error: error.message },
            { status: 500 }
        );
    }
}