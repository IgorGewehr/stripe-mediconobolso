/**
 * Get Patient API
 *
 * Endpoint for AI agent to retrieve patient information.
 * Used by N8N agent to access patient details for context.
 */

import { NextResponse } from 'next/server';
import { patientsService } from '@/lib/services/firebase';

export async function POST(request) {
  const requestId = `get_patient_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const { doctorId, patientId, phone } = body;

    console.log('[GET-PATIENT] Starting', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      patientId,
      phone: phone ? phone.substring(0, 4) + '***' : undefined
    });

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    if (!patientId && !phone) {
      return NextResponse.json(
        { success: false, error: 'Either patientId or phone is required', requestId },
        { status: 400 }
      );
    }

    let patient = null;

    if (patientId) {
      // Get patient directly by ID
      patient = await patientsService.getPatient(doctorId, patientId);
    } else if (phone) {
      // Search patient by phone
      const patients = await patientsService.listPatients(doctorId);
      const normalizedPhone = phone.replace(/\D/g, '');

      patient = patients.find(p => {
        const patientPhone = (p.phone || p.telefone || '').replace(/\D/g, '');
        // Match last digits (handle country code variations)
        return patientPhone.endsWith(normalizedPhone) ||
               normalizedPhone.endsWith(patientPhone) ||
               patientPhone === normalizedPhone;
      });
    }

    if (!patient) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          patient: null
        },
        meta: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // Format patient data for AI agent (exclude sensitive internal data)
    const formattedPatient = {
      id: patient.id,
      name: patient.name || patient.nome,
      phone: patient.phone || patient.telefone,
      email: patient.email,
      birthDate: patient.birthDate || patient.dataNascimento,
      gender: patient.gender || patient.sexo,
      cpf: patient.cpf ? `***${patient.cpf.slice(-4)}` : undefined, // Mask CPF
      healthPlan: patient.healthPlan?.name || patient.healthPlans?.[0]?.name,
      statusList: patient.statusList || [],
      lastConsultationDate: patient.lastConsultationDate,
      nextConsultationDate: patient.nextConsultationDate,
      address: patient.address || patient.endereco ? {
        city: patient.city || patient.endereco?.cidade,
        state: patient.state || patient.endereco?.estado
      } : undefined,
      observations: patient.observations || patient.observacoes,
      allergies: patient.allergies || patient.alergias,
      chronicDiseases: patient.chronicDiseases || patient.condicoesClinicas?.doencas
    };

    console.log('[GET-PATIENT] Completed', {
      requestId,
      found: true,
      patientId: patient.id
    });

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        patient: formattedPatient
      },
      meta: { requestId, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[GET-PATIENT] Error', { requestId, error: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'get-patient failed',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
