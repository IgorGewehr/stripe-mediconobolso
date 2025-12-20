/**
 * WhatsApp Session Reset API
 *
 * Endpoint for disconnecting/resetting WhatsApp session.
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

    console.log('[WhatsApp Reset] Resetting session for doctor:', doctorId.substring(0, 8) + '***');

    // Call WhatsApp microservice to reset session
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/session/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': doctorId
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to reset session');
    }

    const data = await response.json();

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
