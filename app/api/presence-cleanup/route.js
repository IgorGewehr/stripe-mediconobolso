// app/api/presence-cleanup/route.js
// API para cleanup de presença - usa doctor-server API

import { NextResponse } from 'next/server';

// Cache para evitar múltiplos cleanups do mesmo usuário
const cleanupCache = new Map();
const CACHE_DURATION = 5000; // 5 segundos

// Rate limiting por IP
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 50;

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
    const startTime = Date.now();
    let userId = null;

    try {
        // Obter IP do cliente para rate limiting
        const clientIP = getClientIP(req);

        // Verificar rate limiting
        if (!isWithinRateLimit(clientIP)) {
            console.warn(`🚫 Rate limit excedido para IP: ${clientIP}`);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded',
                    retryAfter: 60
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        // Parse do body com validação robusta
        const requestData = await parseRequestBody(req);
        if (!requestData.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: requestData.error
                },
                { status: 400 }
            );
        }

        userId = requestData.data.userId;
        const action = requestData.data.action;

        // Validações de dados
        if (!userId || typeof userId !== 'string' || userId.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid userId format'
                },
                { status: 400 }
            );
        }

        if (action !== 'offline') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid action. Expected: offline'
                },
                { status: 400 }
            );
        }

        // Verificar se o cleanup já foi feito recentemente
        const cacheKey = `${userId}_${action}`;
        const lastCleanup = cleanupCache.get(cacheKey);

        if (lastCleanup && (Date.now() - lastCleanup) < CACHE_DURATION) {
            console.log(`⚡ Cleanup duplicado ignorado para: ${userId}`);
            return NextResponse.json({
                success: true,
                cached: true,
                message: 'Cleanup already processed recently'
            });
        }

        // Chamar API do doctor-server para marcar offline
        const apiResponse = await fetch(`${API_URL}/presence`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Se tiver um token de serviço, adicionar aqui
            },
            body: JSON.stringify({ user_id: userId }),
            signal: AbortSignal.timeout(5000),
        });

        // Atualizar cache
        cleanupCache.set(cacheKey, Date.now());

        // Log de sucesso com métricas
        const processingTime = Date.now() - startTime;
        console.log(`✅ Cleanup de presença concluído para ${userId} em ${processingTime}ms`);

        return NextResponse.json({
            success: true,
            userId: userId,
            processingTime: processingTime,
            apiStatus: apiResponse.ok ? 'synced' : 'pending',
            message: 'User marked as offline successfully'
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        // Log detalhado do erro
        console.error(`❌ Erro no cleanup de presença para ${userId || 'unknown'}:`, {
            error: error.message,
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        });

        // Verificar se é erro de timeout
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Service temporarily unavailable',
                    code: 'SERVICE_UNAVAILABLE',
                    retryAfter: 5
                },
                {
                    status: 503,
                    headers: {
                        'Retry-After': '5'
                    }
                }
            );
        }

        // Erro genérico do servidor
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                processingTime: processingTime
            },
            { status: 500 }
        );
    }
}

// ====================================================
// FUNÇÕES AUXILIARES
// ====================================================

/**
 * Parse robusto do body da requisição
 */
async function parseRequestBody(req) {
    try {
        const contentType = req.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            const jsonData = await req.json();
            return {
                success: true,
                data: {
                    userId: jsonData.userId,
                    action: jsonData.action,
                    timestamp: jsonData.timestamp || Date.now()
                }
            };
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            return {
                success: true,
                data: {
                    userId: formData.get('userId'),
                    action: formData.get('action'),
                    timestamp: formData.get('timestamp') || Date.now()
                }
            };
        } else {
            const text = await req.text();
            try {
                const jsonData = JSON.parse(text);
                return {
                    success: true,
                    data: {
                        userId: jsonData.userId,
                        action: jsonData.action,
                        timestamp: jsonData.timestamp || Date.now()
                    }
                };
            } catch {
                return {
                    success: false,
                    error: 'Invalid request format. Expected JSON or FormData'
                };
            }
        }
    } catch (error) {
        return {
            success: false,
            error: `Failed to parse request body: ${error.message}`
        };
    }
}

/**
 * Obter IP do cliente
 */
function getClientIP(req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return req.headers.get('x-vercel-forwarded-for') ||
        req.headers.get('cf-connecting-ip') ||
        'unknown';
}

/**
 * Verificar rate limiting
 */
function isWithinRateLimit(clientIP) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!rateLimiter.has(clientIP)) {
        rateLimiter.set(clientIP, []);
    }

    const requests = rateLimiter.get(clientIP);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    validRequests.push(now);
    rateLimiter.set(clientIP, validRequests);

    return true;
}

// ====================================================
// CLEANUP AUTOMÁTICO DE CACHE E RATE LIMITER
// ====================================================

// Limpar cache periodicamente
setInterval(() => {
    const now = Date.now();

    // Limpar cache de cleanup
    for (const [key, timestamp] of cleanupCache.entries()) {
        if (now - timestamp > CACHE_DURATION * 2) {
            cleanupCache.delete(key);
        }
    }

    // Limpar rate limiter
    for (const [ip, requests] of rateLimiter.entries()) {
        const validRequests = requests.filter(timestamp =>
            timestamp > now - RATE_LIMIT_WINDOW
        );

        if (validRequests.length === 0) {
            rateLimiter.delete(ip);
        } else {
            rateLimiter.set(ip, validRequests);
        }
    }
}, 60000);

// ====================================================
// SUPORTE PARA OUTROS MÉTODOS HTTP
// ====================================================

export async function GET(req) {
    return NextResponse.json({
        service: 'presence-cleanup',
        status: 'active',
        timestamp: new Date().toISOString(),
        cacheSize: cleanupCache.size,
        rateLimiterSize: rateLimiter.size,
        methods: ['POST'],
        version: '3.0.0',
        backend: 'doctor-server'
    });
}

export async function OPTIONS(req) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
