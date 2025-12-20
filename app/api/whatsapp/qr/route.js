/**
 * WhatsApp QR Code API
 *
 * Endpoint for requesting a new QR code for WhatsApp connection.
 */

import { NextResponse } from 'next/server';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3001';

export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    console.log('[WhatsApp QR] Requesting QR code for doctor:', doctorId.substring(0, 8) + '***');

    // Call WhatsApp microservice to generate QR code
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/session/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': doctorId
      },
      signal: AbortSignal.timeout(30000) // 30 seconds for QR generation
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate QR code');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      qrCode: data.qrCode || null,
      status: data.status || 'qr'
    });
  } catch (error) {
    console.error('[WhatsApp QR] Error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate QR code'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Get current QR code if available
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/session/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': doctorId
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        qrCode: null,
        status: 'disconnected'
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      qrCode: data.qrCode || null,
      status: data.status || 'disconnected'
    });
  } catch (error) {
    console.error('[WhatsApp QR GET] Error:', error.message);

    return NextResponse.json({
      success: true,
      qrCode: null,
      status: 'error',
      error: error.message
    });
  }
}
