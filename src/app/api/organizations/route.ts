import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    const result = await db.query(`
      SELECT 
        c.*,
        COUNT(contacts.id) as contact_count
      FROM companies c
      LEFT JOIN contacts ON contacts.company_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, website, industry, size, annual_revenue } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db.query(
      'INSERT INTO companies (name, website, industry, size, annual_revenue) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, website, industry, size, annual_revenue]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Handle unique constraint error
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Organization name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}