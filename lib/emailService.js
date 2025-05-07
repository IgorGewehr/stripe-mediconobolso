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

// Função para enviar email de boas-vindas
export async function sendWelcomeEmail(userEmail, userName, appLink) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: userEmail,
            subject: 'Bem-vindo ao Medico no Bolso!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Bem-vindo ao Medico no Bolso!</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Olá, ${userName || 'Usuario'}!</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Estamos muito felizes em ter você conosco! Sua assinatura foi confirmada com sucesso 
              e você já pode começar a aproveitar todos os benefícios da nossa plataforma.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Acesse nossa plataforma agora mesmo:
              </p>
              <a 
                href="${appLink}" 
                style="display: inline-block; padding: 15px 35px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;"
              >
                Acessar o Medico no Bolso
              </a>
            </div>
            
            <div style="margin: 40px 0;">
              <h3 style="color: #333; font-size: 18px;">O que você pode fazer agora:</h3>
              <ul style="color: #555; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li>Completar seu perfil</li>
                <li>Buscar médicos na sua região</li>
                <li>Agendar sua primeira consulta</li>
                <li>Acessar recursos exclusivos para assinantes</li>
              </ul>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Se você tiver qualquer dúvida, não hesite em responder a este email. 
              Nossa equipe de suporte está pronta para ajudar!
            </p>
            
            <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;"/>
            
            <div style="text-align: center;">
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Atenciosamente,<br>
                <strong>Equipe Medico no Bolso</strong>
              </p>
              
              <p style="font-size: 12px; color: #888; margin-top: 30px;">
                Este é um email automático, mas você pode responder caso precise de ajuda.<br>
                © ${new Date().getFullYear()} Medico no Bolso. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
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