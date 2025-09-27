import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Yealink call history service
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mac = searchParams.get('mac');
  
  if (!mac) {
    return new NextResponse('MAC address required', { status: 400 });
  }

  try {
    const db = await getDatabase();
    
    // Get device and user info
    const device = await db.query(
      'SELECT user_id FROM yealink_devices WHERE mac_address = $1',
      [mac.toLowerCase()]
    );

    if (!device.rows[0]) {
      return new NextResponse('Device not found', { status: 404 });
    }

    const userId = device.rows[0].user_id;

    // Get recent calls for this user
    const calls = await db.query(`
      SELECT 
        from_number,
        to_number,
        direction,
        duration,
        created_at,
        status
      FROM calls 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    // Generate call history XML
    let callHistoryXml = `<?xml version="1.0" encoding="UTF-8"?>
<YealinkIPPhoneDirectory>
  <Title>Call History</Title>`;

    for (const call of calls.rows) {
      const displayNumber = call.direction === 'outbound' ? call.to_number : call.from_number;
      const displayName = call.direction === 'outbound' ? 'Outbound' : 'Inbound';
      const duration = call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : 'No answer';
      const date = new Date(call.created_at).toLocaleDateString();
      
      callHistoryXml += `
  <DirectoryEntry>
    <Name>${escapeXml(`${displayName} - ${date}`)}</Name>
    <Telephone>${escapeXml(displayNumber)}</Telephone>
    <Company>${escapeXml(`Duration: ${duration}`)}</Company>
  </DirectoryEntry>`;
    }

    callHistoryXml += `
  <SoftKey index="1">
    <Label>Call Back</Label>
    <URI>SoftKey:Dial</URI>
  </SoftKey>
</YealinkIPPhoneDirectory>`;

    return new NextResponse(callHistoryXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=60' // Cache for 1 minute
      }
    });

  } catch (error) {
    console.error('Call history service error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><YealinkIPPhoneDirectory><Title>Call History Error</Title></YealinkIPPhoneDirectory>',
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