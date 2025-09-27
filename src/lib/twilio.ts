import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not found. Please check your .env.local file.');
}

export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const TWILIO_PHONE_NUMBER = twilioPhoneNumber;

export async function sendSMS(to: string, body: string) {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio is not configured');
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export async function makeCall(to: string, twimlUrl: string) {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio is not configured');
  }

  try {
    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to,
      from: TWILIO_PHONE_NUMBER,
    });
    return call;
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
}