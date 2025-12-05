import { getDatabase } from './database';

// Pricing configuration
export const COMMUNICATION_PRICING = {
  call: {
    connection: 0.10, // $0.10 per call connection
    perMinute: 0.05,  // $0.05 per minute
  },
  sms: 0.02,         // $0.02 per SMS
  email: 0.01,       // $0.01 per email
  fax: 0.15,         // $0.15 per fax page
  fileTransfer: 0.05 // $0.05 per file transfer
};

export interface WalletDeductionResult {
  success: boolean;
  newBalance?: number;
  error?: string;
  transactionId?: number;
}

/**
 * Deduct amount from user's wallet for communications
 */
export async function deductFromWallet(
  userId: number, 
  amount: number, 
  description: string,
  referenceType: 'call' | 'sms' | 'email' | 'fax' | 'file_transfer',
  referenceId?: number
): Promise<WalletDeductionResult> {
  const db = await getDatabase();
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Get user's wallet
    const walletResult = await db.query(
      'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    
    if (walletResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return { success: false, error: 'Wallet not found' };
    }
    
    const wallet = walletResult.rows[0];
    const currentBalance = parseFloat(wallet.balance);
    
    // Check if sufficient balance
    if (currentBalance < amount) {
      await db.query('ROLLBACK');
      return { 
        success: false, 
        error: `Insufficient balance. Required: $${amount.toFixed(2)}, Available: $${currentBalance.toFixed(2)}` 
      };
    }
    
    // Deduct amount
    const newBalance = currentBalance - amount;
    await db.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, wallet.id]
    );
    
    // Record transaction
    const transactionResult = await db.query(`
      INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [wallet.id, 'debit', amount, description, referenceType, referenceId]);
    
    const transactionId = transactionResult.rows[0].id;
    
    // Commit transaction
    await db.query('COMMIT');
    
    return {
      success: true,
      newBalance,
      transactionId
    };
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Wallet deduction error:', error);
    return { success: false, error: 'Transaction failed' };
  }
}

/**
 * Calculate cost for a phone call
 */
export function calculateCallCost(durationMinutes: number): number {
  const connectionFee = COMMUNICATION_PRICING.call.connection;
  const minuteCost = Math.ceil(durationMinutes) * COMMUNICATION_PRICING.call.perMinute;
  return connectionFee + minuteCost;
}

/**
 * Get user's wallet balance
 */
export async function getWalletBalance(userId: number): Promise<number | null> {
  const db = await getDatabase();
  
  try {
    const result = await db.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return parseFloat(result.rows[0].balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
}

/**
 * Check if user has sufficient balance for an operation
 */
export async function hasSufficientBalance(userId: number, requiredAmount: number): Promise<boolean> {
  const balance = await getWalletBalance(userId);
  if (balance === null) return false;
  return balance >= requiredAmount;
}

/**
 * Process communication billing (called when making calls, sending SMS, etc.)
 */
export async function processCommunicationBilling(
  userId: number,
  type: 'call' | 'sms' | 'email' | 'fax' | 'file_transfer',
  details: {
    duration?: number; // for calls, in minutes
    pages?: number;    // for fax
    to?: string;       // recipient
    [key: string]: any;
  }
): Promise<WalletDeductionResult> {
  let amount: number;
  let description: string;
  
  switch (type) {
    case 'call':
      amount = calculateCallCost(details.duration || 0);
      description = `Phone call to ${details.to || 'unknown'} - ${details.duration || 0} minutes`;
      break;
      
    case 'sms':
      amount = COMMUNICATION_PRICING.sms;
      description = `SMS to ${details.to || 'unknown'}`;
      break;
      
    case 'email':
      amount = COMMUNICATION_PRICING.email;
      description = `Email to ${details.to || 'unknown'}`;
      break;
      
    case 'fax':
      amount = COMMUNICATION_PRICING.fax * (details.pages || 1);
      description = `Fax to ${details.to || 'unknown'} - ${details.pages || 1} page(s)`;
      break;
      
    case 'file_transfer':
      amount = COMMUNICATION_PRICING.fileTransfer;
      description = `File transfer to ${details.to || 'unknown'}`;
      break;
      
    default:
      return { success: false, error: 'Invalid communication type' };
  }
  
  return await deductFromWallet(userId, amount, description, type, details.referenceId);
}