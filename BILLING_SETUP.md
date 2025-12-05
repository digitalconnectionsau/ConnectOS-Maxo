# Stripe Prepaid Billing System Setup

## Overview
This system provides a prepaid wallet using Stripe for secure payments, with automatic monthly billing for communication usage.

## Features
- **Stripe Integration**: Secure payment processing with PCI compliance
- **Prepaid Wallet**: Users top up their balance before using services
- **Automatic Billing**: Monthly deduction on the 1st of each month
- **Communication Tracking**: Tracks calls, SMS, emails, fax, and file transfers
- **Transaction History**: Complete audit trail of all transactions

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Billing System
BILLING_CRON_TOKEN=your_secure_random_token_here
```

## Pricing Configuration

Current pricing (configurable in `src/lib/billing.ts`):
- **Calls**: $0.10 connection fee + $0.05 per minute
- **SMS**: $0.02 per message
- **Email**: $0.01 per email
- **Fax**: $0.15 per page
- **File Transfer**: $0.05 per transfer

## Setting up Monthly Billing Cron Job

### Option 1: Server Cron Job (Recommended for Production)

Add this to your server's crontab to run on the 1st of each month at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line (replace YOUR_DOMAIN and TOKEN)
0 2 1 * * curl -X POST -H "Authorization: Bearer YOUR_BILLING_CRON_TOKEN" https://YOUR_DOMAIN/api/billing/monthly
```

### Option 2: External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** (paid)
- **AWS EventBridge** (if using AWS)

Configure them to make a POST request to:
```
URL: https://your-domain.com/api/billing/monthly
Method: POST
Headers: Authorization: Bearer YOUR_BILLING_CRON_TOKEN
Schedule: 0 2 1 * * (1st of month at 2 AM)
```

### Option 3: Vercel Cron Jobs

If using Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/billing/monthly",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

## Stripe Webhook Setup

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret to your environment variables

## Usage Integration

### Deducting from Wallet (Example)

When a user makes a call, SMS, etc., use the billing system:

```typescript
import { processCommunicationBilling } from '@/lib/billing';

// Example: Bill for a phone call
const billingResult = await processCommunicationBilling(userId, 'call', {
  duration: 5.5, // 5.5 minutes
  to: '+1-555-123-4567',
  referenceId: callRecord.id
});

if (!billingResult.success) {
  // Handle insufficient balance or other errors
  console.error('Billing failed:', billingResult.error);
  // Maybe notify user or prevent the call
}
```

## Database Tables

The system uses these tables:
- `stripe_customers` - Links users to Stripe customers
- `wallets` - User wallet balances
- `wallet_transactions` - All wallet transactions
- `monthly_billings` - Monthly billing records

## Testing

### Test Top-up Payment
1. Go to `/account` page
2. Click "Add Funds" 
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date and CVC

### Test Monthly Billing
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_BILLING_CRON_TOKEN" \
  http://localhost:3000/api/billing/monthly
```

### Check Billing Status
```bash
curl http://localhost:3000/api/billing/monthly
```

## Security Notes

- Never expose `STRIPE_SECRET_KEY` in client-side code
- Use strong, random `BILLING_CRON_TOKEN`
- Webhook endpoints verify Stripe signatures
- All payment processing happens on Stripe's secure servers
- Wallet transactions use database transactions for consistency

## Monitoring

Check these endpoints for system health:
- `GET /api/wallet` - Current user's wallet status
- `GET /api/billing/monthly` - Current month's billing status
- Monitor Stripe Dashboard for payment issues
- Check server logs for billing cron job execution