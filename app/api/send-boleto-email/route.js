// app/api/send-boleto-email/route.js
import { NextResponse } from 'next/server';
import { createEmailTransporter } from '../../../lib/emailService';

export async function POST(request) {
    try {
        const { email, name, boletoUrl, plan, amount } = await request.json();

        if (!email || !boletoUrl) {
            return NextResponse.json(
                { success: false, message: 'Email e URL do boleto são obrigatórios' },
                { status: 400 }
            );
        }

        const transporter = createEmailTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: '📄 Seu Boleto - Médico no Bolso',
            html: `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Seu Boleto - Médico no Bolso</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        
                        <!-- Cabeçalho -->
                        <div style="padding: 30px; background-color: #0F0F0F; text-align: center;">
                            <img src="https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/landingpage%2Flogoico.png?alt=media&token=65d6a14e-8f88-432c-a8c7-d3c236ff40a0" alt="Médico no Bolso" width="120" style="display: block; margin: 0 auto;">
                            <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px;">📄 Seu Boleto</h1>
                        </div>
                        
                        <!-- Conteúdo -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #151B3B; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Boleto Gerado com Sucesso!</h2>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Olá Dr. ${name || 'Médico'},
                            </p>

                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                Seu boleto para a assinatura do <strong>Médico no Bolso</strong> foi gerado com sucesso!
                            </p>
                            
                            <!-- Detalhes do Pagamento -->
                            <div style="background-color: #F9F9F9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #151B3B; margin: 0 0 15px 0; font-size: 18px;">📋 Detalhes do Pagamento</h3>
                                <p style="color: #666666; margin: 5px 0;"><strong>Plano:</strong> ${plan === 'monthly' ? 'Mensal' : plan === 'annual' ? 'Anual' : 'Trimestral'}</p>
                                <p style="color: #666666; margin: 5px 0;"><strong>Valor:</strong> ${amount || 'R$ 127,00'}</p>
                                <p style="color: #666666; margin: 5px 0;"><strong>Vencimento:</strong> 3 dias após a emissão</p>
                            </div>
                            
                            <!-- Botão do Boleto -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${boletoUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #F9B934; color: #000000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">📄 VISUALIZAR E IMPRIMIR BOLETO</a>
                            </div>
                            
                            <!-- Instruções -->
                            <div style="background-color: #E8F5E8; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #2E7D32; margin: 0 0 15px 0;">💡 Instruções Importantes:</h3>
                                <ul style="color: #2E7D32; margin: 0; padding-left: 20px;">
                                    <li>O boleto vence em <strong>3 dias úteis</strong></li>
                                    <li>Você pode pagar em qualquer banco, lotérica ou pelo internet banking</li>
                                    <li>Após o pagamento, o acesso será liberado em até 2 dias úteis</li>
                                    <li>Guarde este email para referência futura</li>
                                </ul>
                            </div>
                            
                            <!-- Alerta sobre Acesso -->
                            <div style="background-color: #FFF3CD; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #F9B934;">
                                <h3 style="color: #856404; margin: 0 0 10px 0;">⏰ Liberação do Acesso</h3>
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    Seu acesso ao sistema será liberado automaticamente após a confirmação do pagamento do boleto pelo banco. 
                                    Você receberá um email de confirmação quando isso acontecer.
                                </p>
                            </div>
                            
                            <!-- Contato -->
                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE;">
                                <p style="color: #666666; font-size: 14px; margin: 0;">
                                    <strong>Dúvidas sobre o pagamento?</strong><br>
                                    Entre em contato: <a href="mailto:suporte@doctorcare.io" style="color: #F9B934; text-decoration: none; font-weight: bold;">suporte@doctorcare.io</a>
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
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email do boleto enviado:', info.messageId);

        return NextResponse.json({
            success: true,
            message: 'Email do boleto enviado com sucesso',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Erro ao enviar email do boleto:', error);
        return NextResponse.json(
            { success: false, message: 'Erro ao enviar email do boleto', error: error.message },
            { status: 500 }
        );
    }
}