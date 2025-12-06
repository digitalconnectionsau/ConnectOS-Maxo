import Stripe from 'stripe';

// Initialize Stripe with your secret key
// Allow undefined during build time, will fail at runtime if actually used without key
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'usd',
  minimumTopUpAmount: 500, // $5.00 in cents
  maximumTopUpAmount: 50000, // $500.00 in cents
  defaultTopUpAmounts: [1000, 2500, 5000, 10000], // $10, $25, $50, $100
};

// Convert dollars to cents for Stripe
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Format currency for display
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(centsToDollars(cents));
}

// Create or retrieve Stripe customer
export async function createOrGetStripeCustomer(
  userId: number, 
  email: string, 
  name?: string
): Promise<string> {
  const db = await import('./database').then(m => m.getDatabase());
  
  // Check if customer already exists
  const existingCustomer = await db.query(
    'SELECT stripe_customer_id FROM stripe_customers WHERE user_id = $1',
    [userId]
  );
  
  if (existingCustomer.rows.length > 0) {
    return existingCustomer.rows[0].stripe_customer_id;
  }
  
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId: userId.toString(),
    },
  });
  
  // Store customer in database
  await db.query(
    'INSERT INTO stripe_customers (user_id, stripe_customer_id, email, name) VALUES ($1, $2, $3, $4)',
    [userId, customer.id, email, name]
  );
  
  return customer.id;
}

// Create wallet for user if it doesn't exist
export async function createOrGetWallet(userId: number) {
  const db = await import('./database').then(m => m.getDatabase());
  
  // Check if wallet exists
  const existingWallet = await db.query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  
  if (existingWallet.rows.length > 0) {
    return existingWallet.rows[0];
  }
  
  // Create new wallet
  const newWallet = await db.query(
    'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *',
    [userId, 0.00]
  );
  
  return newWallet.rows[0];
}