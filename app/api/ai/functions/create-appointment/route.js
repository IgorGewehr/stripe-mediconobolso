/**
 * Create Appointment API
 *
 * Endpoint for AI agent to create new appointments/consultations.
 * Used by N8N agent to schedule appointments for patients.
 */

import { NextResponse } from 'next/server';
import { appointmentsService, patientsService } from '@/lib/services/firebase';

export async function POST(request) {
  const requestId = `create_appointment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const {
      doctorId,
      patientId,
      patientPhone,
      patientName,
      consultationDate,
      consultationTime,
      consultationDuration = 30,
      consultationType = 'Presencial',
      reasonForVisit,
      notes
    } = body;

    console.log('[CREATE-APPOINTMENT] Starting', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      patientId,
      patientPhone,
      consultationDate,
      consultationTime
    });

    // Validate required parameters
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    if (!consultationDate || !consultationTime) {
      return NextResponse.json(
        { success: false, error: 'consultationDate and consultationTime are required', requestId },
        { status: 400 }
      );
    }

    // Find or identify patient
    let resolvedPatientId = patientId;
    let resolvedPatientName = patientName;

    if (!resolvedPatientId && patientPhone) {
      // Try to find patient by phone
      const patients = await patientsService.listPatients(doctorId);
      const matchingPatient = patients.find(p => {
        const normalizedPhone = patientPhone.replace(/\D/g, '');
        const patientPhoneNormalized = (p.phone || p.telefone || '').replace(/\D/g, '');
        return patientPhoneNormalized.endsWith(normalizedPhone) ||
               normalizedPhone.endsWith(patientPhoneNormalized);
      });

      if (matchingPatient) {
        resolvedPatientId = matchingPatient.id;
        resolvedPatientName = resolvedPatientName || matchingPatient.name || matchingPatient.nome;
      }
    }

    if (!resolvedPatientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found. Please provide a valid patientId or patientPhone',
          requestId
        },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const existingAppointments = await appointmentsService.listAllConsultations(doctorId, {
      limit: 100
    });

    const targetDate = new Date(consultationDate);
    const conflicting = existingAppointments.find(apt => {
      const aptDate = apt.consultationDate instanceof Date
        ? apt.consultationDate
        : new Date(apt.consultationDate);

      return aptDate.toDateString() === targetDate.toDateString() &&
             apt.consultationTime === consultationTime &&
             apt.status !== 'cancelled';
    });

    if (conflicting) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot already occupied',
          conflictingAppointment: {
            id: conflicting.id,
            time: conflicting.consultationTime,
            patientName: conflicting.patientName
          },
          requestId
        },
        { status: 409 }
      );
    }

    // Create the consultation
    const consultationData = {
      patientId: resolvedPatientId,
      patientName: resolvedPatientName,
      consultationDate,
      consultationTime,
      consultationDuration,
      consultationType,
      reasonForVisit: reasonForVisit || '',
      clinicalNotes: notes || '',
      status: 'scheduled',
      source: 'ai_agent',
      createdVia: 'n8n_automation'
    };

    const consultationId = await appointmentsService.createConsultation(
      doctorId,
      resolvedPatientId,
      consultationData
    );

    console.log('[CREATE-APPOINTMENT] Completed', {
      requestId,
      consultationId,
      patientId: resolvedPatientId
    });

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: consultationId,
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        date: consultationDate,
        time: consultationTime,
        duration: consultationDuration,
        type: consultationType,
        status: 'scheduled'
      },
      meta: { requestId, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[CREATE-APPOINTMENT] Error', { requestId, error: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'create-appointment failed',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
