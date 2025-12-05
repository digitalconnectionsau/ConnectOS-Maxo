import { NextResponse } from 'next/server';
import { validateMaxoTelConfig } from '@/lib/maxotel';

/**
 * MaxoTel Configuration Health Check
 * Use this endpoint to verify all required environment variables are set
 * GET /api/maxotel/health
 */
export async function GET() {
  try {
    const validation = validateMaxoTelConfig();

    if (!validation.valid) {
      return NextResponse.json(
        {
          status: 'error',
          configured: false,
          errors: validation.errors,
          message: 'MaxoTel is not properly configured. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    // If valid, return success with config summary (hide sensitive data)
    return NextResponse.json({
      status: 'ok',
      configured: true,
      provider: 'maxotel',
      features: {
        sms: !!process.env.MAXOTEL_API_KEY && !!process.env.MAXOTEL_VIRTUAL_MOBILE,
        calls: !!process.env.MAXOTEL_API_KEY && !!process.env.MAXOTEL_OFFICE_NUMBER,
        sip_bridging: !!(process.env.MAXOTEL_ACCOUNT_ID || process.env.TWILIO_BYOC_TRUNK_SID),
        call_history: !!process.env.MAXOTEL_API_KEY,
      },
      config: {
        api_key_set: !!process.env.MAXOTEL_API_KEY,
        virtual_mobile_set: !!process.env.MAXOTEL_VIRTUAL_MOBILE,
        office_number_set: !!process.env.MAXOTEL_OFFICE_NUMBER,
        account_id_set: !!(process.env.MAXOTEL_ACCOUNT_ID || process.env.TWILIO_BYOC_TRUNK_SID),
        sip_credentials_set: !!process.env.MAXOTEL_SIP_USER && !!process.env.MAXOTEL_SIP_PASS,
      },
      message: 'MaxoTel is properly configured and ready to use.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to validate MaxoTel configuration.',
      },
      { status: 500 }
    );
  }
}
