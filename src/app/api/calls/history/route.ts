import { NextRequest, NextResponse } from 'next/server';
import { getMaxoTelCallHistory } from '@/lib/maxotel';

// V2 ARCHITECTURE: Fetch call history from MaxoTel CDR API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    console.log('Fetching call history from MaxoTel...');

    // Fetch and transform call history using MaxoTel utility
    let calls;
    try {
      calls = await getMaxoTelCallHistory(limit);
    } catch (configError) {
      console.error('MaxoTel configuration error:', configError);
      return NextResponse.json(
        { error: 'Call history service not configured', details: (configError as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      calls: calls,
      count: calls.length,
      provider: 'maxotel',
    });

  } catch (error) {
    console.error('Error fetching MaxoTel call history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch call history', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
