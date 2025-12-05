/**
 * MaxoTel API Integration Library
 * V2 Architecture - Cost-saving backend for VoIP platform
 */

export interface MaxoTelConfig {
  apiKey: string;
  virtualMobile: string;
  officeNumber: string;
  accountId: string;
}

export interface MaxoTelSMSResponse {
  success: boolean;
  message: string;
  provider: 'maxotel';
}

export interface MaxoTelCall {
  uniqueid: string;
  origin: string;
  destination: string;
  status: string;
  duration: number;
  calldate: string;
  disposition?: string;
  channel?: string;
  accountcode?: string;
  direction?: string;
}

export interface TransformedCall {
  id: string;
  from: string;
  to: string;
  status: string;
  duration: number;
  direction: string;
  created_at: string;
  maxotel_data?: any;
  provider: 'maxotel';
}

/**
 * Get MaxoTel configuration from environment variables
 */
export function getMaxoTelConfig(): MaxoTelConfig {
  const apiKey = process.env.MAXOTEL_API_KEY;
  const virtualMobile = process.env.MAXOTEL_VIRTUAL_MOBILE;
  const officeNumber = process.env.MAXOTEL_OFFICE_NUMBER;
  const accountId = process.env.MAXOTEL_ACCOUNT_ID || process.env.TWILIO_BYOC_TRUNK_SID;

  if (!apiKey) {
    throw new Error('MAXOTEL_API_KEY is not configured');
  }

  if (!virtualMobile) {
    throw new Error('MAXOTEL_VIRTUAL_MOBILE is not configured');
  }

  if (!officeNumber) {
    throw new Error('MAXOTEL_OFFICE_NUMBER is not configured');
  }

  if (!accountId) {
    throw new Error('MAXOTEL_ACCOUNT_ID or TWILIO_BYOC_TRUNK_SID is not configured');
  }

  return {
    apiKey,
    virtualMobile,
    officeNumber,
    accountId,
  };
}

/**
 * Sanitize phone number for SIP dialing
 * Removes spaces, dashes, parentheses, and other formatting
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Send SMS via MaxoTel API
 */
export async function sendMaxoTelSMS(
  destination: string,
  message: string,
  origin?: string
): Promise<MaxoTelSMSResponse> {
  const config = getMaxoTelConfig();
  const fromNumber = origin || config.virtualMobile;

  const url = new URL('https://myapi.maxo.com.au/sms/send');
  url.searchParams.append('key', config.apiKey);
  url.searchParams.append('destination', destination);
  url.searchParams.append('message', message);
  url.searchParams.append('origin', fromNumber);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  const responseText = await response.text();
  const success = responseText.includes('Successfully');

  return {
    success,
    message: responseText,
    provider: 'maxotel',
  };
}

/**
 * Fetch call history from MaxoTel CDR API
 */
export async function getMaxoTelCallHistory(limit: number = 50): Promise<TransformedCall[]> {
  const config = getMaxoTelConfig();

  const url = new URL('https://myapi.maxo.com.au/calls/list');
  url.searchParams.append('key', config.apiKey);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('format', 'json');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MaxoTel API error: ${response.status} ${response.statusText}`);
  }

  const calls = await response.json();

  return transformMaxoTelCalls(calls);
}

/**
 * Transform MaxoTel CDR format to application format
 */
export function transformMaxoTelCalls(maxotelCalls: any[]): TransformedCall[] {
  if (!Array.isArray(maxotelCalls)) {
    return [];
  }

  return maxotelCalls.map((call) => ({
    id: call.uniqueid || call.id || `maxotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from: call.origin || call.from_number || call.src || 'unknown',
    to: call.destination || call.to_number || call.dst || 'unknown',
    status: call.status || call.disposition || 'completed',
    duration: call.duration || call.billsec || 0,
    direction: determineCallDirection(call),
    created_at: call.calldate || call.start_time || call.created_at || new Date().toISOString(),
    maxotel_data: {
      uniqueid: call.uniqueid,
      channel: call.channel,
      disposition: call.disposition,
      accountcode: call.accountcode,
    },
    provider: 'maxotel',
  }));
}

/**
 * Determine call direction from MaxoTel CDR data
 */
function determineCallDirection(call: any): string {
  if (call.direction) {
    return call.direction.toLowerCase();
  }

  if (call.dcontext) {
    if (call.dcontext.includes('from-trunk')) return 'inbound';
    if (call.dcontext.includes('from-internal')) return 'outbound';
  }

  if (call.channel) {
    if (call.channel.includes('SIP/')) return 'outbound';
  }

  return 'unknown';
}

/**
 * Generate TwiML for MaxoTel SIP bridging
 */
export function generateMaxoTelBridgeTwiML(
  phoneNumber: string,
  callerId?: string,
  accountId?: string
): string {
  const config = getMaxoTelConfig();
  const sanitizedNumber = sanitizePhoneNumber(phoneNumber);
  const caller = callerId || config.officeNumber;
  const account = accountId || config.accountId;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${caller}" action="/api/twiml/call/status" method="POST">
    <Sip>sip:${sanitizedNumber}@sip.maxo.com.au?x-account-id=${account}</Sip>
  </Dial>
</Response>`;
}

/**
 * Generate a pseudo message ID for tracking
 * (MaxoTel SMS API doesn't return message IDs)
 */
export function generateMessageId(prefix: string = 'maxotel'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate MaxoTel configuration
 */
export function validateMaxoTelConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.MAXOTEL_API_KEY) {
    errors.push('MAXOTEL_API_KEY is not set');
  }

  if (!process.env.MAXOTEL_VIRTUAL_MOBILE) {
    errors.push('MAXOTEL_VIRTUAL_MOBILE is not set');
  }

  if (!process.env.MAXOTEL_OFFICE_NUMBER) {
    errors.push('MAXOTEL_OFFICE_NUMBER is not set');
  }

  if (!process.env.MAXOTEL_ACCOUNT_ID && !process.env.TWILIO_BYOC_TRUNK_SID) {
    errors.push('MAXOTEL_ACCOUNT_ID or TWILIO_BYOC_TRUNK_SID is not set');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
