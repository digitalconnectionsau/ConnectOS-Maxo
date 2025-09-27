import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    
    const result = await db.query(`
      SELECT c.*, 
        COUNT(DISTINCT calls.id) as call_count,
        COUNT(DISTINCT messages.id) as message_count,
        GREATEST(MAX(calls.created_at), MAX(messages.created_at)) as last_contact
      FROM contacts c
      LEFT JOIN calls ON c.id = calls.contact_id
      LEFT JOIN messages ON c.id = messages.contact_id
      GROUP BY c.id, c.name, c.phone, c.email, c.job_title, c.company_id, c.created_at
      ORDER BY last_contact DESC NULLS LAST, c.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, notes, jobTitle, company } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db.query(
      'INSERT INTO contacts (name, phone, email, notes, job_title) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, notes, jobTitle]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    
    // Handle unique constraint error
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}