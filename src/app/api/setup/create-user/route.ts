import { NextRequest, NextResponse } from 'next/server';
import { createUser, getAllUsers } from '@/lib/users';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, fullName, role, companyData } = await request.json();

    // Check if any users already exist (prevent duplicate setup)
    const existingUsers = await getAllUsers();
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'System already set up. Please login.' }, { status: 400 });
    }

    // Create the admin user
    const user = await createUser(username, email, password, fullName, role);

    // Store company information if provided
    if (companyData) {
      const db = await getDatabase();
      await db.query(`
        INSERT INTO companies (name, industry, website, phone, email, address, city, state, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        companyData.companyName,
        companyData.industry || null,
        null, // website
        companyData.phone || null,
        companyData.email || null,
        companyData.address || null,
        companyData.city || null,
        companyData.state || null,
        companyData.country || 'Australia'
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Setup error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}