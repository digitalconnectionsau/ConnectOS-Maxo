import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// SIP registration endpoint for mobile SIP clients
export async function POST(request: NextRequest) {
  try {
    const { userId, deviceId, sipUsername, sipPassword } = await request.json();
    
    if (!userId || !deviceId) {
      return NextResponse.json(
        { error: 'User ID and device ID required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Register SIP device for user
    await db.query(`
      INSERT INTO sip_devices (user_id, device_id, sip_username, sip_password, registered_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, device_id) 
      DO UPDATE SET 
        sip_username = $3,
        sip_password = $4,
        registered_at = NOW()
    `, [userId, deviceId, sipUsername, sipPassword]);

    // Generate SIP configuration for mobile client
    const sipConfig = {
      domain: process.env.SIP_DOMAIN || 'sip.yourcompany.com',
      username: sipUsername,
      password: sipPassword,
      proxy: process.env.SIP_PROXY || 'sip.yourcompany.com:5060',
      transport: 'UDP'
    };

    return NextResponse.json({
      success: true,
      sipConfig
    });

  } catch (error) {
    console.error('SIP registration error:', error);
    return NextResponse.json(
      { error: 'SIP registration failed' },
      { status: 500 }
    );
  }
}