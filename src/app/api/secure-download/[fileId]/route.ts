import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { decryptFile } from '@/lib/encryption';
import { getDatabase } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { pin } = await request.json();
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;

    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    // Get file metadata from database
    const db = await getDatabase();
    const result = await db.query(
      'SELECT * FROM secure_files WHERE id = $1 AND expires_at > NOW()',
      [fileId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'File not found or expired' }, { status: 404 });
    }

    const fileMetadata = result.rows[0];
    
    // Read encrypted file
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/data/secure-files'
      : join(process.cwd(), 'secure-files');
    
    const encryptedFilePath = join(uploadDir, `${fileId}.enc`);
    const encryptedData = await readFile(encryptedFilePath);

    // Attempt to decrypt
    try {
      const decryptedData = decryptFile(
        encryptedData,
        pin,
        fileMetadata.salt,
        fileMetadata.iv,
        fileMetadata.auth_tag
      );

      // Log access
      await db.query(
        'INSERT INTO secure_file_access (file_id, accessed_at, ip_address) VALUES ($1, $2, $3)',
        [
          fileId,
          new Date(),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        ]
      );

      // Return decrypted file
      return new NextResponse(new Uint8Array(decryptedData), {
        status: 200,
        headers: {
          'Content-Type': fileMetadata.file_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileMetadata.original_filename}"`,
          'Content-Length': decryptedData.length.toString(),
        },
      });

    } catch {
      // Log failed attempt
      await db.query(
        'INSERT INTO secure_file_access (file_id, accessed_at, ip_address, success) VALUES ($1, $2, $3, $4)',
        [
          fileId,
          new Date(),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          false
        ]
      );

      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

  } catch (error) {
    console.error('Secure download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}