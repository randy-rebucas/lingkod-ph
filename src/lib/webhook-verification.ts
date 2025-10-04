import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Verify webhook signature to ensure the request is from n8n
 */
export async function verifyWebhookSignature(
  request: NextRequest,
  body: any
): Promise<boolean> {
  try {
    const signature = request.headers.get('x-n8n-signature');
    const secret = process.env.N8N_WEBHOOK_SECRET;
    
    if (!signature || !secret) {
      console.warn('Missing webhook signature or secret');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.warn('Invalid webhook signature');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Verify n8n API key for direct API calls
 */
export function verifyN8nApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-n8n-api-key');
  const expectedApiKey = process.env.N8N_API_KEY;
  
  if (!apiKey || !expectedApiKey) {
    return false;
  }

  return apiKey === expectedApiKey;
}

/**
 * Get webhook URL for n8n workflows
 */
export function getWebhookUrl(workflowName: string): string {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678';
  return `${baseUrl}/webhook/${workflowName}`;
}

/**
 * Trigger n8n workflow via webhook
 */
export async function triggerN8nWorkflow(
  workflowName: string,
  data: any
): Promise<boolean> {
  try {
    const webhookUrl = getWebhookUrl(workflowName);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Signature': generateWebhookSignature(data)
      },
      body: JSON.stringify(data)
    });

    return response.ok;
  } catch (error) {
    console.error(`Error triggering n8n workflow ${workflowName}:`, error);
    return false;
  }
}

/**
 * Generate webhook signature for outbound requests
 */
function generateWebhookSignature(data: any): string {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('N8N_WEBHOOK_SECRET not configured');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}
