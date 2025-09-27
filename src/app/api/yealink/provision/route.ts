import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Yealink provisioning endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mac = searchParams.get('mac');
  
  if (!mac) {
    return new NextResponse('MAC address required', { status: 400 });
  }

  try {
    const db = await getDatabase();
    
    // Get device configuration
    const device = await db.query(
      'SELECT * FROM yealink_devices WHERE mac_address = $1',
      [mac.toLowerCase()]
    );

    if (!device.rows[0]) {
      return new NextResponse('Device not found', { status: 404 });
    }

    const config = device.rows[0];
    
    // Generate Yealink XML configuration
    const xmlConfig = `<?xml version="1.0" encoding="UTF-8"?>
<yealinkIPPhoneConfiguration>
  <!-- Account Configuration -->
  <account.1.enable>1</account.1.enable>
  <account.1.label>${config.display_name}</account.1.label>
  <account.1.display_name>${config.display_name}</account.1.display_name>
  <account.1.auth_name>${config.sip_username}</account.1.auth_name>
  <account.1.password>${config.sip_password}</account.1.password>
  <account.1.user_name>${config.sip_username}</account.1.user_name>
  <account.1.sip_server.1.address>${process.env.SIP_DOMAIN || 'sip.yourcompany.com'}</account.1.sip_server.1.address>
  <account.1.sip_server.1.port>5060</account.1.sip_server.1.port>
  
  <!-- Feature Configuration -->
  <features.call_waiting.enable>1</features.call_waiting.enable>
  <features.call_forward.enable>1</features.call_forward.enable>
  <features.intercom.enable>1</features.intercom.enable>
  
  <!-- Directory Service -->
  <directory_setting.server_name>Company Directory</directory_setting.server_name>
  <directory_setting.server_url>http://${process.env.NEXT_PUBLIC_APP_URL}/api/yealink/directory?mac=${mac}</directory_setting.server_url>
  
  <!-- Call History Integration -->
  <call_history.url>http://${process.env.NEXT_PUBLIC_APP_URL}/api/yealink/call-history?mac=${mac}</call_history.url>
  
  <!-- Time Configuration -->
  <local_time.ntp_server1>pool.ntp.org</local_time.ntp_server1>
  <local_time.time_zone>${config.timezone || '+00'}</local_time.time_zone>
  
  <!-- Audio Settings -->
  <codec.g711alaw.enable>1</codec.g711alaw.enable>
  <codec.g711ulaw.enable>1</codec.g711ulaw.enable>
  <codec.g729.enable>1</codec.g729.enable>
  
  <!-- BLF (Busy Lamp Field) Configuration -->
  ${generateBLFConfig(config.user_id)}
</yealinkIPPhoneConfiguration>`;

    return new NextResponse(xmlConfig, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Provisioning error:', error);
    return new NextResponse('Provisioning failed', { status: 500 });
  }
}

// Generate BLF configuration for monitoring other extensions
function generateBLFConfig(_userId: string) {
  // You can customize this based on your needs
  return `
  <programable_key.1.type>BLF</programable_key.1.type>
  <programable_key.1.line>1</programable_key.1.line>
  <programable_key.1.value>101</programable_key.1.value>
  <programable_key.1.label>Reception</programable_key.1.label>
  
  <programable_key.2.type>BLF</programable_key.2.type>
  <programable_key.2.line>1</programable_key.2.line>
  <programable_key.2.value>102</programable_key.2.value>
  <programable_key.2.label>Sales</programable_key.2.label>
  `;
}