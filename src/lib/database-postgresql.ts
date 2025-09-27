import { Pool } from 'pg';

let pool: Pool | null = null;

export async function getDatabase() {
  if (!pool) {
    // Use Railway's PostgreSQL connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Initialize tables
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT UNIQUE NOT NULL,
          email TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS calls (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id),
          twilio_sid TEXT UNIQUE,
          direction TEXT NOT NULL, -- 'inbound' or 'outbound'
          from_number TEXT NOT NULL,
          to_number TEXT NOT NULL,
          status TEXT NOT NULL,
          duration INTEGER,
          recording_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id),
          twilio_sid TEXT UNIQUE,
          direction TEXT NOT NULL, -- 'inbound' or 'outbound'
          from_number TEXT NOT NULL,
          to_number TEXT NOT NULL,
          body TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
        CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
        CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
      `);
      console.log('PostgreSQL database initialized successfully');
    } finally {
      client.release();
    }
  }

  return pool;
}

export async function findOrCreateContact(phone: string, name?: string) {
  const db = await getDatabase();
  
  // Try to find existing contact
  let result = await db.query('SELECT * FROM contacts WHERE phone = $1', [phone]);
  let contact = result.rows[0];
  
  if (!contact && name) {
    // Create new contact
    result = await db.query(
      'INSERT INTO contacts (name, phone) VALUES ($1, $2) RETURNING *',
      [name, phone]
    );
    contact = result.rows[0];
  }
  
  return contact;
}