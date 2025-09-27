-- Full CRM + Payments schema for PostgreSQL
-- This handles enterprise-level CRM with payment processing

-- Companies/Organizations
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50), -- 'startup', 'small', 'medium', 'enterprise'
  annual_revenue DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced contacts with company relationships
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  job_title VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  notes TEXT,
  lead_source VARCHAR(50),
  lead_status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  last_contact_date TIMESTAMP,
  next_follow_up TIMESTAMP,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Services
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  product_type VARCHAR(50), -- 'service', 'product', 'subscription'
  stripe_price_id VARCHAR(255), -- For Stripe integration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id),
  contact_id INTEGER REFERENCES contacts(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'cash'
  stripe_payment_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'refunded'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions (for recurring services)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  product_id INTEGER REFERENCES products(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(company_id::text, '')));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', name));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);