import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
    
    return NextResponse.json({
      status: 'success',
      database: 'connected',
      currentTime: result.rows[0].current_time,
      version: result.rows[0].pg_version,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    }, { status: 500 });
  }
}