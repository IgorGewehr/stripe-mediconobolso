/**
 * API Routes for Beneficiarios (Patients with Insurance)
 * Endpoint: /api/tiss/beneficiarios
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/beneficiarios - List beneficiarios by doctor
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const patientId = searchParams.get('patient_id');
    const carteira = searchParams.get('carteira');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'doctor_id é obrigatório' },
        { status: 400 }
      );
    }

    let endpoint;

    if (patientId) {
      // List convenios for specific patient
      endpoint = `/beneficiarios/paciente/convenios?doctor_id=${doctorId}&patient_id=${patientId}`;
    } else if (carteira) {
      // Search by carteira number
      endpoint = `/beneficiarios/search/carteira/${encodeURIComponent(carteira)}?doctor_id=${doctorId}`;
    } else {
      // List all beneficiarios
      endpoint = `/beneficiarios?doctor_id=${doctorId}`;
    }

    const response = await fetch(`${TISS_SERVICE_URL}${endpoint}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching beneficiarios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar beneficiários', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/beneficiarios - Create new beneficiario
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${TISS_SERVICE_URL}/beneficiarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar beneficiário', details: error.message },
      { status: 500 }
    );
  }
}
