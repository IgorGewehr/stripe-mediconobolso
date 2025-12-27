import { NextResponse } from 'next/server';

const DOCTOR_SERVER_URL = process.env.DOCTOR_SERVER_URL || 'http://localhost:8080';

/**
 * POST /api/facebook/auth
 * Conecta uma página do Facebook ao tenant
 */
export async function POST(request) {
  try {
    // Obtém o token de autenticação
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pageId, pageAccessToken, pageName, pageCategory, aiEnabled } = body;

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'pageId and pageAccessToken are required' },
        { status: 400 }
      );
    }

    // Encaminha para o doctor-server
    const response = await fetch(`${DOCTOR_SERVER_URL}/api/v1/facebook/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        page_id: pageId,
        page_access_token: pageAccessToken,
        page_name: pageName,
        page_category: pageCategory,
        ai_enabled: aiEnabled || false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to connect Facebook page' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error connecting Facebook page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/facebook/auth
 * Desconecta a página do Facebook do tenant
 */
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Encaminha para o doctor-server
    const response = await fetch(`${DOCTOR_SERVER_URL}/api/v1/facebook/auth`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to disconnect Facebook page' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error disconnecting Facebook page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/facebook/auth
 * Retorna o status da conexão Facebook
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Encaminha para o doctor-server
    const response = await fetch(`${DOCTOR_SERVER_URL}/api/v1/facebook/status`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get Facebook status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting Facebook status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
