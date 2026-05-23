/**
 * Symmetric encryption for secrets stored at rest (OAuth tokens, API keys, etc.).
 *
 * Uses a single server-side key derived from APP_ENCRYPTION_KEY (env).
 * Different from src/lib/encryption.ts which encrypts shared files with a user PIN.
 *
 * Format: <ivHex>:<authTagHex>:<ciphertextHex>
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw || raw.length < 16) {
    throw new Error(
      'APP_ENCRYPTION_KEY is not set (or is too short). Set a long random string in your environment.'
    );
  }
  // Derive a stable 32-byte key from whatever the user supplied.
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const [ivHex, tagHex, ctHex] = payload.split(':');
  if (!ivHex || !tagHex || !ctHex) {
    throw new Error('Invalid encrypted payload format');
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(ctHex, 'hex')),
    decipher.final(),
  ]);
  return pt.toString('utf8');
}
