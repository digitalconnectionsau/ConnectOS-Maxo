-- Phase 2: Ticketing system
-- Lookup tables for ticket workflow

CREATE TABLE IF NOT EXISTS ticket_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  color VARCHAR(16) DEFAULT '#6B7280',
  sort_order INT DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_priorities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  color VARCHAR(16) DEFAULT '#6B7280',
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  -- Default SLA hints if no explicit policy is attached to the ticket.
  default_response_minutes INT,
  default_resolution_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sla_policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  response_minutes INT NOT NULL,
  resolution_minutes INT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed defaults (idempotent via ON CONFLICT)
INSERT INTO ticket_statuses (name, color, sort_order, is_closed, is_default) VALUES
  ('Open',        '#3B82F6', 10, FALSE, TRUE),
  ('In Progress', '#F59E0B', 20, FALSE, FALSE),
  ('Pending',     '#A855F7', 30, FALSE, FALSE),
  ('Resolved',    '#10B981', 40, TRUE,  FALSE),
  ('Closed',      '#6B7280', 50, TRUE,  FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ticket_priorities (name, color, sort_order, is_default, default_response_minutes, default_resolution_minutes) VALUES
  ('Low',    '#9CA3AF', 10, FALSE, 480,  2880),  -- 8h / 48h
  ('Normal', '#3B82F6', 20, TRUE,  240,  1440),  -- 4h / 24h
  ('High',   '#F59E0B', 30, FALSE, 60,   480),   -- 1h / 8h
  ('Urgent', '#EF4444', 40, FALSE, 15,   240)    -- 15m / 4h
ON CONFLICT (name) DO NOTHING;

INSERT INTO sla_policies (name, description, response_minutes, resolution_minutes, is_default) VALUES
  ('Standard', 'Default SLA for all new tickets', 240, 1440, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Main tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(32) UNIQUE NOT NULL,
  subject VARCHAR(512) NOT NULL,
  description TEXT,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  assignee_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  status_id INTEGER NOT NULL REFERENCES ticket_statuses(id),
  priority_id INTEGER NOT NULL REFERENCES ticket_priorities(id),
  sla_policy_id INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL,
  source VARCHAR(32) DEFAULT 'manual', -- 'manual','email','phone','portal','api'
  response_due_at TIMESTAMP,
  resolution_due_at TIMESTAMP,
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee    ON tickets(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact     ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority    ON tickets(priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at  ON tickets(created_at DESC);

-- Sequence for human-readable ticket numbers (T-00001, T-00002, ...)
CREATE SEQUENCE IF NOT EXISTS tickets_number_seq START WITH 1000;

-- Comments / replies
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- internal notes vs replies visible to the client
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id, created_at);

-- Attachments (file storage path; can be reused for comments later)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE CASCADE,
  file_name VARCHAR(512) NOT NULL,
  file_size BIGINT,
  content_type VARCHAR(255),
  file_path TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity / audit trail
CREATE TABLE IF NOT EXISTS ticket_activity (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,     -- 'created','status_changed','assigned','priority_changed','commented', ...
  field VARCHAR(64),
  from_value TEXT,
  to_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON ticket_activity(ticket_id, created_at);
