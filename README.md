# BOM — OTP Security Lab

A Vercel-ready OTP verification dashboard, inspired by the console styling of SpamScam but **not** an OTP bombing tool.

## What it does
- Responsive dark terminal-style dashboard, five reference-provider cards, and a live activity feed.
- Real OTP delivery and verification through **Twilio Verify**.
- No repeated sends, no third-party reverse-engineered providers, no mass targeting.
- Fail-closed server configuration: a strong admin key, explicit allowlist of authorized numbers, and Upstash Redis shared cooldown are all mandatory.
- Logs are displayed in the current browser session only; phone numbers are masked.

## Configure Vercel environment variables
Set these for Production (and Preview only if you want to test there):

| Name | Purpose |
| --- | --- |
| `BOM_ADMIN_KEY` | Random secret with 24+ characters, shared out of band with the authorized operator |
| `BOM_ALLOWED_NUMBERS` | Comma-separated E.164 test phone numbers, e.g. `+6281234567890,+6289876543210` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | Your Twilio Verify Service SID |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST bearer token |

Never commit values to GitHub. Without **all** settings, sending and checking real OTP is disabled.

## Getting started
1. Link the repository to a new Vercel project (framework preset: Other).
2. Add the environment variables in Vercel dashboard.
3. Redeploy the project after adding environment variables.
4. Open the website, enter your admin key and an allowlisted number, request a single SMS OTP, then enter the received code.

## Controls
- Per-number shared cooldown of **15 minutes** enforced in Upstash Redis, fail closed if Redis is unavailable.
- Phone number must match `BOM_ALLOWED_NUMBERS`.
- Every API call requires the admin key; the browser does not save the key.
- Verification code is checked by Twilio, not stored locally.
- Keep project deployments protected and use only phone numbers for which you have explicit authorization.

## Repository structure
- `index.html`: dashboard layout
- `styles.css`: responsive interface
- `app.js`: browser interactions
- `api/status.js`: read-only readiness indicator
- `api/send.js`: real authorized SMS OTP send
- `api/check.js`: real OTP verification
- `lib/security.js`: validation, authorization, rate limiting, Twilio integration

## Development and limitations
This project intentionally does not integrate the original AdaKami, Indosaku, KrediOne, RupiahCepat, or KreditNavigator OTP endpoints. Provider names are displayed solely for reference. Rate limits and account protections from Twilio and Upstash also apply. Activity counters are local to the open page and are not an authoritative server audit trail.

MIT-style usage is not implied: you retain copyright in your own implementation. The third-party SpamScam source code is **not copied**.
