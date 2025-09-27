import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check that doesn't depend on database
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'phone-crm',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}