import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Validate that a webhook request is from Twilio
 * Add this to your webhook routes for extra security
 */
export function validateTwilioSignature(
  request: NextRequest,
  body: string,
  twilioSignature: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const url = request.url;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(url + body)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(twilioSignature, 'base64'),
    Buffer.from(expectedSignature, 'base64')
  );
}

/**
 * Simple API key authentication
 * You can add this to protect your API routes
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;
  
  return !!(apiKey && validApiKey && apiKey === validApiKey);
}