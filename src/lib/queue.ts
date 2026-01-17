import { Queue, Worker, Job } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
};

export type GenerationJobData = {
  generationId: string;
  prompt: string;
  model: string;
  mode: 'image' | 'video';
  // Video-specific parameters
  inputImageUrls?: string[];
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
  fixedLens?: boolean;
  generateAudio?: boolean;
};

export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: redisConnection,
});

export function createGenerationWorker(
  processor: (job: Job<GenerationJobData>) => Promise<void>
) {
  return new Worker<GenerationJobData>('generation', processor, {
    connection: redisConnection,
    concurrency: 3,
  });
}
