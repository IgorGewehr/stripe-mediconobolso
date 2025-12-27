import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildOAuthUrl } from '@/lib/facebook/constants';

/**
 * GET /api/facebook/oauth/start
 * Inicia o fluxo OAuth do Facebook
 * Gera um token de estado seguro e redireciona para o Facebook
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Gera token de estado seguro (CSRF protection)
    const stateData = {
      tenantId,
      token: generateSecureToken(),
      ts: Date.now(),
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Salva o state em um cookie httpOnly para validação posterior
    const cookieStore = await cookies();
    cookieStore.set('fb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/',
    });

    // Constrói URL de autorização
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI ||
      `${getBaseUrl(request)}/api/facebook/oauth/callback`;

    if (!appId) {
      return NextResponse.json(
        { error: 'Facebook App ID not configured' },
        { status: 500 }
      );
    }

    const authUrl = buildOAuthUrl(appId, redirectUri, state);

    // Retorna a URL para o frontend redirecionar
    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Error starting Facebook OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}

/**
 * Gera um token seguro usando crypto
 */
function generateSecureToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Obtém a URL base da requisição
 */
function getBaseUrl(request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}
