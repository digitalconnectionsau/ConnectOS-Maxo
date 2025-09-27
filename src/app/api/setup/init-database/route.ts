import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing database...');
    
    // This will create all the tables
    const db = await getDatabase();
    
    // Check if admin user already exists
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(existingUsers.rows[0].count);
    
    if (userCount === 0) {
      // Create default admin user
      const defaultPassword = 'admin123'; // You should change this!
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await db.query(`
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'admin',
        'admin@company.com',
        hashedPassword,
        'System Administrator',
        'admin'
      ]);
      
      console.log('Created default admin user');
    }
    
    // Get table counts for verification
    const tables = [
      'users', 'companies', 'contacts', 'calls', 'messages', 
      'tasks', 'products', 'invoices', 'payments', 'secure_files'
    ];
    
    const tableCounts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        console.log(`Table ${table} might not exist yet:`, error);
        tableCounts[table] = -1; // Indicates table doesn't exist
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      userCount,
      tableCounts,
      defaultCredentials: userCount === 1 ? {
        username: 'admin',
        password: 'admin123',
        note: 'Please change the default password after first login!'
      } : null
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        error: 'Database initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy browser testing
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to initialize database',
    endpoint: '/api/setup/init-database',
    method: 'POST'
  });
}