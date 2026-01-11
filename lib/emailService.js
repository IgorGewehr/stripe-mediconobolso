//emailservice.js - Versão corrigida

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

// Configuração do transporter com tratamento de erro - AGORA EXPORTADA
export function createEmailTransporter() {
    try {
        checkEnvVars();

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true = TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            },
            requireTLS: true,
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });

        console.log('✅ Transporter de email criado com sucesso');
        return transporter;
    } catch (error) {
        console.error('❌ Erro ao criar transporter:', error);
        throw error;
    }
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
            html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Médico no Bolso</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
                <!-- Cabeçalho com Logo -->
                <tr>
                    <td align="center" style="padding: 30px 0; background-color: #0F0F0F; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Médico no Bolso" width="120" style="display: block; margin: 0 auto;">
                    </td>
                </tr>
                
                <!-- Seção de Boas-vindas -->
                <tr>
                    <td style="padding: 40px 30px 20px 30px;">
                        <h1 style="color: #151B3B; font-size: 24px; margin: 0 0 20px 0; text-align: center; font-weight: 600;">Bem-vindo ao Médico no Bolso, Dr. ${userName || 'Médico'}!</h1>
                        
                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Sua conta foi <span style="color: #4CAF50; font-weight: bold;">criada com sucesso</span>. 
                            Estamos muito felizes em tê-lo em nossa plataforma e queremos ajudá-lo a transformar sua prática médica 
                            com nossa solução completa.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">ACESSAR MINHA CONTA</a>
                        </div>
                    </td>
                </tr>
                
                <!-- Recursos Principais -->
                <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                        <h2 style="color: #151B3B; font-size: 20px; margin: 0 0 25px 0; text-align: center; font-weight: 600;">Sua conta inclui acesso a:</h2>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px;">
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📅 Agenda & Consultas</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Sistema completo de agendamento com gestão de consultas.</p>
                                    </div>
                                </td>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px;">
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">👥 Gestão de Pacientes</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Cadastro completo e histórico médico de pacientes.</p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px;">
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">🧠 Anamnese Inteligente</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">IA para criar anamneses personalizadas em segundos.</p>
                                    </div>
                                </td>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px;">
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📊 Relatórios</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Insights para otimizar sua produtividade.</p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Suporte -->
                <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center; border-top: 1px solid #EEEEEE;">
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                            Precisa de ajuda? Entre em contato:
                            <a href="mailto:suporte@mediconobolso.app" style="color: #F9B934; text-decoration: none; font-weight: bold;">suporte@mediconobolso.app</a>
                        </p>
                    </td>
                </tr>
                
                <!-- Rodapé -->
                <tr>
                    <td style="padding: 20px 30px 30px 30px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
        };

        console.log(`📧 [WELCOME] Enviando email de boas-vindas...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [WELCOME] Email de boas-vindas enviado com sucesso:', info.messageId);

        return { success: true, messageId: info.messageId, type: 'welcome' };
    } catch (error) {
        console.error('❌ [WELCOME] Erro ao enviar email de boas-vindas:', error);
        return { success: false, error: error.message, type: 'welcome' };
    }
}

// Email de ajuda com link do vídeo correto do Firebase
export async function sendHelpVideoEmail(userEmail, userName, appLink) {
    console.log(`📧 [HELP] Iniciando envio de email de ajuda para: ${userEmail}`);

    try {
        const transporter = createEmailTransporter();

        const videoUrl = `https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/welcome.mp4?alt=media&token=546d5666-6218-4dc2-acf8-4663473a623b`;


        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: '🎥 Tutorial: Como acessar o Médico no Bolso',
            text: `Olá Dr. ${userName},\n\nAssista ao nosso tutorial em vídeo aqui:\n${videoUrl}\n\nQualquer dúvida, é só responder este e-mail.`,
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
                <!-- Cabeçalho -->
                <div style="padding: 30px; background-color: #151B3B; text-align: center;">
                    <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Médico no Bolso" width="120" style="display: block; margin: 0 auto;">
                    <h1 style="color: white; margin: 20px 0 0 0;">🎥 Tutorial de Acesso</h1>
                </div>
                
                <!-- Conteúdo -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #151B3B; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Precisa de ajuda para acessar?</h2>
                    
                    <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Olá Dr. ${userName || 'Médico'},
                    </p>

                    <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                        Preparamos um tutorial especial em vídeo para ajudá-lo a acessar o <strong>Médico no Bolso</strong> e aproveitar ao máximo nossa plataforma.
                    </p>
                    
                    <!-- Seção do Vídeo -->
                    <div style="background-color: #FFF3CD; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                        <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📹 Vídeo Tutorial de Boas-vindas</h3>
                        <p style="color: #856404; margin: 0 0 20px 0; font-size: 14px;">
                            Assista ao nosso tutorial passo a passo para começar
                        </p>
                        <a href="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/welcome.mp4?alt=media&token=546d5666-6218-4dc2-acf8-4663473a623b" 
                           style="display: inline-block; padding: 12px 25px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
                            🎥 ASSISTIR VÍDEO TUTORIAL
                        </a>
                        <br>
                        <small style="color: #856404; font-size: 12px;">Clique para baixar e assistir</small>
                    </div>
                    
                    <!-- Botão Principal -->
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">ACESSAR PLATAFORMA AGORA</a>
                    </div>

                    <!-- Passos Rápidos -->
                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #151B3B; margin: 0 0 15px 0;">Passos Rápidos:</h3>
                        <p style="color: #666666; margin: 5px 0;"><strong>1.</strong> Clique em "ACESSAR PLATAFORMA AGORA"</p>
                        <p style="color: #666666; margin: 5px 0;"><strong>2.</strong> Use seu email: <strong>${userEmail}</strong></p>
                        <p style="color: #666666; margin: 5px 0;"><strong>3.</strong> Digite a senha que você criou</p>
                        <p style="color: #666666; margin: 5px 0;"><strong>4.</strong> Explore todas as funcionalidades!</p>
                    </div>
                    
                    <!-- Dicas Extras -->
                    <div style="background-color: #E8F5E8; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #2E7D32; margin: 0 0 15px 0;">💡 Dicas para começar:</h3>
                        <ul style="color: #2E7D32; margin: 0; padding-left: 20px;">
                            <li>Comece criando seu primeiro paciente</li>
                            <li>Configure sua agenda de consultas</li>
                            <li>Explore a ferramenta de anamnese inteligente</li>
                            <li>Teste a análise de exames com IA</li>
                        </ul>
                    </div>
                    
                    <!-- Contato -->
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE;">
                        <p style="color: #1976D2; font-size: 14px; margin: 0;">
                            <strong>Ainda com dificuldades?</strong><br>
                            Responda este email ou envie para: <a href="mailto:suporte@mediconobolso.app" style="color: #1565C0; text-decoration: none; font-weight: bold;">suporte@mediconobolso.app</a>
                        </p>
                    </div>
                </div>
                
                <!-- Rodapé -->
                <div style="padding: 20px 30px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
      `
        };

        console.log(`📧 [HELP] Enviando email de ajuda com vídeo...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [HELP] Email de ajuda enviado com sucesso:', info.messageId);

        return { success: true, messageId: info.messageId, type: 'help' };
    } catch (error) {
        console.error('❌ [HELP] Erro ao enviar email de ajuda:', error);
        return { success: false, error: error.message, type: 'help' };
    }
}

// Função para enviar ambos os emails com controle individual
export async function sendBothWelcomeEmails(userEmail, userName, appLink) {
    console.log(`📧 [BOTH] Iniciando envio de ambos os emails para: ${userEmail}`);

    const results = {
        welcome: { success: false, error: null, messageId: null },
        help: { success: false, error: null, messageId: null }
    };

    try {
        // PRIMEIRO EMAIL: Boas-vindas
        console.log('📧 [BOTH] 1/2 - Enviando email de boas-vindas...');
        try {
            results.welcome = await sendWelcomeEmail(userEmail, userName, appLink);
            console.log(`✅ [BOTH] Email de boas-vindas: ${results.welcome.success ? 'SUCESSO' : 'FALHA'}`);
            if (!results.welcome.success) {
                console.log(`❌ [BOTH] Erro welcome: ${results.welcome.error}`);
            }
        } catch (welcomeError) {
            console.error('❌ [BOTH] Exception no email de boas-vindas:', welcomeError);
            results.welcome = { success: false, error: welcomeError.message, messageId: null };
        }

        // SEGUNDO EMAIL: Ajuda
        console.log('📧 [BOTH] 2/2 - Enviando email de ajuda com vídeo...');
        try {
            results.help = await sendHelpVideoEmail(userEmail, userName, appLink);
            console.log(`✅ [BOTH] Email de ajuda: ${results.help.success ? 'SUCESSO' : 'FALHA'}`);
            if (!results.help.success) {
                console.log(`❌ [BOTH] Erro help: ${results.help.error}`);
            }
        } catch (helpError) {
            console.error('❌ [BOTH] Exception no email de ajuda:', helpError);
            results.help = { success: false, error: helpError.message, messageId: null };
        }

        // Determinar sucesso geral
        const overallSuccess = results.welcome.success && results.help.success;
        const partialSuccess = results.welcome.success || results.help.success;

        const response = {
            success: partialSuccess, // Consideramos sucesso parcial se pelo menos um funcionou
            allEmailsSuccess: overallSuccess,
            welcomeEmail: results.welcome,
            helpEmail: results.help,
            message: `Boas-vindas: ${results.welcome.success ? 'OK' : 'FALHA'}, Ajuda: ${results.help.success ? 'OK' : 'FALHA'}`,
            summary: {
                total: 2,
                successful: (results.welcome.success ? 1 : 0) + (results.help.success ? 1 : 0),
                failed: (results.welcome.success ? 0 : 1) + (results.help.success ? 0 : 1)
            },
            debug: {
                welcomeMessageId: results.welcome.messageId,
                helpMessageId: results.help.messageId,
                welcomeError: results.welcome.error,
                helpError: results.help.error
            }
        };

        console.log('📊 [BOTH] Resultado final dos emails:', response.message);
        return response;

    } catch (error) {
        console.error('❌ [BOTH] Erro geral ao enviar ambos os emails:', error);
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

// Função para enviar email customizado (para campanhas CRM)
export async function sendCustomEmail(userEmail, userName, subject, body) {
    console.log(`📧 [CUSTOM] Iniciando envio de email customizado para: ${userEmail}`);

    try {
        const transporter = createEmailTransporter();

        // Converter quebras de linha em <br> para HTML
        const htmlBody = body.replace(/\n/g, '<br>');

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: subject,
            text: body,
            html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-top: 20px; margin-bottom: 20px;">
                <!-- Cabeçalho -->
                <tr>
                    <td align="center" style="padding: 30px 30px 20px 30px; background: linear-gradient(135deg, #1852FE 0%, #0A3AA8 100%); border-top-left-radius: 12px; border-top-right-radius: 12px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Logo" width="80" style="display: block; margin: 0 auto;">
                    </td>
                </tr>

                <!-- Conteudo -->
                <tr>
                    <td style="padding: 40px 35px;">
                        <div style="color: #333333; font-size: 16px; line-height: 1.7;">
                            ${htmlBody}
                        </div>
                    </td>
                </tr>

                <!-- Rodape -->
                <tr>
                    <td style="padding: 25px 35px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F9FA; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top: 1px solid #eee;">
                        <p style="margin: 0 0 8px 0;">Enviado por Medico no Bolso</p>
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Todos os direitos reservados.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
        };

        console.log(`📧 [CUSTOM] Enviando email customizado...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [CUSTOM] Email customizado enviado com sucesso:', info.messageId);

        return { success: true, messageId: info.messageId, type: 'custom' };
    } catch (error) {
        console.error('❌ [CUSTOM] Erro ao enviar email customizado:', error);
        return { success: false, error: error.message, type: 'custom' };
    }
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