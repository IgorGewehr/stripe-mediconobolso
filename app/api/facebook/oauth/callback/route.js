import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildGraphApiUrl, FACEBOOK_OAUTH_SCOPES } from '@/lib/facebook/constants';

/**
 * GET /api/facebook/oauth/callback
 * Callback do OAuth do Facebook
 * Troca o código por token e lista as páginas do usuário
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Verifica se houve erro no OAuth
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
      return redirectWithError(request, `OAuth error: ${errorDescription || error}`);
    }

    if (!code || !state) {
      return redirectWithError(request, 'Missing code or state parameter');
    }

    // Valida o state (CSRF protection)
    const cookieStore = await cookies();
    const savedState = cookieStore.get('fb_oauth_state')?.value;

    if (!savedState || savedState !== state) {
      console.error('Invalid state token');
      return redirectWithError(request, 'Invalid state token');
    }

    // Decodifica o state para obter o tenantId
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return redirectWithError(request, 'Invalid state format');
    }

    // Verifica expiração do state (10 minutos)
    if (Date.now() - stateData.ts > 10 * 60 * 1000) {
      return redirectWithError(request, 'State token expired');
    }

    // Limpa o cookie de state
    cookieStore.delete('fb_oauth_state');

    // Troca o código por token de acesso do usuário
    const redirectUri = process.env.FACEBOOK_OAUTH_REDIRECT_URI ||
      `${getBaseUrl(request)}/api/facebook/oauth/callback`;

    const tokenUrl = buildGraphApiUrl('/oauth/access_token');
    const tokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: redirectUri,
      code: code,
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error exchanging code for token:', tokenData.error);
      return redirectWithError(request, tokenData.error.message);
    }

    const shortLivedToken = tokenData.access_token;

    // Troca por token de longa duração
    const longLivedTokenUrl = buildGraphApiUrl('/oauth/access_token');
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    const longLivedResponse = await fetch(`${longLivedTokenUrl}?${longLivedParams.toString()}`);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('Error getting long-lived token:', longLivedData.error);
      return redirectWithError(request, longLivedData.error.message);
    }

    const userAccessToken = longLivedData.access_token;

    // Busca páginas do usuário
    const pagesUrl = buildGraphApiUrl('/me/accounts');
    const pagesParams = new URLSearchParams({
      access_token: userAccessToken,
      fields: 'id,name,access_token,category,tasks',
    });

    const pagesResponse = await fetch(`${pagesUrl}?${pagesParams.toString()}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('Error fetching pages:', pagesData.error);
      return redirectWithError(request, pagesData.error.message);
    }

    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return redirectWithError(request, 'No Facebook pages found');
    }

    // Codifica dados das páginas para passar via URL
    const pagesToken = Buffer.from(JSON.stringify({
      tenantId: stateData.tenantId,
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        access_token: p.access_token,
      })),
    })).toString('base64url');

    // Redireciona para a página de seleção de página
    const redirectUrl = new URL('/dashboard/settings/messaging', getBaseUrl(request));
    redirectUrl.searchParams.set('fb_pages', pagesToken);
    redirectUrl.searchParams.set('success', 'true');

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Error in Facebook OAuth callback:', error);
    return redirectWithError(request, 'Internal server error');
  }
}

/**
 * Redireciona com erro
 */
function redirectWithError(request, message) {
  const redirectUrl = new URL('/dashboard/settings/messaging', getBaseUrl(request));
  redirectUrl.searchParams.set('fb_error', message);
  return NextResponse.redirect(redirectUrl.toString());
}

/**
 * Obtém a URL base da requisição
 */
function getBaseUrl(request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}
