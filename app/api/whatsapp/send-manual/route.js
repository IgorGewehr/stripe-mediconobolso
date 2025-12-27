/**
 * WhatsApp Send Manual Message API
 *
 * Endpoint for sending manual messages through WhatsApp.
 * Used when AI is paused and doctor/secretary responds manually.
 * Communicates with doctor-server WhatsApp endpoints.
 */

import { NextResponse } from 'next/server';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');
    const authToken = request.headers.get('Authorization');
    const body = await request.json();

    const { phone, message, conversationId } = body;

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    console.log('[WhatsApp Send] Sending manual message:', {
      doctor: doctorId.substring(0, 8) + '***',
      phone: phone.substring(0, 6) + '***',
      messageLength: message.length
    });

    // Build headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Send message through doctor-server WhatsApp endpoint
    const response = await fetch(`${API_URL}/whatsapp/messages/${doctorId}/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: phone,
        message: message, // doctor-server expects 'message' not 'text'
        message_type: 'text'
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();

    return NextResponse.json({
      success: data.success !== false,
      messageId: data.message_id || null,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('[WhatsApp Send] Error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send message'
      },
      { status: 500 }
    );
  }
}
