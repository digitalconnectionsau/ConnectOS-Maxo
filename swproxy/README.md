# Synergy Wholesale SOAP Proxy

Tiny PHP forwarder so a Railway-hosted app can hit the Synergy Wholesale
SOAP API from your static-IP cPanel server (which you whitelist in SW).

## Deploy

1. Upload `index.php` to a fresh subdomain doc root on your Synergy
   cPanel hosting, e.g. `swproxy.yourdomain.com` → `/public_html/swproxy/`.
2. Edit `index.php` and replace the three constants:
   - `PROXY_SHARED_KEY` — generate with `openssl rand -hex 32`
   - `SW_API_ID`        — from SW > Your Account > API Information
   - `SW_API_KEY`       — same place
3. Make sure the subdomain has HTTPS (AutoSSL in cPanel).
4. Whitelist your cPanel server's IP in SW > API Information.

## Test from your laptop

```powershell
$key = "<PROXY_SHARED_KEY>"
Invoke-RestMethod -Method POST `
  -Uri "https://swproxy.yourdomain.com/" `
  -Headers @{ "X-Proxy-Key" = $key } `
  -ContentType "application/json" `
  -Body '{"method":"balanceQuery"}'
```

Expected: `{ "ok": true, "method": "balanceQuery", "data": { "status": "OK", "balance": ... } }`

## Railway env vars

Set in Railway dashboard for the Next.js service:

```
SYNERGY_PROXY_URL=https://swproxy.yourdomain.com/
SYNERGY_PROXY_KEY=<same PROXY_SHARED_KEY>
```

## Security notes

- API ID/Key live ONLY on the PHP proxy — never sent over the wire from Railway.
- Shared key auth is constant-time-compared. Optionally restrict by `Origin`.
- The PHP file allowlists which SOAP methods callers may invoke.
