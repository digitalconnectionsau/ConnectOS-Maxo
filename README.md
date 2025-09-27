# Phone CRM System

A fun phone/CRM system built with Next.js and Twilio integration for making calls, sending SMS, and managing contacts.

## Features

- 📞 **Make outbound calls** using Twilio Voice API
- 📱 **Send SMS messages** using Twilio Messaging API  
- 📋 **Contact management** with SQLite database storage
- 📊 **Call and message history** tracking
- 🎯 **Webhook handlers** for incoming calls and SMS
- 🎨 **Modern responsive UI** built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with React and TypeScript
- **Styling**: Tailwind CSS with Lucide React icons
- **Backend**: Next.js API routes
- **Database**: SQLite with sqlite3
- **Phone/SMS**: Twilio APIs
- **Environment**: Node.js

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Twilio

1. Create a [Twilio account](https://console.twilio.com) if you haven't already
2. Get a Twilio phone number from the console
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Fill in your Twilio credentials in `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 4. Configure Webhooks (Optional)

For incoming calls and SMS, you'll need to expose your local development server to the internet. You can use tools like:

- [ngrok](https://ngrok.com/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [localtunnel](https://localtunnel.github.io/www/)

Example with ngrok:

```bash
# Install ngrok and run
ngrok http 3000
```

Then configure your Twilio phone number webhooks:
- **Voice webhook URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/calls`
- **SMS webhook URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/sms`

## API Endpoints

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create a new contact

### Calls
- `GET /api/calls` - List call history
- `POST /api/calls/make` - Make an outbound call

### Messages
- `GET /api/messages` - List message history  
- `POST /api/sms/send` - Send an SMS

### Webhooks
- `POST /api/webhooks/calls` - Handle incoming calls
- `POST /api/webhooks/sms` - Handle incoming SMS

### TwiML
- `GET/POST /api/twiml/call` - TwiML for call handling

## Database Schema

The app uses SQLite with the following tables:

- **contacts** - Store contact information
- **calls** - Track call history and status
- **messages** - Store SMS message history

## Usage

1. **Add Contacts**: Click "New Contact" to add people to your CRM
2. **Send SMS**: Click "Send SMS" to send text messages
3. **Make Calls**: Click "Make Call" to initiate phone calls
4. **View History**: Browse calls and messages in their respective tabs

## Development

The project structure:

```
src/
├── app/
│   ├── api/           # API routes
│   ├── page.tsx       # Main UI component
│   └── layout.tsx     # App layout
├── lib/
│   ├── database.ts    # Database utilities
│   └── twilio.ts      # Twilio client configuration
```

## Deployment

For production deployment:

1. Update webhook URLs in your Twilio console
2. Set up a production database (PostgreSQL recommended)
3. Deploy to platforms like Vercel, Railway, or Heroku
4. Ensure environment variables are configured

## License

MIT License - feel free to use this project for learning and experimentation!
