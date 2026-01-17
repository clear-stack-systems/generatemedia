import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// kie.ai webhook format: { code: 200, data: { taskId, state, resultJson }, msg }
const WebhookPayloadSchema = z.object({
  code: z.number(),
  data: z.object({
    taskId: z.string(),
    state: z.string(), // "success", "failed", etc.
    resultJson: z.string().optional(), // JSON string with resultUrls
    failCode: z.string().nullable().optional(),
    failMsg: z.string().nullable().optional(),
  }),
  msg: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = WebhookPayloadSchema.parse(body);

    console.log('[Webhook] Received kie.ai webhook:', JSON.stringify(payload, null, 2));

    // Find generation by kie job ID
    const generation = await prisma.generation.findUnique({
      where: { kieJobId: payload.data.taskId },
    });

    if (!generation) {
      console.error('[Webhook] Generation not found for kie job:', payload.data.taskId);
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Map kie.ai state to our status
    let status: 'pending' | 'processing' | 'completed' | 'failed';
    if (payload.data.state === 'success') {
      status = 'completed';
    } else if (payload.data.state === 'fail' || payload.data.state === 'failed') {
      status = 'failed';
    } else if (payload.data.state === 'processing') {
      status = 'processing';
    } else {
      status = 'pending';
    }

    // Extract result URL from resultJson
    let resultUrl: string | undefined;
    if (payload.data.resultJson) {
      try {
        const resultData = JSON.parse(payload.data.resultJson);
        resultUrl = resultData.resultUrls?.[0]; // Get first URL
      } catch (e) {
        console.error('[Webhook] Failed to parse resultJson:', e);
      }
    }

    // Update generation with results
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status,
        resultUrl,
        errorMessage: payload.data.failMsg || undefined,
      },
    });

    console.log(`[Webhook] Updated generation ${generation.id} to status: ${status}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
