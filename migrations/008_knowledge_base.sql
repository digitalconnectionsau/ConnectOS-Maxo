-- Phase 7: Knowledge base
-- Markdown articles with full-text search (Postgres tsvector).

CREATE TABLE IF NOT EXISTS kb_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES kb_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kb_articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  category_id INTEGER REFERENCES kb_categories(id) ON DELETE SET NULL,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',     -- draft | published | archived
  visibility VARCHAR(20) NOT NULL DEFAULT 'internal', -- internal | public
  tags TEXT[],
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  search_tsv tsvector
);

CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status   ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tsv      ON kb_articles USING GIN (search_tsv);

CREATE OR REPLACE FUNCTION kb_articles_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.excerpt,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body,'')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kb_articles_tsv_trigger ON kb_articles;
CREATE TRIGGER kb_articles_tsv_trigger
  BEFORE INSERT OR UPDATE ON kb_articles
  FOR EACH ROW EXECUTE FUNCTION kb_articles_tsv_update();
