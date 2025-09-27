import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDatabase } from '@/lib/database';

// Email configuration based on provider
function createEmailTransporter() {
  const emailProvider = process.env.EMAIL_PROVIDER; // 'sendgrid', 'outlook', 'gmail', 'smtp'
  
  switch (emailProvider) {
    case 'sendgrid':
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
      
    case 'outlook':
    case 'exchange':
      return nodemailer.createTransporter({
        service: 'Outlook365',
        auth: {
          user: process.env.OUTLOOK_EMAIL,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });
      
    case 'gmail':
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD // App-specific password
        }
      });
      
    case 'smtp':
    default:
      // Generic SMTP (cPanel, private servers, etc.)
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST, // e.g., 'mail.yourdomain.com'
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER, // your email
          pass: process.env.SMTP_PASSWORD // your password
        },
        // For cPanel and self-hosted servers
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, contactId, templateType } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'To, subject, and message are required' },
        { status: 400 }
      );
    }

    // Create email transporter based on configuration
    const transporter = createEmailTransporter();

    // Get contact details for personalization
    let contactDetails = null;
    if (contactId) {
      const db = await getDatabase();
      const result = await db.query(
        'SELECT name, email, phone, company_id FROM contacts WHERE id = $1',
        [contactId]
      );
      contactDetails = result.rows[0];
    }

    // Email templates for different scenarios
    let htmlContent = '';
    let textContent = message;

    switch (templateType) {
      case 'appointment_reminder':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Reminder</h2>
            <p>Hi ${contactDetails?.name || 'there'},</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message}
            </div>
            <p>If you need to reschedule, please call us at ${process.env.COMPANY_PHONE || 'our office'}.</p>
            <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              ${process.env.COMPANY_NAME || 'Our Company'}<br>
              ${process.env.COMPANY_ADDRESS || ''}<br>
              ${process.env.COMPANY_PHONE || ''}
            </p>
          </div>
        `;
        break;
        
      case 'follow_up':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Thank You for Your Business</h2>
            <p>Hi ${contactDetails?.name || 'there'},</p>
            <p>${message}</p>
            <p>We value your business and look forward to serving you again.</p>
            <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              ${process.env.COMPANY_NAME || 'Our Company'}<br>
              Best regards,<br>
              The Team
            </p>
          </div>
        `;
        break;
        
      default:
        // Basic professional template
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              ${process.env.COMPANY_NAME || 'Our Company'}<br>
              ${process.env.COMPANY_EMAIL || ''}<br>
              ${process.env.COMPANY_PHONE || ''}
            </p>
          </div>
        `;
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
      // Add reply-to if different from sender
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);

    // Log email to database
    try {
      const db = await getDatabase();
      await db.query(`
        INSERT INTO messages (
          contact_id, direction, body, message_type, status, 
          external_id, to_number, from_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
        contactId || null,
        'outbound',
        `Subject: ${subject}\n\n${message}`,
        'email',
        'sent',
        result.messageId,
        to,
        process.env.EMAIL_FROM || 'system'
      ]);
    } catch (dbError) {
      console.error('Error logging email to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}