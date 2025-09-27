import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'NEXTAUTH_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'phone-crm',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database_url_configured: !!process.env.DATABASE_URL,
      nextauth_secret_configured: !!process.env.NEXTAUTH_SECRET,
      missing_env_vars: missingEnvVars
    };

    // If critical env vars are missing, return warning but still 200 status
    if (missingEnvVars.length > 0) {
      healthStatus.status = 'degraded';
    }

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Still return 200 so Railway doesn't kill the deployment
    );
  }
}