import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    
    const contacts = await db.all(`
      SELECT c.*, 
        COUNT(DISTINCT calls.id) as call_count,
        COUNT(DISTINCT messages.id) as message_count,
        MAX(COALESCE(calls.created_at, messages.created_at)) as last_contact
      FROM contacts c
      LEFT JOIN calls ON c.id = calls.contact_id
      LEFT JOIN messages ON c.id = messages.contact_id
      GROUP BY c.id
      ORDER BY last_contact DESC, c.created_at DESC
    `);

    return NextResponse.json(contacts);
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
    const { name, phone, email, notes } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db.run(
      'INSERT INTO contacts (name, phone, email, notes) VALUES (?, ?, ?, ?)',
      [name, phone, email, notes]
    );

    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}