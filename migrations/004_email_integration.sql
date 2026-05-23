-- Phase 3: Microsoft 365 email-to-ticket integration

-- A mailbox is the upstream inbox we poll. We allow multiple in case the user
-- runs support@ and sales@ from the same tenant.
CREATE TABLE IF NOT EXISTS mailboxes (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER REFERENCES integrations(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL DEFAULT 'microsoft365',  -- room to add imap/gmail later
  address VARCHAR(255) UNIQUE NOT NULL,                  -- support@example.com
  display_name VARCHAR(255),
  -- Polling state. last_polled_at is informational; we use $filter=receivedDateTime gt
  -- last_message_at to avoid re-processing what we've already imported.
  last_polled_at TIMESTAMP,
  last_message_at TIMESTAMP,
  enabled BOOLEAN DEFAULT TRUE,
  -- Behaviour toggles
  create_tickets BOOLEAN DEFAULT TRUE,                   -- create new tickets for unknown threads
  default_priority_id INTEGER REFERENCES ticket_priorities(id),
  default_assignee_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Persisted email messages — both inbound (from Graph) and outbound (replies we sent).
CREATE TABLE IF NOT EXISTS email_messages (
  id SERIAL PRIMARY KEY,
  mailbox_id INTEGER REFERENCES mailboxes(id) ON DELETE SET NULL,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE SET NULL,
  external_id VARCHAR(255),                              -- Graph message id
  conversation_id VARCHAR(255),                          -- Graph conversationId — used to thread replies
  internet_message_id VARCHAR(512),                      -- RFC 5322 Message-ID
  in_reply_to VARCHAR(512),
  subject VARCHAR(1024),
  from_address VARCHAR(255),
  from_name VARCHAR(255),
  to_addresses TEXT,                                     -- comma-separated
  cc_addresses TEXT,
  body_html TEXT,
  body_text TEXT,
  direction VARCHAR(16) NOT NULL DEFAULT 'inbound',      -- 'inbound' | 'outbound'
  received_at TIMESTAMP,
  sent_at TIMESTAMP,
  has_attachments BOOLEAN DEFAULT FALSE,
  raw_metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_messages_ticket          ON email_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_conversation    ON email_messages(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_messages_external_id_unique
  ON email_messages(external_id) WHERE external_id IS NOT NULL;

-- Tag tickets that originated from email so the UI can show "Reply via email".
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email_conversation_id VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS email_mailbox_id INTEGER REFERENCES mailboxes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_email_conv ON tickets(email_conversation_id);
