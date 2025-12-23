/**
 * API Route for downloading Lote XML
 * Endpoint: /api/tiss/lotes/[id]/xml
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/lotes/[id]/xml - Download lote XML
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/lotes/${id}/xml`);

    if (response.status === 404) {
      return NextResponse.json(
        { success: false, error: 'XML não encontrado. Feche o lote primeiro.' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Return XML as file download
    const xml = await response.text();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename=lote_${id}.xml`,
      },
    });
  } catch (error) {
    console.error('Error downloading XML:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao baixar XML', details: error.message },
      { status: 500 }
    );
  }
}
