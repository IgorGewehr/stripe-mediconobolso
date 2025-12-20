/**
 * Get Appointments API
 *
 * Endpoint for AI agent to retrieve appointments/consultations.
 */

import { NextResponse } from 'next/server';
import { appointmentsService } from '@/lib/services/firebase';

export async function POST(request) {
  const requestId = `get_appointments_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const { doctorId, patientId, date, startDate, endDate, status, limit = 50 } = body;

    console.log('[GET-APPOINTMENTS] Starting', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      patientId,
      date,
      status
    });

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    let appointments;

    if (patientId) {
      // Get appointments for specific patient
      appointments = await appointmentsService.listPatientConsultations(doctorId, patientId);
    } else {
      // Get all appointments
      appointments = await appointmentsService.listAllConsultations(doctorId, {
        limit
      });
    }

    // Apply filters
    if (date) {
      const targetDate = new Date(date);
      appointments = appointments.filter(apt => {
        const aptDate = apt.consultationDate instanceof Date
          ? apt.consultationDate
          : new Date(apt.consultationDate);
        return aptDate.toDateString() === targetDate.toDateString();
      });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      appointments = appointments.filter(apt => {
        const aptDate = apt.consultationDate instanceof Date
          ? apt.consultationDate
          : new Date(apt.consultationDate);
        return aptDate >= start && aptDate <= end;
      });
    }

    if (status) {
      appointments = appointments.filter(apt => apt.status === status);
    }

    // Sort by date (most recent first)
    appointments.sort((a, b) => {
      const dateA = a.consultationDate instanceof Date ? a.consultationDate : new Date(a.consultationDate);
      const dateB = b.consultationDate instanceof Date ? b.consultationDate : new Date(b.consultationDate);
      return dateB - dateA;
    });

    // Format response
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patientName,
      date: apt.consultationDate,
      time: apt.consultationTime,
      duration: apt.consultationDuration || 30,
      type: apt.consultationType || 'Presencial',
      status: apt.status,
      reason: apt.reasonForVisit,
      notes: apt.clinicalNotes
    }));

    console.log('[GET-APPOINTMENTS] Completed', {
      requestId,
      count: formattedAppointments.length
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        total: formattedAppointments.length
      },
      meta: { requestId, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[GET-APPOINTMENTS] Error', { requestId, error: error.message });

    return NextResponse.json(
      { success: false, error: 'get-appointments failed', requestId },
      { status: 500 }
    );
  }
}
