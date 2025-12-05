# 🚀 V2 Deployment Checklist

Use this checklist to ensure your MaxoTel V2 migration is successful.

---

## Pre-Deployment

### MaxoTel Account Setup
- [ ] MaxoTel account is active and paid
- [ ] API access is enabled in MaxoTel portal
- [ ] Virtual mobile number is provisioned for SMS
- [ ] SIP trunk is active and configured
- [ ] CDR (Call Detail Records) access is enabled

### Twilio BYOC Setup
- [ ] Twilio account has BYOC (Bring Your Own Carrier) enabled
- [ ] Created new SIP trunk in Twilio Console
- [ ] Named trunk "MaxoTel Bridge" or similar
- [ ] Added Origination URI: `sip.maxo.com.au`
- [ ] Copied Trunk SID (starts with `TK`)
- [ ] Trunk is marked as "Active"

### Credentials Collected
- [ ] `MAXOTEL_API_KEY` from MaxoTel portal
- [ ] `MAXOTEL_ACCOUNT_ID` from MaxoTel portal
- [ ] `MAXOTEL_VIRTUAL_MOBILE` (format: 0400123456)
- [ ] `MAXOTEL_OFFICE_NUMBER` (format: 0299999999)
- [ ] `TWILIO_BYOC_TRUNK_SID` from Twilio Console

---

## Railway Deployment

### Environment Variables
- [ ] Opened Railway project dashboard
- [ ] Navigated to Variables tab
- [ ] Added `MAXOTEL_API_KEY`
- [ ] Added `MAXOTEL_ACCOUNT_ID`
- [ ] Added `MAXOTEL_VIRTUAL_MOBILE`
- [ ] Added `MAXOTEL_OFFICE_NUMBER`
- [ ] Added `TWILIO_BYOC_TRUNK_SID`
- [ ] Verified existing Twilio variables still present
- [ ] Clicked "Deploy" to apply changes

### Code Deployment
- [ ] Committed all changes to Git
- [ ] Pushed to main branch
- [ ] Railway detected changes and started build
- [ ] Build completed successfully (green checkmark)
- [ ] Deployment is live

---

## Post-Deployment Testing

### Health Check
- [ ] Visited `/api/maxotel/health`
- [ ] Response shows `"status": "ok"`
- [ ] Response shows `"configured": true`
- [ ] All features show `true`:
  - [ ] `sms: true`
  - [ ] `calls: true`
  - [ ] `sip_bridging: true`
  - [ ] `call_history: true`

### SMS Test
- [ ] Sent test SMS via your app interface
- [ ] Checked Railway logs for "Sending SMS via MaxoTel"
- [ ] Checked Railway logs for "SMS Sent Successfully!"
- [ ] Received SMS on test phone
- [ ] SMS appears in app's message history

### Voice Call Test
- [ ] Made test call via your app interface
- [ ] Checked Railway logs for "MaxoTel Bridge"
- [ ] Call connected successfully
- [ ] Audio quality is acceptable
- [ ] Call duration recorded correctly
- [ ] Call appears in database

### Call History Test
- [ ] Visited call history page in your app
- [ ] Call history displays recent calls
- [ ] Checked Railway logs for "Fetching call history from MaxoTel"
- [ ] CDR data includes:
  - [ ] Origin number
  - [ ] Destination number
  - [ ] Duration
  - [ ] Status/disposition
  - [ ] Timestamp

---

## Monitoring Setup

### Logging
- [ ] Railway logs are accessible
- [ ] Set up log alerts for errors (optional)
- [ ] Created bookmark for Railway logs page
- [ ] Documented common log patterns

### Health Monitoring
- [ ] Added `/api/maxotel/health` to monitoring
- [ ] Set up uptime monitoring (optional - UptimeRobot, etc.)
- [ ] Created internal status dashboard (optional)

### Cost Tracking
- [ ] Documented baseline costs before migration
- [ ] Set up MaxoTel cost alerts in portal
- [ ] Set up Twilio cost alerts in console
- [ ] Created spreadsheet for monthly comparison

---

## Documentation

### Team Knowledge
- [ ] Team has access to `MAXOTEL_MIGRATION_GUIDE.md`
- [ ] Team has access to `RAILWAY_ENV_SETUP.md`
- [ ] Team has access to `V2_IMPLEMENTATION_SUMMARY.md`
- [ ] Team knows where MaxoTel portal is
- [ ] Team knows where to check Railway logs

### Credentials Storage
- [ ] MaxoTel credentials stored in password manager
- [ ] Railway project invite sent to team members
- [ ] Backup of all environment variables stored securely
- [ ] Emergency contact info for MaxoTel support documented

---

## Rollback Plan (Just in Case)

### Emergency Rollback Steps
If something goes wrong, you can quickly rollback:

1. **Revert Call Routing**
   ```typescript
   // In src/app/api/twiml/call/route.ts
   // Change <Sip> back to <Number>
   <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}">
     <Number>${phoneNumber}</Number>
   </Dial>
   ```

2. **Revert SMS**
   ```typescript
   // In src/app/api/sms/send/route.ts
   // Uncomment old Twilio code
   const twilioMessage = await sendSMS(to, message);
   ```

3. **Deploy Rollback**
   - [ ] Commit rollback changes
   - [ ] Push to Git
   - [ ] Railway auto-deploys
   - [ ] Verify services restored

### Rollback Checklist
- [ ] Documented what went wrong
- [ ] Captured error logs
- [ ] Notified MaxoTel support
- [ ] Frontend still works during rollback
- [ ] No data loss occurred

---

## Success Criteria

Your migration is successful when:

- ✅ Health check returns `"status": "ok"`
- ✅ Test SMS sends successfully
- ✅ Test call connects via MaxoTel SIP
- ✅ Call history fetches from MaxoTel CDR
- ✅ No errors in Railway logs (for 24 hours)
- ✅ Cost per call/SMS reduced significantly
- ✅ User experience unchanged (frontend identical)

---

## Week 1 Monitoring

For the first week after deployment:

### Daily Checks
- [ ] Day 1: Check health endpoint
- [ ] Day 1: Review all Railway logs
- [ ] Day 1: Test SMS and calls
- [ ] Day 2: Review logs for errors
- [ ] Day 3: Compare costs (Twilio vs MaxoTel)
- [ ] Day 4: Test edge cases (international, etc.)
- [ ] Day 5: Review call quality feedback
- [ ] Day 7: Generate weekly cost report

### Weekly Report Template
```
Week 1 MaxoTel V2 Report
------------------------
Total Calls: [X]
Total SMS: [X]
Errors: [X]
Cost Savings: $[X]
Issues Encountered: [List]
User Feedback: [Summary]
Action Items: [List]
```

---

## Optimization Opportunities (Month 2+)

After stable operation:

- [ ] Implement incoming call webhooks from MaxoTel
- [ ] Set up inbound SMS webhooks
- [ ] Add failover logic (MaxoTel → Twilio backup)
- [ ] Optimize CDR polling frequency
- [ ] Build cost analytics dashboard
- [ ] Consider direct SIP integration (bypass Twilio entirely)
- [ ] Implement call recording via MaxoTel
- [ ] Add custom caller ID per campaign

---

## Support Contacts

### MaxoTel
- **Portal**: https://portal.maxo.com.au
- **API Docs**: https://myapi.maxo.com.au/docs
- **Support Email**: support@maxo.com.au
- **Phone**: [Your account manager's number]

### Twilio (BYOC)
- **Console**: https://console.twilio.com
- **Support**: https://www.twilio.com/help/contact
- **BYOC Docs**: https://www.twilio.com/docs/sip-trunking

### Railway
- **Dashboard**: https://railway.app
- **Logs**: [Your project logs URL]
- **Support**: https://railway.app/help

---

## Final Sign-Off

- [ ] Project lead has reviewed all changes
- [ ] Team is trained on new architecture
- [ ] All tests passed
- [ ] Monitoring is active
- [ ] Documentation is complete
- [ ] Rollback plan is ready
- [ ] **READY FOR PRODUCTION** ✅

---

**Date Completed**: _____________

**Deployed By**: _____________

**Verified By**: _____________

**Notes**: 
_____________________________________________
_____________________________________________
_____________________________________________
