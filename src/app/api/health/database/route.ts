import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    const db = await getDatabase();
    await db.query('SELECT NOW() as current_time');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'phone-crm'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}