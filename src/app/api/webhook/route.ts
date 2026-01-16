import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const WebhookPayloadSchema = z.object({
  id: z.string(), // kie.ai job ID
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  result_url: z.string().url().optional(),
  error: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = WebhookPayloadSchema.parse(body);

    console.log('[Webhook] Received kie.ai webhook:', payload);

    // Find generation by kie job ID
    const generation = await prisma.generation.findUnique({
      where: { kieJobId: payload.id },
    });

    if (!generation) {
      console.error('[Webhook] Generation not found for kie job:', payload.id);
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Update generation with results
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: payload.status,
        resultUrl: payload.result_url,
        errorMessage: payload.error,
      },
    });

    console.log(`[Webhook] Updated generation ${generation.id} to status: ${payload.status}`);

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
