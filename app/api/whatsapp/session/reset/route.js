/**
 * WhatsApp Session Reset API
 *
 * Endpoint for disconnecting/resetting WhatsApp session.
 * Communicates with doctor-server WhatsApp endpoints.
 */

import { NextResponse } from 'next/server';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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

    console.log('[WhatsApp Reset] Resetting session for doctor:', doctorId.substring(0, 8) + '***');

    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Call doctor-server to disconnect session
    const response = await fetch(`${API_URL}/whatsapp/sessions/${doctorId}`, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to reset session');
    }

    const data = await response.json().catch(() => ({ success: true }));

    return NextResponse.json({
      success: true,
      message: 'Session reset successfully',
      data
    });
  } catch (error) {
    console.error('[WhatsApp Reset] Error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reset session'
      },
      { status: 500 }
    );
  }
}
