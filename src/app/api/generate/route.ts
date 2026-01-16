import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generationQueue } from '@/lib/queue';

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = GenerateRequestSchema.parse(body);

    // Get default model from env
    const model = process.env.KIE_DEFAULT_MODEL || 'flux-1.1-pro';

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        prompt,
        model,
        mode: 'image', // MVP: fixed to image
        status: 'pending',
      },
    });

    // Add job to queue
    const job = await generationQueue.add('generate', {
      generationId: generation.id,
      prompt,
      model,
    });

    // Update with job ID
    await prisma.generation.update({
      where: { id: generation.id },
      data: { jobId: job.id },
    });

    return NextResponse.json({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        prompt: generation.prompt,
      },
    });
  } catch (error) {
    console.error('Error creating generation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
