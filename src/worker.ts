import { Job } from 'bullmq';
import { createGenerationWorker, GenerationJobData } from './lib/queue';
import { prisma } from './lib/prisma';
import { submitKieGeneration } from './lib/kie';

async function processGeneration(job: Job<GenerationJobData>) {
  const { generationId, prompt, model } = job.data;

  console.log(`[Worker] Processing generation ${generationId}...`);

  try {
    // Update status to processing
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'processing' },
    });

    // Submit to kie.ai
    const kieResponse = await submitKieGeneration({
      prompt,
      model,
    });

    console.log(`[Worker] kie.ai job created: ${kieResponse.id}`);

    // Update with kie.ai job ID
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        kieJobId: kieResponse.id,
        status: kieResponse.status,
        resultUrl: kieResponse.resultUrl,
      },
    });

    // Note: The actual completion will be handled by the webhook
    // when kie.ai sends us the result

  } catch (error) {
    console.error(`[Worker] Error processing generation ${generationId}:`, error);

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

// Create and start the worker
const worker = createGenerationWorker(processGeneration);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log('[Worker] BullMQ worker started and waiting for jobs...');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
