import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    
    const result = await db.query(`
      SELECT c.*, contacts.name as contact_name 
      FROM calls c
      LEFT JOIN contacts ON c.contact_id = contacts.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}