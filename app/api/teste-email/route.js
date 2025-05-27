// app/api/teste-email/route.js
import { NextResponse } from 'next/server';

// Função para decodificar e limpar email
function processEmail(rawEmail) {
    if (!rawEmail) return null;

    // Fazer múltiplas tentativas de decode
    let email = rawEmail;

    // 1. Decode URL básico
    try {
        email = decodeURIComponent(email);
    } catch (e) {
        console.warn('⚠️ Erro no decodeURIComponent:', e);
    }

    // 2. Decode HTML entities (caso venha como &commat; etc)
    email = email.replace(/&commat;/g, '@')
        .replace(/&#64;/g, '@')
        .replace(/&amp;/g, '&');

    // 3. Trim e limpar
    email = email.trim().toLowerCase();

    return email;
}

// Função para validar email com logs detalhados
function validateEmail(email, rawEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    console.log('📧 Validação de email:', {
        raw: rawEmail,
        processed: email,
        isValid,
        hasAt: email.includes('@'),
        parts: email.split('@')
    });

    return isValid;
}

// Função para testar configuração básica
async function testBasicConfig() {
    console.log('🔧 Iniciando teste básico...');

    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
    const envStatus = {};

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        envStatus[varName] = value ? 'OK' : 'MISSING';

        // Log parcial (não mostrar senha completa)
        if (value && varName !== 'EMAIL_PASSWORD') {
            console.log(`✅ ${varName}: ${value}`);
        } else if (value && varName === 'EMAIL_PASSWORD') {
            console.log(`✅ ${varName}: ${'*'.repeat(value.length)}`);
        } else {
            console.log(`❌ ${varName}: MISSING`);
        }
    });

    return envStatus;
}

export async function GET(request) {
    const startTime = Date.now();
    console.log('🚀 Iniciando teste de email...');

    try {
        // Passo 1: Log da URL completa
        const fullUrl = request.url;
        console.log('🌐 URL completa recebida:', fullUrl);

        // Passo 2: Processar parâmetros com logs detalhados
        const { searchParams } = new URL(request.url);
        const rawEmail = searchParams.get('email');
        const rawName = searchParams.get('name');
        const type = searchParams.get('type') || 'welcome';
        const testMode = searchParams.get('test') === 'true';

        console.log('📨 Parâmetros RAW recebidos:', {
            rawEmail,
            rawName,
            type,
            testMode
        });

        // Passo 3: Processar email
        const email = processEmail(rawEmail);
        const name = rawName ? decodeURIComponent(rawName.trim()) : null;

        console.log('📨 Parâmetros PROCESSADOS:', {
            email,
            name,
            type,
            testMode
        });

        // Passo 4: Testar configuração básica
        const envStatus = await testBasicConfig();

        // Passo 5: Validação de email
        if (!email) {
            const response = {
                success: false,
                message: 'Email é obrigatório',
                debug: {
                    rawEmail,
                    processedEmail: email,
                    envStatus
                },
                examples: [
                    '/api/teste-email?email=igor.gewehr1%40gmail.com',
                    '/api/teste-email?email=igor.gewehr1%40gmail.com&type=welcome',
                    '/api/teste-email?email=igor.gewehr1%40gmail.com&type=help',
                    '/api/teste-email?email=igor.gewehr1%40gmail.com&type=both',
                    '/api/teste-email?email=igor.gewehr1%40gmail.com&test=true'
                ],
                note: 'Use %40 no lugar de @ na URL'
            };

            console.log('❌ Email não fornecido:', response);
            return NextResponse.json(response, { status: 400 });
        }

        // Passo 6: Validar formato do email
        if (!validateEmail(email, rawEmail)) {
            const response = {
                success: false,
                message: 'Formato de email inválido',
                debug: {
                    rawEmail,
                    processedEmail: email,
                    hasAt: email.includes('@'),
                    parts: email.split('@')
                }
            };

            console.log('❌ Email inválido:', response);
            return NextResponse.json(response, { status: 400 });
        }

        // Passo 7: Se for modo teste, só verificar configuração
        if (testMode) {
            console.log('🔧 Modo teste ativado - apenas verificando configuração...');

            try {
                const { testEmailConfig } = await import('../../../lib/emailService');
                const configResult = await testEmailConfig();

                const response = {
                    success: true,
                    message: 'Teste de configuração concluído',
                    debug: {
                        rawEmail,
                        processedEmail: email,
                        envStatus,
                        configTest: configResult,
                        executionTime: `${Date.now() - startTime}ms`
                    }
                };

                console.log('✅ Teste de configuração OK:', response);
                return NextResponse.json(response);

            } catch (configError) {
                console.error('❌ Erro no teste de configuração:', configError);
                return NextResponse.json({
                    success: false,
                    message: 'Erro no teste de configuração',
                    error: configError.message,
                    debug: {
                        rawEmail,
                        processedEmail: email,
                        envStatus,
                        executionTime: `${Date.now() - startTime}ms`
                    }
                }, { status: 500 });
            }
        }

        // Passo 8: Importar emailService
        console.log('📧 Importando emailService...');

        let emailService;
        try {
            emailService = await import('../../../lib/emailService');
            console.log('✅ EmailService importado com sucesso');
        } catch (importError) {
            console.error('❌ Erro ao importar emailService:', importError);
            return NextResponse.json({
                success: false,
                message: 'Erro ao importar emailService',
                error: importError.message,
                debug: {
                    rawEmail,
                    processedEmail: email,
                    envStatus,
                    executionTime: `${Date.now() - startTime}ms`
                }
            }, { status: 500 });
        }

        // Passo 9: Preparar dados para envio
        const userName = name || email.split('@')[0];
        const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        console.log(`📧 Preparando envio:`, {
            email,
            userName,
            appLink,
            type
        });

        // Passo 10: Executar envio com timeout
        let result;
        let emailFunction;

        try {
            const TIMEOUT_MS = 20000; // 20 segundos

            const emailPromise = (async () => {
                switch (type.toLowerCase()) {
                    case 'welcome':
                        console.log('📧 Executando sendWelcomeEmail...');
                        emailFunction = 'sendWelcomeEmail';
                        return await emailService.sendWelcomeEmail(email, userName, appLink);

                    case 'help':
                        console.log('📧 Executando sendHelpVideoEmail...');
                        emailFunction = 'sendHelpVideoEmail';
                        return await emailService.sendHelpVideoEmail(email, userName, appLink);

                    case 'both':
                        console.log('📧 Executando sendBothWelcomeEmails...');
                        emailFunction = 'sendBothWelcomeEmails';
                        return await emailService.sendBothWelcomeEmails(email, userName, appLink);

                    default:
                        throw new Error(`Tipo de email inválido: ${type}`);
                }
            })();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout: Email demorou mais de ${TIMEOUT_MS/1000} segundos`)), TIMEOUT_MS)
            );

            result = await Promise.race([emailPromise, timeoutPromise]);

        } catch (emailError) {
            console.error(`❌ Erro ao executar ${emailFunction}:`, emailError);
            return NextResponse.json({
                success: false,
                message: `Erro ao executar ${emailFunction}`,
                error: emailError.message,
                debug: {
                    rawEmail,
                    processedEmail: email,
                    function: emailFunction,
                    envStatus,
                    executionTime: `${Date.now() - startTime}ms`
                }
            }, { status: 500 });
        }

        // Passo 11: Retornar resultado
        const executionTime = `${Date.now() - startTime}ms`;

        const response = {
            success: result.success,
            message: result.success ?
                `Email(s) do tipo '${type}' enviado(s) com sucesso para ${email}` :
                `Falha no envio do email tipo '${type}'`,
            data: {
                type,
                email,
                userName,
                appLink,
                function: emailFunction,
                result
            },
            debug: {
                rawEmail,
                processedEmail: email,
                envStatus,
                executionTime
            }
        };

        console.log(result.success ? '✅ Sucesso:' : '❌ Falha:', response);

        return NextResponse.json(response, {
            status: result.success ? 200 : 500
        });

    } catch (error) {
        console.error('❌ Erro geral na rota de teste:', error);

        return NextResponse.json({
            success: false,
            message: 'Erro interno no teste de email',
            error: error.message,
            debug: {
                executionTime: `${Date.now() - startTime}ms`,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        }, { status: 500 });
    }
}

// Método POST (mantido igual)
export async function POST(request) {
    const startTime = Date.now();
    console.log('🚀 Iniciando teste POST...');

    try {
        const body = await request.json();
        let { email, name, type = 'welcome', appLink: customAppLink } = body;

        // Processar email do body também
        email = processEmail(email);

        if (!email || !validateEmail(email, body.email)) {
            return NextResponse.json({
                success: false,
                message: 'Email inválido ou não fornecido',
                debug: {
                    raw: body.email,
                    processed: email,
                    executionTime: `${Date.now() - startTime}ms`
                }
            }, { status: 400 });
        }

        console.log(`📧 POST - Email: ${email}, Tipo: ${type}`);

        const emailService = await import('../../../lib/emailService');

        const userName = name || email.split('@')[0];
        const appLink = customAppLink || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

        let result;
        switch (type.toLowerCase()) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail(email, userName, appLink);
                break;
            case 'help':
                result = await emailService.sendHelpVideoEmail(email, userName, appLink);
                break;
            case 'both':
            default:
                result = await emailService.sendBothWelcomeEmails(email, userName, appLink);
                break;
        }

        const response = {
            success: result.success,
            message: result.success ?
                `Teste POST: Email(s) enviado(s) com sucesso` :
                `Teste POST: Falha no envio`,
            data: result,
            debug: {
                executionTime: `${Date.now() - startTime}ms`
            }
        };

        return NextResponse.json(response, {
            status: result.success ? 200 : 500
        });

    } catch (error) {
        console.error('❌ Erro no teste POST:', error);

        return NextResponse.json({
            success: false,
            message: 'Erro no teste POST',
            error: error.message,
            debug: {
                executionTime: `${Date.now() - startTime}ms`
            }
        }, { status: 500 });
    }
}