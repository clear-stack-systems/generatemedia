import { z } from 'zod';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = process.env.KIE_API_BASE_URL || 'https://api.kie.ai/v1';

export type KieGenerationRequest = {
  prompt: string;
  model: string;
  webhookUrl?: string;
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

  const response = await fetch(`${KIE_API_BASE_URL}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`,
    },
    body: JSON.stringify({
      model: request.model,
      callBackUrl: webhookUrl,
      input: {
        prompt: request.prompt,
        aspect_ratio: '1:1',
        quality: 'basic',
      },
    }),
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
