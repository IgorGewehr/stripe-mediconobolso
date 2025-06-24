// app/api/presence-cleanup/route.js
// API otimizada para cleanup de presença com melhor performance e confiabilidade

import { NextResponse } from 'next/server';
import { doc, deleteDoc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';

// Cache para evitar múltiplos cleanups do mesmo usuário
const cleanupCache = new Map();
const CACHE_DURATION = 5000; // 5 segundos

// Rate limiting por IP
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 50;

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
        const timestamp = requestData.data.timestamp;

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

        // Executar cleanup com operações atômicas
        const cleanupResult = await performAtomicCleanup(userId, timestamp);

        // Atualizar cache
        cleanupCache.set(cacheKey, Date.now());

        // Log de sucesso com métricas
        const processingTime = Date.now() - startTime;
        console.log(`✅ Cleanup de presença concluído para ${userId} em ${processingTime}ms`);

        return NextResponse.json({
            success: true,
            userId: userId,
            processingTime: processingTime,
            operations: cleanupResult.operations,
            message: 'User marked as offline successfully'
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;

        // Log detalhado do erro
        console.error(`❌ Erro no cleanup de presença para ${userId || 'unknown'}:`, {
            error: error.message,
            stack: error.stack,
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        });

        // Verificar se é erro de permissão
        if (error.code === 'permission-denied') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Insufficient permissions',
                    code: 'PERMISSION_DENIED'
                },
                { status: 403 }
            );
        }

        // Verificar se é erro de rede/Firestore
        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
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
            // JSON body
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
            // Form data (sendBeacon)
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
            // Tentar texto simples (fallback)
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
 * Executar cleanup atômico usando batch operations
 */
async function performAtomicCleanup(userId, timestamp) {
    const batch = writeBatch(firestore);
    const operations = [];

    try {
        // Referencias dos documentos
        const userRef = doc(firestore, 'users', userId);
        const presenceRef = doc(firestore, 'presence', userId);

        // Verificar se o documento do usuário existe
        const userExists = await checkUserExists(userRef);

        if (userExists) {
            // Atualizar documento do usuário
            batch.update(userRef, {
                isCurrentlyOnline: false,
                lastSeen: new Date(),
                sessionEndedAt: new Date(),
                lastCleanupTimestamp: timestamp,
                cleanupMethod: 'api'
            });
            operations.push('user_updated');
        } else {
            console.warn(`⚠️ Usuário ${userId} não encontrado no Firestore`);
            operations.push('user_not_found');
        }

        // Verificar se o documento de presença existe antes de deletar
        const presenceExists = await checkPresenceExists(presenceRef);

        if (presenceExists) {
            // Deletar documento de presença
            batch.delete(presenceRef);
            operations.push('presence_deleted');
        } else {
            console.warn(`⚠️ Documento de presença para ${userId} já removido`);
            operations.push('presence_not_found');
        }

        // Executar batch
        await batch.commit();

        return {
            success: true,
            operations: operations
        };

    } catch (error) {
        console.error(`❌ Erro no cleanup atômico para ${userId}:`, error);
        throw error;
    }
}

/**
 * Verificar se usuário existe
 */
async function checkUserExists(userRef) {
    try {
        const userDoc = await getDoc(userRef);
        return userDoc.exists();
    } catch (error) {
        console.warn('Erro ao verificar existência do usuário:', error);
        return false;
    }
}

/**
 * Verificar se documento de presença existe
 */
async function checkPresenceExists(presenceRef) {
    try {
        const presenceDoc = await getDoc(presenceRef);
        return presenceDoc.exists();
    } catch (error) {
        console.warn('Erro ao verificar existência da presença:', error);
        return false;
    }
}

/**
 * Obter IP do cliente
 */
function getClientIP(req) {
    // Verificar headers de proxy
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback para desenvolvimento
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

    // Obter ou criar entrada para o IP
    if (!rateLimiter.has(clientIP)) {
        rateLimiter.set(clientIP, []);
    }

    const requests = rateLimiter.get(clientIP);

    // Remover requisições antigas
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Verificar se excedeu o limite
    if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    // Adicionar nova requisição
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
}, 60000); // Limpar a cada minuto

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
        version: '2.0.0'
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