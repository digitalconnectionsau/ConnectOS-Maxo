import { NextRequest, NextResponse } from 'next/server';

// Placeholder email endpoint - will implement when email provider is configured
export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    // For now, just log the email request
    console.log('Email request:', { to, subject, message });

    return NextResponse.json({
      success: false,
      message: 'Email functionality not yet configured. Please set up email provider in environment variables.',
      data: { to, subject }
    });

  } catch (error) {
    console.error('Email endpoint error:', error);
    
    return NextResponse.json(
      { error: 'Email endpoint not ready' },
      { status: 500 }
    );
  }
}