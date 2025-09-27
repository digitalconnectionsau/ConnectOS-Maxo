# Phone CRM System

A fun phone/CRM system built with Next.js and Twilio integration for making calls, sending SMS, and managing contacts.

## Why Railway + Twilio?

This combination provides several advantages:

🚀 **Easy Deployment**: Railway automatically builds and deploys from GitHub  
🔒 **Secure Environment**: Environment variables are encrypted and secure  
📊 **Persistent Storage**: SQLite database persists across deployments  
🌐 **Global CDN**: Fast response times for webhook handling  
📱 **Reliable Webhooks**: Railway's uptime ensures Twilio webhooks are always received  
💰 **Cost Effective**: Railway's pricing scales with usage  
🔄 **Auto Deployments**: Push to GitHub and Railway automatically redeploys

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

### Railway Deployment (Recommended for Production)

Railway is perfect for hosting this Twilio-powered Phone CRM system. Here's how to deploy:

#### 1. Prepare for Railway

The project is already configured for Railway with:
- `railway.toml` configuration file
- Health check endpoint at `/api/health`
- Production-ready environment setup
- Persistent SQLite database storage

#### 2. Deploy to Railway

1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)

2. **Connect GitHub**: Link your GitHub account to Railway

3. **Create New Project**: 
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `digitalconnectionsau/phone-system`

4. **Configure Environment Variables** in Railway dashboard:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   NEXTAUTH_SECRET=your-random-secret-key-here
   NODE_ENV=production
   ```

5. **Deploy**: Railway will automatically build and deploy your app

#### 3. Configure Twilio Webhooks

After deployment, update your Twilio phone number webhooks in the [Twilio Console](https://console.twilio.com/):

- **Voice webhook URL**: `https://your-railway-app.railway.app/api/webhooks/calls`
- **SMS webhook URL**: `https://your-railway-app.railway.app/api/webhooks/sms`

#### 4. Test Your Deployment

1. Visit your Railway app URL
2. Create a test contact
3. Send an SMS or make a call
4. Check the Railway logs to see webhook activity

### Local Development

For local development and testing:

## Troubleshooting

### Common Issues

**Twilio Webhooks Not Working:**
- Verify webhook URLs in Twilio Console match your Railway deployment URL
- Check Railway deployment logs for webhook request errors
- Ensure your Railway app is not sleeping (Railway Pro plans don't sleep)

**Database Issues:**
- Railway automatically handles SQLite file persistence
- Check logs for database connection errors
- Database is created automatically on first API request

**Environment Variables:**
- Double-check all Twilio credentials in Railway dashboard
- Ensure `NEXTAUTH_SECRET` is set to a random string
- Verify phone number format includes country code (e.g., +1234567890)

**Call/SMS Failures:**
- Verify Twilio account has sufficient credits
- Check phone number permissions in Twilio Console
- Test with verified numbers first if using trial account

### Monitoring

Railway provides built-in monitoring:
- **Deployment Logs**: View build and runtime logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic monitoring via `/api/health`

## License

MIT License - feel free to use this project for learning and experimentation!
