import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// API endpoint for processing monthly billing
// This should be called by a cron job on the 1st of each month
export async function POST(request: NextRequest) {
  try {
    // Verify this is called by an authorized source (cron job, admin, etc.)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.BILLING_CRON_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const currentDate = new Date();
    const billingPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    console.log(`Starting monthly billing for period: ${billingPeriod.toISOString().split('T')[0]}`);

    // Get all users with wallets
    const users = await db.query(`
      SELECT u.id as user_id, u.full_name, u.email, w.id as wallet_id, w.balance
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE w.balance > 0
    `);

    let processedCount = 0;
    let totalBilled = 0;

    for (const user of users.rows) {
      try {
        // Calculate usage for the previous month
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

        // Count communications for the previous month
        const [callsResult, messagesResult, emailsResult, faxesResult] = await Promise.all([
          // Calls
          db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(CASE WHEN duration > 0 THEN CEIL(duration::numeric / 60) * 0.05 ELSE 0.10 END), 0) as cost
            FROM calls 
            WHERE created_at >= $1 AND created_at < $2
          `, [previousMonth, billingPeriod]),
          
          // SMS Messages  
          db.query(`
            SELECT COUNT(*) as count, COUNT(*) * 0.02 as cost
            FROM messages 
            WHERE created_at >= $1 AND created_at < $2
          `, [previousMonth, billingPeriod]),
          
          // Emails (if you have an emails table)
          db.query(`
            SELECT 0 as count, 0 as cost
          `),
          
          // Faxes (if you have a faxes table)
          db.query(`
            SELECT 0 as count, 0 as cost
          `)
        ]);

        const callsCount = parseInt(callsResult.rows[0].count);
        const callsCost = parseFloat(callsResult.rows[0].cost);
        const smsCount = parseInt(messagesResult.rows[0].count);
        const smsCost = parseFloat(messagesResult.rows[0].cost);
        const emailsCount = parseInt(emailsResult.rows[0].count);
        const emailsCost = parseFloat(emailsResult.rows[0].cost);
        const faxesCount = parseInt(faxesResult.rows[0].count);
        const faxesCost = parseFloat(faxesResult.rows[0].cost);

        const totalAmount = callsCost + smsCost + emailsCost + faxesCost;

        if (totalAmount > 0) {
          // Check if user has sufficient balance
          if (user.balance >= totalAmount) {
            // Deduct from wallet
            const newBalance = parseFloat(user.balance) - totalAmount;
            await db.query(
              'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [newBalance, user.wallet_id]
            );

            // Record transaction
            await db.query(`
              INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_type)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              user.wallet_id,
              'debit',
              totalAmount,
              `Monthly billing for ${billingPeriod.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${callsCount} calls, ${smsCount} SMS`,
              'monthly_deduction'
            ]);

            // Record billing record
            await db.query(`
              INSERT INTO monthly_billings (user_id, billing_period, total_calls, total_sms, total_emails, total_faxes, total_amount, status, processed_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            `, [
              user.user_id,
              billingPeriod,
              callsCount,
              smsCount,
              emailsCount,
              faxesCount,
              totalAmount,
              'processed'
            ]);

            processedCount++;
            totalBilled += totalAmount;

            console.log(`Billed user ${user.user_id}: $${totalAmount.toFixed(2)} (${callsCount} calls, ${smsCount} SMS)`);
          } else {
            // Insufficient balance - record as failed
            await db.query(`
              INSERT INTO monthly_billings (user_id, billing_period, total_calls, total_sms, total_emails, total_faxes, total_amount, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              user.user_id,
              billingPeriod,
              callsCount,
              smsCount,
              emailsCount,
              faxesCount,
              totalAmount,
              'failed'
            ]);

            console.log(`Insufficient balance for user ${user.user_id}: Required $${totalAmount.toFixed(2)}, Available $${user.balance}`);
          }
        } else {
          // No usage - record as processed with $0
          await db.query(`
            INSERT INTO monthly_billings (user_id, billing_period, total_calls, total_sms, total_emails, total_faxes, total_amount, status, processed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [
            user.user_id,
            billingPeriod,
            callsCount,
            smsCount,
            emailsCount,
            faxesCount,
            0,
            'processed'
          ]);

          processedCount++;
          console.log(`No usage for user ${user.user_id}`);
        }
      } catch (userError) {
        console.error(`Error processing billing for user ${user.user_id}:`, userError);
        
        // Record as failed
        await db.query(`
          INSERT INTO monthly_billings (user_id, billing_period, total_amount, status)
          VALUES ($1, $2, $3, $4)
        `, [user.user_id, billingPeriod, 0, 'failed']);
      }
    }

    console.log(`Monthly billing completed: ${processedCount} users processed, $${totalBilled.toFixed(2)} total billed`);

    return NextResponse.json({
      success: true,
      billingPeriod: billingPeriod.toISOString().split('T')[0],
      usersProcessed: processedCount,
      totalBilled: totalBilled.toFixed(2)
    });
  } catch (error) {
    console.error('Monthly billing error:', error);
    return NextResponse.json(
      { error: 'Monthly billing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check billing status
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const billingStatus = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM monthly_billings 
      WHERE billing_period = $1
      GROUP BY status
    `, [currentMonth]);

    return NextResponse.json({
      billingPeriod: currentMonth.toISOString().split('T')[0],
      status: billingStatus.rows
    });
  } catch (error) {
    console.error('Error checking billing status:', error);
    return NextResponse.json(
      { error: 'Failed to check billing status' },
      { status: 500 }
    );
  }
}