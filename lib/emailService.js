//emailservice.js

import nodemailer from 'nodemailer';

// Configuração para Microsoft Office 365
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
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
});

// Função para enviar email de boas-vindas (existente)
export async function sendWelcomeEmail(userEmail, userName, appLink) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: 'Bem-vindo ao Médico no Bolso! Sua assinatura foi confirmada',
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
                            Sua assinatura foi <span style="color: #4CAF50; font-weight: bold;">confirmada com sucesso</span>. 
                            Estamos muito felizes em tê-lo em nossa plataforma e queremos ajudá-lo a transformar sua prática médica 
                            com nossa solução completa.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">ACESSAR MINHA CONTA</a>
                        </div>
                    </td>
                </tr>
                
                <!-- Divisor -->
                <tr>
                    <td style="padding: 0 30px;">
                        <div style="height: 1px; background-color: #EEEEEE;"></div>
                    </td>
                </tr>
                
                <!-- Recursos Principais -->
                <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                        <h2 style="color: #151B3B; font-size: 20px; margin: 0 0 25px 0; text-align: center; font-weight: 600;">Sua assinatura inclui acesso a:</h2>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <!-- Linha 1 -->
                            <tr>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">📅</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 606;">Agenda & Consultas</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Sistema completo de agendamento com gestão de consultas e notificações automáticas.</p>
                                    </div>
                                </td>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">👥</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Gestão de Pacientes</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Cadastro completo e histórico médico de pacientes em uma interface intuitiva.</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Linha 2 -->
                            <tr>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">🧠</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Anamnese Inteligente</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Ferramenta com IA para criar anamneses detalhadas e personalizadas em segundos.</p>
                                    </div>
                                </td>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">🔬</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Exames com IA</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Análise de exames com inteligência artificial para apoio diagnóstico avançado.</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Linha 3 -->
                            <tr>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">💰</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Controle Financeiro</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Gestão completa de receitas, despesas e recebimentos da sua prática médica.</p>
                                    </div>
                                </td>
                                <td valign="top" width="50%" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">📊</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Métricas e Dashboards</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Relatórios detalhados e insights para otimizar sua produtividade e resultados.</p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Linha 4 -->
                            <tr>
                                <td valign="top" colspan="2" style="padding: 10px;">
                                    <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; height: 100%;">
                                        <div style="color: #F9B934; font-size: 24px; margin-bottom: 10px;">📝</div>
                                        <h3 style="color: #151B3B; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Geração de Receitas e Documentos</h3>
                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">Crie receitas, atestados e encaminhamentos profissionais com apenas alguns cliques.</p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Chamada para ação final -->
                <tr>
                    <td style="padding: 0 30px 30px 30px;">
                        <div style="background-color: #151B3B; border-radius: 8px; padding: 30px; text-align: center;">
                            <h3 style="color: white; font-size: 18px; margin: 0 0 15px 0;">Comece agora mesmo!</h3>
                            <p style="color: #CCCCCC; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
                                Acesse sua conta e comece a transformar sua prática médica com nossa plataforma completa.
                            </p>
                            <a href="${appLink}" style="display: inline-block; padding: 12px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">ACESSAR PLATAFORMA</a>
                        </div>
                    </td>
                </tr>
                
                <!-- Suporte -->
                <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center; border-top: 1px solid #EEEEEE;">
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                            Precisa de ajuda? Entre em contato conosco por e-mail:
                            <a href="mailto:suporte@mediconobolso.app" style="color: #F9B934; text-decoration: none; font-weight: bold;">suporte@mediconobolso.app</a>
                        </p>
                        
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                            Ou responda diretamente a este e-mail.
                        </p>
                    </td>
                </tr>
                
                <!-- Rodapé -->
                <tr>
                    <td style="padding: 20px 30px 30px 30px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.
                        </p>
                        
                        <p style="margin: 0;">
                            Este é um e-mail automático. Por favor, não responda se não precisar de suporte.
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email de boas-vindas enviado com sucesso:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        return { success: false, error: error.message };
    }
}

// NOVA FUNÇÃO: Email de ajuda com vídeo - VERSÃO NETLIFY-FRIENDLY
export async function sendHelpVideoEmail(userEmail, userName, appLink) {
    try {
        // Para o ambiente Netlify, vamos hospedar o vídeo externamente
        // ou incluir um link para download em vez de anexar o arquivo
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: 'Não consegui acessar o mediconobolso',
            html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ajuda - Médico no Bolso</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px;">
                <!-- Cabeçalho com Logo -->
                <tr>
                    <td align="center" style="padding: 30px 0; background-color: #151B3B; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Médico no Bolso" width="120" style="display: block; margin: 0 auto;">
                    </td>
                </tr>
                
                <!-- Seção de Ajuda -->
                <tr>
                    <td style="padding: 40px 30px 20px 30px;">
                        <h1 style="color: #151B3B; font-size: 24px; margin: 0 0 20px 0; text-align: center; font-weight: 600;">Precisa de ajuda para acessar?</h1>
                        
                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Olá Dr. ${userName || 'Médico'}, 
                        </p>

                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            Sabemos que às vezes pode haver dúvidas sobre como acessar nossa plataforma. 
                            Para ajudá-lo, preparamos um vídeo tutorial especial que mostra passo a passo 
                            como fazer seu primeiro acesso ao <strong>Médico no Bolso</strong>.
                        </p>
                        
                        <div style="background-color: #FFF3CD; border: 1px solid #FFEAA7; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📹 Vídeo Tutorial de Boas-vindas</h3>
                            <p style="color: #856404; margin: 0 0 15px 0; font-size: 14px;">
                                Assista ao nosso vídeo tutorial especial para começar!
                            </p>
                            <a href="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/videos%2Fwelcome.mp4?alt=media" 
                               style="display: inline-block; padding: 12px 25px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                                🎥 ASSISTIR VÍDEO TUTORIAL
                            </a>
                        </div>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${appLink}" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: all 0.3s ease;">ACESSAR PLATAFORMA AGORA</a>
                        </div>
                    </td>
                </tr>
                
                <!-- Divisor -->
                <tr>
                    <td style="padding: 0 30px;">
                        <div style="height: 1px; background-color: #EEEEEE;"></div>
                    </td>
                </tr>
                
                <!-- Passos Rápidos -->
                <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                        <h2 style="color: #151B3B; font-size: 20px; margin: 0 0 25px 0; text-align: center; font-weight: 600;">Passos rápidos para começar:</h2>
                        
                        <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <div style="background-color: #F9B934; color: #000; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; float: left;">1</div>
                                <h3 style="color: #151B3B; font-size: 16px; margin: 0; font-weight: 600; margin-left: 45px;">Acesse a plataforma</h3>
                            </div>
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0; margin-left: 45px;">
                                Clique no botão "ACESSAR PLATAFORMA AGORA" acima ou acesse: ${appLink}
                            </p>
                        </div>

                        <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <div style="background-color: #F9B934; color: #000; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; float: left;">2</div>
                                <h3 style="color: #151B3B; font-size: 16px; margin: 0; font-weight: 600; margin-left: 45px;">Faça login com seu email</h3>
                            </div>
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0; margin-left: 45px;">
                                Use o email: <strong>${userEmail}</strong> e a senha que você criou
                            </p>
                        </div>

                        <div style="background-color: #F8F9FA; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <div style="background-color: #F9B934; color: #000; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; float: left;">3</div>
                                <h3 style="color: #151B3B; font-size: 16px; margin: 0; font-weight: 600; margin-left: 45px;">Explore as funcionalidades</h3>
                            </div>
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0; margin-left: 45px;">
                                Comece criando seu primeiro paciente ou explorando a agenda
                            </p>
                        </div>
                    </td>
                </tr>
                
                <!-- Chamada para ação final -->
                <tr>
                    <td style="padding: 0 30px 30px 30px;">
                        <div style="background-color: #E3F2FD; border-radius: 8px; padding: 30px; text-align: center;">
                            <h3 style="color: #1565C0; font-size: 18px; margin: 0 0 15px 0;">Ainda com dificuldades?</h3>
                            <p style="color: #1976D2; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
                                Nossa equipe de suporte está pronta para ajudar!
                            </p>
                            <p style="color: #1976D2; font-size: 14px; margin: 0;">
                                📧 <a href="mailto:suporte@mediconobolso.app" style="color: #1565C0; text-decoration: none; font-weight: bold;">suporte@mediconobolso.app</a>
                            </p>
                        </div>
                    </td>
                </tr>
                
                <!-- Rodapé -->
                <tr>
                    <td style="padding: 20px 30px 30px 30px; text-align: center; color: #999999; font-size: 12px; background-color: #F8F8F8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} Médico no Bolso. Todos os direitos reservados.
                        </p>
                        
                        <p style="margin: 0;">
                            Este e-mail foi enviado para ajudá-lo a começar. Se não precisar mais dessa ajuda, pode ignorar este e-mail.
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email de ajuda com vídeo enviado com sucesso:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erro ao enviar email de ajuda:', error);
        return { success: false, error: error.message };
    }
}

// NOVA FUNÇÃO: Enviar ambos os emails em sequência
export async function sendBothWelcomeEmails(userEmail, userName, appLink) {
    try {
        console.log(`📧 Iniciando envio de ambos os emails para: ${userEmail}`);

        // Enviar o primeiro email (boas-vindas)
        const welcomeResult = await sendWelcomeEmail(userEmail, userName, appLink);

        // Aguardar um pouco entre os envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Enviar o segundo email (ajuda com vídeo)
        const helpResult = await sendHelpVideoEmail(userEmail, userName, appLink);

        // Retornar resultado consolidado
        return {
            success: welcomeResult.success && helpResult.success,
            welcomeEmail: welcomeResult,
            helpEmail: helpResult,
            message: `Emails enviados - Boas-vindas: ${welcomeResult.success ? 'OK' : 'FALHA'}, Ajuda: ${helpResult.success ? 'OK' : 'FALHA'}`
        };
    } catch (error) {
        console.error('Erro ao enviar ambos os emails:', error);
        return {
            success: false,
            error: error.message,
            message: 'Falha no envio dos emails'
        };
    }
}

// Função para testar a configuração (opcional, pode remover se não precisar)
export async function testEmailConfig() {
    try {
        await transporter.verify();
        console.log('Configuração de email funcionando!');
        return { success: true };
    } catch (error) {
        console.error('Erro na configuração de email:', error);
        return { success: false, error: error.message };
    }
}