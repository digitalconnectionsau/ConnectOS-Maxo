# Phone CRM System V2

A Next.js VoIP/CRM platform with **Hybrid MaxoTel** architecture for cost-optimized voice and SMS services.

## 🎯 V2 Architecture (Cost-Saving Hybrid)

This version uses a **smart hybrid approach**:

- **Frontend**: Twilio WebRTC client (`@twilio/voice-sdk`) - unchanged
- **Voice Calls**: Bridged to MaxoTel SIP trunk via Twilio BYOC - **~70% cost savings**
- **SMS**: Direct MaxoTel REST API - **~60% cost savings**  
- **Call Logs**: MaxoTel CDR API instead of Twilio logs

**Result**: You keep the excellent Twilio developer experience while routing actual calls/SMS through MaxoTel's lower-cost infrastructure.

## 💰 Cost Comparison

| Service | Twilio Native | Hybrid MaxoTel | Savings |
|---------|---------------|----------------|---------|
| 1000 calls (10 min avg) | $400/mo | $125/mo | **69%** |
| 500 SMS messages | $40/mo | $12.50/mo | **69%** |
| **Total Monthly** | **$440** | **$137.50** | **$302.50** |

## Why Railway + MaxoTel?

🚀 **Easy Deployment**: Railway automatically builds and deploys from GitHub  
🔒 **Secure Environment**: Environment variables are encrypted and secure  
📊 **Persistent Storage**: PostgreSQL database for enterprise-grade data  
🌐 **Global CDN**: Fast response times for webhook handling  
💰 **Cost Optimized**: MaxoTel's competitive Australian rates  
🔄 **Auto Deployments**: Push to GitHub and Railway automatically redeploys
⚡ **Best of Both**: Twilio's WebRTC + MaxoTel's carrier pricing

## Features

- 📞 **Make outbound calls** using hybrid Twilio/MaxoTel routing
- 📱 **Send SMS messages** via MaxoTel REST API  
- 📋 **Full CRM** with contacts, companies, tasks, and notes
- 📊 **Call and message history** from MaxoTel CDR
- 🎯 **Webhook handlers** for incoming calls and SMS
- 🎨 **Modern responsive UI** built with Next.js and Tailwind CSS
- 💳 **Billing & Payments** with Stripe integration
- 🔐 **Secure file sharing** with encryption
- 📱 **Mobile app** support via Android SIP client

## Tech Stack

- **Frontend**: Next.js 15 with React and TypeScript
- **Styling**: Tailwind CSS with Lucide React icons
- **Backend**: Next.js API routes (Hybrid MaxoTel)
- **Database**: PostgreSQL (Railway hosted)
- **Voice**: Twilio WebRTC → MaxoTel SIP Bridge
- **SMS**: MaxoTel REST API
- **Payments**: Stripe
- **Environment**: Node.js

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Services

**Get MaxoTel Credentials:**
1. Log in to [MaxoTel Portal](https://portal.maxo.com.au)
2. Get your API key, Account ID, Virtual Mobile, and Office Number

**Configure Twilio BYOC:**
1. Create a [Twilio account](https://console.twilio.com)
2. Go to Elastic SIP Trunking → Create new trunk
3. Set Origination URI to `sip.maxo.com.au`
4. Copy the Trunk SID

**Environment Setup:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Twilio (for WebRTC client)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_BYOC_TRUNK_SID=TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MaxoTel (for calls & SMS)
MAXOTEL_API_KEY=your_maxotel_api_key
MAXOTEL_ACCOUNT_ID=your_account_id
MAXOTEL_VIRTUAL_MOBILE=0400123456
MAXOTEL_OFFICE_NUMBER=0299999999

# Database
DATABASE_URL=postgresql://localhost:5432/phone_crm
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 4. Test the Integration

**Health Check:**
```bash
curl http://localhost:3000/api/maxotel/health
```

Should return `"status": "ok"` if configured correctly.

## 📚 Documentation

- **[MAXOTEL_MIGRATION_GUIDE.md](./MAXOTEL_MIGRATION_GUIDE.md)** - Complete V2 architecture documentation
- **[RAILWAY_ENV_SETUP.md](./RAILWAY_ENV_SETUP.md)** - Quick environment setup guide
- **[V2_IMPLEMENTATION_SUMMARY.md](./V2_IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist

## API Endpoints

### V2 MaxoTel Endpoints
- `GET /api/maxotel/health` - Configuration health check
- `POST /api/twiml/call` - Generate TwiML for MaxoTel SIP bridge
- `POST /api/sms/send` - Send SMS via MaxoTel
- `GET /api/calls/history` - Fetch call logs from MaxoTel CDR

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
