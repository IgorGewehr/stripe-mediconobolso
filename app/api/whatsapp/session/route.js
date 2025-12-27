/**
 * WhatsApp Session API
 *
 * Endpoint for checking WhatsApp connection status.
 * Communicates with the doctor-server WhatsApp endpoints.
 */

import { NextResponse } from 'next/server';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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

    console.log('[WhatsApp Session] Checking status for doctor:', doctorId.substring(0, 8) + '***');

    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Call doctor-server WhatsApp status endpoint
    const response = await fetch(`${API_URL}/whatsapp/sessions/${doctorId}/status`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('[WhatsApp Session] API returned error:', response.status);
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

    // Map doctor-server response to frontend format
    return NextResponse.json({
      success: true,
      data: {
        connected: data.connected || false,
        status: mapStatus(data.status),
        phoneNumber: data.phone_number || null,
        businessName: data.profile_name || null,
        qrCode: null // QR is fetched separately
      }
    });
  } catch (error) {
    console.error('[WhatsApp Session] Error:', error.message);

    // Return disconnected status on error
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
