import { NextRequest, NextResponse } from 'next/server';
import { stripe, createOrGetStripeCustomer } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();
    
    // TODO: Get user from authentication/session
    const userId = 1; // Hardcoded for now - replace with actual auth
    const userEmail = 'user@example.com'; // Replace with actual user email
    const userName = 'Test User'; // Replace with actual user name
    
    if (!amount || amount < 500 || amount > 50000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between $5.00 and $500.00' },
        { status: 400 }
      );
    }
    
    // Get or create Stripe customer
    const customerId = await createOrGetStripeCustomer(userId, userEmail, userName);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString(),
        type: 'wallet_topup',
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}