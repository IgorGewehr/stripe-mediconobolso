/**
 * Block Conversation API
 *
 * Endpoint for AI agent and frontend to pause/resume AI responses for a conversation.
 * When blocked, the AI agent will not respond to messages and a human can take over.
 */

import { NextResponse } from 'next/server';
import { conversationService } from '@/lib/services/firebase';

export async function POST(request) {
  const requestId = `block_conversation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await request.json();
    const {
      doctorId,
      phone,
      action, // 'block' or 'unblock'
      duration, // Duration in minutes (optional, for block action)
      reason // Optional reason for blocking
    } = body;

    console.log('[BLOCK-CONVERSATION] Starting', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      phone: phone ? phone.substring(0, 4) + '***' : undefined,
      action,
      duration
    });

    // Validate required parameters
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'DoctorId is required', requestId },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone is required', requestId },
        { status: 400 }
      );
    }

    if (!action || !['block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "block" or "unblock"', requestId },
        { status: 400 }
      );
    }

    let result;

    if (action === 'block') {
      // Block AI for this conversation
      const durationMinutes = duration || 60; // Default 1 hour
      result = await conversationService.blockAI(doctorId, phone, durationMinutes, reason);

      console.log('[BLOCK-CONVERSATION] AI blocked', {
        requestId,
        duration: durationMinutes
      });

      return NextResponse.json({
        success: true,
        data: {
          action: 'blocked',
          phone,
          blockedUntil: result.blockedUntil,
          duration: durationMinutes,
          reason: reason || 'Manual takeover requested'
        },
        meta: { requestId, timestamp: new Date().toISOString() }
      });

    } else {
      // Unblock AI for this conversation
      result = await conversationService.unblockAI(doctorId, phone);

      console.log('[BLOCK-CONVERSATION] AI unblocked', { requestId });

      return NextResponse.json({
        success: true,
        data: {
          action: 'unblocked',
          phone,
          aiActive: true
        },
        meta: { requestId, timestamp: new Date().toISOString() }
      });
    }

  } catch (error) {
    console.error('[BLOCK-CONVERSATION] Error', { requestId, error: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'block-conversation failed',
        requestId,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check AI block status for a conversation
 */
export async function GET(request) {
  const requestId = `check_block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const phone = searchParams.get('phone');

    console.log('[BLOCK-CONVERSATION] Checking status', {
      requestId,
      doctorId: doctorId?.substring(0, 8) + '***',
      phone: phone ? phone.substring(0, 4) + '***' : undefined
    });

    if (!doctorId || !phone) {
      return NextResponse.json(
        { success: false, error: 'DoctorId and phone are required', requestId },
        { status: 400 }
      );
    }

    const blockStatus = await conversationService.getAIBlockStatus(doctorId, phone);

    console.log('[BLOCK-CONVERSATION] Status retrieved', {
      requestId,
      isBlocked: blockStatus.isBlocked
    });

    return NextResponse.json({
      success: true,
      data: {
        phone,
        isBlocked: blockStatus.isBlocked,
        blockedUntil: blockStatus.blockedUntil,
        blockedAt: blockStatus.blockedAt,
        reason: blockStatus.reason,
        aiCanRespond: !blockStatus.isBlocked
      },
      meta: { requestId, timestamp: new Date().toISOString() }
    });

  } catch (error) {
    console.error('[BLOCK-CONVERSATION] Error checking status', { requestId, error: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check block status',
        requestId
      },
      { status: 500 }
    );
  }
}
