import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db: any = null;

export async function getDatabase() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'crm_database.db'),
      driver: sqlite3.Database,
    });

    // Initialize tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER,
        twilio_sid TEXT UNIQUE,
        direction TEXT NOT NULL, -- 'inbound' or 'outbound'
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER,
        recording_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER,
        twilio_sid TEXT UNIQUE,
        direction TEXT NOT NULL, -- 'inbound' or 'outbound'
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
      CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
    `);
  }

  return db;
}

export async function findOrCreateContact(phone: string, name?: string) {
  const db = await getDatabase();
  
  // Try to find existing contact
  let contact = await db.get('SELECT * FROM contacts WHERE phone = ?', [phone]);
  
  if (!contact && name) {
    // Create new contact
    const result = await db.run(
      'INSERT INTO contacts (name, phone) VALUES (?, ?)',
      [name, phone]
    );
    contact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
  }
  
  return contact;
}