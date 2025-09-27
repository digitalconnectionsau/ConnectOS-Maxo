import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { encryptFile, generateShareableLink } from '@/lib/encryption';
import { getDatabase } from '@/lib/database';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pin = formData.get('pin') as string;
    const contactId = formData.get('contactId') as string;
    const description = formData.get('description') as string;

    if (!file || !pin) {
      return NextResponse.json({ error: 'File and PIN are required' }, { status: 400 });
    }

    if (pin.length < 4) {
      return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Encrypt the file
    const { encryptedData, salt, iv, authTag } = encryptFile(fileBuffer, pin);

    // Generate unique file ID
    const fileId = randomBytes(16).toString('hex');
    
    // Storage directory
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/app/storage/secure-files'
      : join(process.cwd(), 'secure-files');

    await mkdir(uploadDir, { recursive: true });

    // Save encrypted file
    const encryptedFilePath = join(uploadDir, `${fileId}.enc`);
    await writeFile(encryptedFilePath, encryptedData);

    // Store file metadata in database
    const db = await getDatabase();
    await db.query(`
      INSERT INTO secure_files (
        id, contact_id, original_filename, file_type, file_size,
        salt, iv, auth_tag, description, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      fileId,
      contactId || null,
      file.name,
      file.type,
      file.size,
      salt,
      iv,
      authTag,
      description || '',
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    ]);

    // Generate shareable link
    const shareLink = generateShareableLink(fileId);

    return NextResponse.json({
      success: true,
      fileId,
      shareLink,
      message: 'File encrypted and uploaded successfully. Share the link and PIN separately for security.'
    });

  } catch (error) {
    console.error('Secure upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}