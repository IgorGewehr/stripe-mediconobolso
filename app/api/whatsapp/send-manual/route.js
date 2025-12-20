/**
 * WhatsApp Send Manual Message API
 *
 * Endpoint for sending manual messages through WhatsApp.
 * Used when AI is paused and doctor/secretary responds manually.
 */

import { NextResponse } from 'next/server';
import { conversationService } from '@/lib/services/firebase';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3001';

export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-Id');
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

    // Send message through WhatsApp microservice
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': doctorId
      },
      body: JSON.stringify({
        phone,
        message,
        isManual: true
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();

    // Save message to Firebase if conversationId is provided
    if (conversationId) {
      try {
        await conversationService.addMessage(doctorId, conversationId, {
          doctorMessage: message,
          sender: 'doctor',
          whatsappMessageId: data.messageId || null
        });
      } catch (dbError) {
        console.warn('[WhatsApp Send] Failed to save message to Firebase:', dbError.message);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: data.messageId || null,
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
