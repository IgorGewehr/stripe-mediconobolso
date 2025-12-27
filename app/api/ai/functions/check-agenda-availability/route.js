/**
 * Check Agenda Availability API
 *
 * Endpoint for AI agent to check agenda availability for a specific date/month.
 * Used by N8N agent to help patients schedule appointments.
 */

import { NextResponse } from 'next/server';
import { appointmentsService } from '@/lib/services/api';

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `check_agenda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const { doctorId, year, month, day } = body;

    console.log('[CHECK-AGENDA-AVAILABILITY] Starting execution', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      year,
      month,
      day,
      source: request.headers.get('x-source') || 'unknown'
    });

    // Validate required parameters
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Year and month are required parameters', requestId },
        { status: 400 }
      );
    }

    // Validate parameter values
    const yearNum = parseInt(String(year));
    const monthNum = parseInt(String(month));
    const dayNum = day ? parseInt(String(day)) : null;

    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < currentYear - 1 || yearNum > currentYear + 5) {
      return NextResponse.json(
        { success: false, error: `Year must be between ${currentYear - 1} and ${currentYear + 5}`, requestId },
        { status: 400 }
      );
    }

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12', requestId },
        { status: 400 }
      );
    }

    if (dayNum && (isNaN(dayNum) || dayNum < 1 || dayNum > 31)) {
      return NextResponse.json(
        { success: false, error: 'Day must be between 1 and 31', requestId },
        { status: 400 }
      );
    }

    // Get appointments for the specified period
    const appointments = await appointmentsService.listAllConsultations(doctorId, {
      year: yearNum,
      month: monthNum
    });

    // If specific day requested, filter by day
    let filteredAppointments = appointments;
    if (dayNum) {
      filteredAppointments = appointments.filter(apt => {
        const aptDate = apt.consultationDate instanceof Date
          ? apt.consultationDate
          : new Date(apt.consultationDate);
        return aptDate.getDate() === dayNum;
      });
    }

    // Get occupied slots
    const occupiedSlots = filteredAppointments.map(apt => ({
      date: apt.consultationDate,
      time: apt.consultationTime,
      duration: apt.consultationDuration || 30,
      status: apt.status,
      patientName: apt.patientName
    }));

    // Generate available suggestions
    const availableSuggestions = generateAvailableSuggestions(
      occupiedSlots,
      yearNum,
      monthNum,
      dayNum
    );

    const processingTime = Date.now() - startTime;

    console.log('[CHECK-AGENDA-AVAILABILITY] Completed', {
      requestId,
      totalOccupied: occupiedSlots.length,
      suggestionsCount: availableSuggestions.length,
      processingTime: `${processingTime}ms`
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dayNum ? `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null,
        month: `${yearNum}-${String(monthNum).padStart(2, '0')}`,
        totalOccupied: occupiedSlots.length,
        occupiedSlots,
        availableSuggestions
      },
      meta: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString(),
        queryType: dayNum ? 'single_day' : 'full_month'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('[CHECK-AGENDA-AVAILABILITY] Error', {
      requestId,
      error: error.message,
      processingTime: `${processingTime}ms`
    });

    return NextResponse.json(
      {
        success: false,
        error: 'check-agenda-availability failed',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Generate available time suggestions based on occupied slots
 */
function generateAvailableSuggestions(occupiedSlots, year, month, day) {
  const suggestions = [];
  const workingHours = {
    start: 8,  // 8 AM
    end: 18,   // 6 PM
    slotDuration: 30 // 30 minutes per slot
  };

  // If specific day, generate slots for that day
  if (day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return suggestions;
    }

    // Get occupied times for this day
    const occupiedTimes = new Set(
      occupiedSlots
        .filter(slot => {
          const slotDate = new Date(slot.date);
          return slotDate.getDate() === day;
        })
        .map(slot => slot.time)
    );

    // Generate available slots
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        if (!occupiedTimes.has(time)) {
          suggestions.push({
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            time,
            available: true
          });
        }
      }
    }
  } else {
    // Generate suggestions for next 7 available days with open slots
    const today = new Date();
    let daysChecked = 0;
    let currentDate = new Date(year, month - 1, 1);

    while (suggestions.length < 10 && daysChecked < 31) {
      const dayOfWeek = currentDate.getDay();

      // Skip past dates and weekends
      if (currentDate >= today && dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

        // Count occupied slots for this day
        const occupiedForDay = occupiedSlots.filter(slot => {
          const slotDate = new Date(slot.date);
          return slotDate.toDateString() === currentDate.toDateString();
        }).length;

        const totalSlots = ((workingHours.end - workingHours.start) * 60) / workingHours.slotDuration;
        const availableSlots = totalSlots - occupiedForDay;

        if (availableSlots > 0) {
          suggestions.push({
            date: dateStr,
            availableSlots,
            percentAvailable: Math.round((availableSlots / totalSlots) * 100)
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
  }

  return suggestions;
}
