import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

export function generateFileKey(pin: string, salt: string): string {
  // Create a strong key from PIN using PBKDF2-like approach
  return createHash('sha256')
    .update(pin + salt + 'phone-crm-secret')
    .digest('hex');
}

export function encryptFile(buffer: Buffer, pin: string): {
  encryptedData: Buffer;
  salt: string;
  iv: string;
  authTag: string;
} {
  const salt = randomBytes(16).toString('hex');
  const iv = randomBytes(16);
  const key = Buffer.from(generateFileKey(pin, salt), 'hex');
  
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    salt,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptFile(
  encryptedData: Buffer,
  pin: string,
  salt: string,
  iv: string,
  authTag: string
): Buffer {
  const key = Buffer.from(generateFileKey(pin, salt), 'hex');
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(iv, 'hex'));
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
}

export function generateShareableLink(fileId: string): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://digital-connections-crm-production.up.railway.app'
    : 'http://localhost:3000';
  
  return `${baseUrl}/secure-file/${fileId}`;
}