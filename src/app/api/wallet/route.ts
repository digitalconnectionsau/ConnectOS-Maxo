import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { stripe, createOrGetStripeCustomer, createOrGetWallet, dollarsToCents, formatCurrency } from '@/lib/stripe';

// GET - Get wallet balance and recent transactions
export async function GET(_request: NextRequest) {
  try {
    // TODO: Get user ID from authentication/session
    const userId = 1; // Hardcoded for now - replace with actual auth
    
    const db = await getDatabase();
    
    // Get or create wallet
    const wallet = await createOrGetWallet(userId);
    
    // Get recent transactions
    const transactions = await db.query(`
      SELECT wt.*, u.full_name as user_name
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1
      ORDER BY wt.created_at DESC
      LIMIT 50
    `, [userId]);
    
    return NextResponse.json({
      balance: wallet.balance,
      currency: wallet.currency,
      formatted_balance: formatCurrency(dollarsToCents(parseFloat(wallet.balance))),
      transactions: transactions.rows
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet information' },
      { status: 500 }
    );
  }
}

// POST - Add funds to wallet via Stripe
export async function POST(request: NextRequest) {
  try {
    const { amount, paymentMethodId } = await request.json();
    
    // TODO: Get user from authentication/session
    const userId = 1; // Hardcoded for now - replace with actual auth
    const userEmail = 'user@example.com'; // Replace with actual user email
    const userName = 'Test User'; // Replace with actual user name
    
    if (!amount || amount < 500) { // Minimum $5
      return NextResponse.json(
        { error: 'Minimum top-up amount is $5.00' },
        { status: 400 }
      );
    }
    
    if (amount > 50000) { // Maximum $500
      return NextResponse.json(
        { error: 'Maximum top-up amount is $500.00' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    
    // Get or create Stripe customer
    const customerId = await createOrGetStripeCustomer(userId, userEmail, userName);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: userId.toString(),
        type: 'wallet_topup',
      },
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Get or create wallet
      const wallet = await createOrGetWallet(userId);
      
      // Add funds to wallet
      const newBalance = parseFloat(wallet.balance) + (amount / 100);
      await db.query(
        'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newBalance, userId]
      );
      
      // Record transaction
      await db.query(`
        INSERT INTO wallet_transactions (wallet_id, stripe_payment_intent_id, type, amount, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        wallet.id,
        paymentIntent.id,
        'credit',
        amount / 100, // Store in dollars
        `Wallet top-up via Stripe - ${formatCurrency(amount)}`
      ]);
      
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
        newBalance: newBalance,
        formatted_balance: formatCurrency(dollarsToCents(newBalance))
      });
    } else {
      return NextResponse.json(
        { error: 'Payment failed', status: paymentIntent.status },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}