# Railway Environment Variables - Quick Setup

Copy these variables into your Railway project dashboard.

## Required MaxoTel Variables

```bash
# Get from MaxoTel Portal (https://portal.maxo.com.au)
MAXOTEL_API_KEY=paste_your_api_key_here
MAXOTEL_ACCOUNT_ID=paste_your_account_id_here
MAXOTEL_VIRTUAL_MOBILE=0400123456
MAXOTEL_OFFICE_NUMBER=0299999999
```

## Required Twilio Variables (Keep Existing)

```bash
# Already configured - keep these
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_existing_auth_token
TWILIO_PHONE_NUMBER=+61XXXXXXXXX
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_existing_api_secret
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## New Twilio BYOC Variable

```bash
# Create BYOC Trunk in Twilio Console first
TWILIO_BYOC_TRUNK_SID=TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Optional MaxoTel SIP Variables

```bash
# Only needed for direct SIP integration (future feature)
MAXOTEL_SIP_USER=your_sip_username
MAXOTEL_SIP_PASS=your_sip_password
MAXOTEL_SIP_DOMAIN=sip.maxo.com.au
```

---

## How to Get These Values

### MaxoTel API Key
1. Login to https://portal.maxo.com.au
2. Go to **Settings** → **API Access**
3. Copy the **API Key**

### MaxoTel Account ID
1. Contact MaxoTel support or check your portal
2. Look for **SIP Account ID** or **Trunk ID**

### MaxoTel Virtual Mobile
1. In MaxoTel portal, go to **Virtual Numbers**
2. Select a mobile number for SMS origin
3. Format: `0400123456` (no spaces or +61)

### MaxoTel Office Number
1. Your main MaxoTel phone number
2. Used for outbound caller ID
3. Format: `0299999999` (no spaces)

### Twilio BYOC Trunk SID
1. Login to https://console.twilio.com
2. Go to **Elastic SIP Trunking** → **Trunks**
3. Click **Create new SIP Trunk**
4. Name it **"MaxoTel Bridge"**
5. Under **Origination**, add: `sip.maxo.com.au`
6. Copy the **Trunk SID** (starts with `TK`)

---

## Quick Deployment Checklist

- [ ] MaxoTel account active with API access
- [ ] Twilio BYOC trunk created and pointing to `sip.maxo.com.au`
- [ ] All environment variables added to Railway
- [ ] Code deployed to Railway
- [ ] Test outbound call (check logs for "MaxoTel Bridge")
- [ ] Test SMS send (check logs for "MaxoTel SMS Response")
- [ ] Test call history fetch (check for MaxoTel CDR data)

---

## Verification Commands

After deployment, check Railway logs for these success messages:

### Call Success
```
Outgoing call request (MaxoTel Bridge): { ... }
```

### SMS Success
```
Sending SMS via MaxoTel: { to: '0400...', from: '0400...' }
MaxoTel SMS Response: SMS Sent Successfully!
```

### Call History Success
```
Fetching call history from MaxoTel...
```

If you see errors, verify the corresponding environment variable is set correctly.
