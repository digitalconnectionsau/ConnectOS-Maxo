import { Pool } from 'pg';

let pool: Pool | null = null;

export async function getDatabase() {
  if (!pool) {
    // Use Railway's PostgreSQL connection or fallback to local
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/phone_crm';
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Initialize tables with full CRM + payments schema
    const client = await pool.connect();
    try {
      await client.query(`
        -- Users/Admin table for authentication
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'user', 'manager'
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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

        -- Contact tags for categorization
        CREATE TABLE IF NOT EXISTS contact_tags (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          tag VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tasks and follow-ups
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          due_date TIMESTAMP,
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
          task_type VARCHAR(50), -- 'call', 'email', 'meeting', 'follow_up'
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP
        );

        -- Notes and interactions
        CREATE TABLE IF NOT EXISTS contact_notes (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          note TEXT NOT NULL,
          note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'meeting', 'call', 'email'
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Enhanced calls table with CRM data
        CREATE TABLE IF NOT EXISTS calls (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id),
          twilio_sid VARCHAR(255) UNIQUE,
          direction VARCHAR(20) NOT NULL, -- 'inbound' or 'outbound'
          from_number VARCHAR(50) NOT NULL,
          to_number VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          duration INTEGER,
          recording_url TEXT,
          call_purpose VARCHAR(50), -- 'sales', 'support', 'follow_up', 'demo'
          call_outcome VARCHAR(50), -- 'interested', 'not_interested', 'callback', 'voicemail'
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Secure file storage for encrypted file sharing
        CREATE TABLE IF NOT EXISTS secure_files (
          id VARCHAR(32) PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id),
          original_filename VARCHAR(255) NOT NULL,
          file_type VARCHAR(100),
          file_size INTEGER,
          salt VARCHAR(32) NOT NULL,
          iv VARCHAR(32) NOT NULL,
          auth_tag VARCHAR(32) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL
        );

        -- Access log for secure files
        CREATE TABLE IF NOT EXISTS secure_file_access (
          id SERIAL PRIMARY KEY,
          file_id VARCHAR(32) REFERENCES secure_files(id),
          accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          success BOOLEAN DEFAULT true
        );

        -- SIP devices table for mobile integration
        CREATE TABLE IF NOT EXISTS sip_devices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          device_id VARCHAR(255) NOT NULL,
          device_type VARCHAR(50) DEFAULT 'mobile',
          sip_username VARCHAR(255),
          sip_password VARCHAR(255),
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP,
          UNIQUE(user_id, device_id)
        );

        -- Yealink devices table
        CREATE TABLE IF NOT EXISTS yealink_devices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          mac_address VARCHAR(17) UNIQUE NOT NULL,
          model VARCHAR(100),
          firmware_version VARCHAR(100),
          display_name VARCHAR(255),
          sip_username VARCHAR(255),
          sip_password VARCHAR(255),
          extension VARCHAR(20),
          timezone VARCHAR(10) DEFAULT '+00',
          provisioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_provisioned TIMESTAMP,
          status VARCHAR(20) DEFAULT 'active'
        );

        -- Device presence table for BLF
        CREATE TABLE IF NOT EXISTS device_presence (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          extension VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'available',
          status_message TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, extension)
        );

        -- Enhanced messages table
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER REFERENCES contacts(id),
          twilio_sid VARCHAR(255) UNIQUE,
          direction VARCHAR(20) NOT NULL, -- 'inbound' or 'outbound'
          from_number VARCHAR(50) NOT NULL,
          to_number VARCHAR(50) NOT NULL,
          body TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

        -- Performance indexes
        -- Stripe customer management
        CREATE TABLE IF NOT EXISTS stripe_customers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Wallet/prepaid balance system
        CREATE TABLE IF NOT EXISTS wallets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          balance DECIMAL(10,2) DEFAULT 0.00,
          currency VARCHAR(3) DEFAULT 'USD',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transaction history for wallet
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
          stripe_payment_intent_id VARCHAR(255),
          type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'refund'
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          reference_type VARCHAR(50), -- 'call', 'sms', 'fax', 'email', 'top_up', 'monthly_deduction'
          reference_id INTEGER, -- ID of the call, message, etc.
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Monthly billing records
        CREATE TABLE IF NOT EXISTS monthly_billings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          billing_period DATE NOT NULL, -- First day of the month
          total_calls INTEGER DEFAULT 0,
          total_sms INTEGER DEFAULT 0,
          total_emails INTEGER DEFAULT 0,
          total_faxes INTEGER DEFAULT 0,
          total_amount DECIMAL(10,2) DEFAULT 0.00,
          status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
          processed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
        CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
        CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
        CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts(lead_status);
        CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON contact_tags(tag);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
        CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
        CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
        CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
        CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
        CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
        CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
        CREATE INDEX IF NOT EXISTS idx_monthly_billings_user_id ON monthly_billings(user_id);
        CREATE INDEX IF NOT EXISTS idx_monthly_billings_period ON monthly_billings(billing_period);
      `);
      
      console.log('PostgreSQL database initialized successfully with full CRM + payments schema');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  return pool;
}

export async function findOrCreateContact(phone: string, name?: string) {
  const db = await getDatabase();
  
  try {
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
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}