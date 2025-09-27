import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Yealink directory service
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mac = searchParams.get('mac');
  
  if (!mac) {
    return new NextResponse('MAC address required', { status: 400 });
  }

  try {
    const db = await getDatabase();
    
    // Get all contacts for directory
    const contacts = await db.query(`
      SELECT 
        c.name,
        c.phone,
        c.email,
        comp.name as company_name
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
      ORDER BY c.name
    `);

    // Generate Yealink directory XML
    let directoryXml = `<?xml version="1.0" encoding="UTF-8"?>
<YealinkIPPhoneDirectory>
  <Title>Company Directory</Title>`;

    for (const contact of contacts.rows) {
      directoryXml += `
  <DirectoryEntry>
    <Name>${escapeXml(contact.name)}</Name>
    <Telephone>${escapeXml(contact.phone)}</Telephone>
    ${contact.company_name ? `<Company>${escapeXml(contact.company_name)}</Company>` : ''}
  </DirectoryEntry>`;
    }

    directoryXml += `
  <SoftKey index="1">
    <Label>Dial</Label>
    <URI>SoftKey:Dial</URI>
  </SoftKey>
  <SoftKey index="2">
    <Label>Edit</Label>
    <URI>SoftKey:Edit</URI>
  </SoftKey>
</YealinkIPPhoneDirectory>`;

    return new NextResponse(directoryXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Directory service error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><YealinkIPPhoneDirectory><Title>Directory Error</Title></YealinkIPPhoneDirectory>',
      { 
        status: 500,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }
}

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}