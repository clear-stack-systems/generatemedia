import { z } from 'zod';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = process.env.KIE_API_BASE_URL || 'https://api.kie.ai/v1';

export type KieGenerationRequest = {
  prompt: string;
  model: string;
  mode: 'image' | 'video';
  webhookUrl?: string;
  // Video-specific parameters
  inputImageUrls?: string[];
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
  fixedLens?: boolean;
  generateAudio?: boolean;
};

export type KieGenerationResponse = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
};

/**
 * Submit a generation request to kie.ai
 */
export async function submitKieGeneration(
  request: KieGenerationRequest
): Promise<KieGenerationResponse> {
  if (!KIE_API_KEY) {
    throw new Error('KIE_API_KEY is not configured');
  }

  const webhookUrl = request.webhookUrl || `${process.env.GENERATEMEDIA_PUBLIC_BASE_URL}/api/webhook`;

  // Build input based on mode
  let input: any;

  if (request.mode === 'video') {
    // Video mode: use video-specific parameters
    input = {
      prompt: request.prompt,
    };

    // Add optional video parameters
    if (request.inputImageUrls && request.inputImageUrls.length > 0) {
      input.input_urls = request.inputImageUrls;
    }
    if (request.aspectRatio) {
      input.aspect_ratio = request.aspectRatio;
    }
    if (request.resolution) {
      input.resolution = request.resolution;
    }
    if (request.duration !== undefined) {
      input.duration = String(request.duration);
    }
    if (request.fixedLens !== undefined) {
      input.fixed_lens = request.fixedLens;
    }
    if (request.generateAudio !== undefined) {
      input.generate_audio = request.generateAudio;
    }
  } else {
    // Image mode: use image-specific parameters
    input = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio || '1:1',
      quality: 'basic',
    };
  }

  const requestBody = {
    model: request.model,
    callBackUrl: webhookUrl,
    input,
  };

  // Debug: log to console
  console.log('\n=== kie.ai REQUEST ===');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('======================\n');

  const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`kie.ai API error: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();

  // kie.ai returns { code: 200, message: "success", data: { taskId: "..." } }
  if (responseData.code !== 200 || !responseData.data?.taskId) {
    throw new Error(`kie.ai API error: Invalid response format - ${JSON.stringify(responseData)}`);
  }

  return {
    id: responseData.data.taskId,
    status: 'pending', // Initial status is always pending
    resultUrl: undefined,
    error: undefined,
  };
}

/**
 * Get status of a kie.ai generation
 */
export async function getKieGenerationStatus(
  kieJobId: string
): Promise<KieGenerationResponse> {
  if (!KIE_API_KEY) {
    throw new Error('KIE_API_KEY is not configured');
  }

  const response = await fetch(`${KIE_API_BASE_URL}/generate/${kieJobId}`, {
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`kie.ai API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    status: data.status,
    resultUrl: data.result_url,
    error: data.error,
  };
}
