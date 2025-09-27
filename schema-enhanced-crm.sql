-- Enhanced CRM schema for SQLite
-- This can handle advanced CRM features while staying with SQLite

-- Enhanced contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  company TEXT,
  job_title TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  notes TEXT,
  lead_source TEXT, -- 'website', 'referral', 'cold_call', etc.
  lead_status TEXT DEFAULT 'new', -- 'new', 'qualified', 'proposal', 'won', 'lost'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  last_contact_date DATETIME,
  next_follow_up DATETIME,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact tags for categorization
CREATE TABLE IF NOT EXISTS contact_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Tasks and follow-ups
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATETIME,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  task_type TEXT, -- 'call', 'email', 'meeting', 'follow_up'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Notes and interactions
CREATE TABLE IF NOT EXISTS contact_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- 'general', 'meeting', 'call', 'email'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Enhanced calls table with CRM data
CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER,
  twilio_sid TEXT UNIQUE,
  direction TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL,
  duration INTEGER,
  recording_url TEXT,
  call_purpose TEXT, -- 'sales', 'support', 'follow_up', 'demo'
  call_outcome TEXT, -- 'interested', 'not_interested', 'callback', 'voicemail'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON contact_tags(tag);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);