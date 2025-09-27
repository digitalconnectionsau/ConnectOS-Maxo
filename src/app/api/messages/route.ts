import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    
    const result = await db.query(`
      SELECT m.*, contacts.name as contact_name 
      FROM messages m
      LEFT JOIN contacts ON m.contact_id = contacts.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}