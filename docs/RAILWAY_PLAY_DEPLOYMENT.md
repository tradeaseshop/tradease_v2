# TradeEase Railway + Google Play deployment checklist

## Railway

Use Node 20.x. Railway can build with the repository's `npm run build` command and start with `npm start`.

Required production variables:

- `NODE_ENV=production`
- `DATABASE_PATH=/data/tradeease.db`
- `JWT_SECRET=<long random secret>`
- `ADMIN_INITIAL_PASSWORD=<strong initial admin password>`
- `PAYSTACK_PUBLIC_KEY=pk_live_...`
- `PAYSTACK_SECRET_KEY=sk_live_...`
- `PAYSTACK_WEBHOOK_SECRET=<Paystack webhook signing secret; normally the live secret key>`
- `GOOGLE_CLIENT_ID=<Google web client ID>` if Google Sign-In is enabled
- `GEMINI_API_KEY=<optional>` if Gemini features are enabled
- `RESEND_API_KEY=<optional/recommended>` if email verification/communications are enabled
- `RESEND_FROM_EMAIL=<verified sender>` if Resend is enabled
- `DELIVERI_API_URL=<production DELIVERI URL>` if DELIVERI integration is enabled
- `TRADEEASE_TO_DELIVERI_SECRET=<strong secret>`
- `DELIVERI_TO_TRADEEASE_SECRET=<strong secret>`

Keep these disabled in production unless deliberately operating a disposable test environment:

- `ALLOW_DEMO_SEED=false`
- `ALLOW_DEMO_WALLET=false`
- `DEMO_MARKETPLACE_SEED=false`

Do not commit `.env`, live Paystack keys, JWT secrets, DELIVERI secrets, Gemini keys, Resend keys, or Android signing keys.

## Paystack

Current Railway public origin:

`https://tradeasev2-production.up.railway.app`

Live callback:

`https://tradeasev2-production.up.railway.app/paystack/callback`

Live webhook:

`https://tradeasev2-production.up.railway.app/api/payments/webhook`

When `tradease.ng` is live and configured as the canonical public domain, use the corresponding `tradease.ng` URLs instead.

The production backend rejects a test-mode public key as a valid Paystack configuration when `NODE_ENV=production`.

## Account deletion

External deletion resource:

`https://tradeasev2-production.up.railway.app/account-deletion.html`

When the canonical domain is live:

`https://tradease.ng/account-deletion.html`

Play Console's Data safety/account-deletion form should use the public deletion resource that is actually live and accessible to reviewers.

## Google Play

- Privacy policy: `/legal/privacy-policy.html`
- Terms: `/legal/terms-of-use.html`
- External account deletion: `/account-deletion.html`
- Data Safety worksheet: `docs/GOOGLE_PLAY_READINESS.md`
- Android API 36 requirement must be satisfied by the separate Android wrapper/AAB. The current web repository does not contain the Android Gradle project.

## Test status of this source package

Static TypeScript syntax checks were run on the changed TypeScript/TSX files. Full dependency installation/build could not be completed in the isolated build environment, so the final Railway build must still be allowed to run `npm install` and `npm run build`.

Paystack cannot be genuinely end-to-end charged/verified from this source-only audit without access to the configured Paystack environment and credentials. The code path is server-side verified and webhook-protected; perform a real Paystack test transaction after Railway deployment.
