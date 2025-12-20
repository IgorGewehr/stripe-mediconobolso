/**
 * List Patients API
 *
 * Endpoint for AI agent to list/search patients.
 * Used by N8N agent to find patients for scheduling or context.
 */

import { NextResponse } from 'next/server';
import { patientsService } from '@/lib/services/firebase';

export async function POST(request) {
  const requestId = `list_patients_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const {
      doctorId,
      search,
      status,
      limit = 50
    } = body;

    console.log('[LIST-PATIENTS] Starting', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      search,
      status,
      limit
    });

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    // Get all patients
    let patients = await patientsService.listPatients(doctorId);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      patients = patients.filter(p => {
        const name = (p.name || p.nome || '').toLowerCase();
        const phone = (p.phone || p.telefone || '').replace(/\D/g, '');
        const email = (p.email || '').toLowerCase();

        return name.includes(searchLower) ||
               phone.includes(search.replace(/\D/g, '')) ||
               email.includes(searchLower);
      });
    }

    if (status) {
      patients = patients.filter(p =>
        p.statusList?.includes(status) ||
        p.status === status
      );
    }

    // Sort by name
    patients.sort((a, b) => {
      const nameA = (a.name || a.nome || '').toLowerCase();
      const nameB = (b.name || b.nome || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Apply limit
    const limitedPatients = patients.slice(0, limit);

    // Format patients for AI agent (minimal data for listing)
    const formattedPatients = limitedPatients.map(p => ({
      id: p.id,
      name: p.name || p.nome,
      phone: p.phone || p.telefone,
      email: p.email,
      statusList: p.statusList || [],
      lastConsultationDate: p.lastConsultationDate,
      nextConsultationDate: p.nextConsultationDate
    }));

    console.log('[LIST-PATIENTS] Completed', {
      requestId,
      total: patients.length,
      returned: formattedPatients.length
    });

    return NextResponse.json({
      success: true,
      data: {
        patients: formattedPatients,
        total: patients.length,
        returned: formattedPatients.length,
        hasMore: patients.length > limit
      },
      meta: { requestId, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[LIST-PATIENTS] Error', { requestId, error: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'list-patients failed',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
