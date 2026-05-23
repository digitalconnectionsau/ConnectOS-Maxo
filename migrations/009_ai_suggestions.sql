-- Phase 8: AI assists
-- OpenAI credentials are stored in the generic `integrations` table
-- (provider='openai'). This migration only tracks suggestion history.

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(40) NOT NULL,                     -- draft_reply | summary | categorize
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  output TEXT NOT NULL,
  model VARCHAR(80),
  tokens_used INTEGER,
  accepted BOOLEAN,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_ticket ON ai_suggestions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_kind   ON ai_suggestions(kind);
