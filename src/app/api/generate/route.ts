import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generationQueue } from '@/lib/queue';

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  mode: z.enum(['image', 'video']).default('image'),
  // Video-specific parameters (optional)
  inputImageUrls: z.array(z.string().url()).max(2).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
  resolution: z.enum(['480p', '720p']).optional(),
  duration: z.number().int().refine((val) => [4, 8, 12].includes(val), {
    message: 'Duration must be 4, 8, or 12 seconds',
  }).optional(),
  fixedLens: z.boolean().optional(),
  generateAudio: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      mode,
      inputImageUrls,
      aspectRatio,
      resolution,
      duration,
      fixedLens,
      generateAudio,
    } = GenerateRequestSchema.parse(body);

    // Select model based on mode
    const model = mode === 'video'
      ? (process.env.KIE_VIDEO_MODEL || 'bytedance/seedance-1.5-pro')
      : (process.env.KIE_IMAGE_MODEL || 'seedream/4.5-text-to-image');

    // Create generation record with video parameters
    const generation = await prisma.generation.create({
      data: {
        prompt,
        model,
        mode,
        status: 'pending',
        // Video parameters (only relevant for video mode)
        inputImageUrls: inputImageUrls || [],
        aspectRatio: aspectRatio || (mode === 'video' ? '16:9' : '1:1'),
        resolution: resolution || (mode === 'video' ? '480p' : undefined),
        duration: duration || (mode === 'video' ? 4 : undefined),
        fixedLens: fixedLens ?? false,
        generateAudio: generateAudio ?? false,
      },
    });

    // Add job to queue with all parameters (convert null to undefined)
    const job = await generationQueue.add('generate', {
      generationId: generation.id,
      prompt,
      model,
      mode,
      inputImageUrls: inputImageUrls || [],
      aspectRatio: generation.aspectRatio ?? undefined,
      resolution: generation.resolution ?? undefined,
      duration: generation.duration ?? undefined,
      fixedLens: generation.fixedLens ?? undefined,
      generateAudio: generation.generateAudio ?? undefined,
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
        mode: generation.mode,
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
