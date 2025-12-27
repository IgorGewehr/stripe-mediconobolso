/**
 * WhatsApp QR Code API
 *
 * Endpoint for requesting a new QR code for WhatsApp connection.
 * Communicates with doctor-server WhatsApp endpoints.
 */

import { NextResponse } from 'next/server';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * POST /api/whatsapp/qr - Start session and get QR code
 */
export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');
    const authToken = request.headers.get('Authorization');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    console.log('[WhatsApp QR] Starting session for doctor:', doctorId.substring(0, 8) + '***');

    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Start WhatsApp session on doctor-server
    const response = await fetch(`${API_URL}/whatsapp/sessions/${doctorId}/start`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(30000) // 30 seconds for session start
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to start WhatsApp session');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      qrCode: data.qr_code || null,
      status: data.status ? mapStatus(data.status) : 'qr'
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

/**
 * GET /api/whatsapp/qr - Get current QR code
 */
export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');
    const authToken = request.headers.get('Authorization');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Get QR code from doctor-server
    const response = await fetch(`${API_URL}/whatsapp/sessions/${doctorId}/qr`, {
      method: 'GET',
      headers,
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
      qrCode: data.qr_code || null,
      status: data.status ? mapStatus(data.status) : 'disconnected',
      expiresAt: data.expires_at || null
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

/**
 * Map doctor-server status to frontend status
 */
function mapStatus(status) {
  if (!status) return 'disconnected';

  const statusStr = String(status).toLowerCase();

  switch (statusStr) {
    case 'connected':
      return 'connected';
    case 'qr_ready':
    case 'waiting_qr':
      return 'qr';
    case 'connecting':
    case 'initializing':
      return 'connecting';
    case 'error':
    case 'failed':
      return 'error';
    default:
      return 'disconnected';
  }
}
