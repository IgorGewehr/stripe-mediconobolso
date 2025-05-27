// emailservice.js - Versão melhorada com melhor debug e controle

import nodemailer from 'nodemailer';

// Função para verificar variáveis de ambiente
function checkEnvVars() {
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
    }

    console.log('✅ Todas as variáveis de ambiente estão configuradas');
}

// Configuração do transporter com tratamento de erro
function createEmailTransporter() {
    try {
        checkEnvVars();

        const transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            },
            requireTLS: true,
            connectionTimeout: 15000, // Aumentado para 15 segundos
            greetingTimeout: 10000,   // Aumentado para 10 segundos
            socketTimeout: 15000,     // Aumentado para 15 segundos
        });

        console.log('✅ Transporter de email criado com sucesso');
        return transporter;
    } catch (error) {
        console.error('❌ Erro ao criar transporter:', error);
        throw error;
    }
}

// Função auxiliar para aguardar com log
function waitWithLog(seconds) {
    console.log(`⏳ Aguardando ${seconds} segundos...`);
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Função para enviar email de boas-vindas
export async function sendWelcomeEmail(userEmail, userName, appLink) {
    console.log(`📧 [WELCOME] Iniciando envio para: ${userEmail}`);

    try {
        const transporter = createEmailTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: 'Bem-vindo ao Médico no Bolso! Sua conta foi criada',
            html: `<!-- Seu HTML do email de boas-vindas aqui -->
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Médico no Bolso</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
                <tr>
                    <td align="center" style="padding: 30px 0; background-color: #0F0F0F; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Médico no Bolso" width="120" style="display: block; margin: 0 auto;">
                    </td>
                </tr>
                <tr>
                    <td style="padding: 40px 30px 20px 30px;">
                        <h1 style="color: #151B3B; font-size: 24px; margin: 0 0 20px 0; text-align: center; font-weight: 600;">Bem-vindo, Dr. ${userName || 'Médico'}!</h1>
                        
                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">ACESSAR MINHA CONTA</a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 20px 30px 30px 30px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
        };

        console.log(`📧 [WELCOME] Enviando...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [WELCOME] Email enviado com sucesso:', info.messageId);

        return { success: true, messageId: info.messageId, type: 'welcome' };
    } catch (error) {
        console.error('❌ [WELCOME] Erro ao enviar:', error);
        return { success: false, error: error.message, type: 'welcome' };
    }
}

// Email de ajuda SIMPLIFICADO (sem vídeo primeiro)
export async function sendHelpVideoEmail(userEmail, userName, appLink) {
    console.log(`📧 [HELP] Iniciando envio para: ${userEmail}`);

    try {
        const transporter = createEmailTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: '🎥 Tutorial: Como acessar o Médico no Bolso',
            html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tutorial - Médico no Bolso</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <div style="padding: 30px; background-color: #151B3B; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎥 Tutorial de Acesso</h1>
                </div>
                
                <div style="padding: 30px;">
                    <h2 style="color: #151B3B;">Olá Dr. ${userName || 'Médico'}!</h2>
                    
                    <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                        Preparamos um tutorial para ajudá-lo a acessar a plataforma.
                    </p>
                    
                    <div style="background-color: #FFF3CD; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #856404; margin: 0 0 15px 0;">📹 Tutorial em Vídeo</h3>
                        <p style="color: #856404; margin: 0 0 15px 0;">
                            Clique no link abaixo para baixar nosso tutorial:
                        </p>
                        <a href="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/welcome.mp4?alt=media&token=546d5666-6218-4dc2-acf8-4663473a623b" 
                           style="display: inline-block; padding: 10px 20px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            🎥 BAIXAR TUTORIAL
                        </a>
                    </div>
                    
                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #151B3B; margin: 0 0 15px 0;">Passos Rápidos:</h3>
                        <p style="color: #666666; margin: 5px 0;"><strong>1.</strong> Acesse: <a href="${appLink}" style="color: #F9B934;">${appLink}</a></p>
                        <p style="color: #666666; margin: 5px 0;"><strong>2.</strong> Use seu email: <strong>${userEmail}</strong></p>
                        <p style="color: #666666; margin: 5px 0;"><strong>3.</strong> Digite sua senha</p>
                        <p style="color: #666666; margin: 5px 0;"><strong>4.</strong> Explore a plataforma!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold;">ACESSAR AGORA</a>
                    </div>
                    
                    <p style="color: #666666; font-size: 14px; text-align: center;">
                        Dúvidas? Responda este email ou contate: 
                        <a href="mailto:suporte@mediconobolso.app" style="color: #F9B934;">suporte@mediconobolso.app</a>
                    </p>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>`,
        };

        console.log(`📧 [HELP] Enviando...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [HELP] Email enviado com sucesso:', info.messageId);

        return { success: true, messageId: info.messageId, type: 'help' };
    } catch (error) {
        console.error('❌ [HELP] Erro ao enviar:', error);
        return { success: false, error: error.message, type: 'help' };
    }
}

// Função melhorada para enviar ambos os emails
export async function sendBothWelcomeEmails(userEmail, userName, appLink) {
    console.log(`📧 [BOTH] Iniciando envio sequencial para: ${userEmail}`);

    const results = {
        welcome: { success: false, error: null, messageId: null },
        help: { success: false, error: null, messageId: null }
    };

    try {
        // PRIMEIRO EMAIL: Boas-vindas
        console.log('📧 [BOTH] 1/2 - Enviando email de boas-vindas...');
        results.welcome = await sendWelcomeEmail(userEmail, userName, appLink);

        if (results.welcome.success) {
            console.log(`✅ [BOTH] Email de boas-vindas: SUCESSO (${results.welcome.messageId})`);
        } else {
            console.log(`❌ [BOTH] Email de boas-vindas: FALHA (${results.welcome.error})`);
        }

        // AGUARDAR MAIS TEMPO entre emails
        await waitWithLog(10); // 10 segundos

        // SEGUNDO EMAIL: Ajuda (tentar mesmo se o primeiro falhou)
        console.log('📧 [BOTH] 2/2 - Enviando email de ajuda...');
        results.help = await sendHelpVideoEmail(userEmail, userName, appLink);

        if (results.help.success) {
            console.log(`✅ [BOTH] Email de ajuda: SUCESSO (${results.help.messageId})`);
        } else {
            console.log(`❌ [BOTH] Email de ajuda: FALHA (${results.help.error})`);
        }

        // Verificar se pelo menos um foi enviado
        const hasSuccess = results.welcome.success || results.help.success;
        const allSuccess = results.welcome.success && results.help.success;

        const response = {
            success: hasSuccess, // Consideramos sucesso se pelo menos um foi enviado
            allEmailsSuccess: allSuccess,
            welcomeEmail: results.welcome,
            helpEmail: results.help,
            message: `Boas-vindas: ${results.welcome.success ? 'OK' : 'FALHA'}, Ajuda: ${results.help.success ? 'OK' : 'FALHA'}`,
            summary: {
                total: 2,
                successful: (results.welcome.success ? 1 : 0) + (results.help.success ? 1 : 0),
                failed: (results.welcome.success ? 0 : 1) + (results.help.success ? 0 : 1)
            }
        };

        console.log('📊 [BOTH] Resultado final:', response.message);
        return response;

    } catch (error) {
        console.error('❌ [BOTH] Erro geral:', error);
        return {
            success: false,
            allEmailsSuccess: false,
            error: error.message,
            message: 'Falha geral no envio dos emails',
            welcomeEmail: results.welcome,
            helpEmail: results.help
        };
    }
}

// Função para enviar APENAS o email de ajuda (para teste)
export async function sendOnlyHelpEmail(userEmail, userName, appLink) {
    console.log(`📧 [ONLY-HELP] Teste: enviando APENAS email de ajuda para: ${userEmail}`);
    return await sendHelpVideoEmail(userEmail, userName, appLink);
}

// Função de teste de configuração
export async function testEmailConfig() {
    console.log('🔧 Testando configuração de email...');

    try {
        checkEnvVars();
        const transporter = createEmailTransporter();

        console.log('🔧 Verificando conexão com servidor SMTP...');
        await transporter.verify();

        console.log('✅ Configuração de email funcionando!');
        return { success: true, message: 'Configuração OK' };
    } catch (error) {
        console.error('❌ Erro na configuração de email:', error);
        return { success: false, error: error.message };
    }
}