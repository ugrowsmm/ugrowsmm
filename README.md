# UGrowSMM

## Backend: Supabase (current)
The backend is Supabase (Postgres + Auth). The database is created by `supabase/schema.sql` (run it once in Supabase > SQL Editor). Accounts, wallet, orders, referral, withdrawals and tickets live there; the browser can only call the functions in that file, and each one checks who is signed in. Admin = a profile with `is_admin = true` (set it by SQL, see the bottom of schema.sql).
Keys: the Project URL and the publishable key are public and are in `src/lib/supabase.ts` (Vercel `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` override them). Never put a secret key in the frontend or GitHub.
If you change the Supabase project, also change the host in `connect-src` inside `vercel.json`.
`backend/Code.gs` (Google Apps Script) is the OLD backend and is no longer used. The sections below that mention Apps Script describe it.

Vite + React + TypeScript. Local: `npm install && npm run dev`. Build: `npm run build`.

## Deploy (GitHub -> Vercel)
Push this folder to GitHub, import the repo in Vercel (framework: Vite, build `npm run build`, output `dist`).
Add env vars in Vercel: `VITE_API_URL` (Apps Script web app URL) and `VITE_WEB3FORMS_KEY` (Web3Forms public access key).

## Backend (Google Apps Script)
Paste `backend/Code.gs` into a Sheets-bound Apps Script, deploy as Web app (execute as you, access anyone).
Script Properties: PROVIDER_API_URL, PROVIDER_API_KEY, ADMIN_TOKEN, PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX.
Fill the two TODOs in createPayment/checkPayment with your PhonePe Business API calls. Never commit real keys.

## Admin
Only the emails in `src/lib/admins.ts` (plus the demo login while VITE_API_URL is empty) see "Admin panel" in the profile menu. With the backend connected the panel also asks for ADMIN_TOKEN once per session; that token (not the email) is what protects admin actions, so add real login (OTP/password) before going live.

### Accounts (email + password + OTP)
Sign up needs a name, email, password (8+ characters) and an optional referral code (prefilled and locked when the user arrives through a referral link). A 6-digit code is emailed and login is blocked until it is entered. One email is one account: dots and +tags are ignored for Gmail, +tags for other providers. Forgot password also works with an emailed code. Sessions last 30 days; 8 wrong passwords lock that email for 15 minutes.
After updating `backend/Code.gs`: Deploy > Manage deployments > edit > New version. The first deploy asks you to authorize email sending (MailApp). Free Gmail sends about 100 emails a day, Google Workspace about 1,500. The `Auth` sheet holds password hashes, so never share the sheet.
`VITE_API_URL` in Vercel overrides the default URL in `src/lib/config.ts`.

### Wallet, orders, referral (server is the source of truth)
Balance, orders, transactions, referral earnings, withdrawals and the welcome bonus live in the Google Sheet (`Ledger`, `Orders`, `Withdrawals`, `Bonus`). The browser only shows them (refreshed every 30 seconds and when the tab opens), so editing localStorage changes nothing. Order prices are calculated on the server from the `Services` sheet.
One-time setup in the Apps Script editor (run these functions once): `syncServices` (fills the Services sheet from your provider, re-run whenever the provider changes prices) and `installTriggers` (checks provider order status every 10 minutes and refunds canceled or partial orders).
Top-ups are switched off until automatic payment confirmation is connected. Then set Script Property `PAYMENT_ENABLED` = `1`. Until then add funds from Admin > Users.

### Admin panel sections
- **Users**: add funds / referral funds, set referral %, delete user.
- **Orders**: filter by status ("Needs attention" = Pending/In progress older than 6 hours) and set the real status of a stuck order (Pending, In progress, Completed, Partial, Canceled). Canceling can refund the charge to the user's wallet once.
- **Payouts**: approve and mark paid, or reject (rejected amounts return to the user's referral funds).
- **Tickets**: read the ticket, reply by email, then mark Resolved. Users see their tickets with status and a 24-48 hours resolution time on the Support page.
Backend sheets added: `Tickets` = [id, email, type, orderId, subject, message, status, createdAt, resolvedAt]. Redeploy `backend/Code.gs` as a new Apps Script web app version after updating.

## Referral default
`REFERRAL_PERCENT_DEFAULT` in `src/lib/config.ts` (frontend) and `pct()` in `backend/Code.gs` (currently 10).

## Pricing
`MARKUP = 4` in `src/lib/data.ts` multiplies provider rates. Replace the demo provider rates with your real ones.

## Bot protection
- `vercel.json` blocks known bot/scraper user agents, sets security headers + CSP. `public/robots.txt` and meta tags disallow crawlers (including search engines; edit them if you want Google to index you).
- Login has a honeypot, a time trap and Cloudflare Turnstile (set `VITE_TURNSTILE_KEY` in Vercel and `TURNSTILE_SECRET` in Apps Script).
- Apps Script rate-limits per user and verifies Turnstile once per user per 6 hours.
- Also turn on Vercel Firewall > Bot Protection / Attack Challenge Mode in the dashboard.

## Services
`npm run sync:services` (with PROVIDER_API_URL and PROVIDER_API_KEY set) imports your provider's full catalog, groups it into Standard / Premium / Pro by price and applies the 5x markup.
