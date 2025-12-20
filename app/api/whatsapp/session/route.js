/**
 * WhatsApp Session API
 *
 * Endpoint for checking WhatsApp connection status.
 * Communicates with the WhatsApp microservice.
 */

import { NextResponse } from 'next/server';

// WhatsApp microservice URL (same as locai)
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3001';

export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    console.log('[WhatsApp Session] Checking status for doctor:', doctorId.substring(0, 8) + '***');

    // Call WhatsApp microservice
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/session/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': doctorId
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('[WhatsApp Session] Microservice returned error:', response.status);
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          status: 'disconnected',
          phoneNumber: null,
          businessName: null,
          qrCode: null
        }
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        connected: data.connected || false,
        status: data.status || 'disconnected',
        phoneNumber: data.phoneNumber || null,
        businessName: data.businessName || null,
        qrCode: data.qrCode || null
      }
    });
  } catch (error) {
    console.error('[WhatsApp Session] Error:', error.message);

    // Return disconnected status on error (microservice might be down)
    return NextResponse.json({
      success: true,
      data: {
        connected: false,
        status: 'disconnected',
        phoneNumber: null,
        businessName: null,
        qrCode: null,
        error: error.message
      }
    });
  }
}
