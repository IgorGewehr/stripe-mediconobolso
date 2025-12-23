/**
 * API Route for TISS Statistics
 * Endpoint: /api/tiss/stats/[doctorId]
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/stats/[doctorId] - Get statistics for guias and lotes
 */
export async function GET(request, { params }) {
  try {
    const { doctorId } = await params;

    // Fetch stats in parallel
    const [guiaStatsRes, loteStatsRes] = await Promise.all([
      fetch(`${TISS_SERVICE_URL}/guias/stats/${doctorId}`),
      fetch(`${TISS_SERVICE_URL}/lotes/stats/${doctorId}`),
    ]);

    const guiaStats = await guiaStatsRes.json();
    const loteStats = await loteStatsRes.json();

    return NextResponse.json({
      success: true,
      data: {
        guias: guiaStats.data,
        lotes: loteStats.data,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas', details: error.message },
      { status: 500 }
    );
  }
}
