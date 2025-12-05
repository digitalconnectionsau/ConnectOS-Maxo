import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDatabase } from '@/lib/database';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    const db = await getDatabase();

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any;
        
        if (paymentIntent.metadata?.type === 'wallet_topup') {
          const userId = parseInt(paymentIntent.metadata.userId);
          const amount = paymentIntent.amount / 100; // Convert cents to dollars
          
          // Get wallet
          const walletResult = await db.query(
            'SELECT * FROM wallets WHERE user_id = $1',
            [userId]
          );
          
          if (walletResult.rows.length > 0) {
            const wallet = walletResult.rows[0];
            const newBalance = parseFloat(wallet.balance) + amount;
            
            // Update wallet balance
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
              amount,
              `Wallet top-up via Stripe - $${amount.toFixed(2)}`
            ]);
            
            console.log(`Wallet topped up: User ${userId}, Amount $${amount}, New Balance $${newBalance}`);
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any;
        console.error('Payment failed:', failedPayment.id, failedPayment.last_payment_error?.message);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}