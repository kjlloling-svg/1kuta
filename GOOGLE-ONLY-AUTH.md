# Google-only authentication: setup and verification

Access-policy update: [PUBLIC-BROWSING.md](PUBLIC-BROWSING.md) supersedes the blanket login gates described below. Public pages and metadata are now open; abstracts/citations require login, while full papers/PDFs and editing remain administrator-only. Google setup and private administrator instructions below still apply.

KUTA uses Next.js on Vercel, not a Vite production build. The existing Vercel configuration remains unchanged. No new service or Gmail permission is needed.

## What changed

- Login offers Sign in with Google and Create account. Create account asks for an email, then uses Google's real sign-in button with that email suggested. The server requires the verified Google email to match.
- Standard sign-in creates an ordinary reader account if the Google identity is new. Google's unique sub identifies the account; existing Google-linked IDs are preserved. All new accounts are public readers, never administrators.
- Every page except login/register and static assets requires a valid server session. Private APIs return 401 without it. Administrator operations still require the admin role, checked from the database.
- Password login, password signup, password reset, Gmail code delivery, ChatGPT authentication and browser-based administrator setup were removed. Google sign-in itself proves ownership of the Google identity; there is no KUTA email OTP step.
- Existing research, PDFs, user records and their relationships are preserved. Historical password fields remain inert for database compatibility. An old account is NEVER automatically linked or promoted just because its email matches.
- A new cookie and session hash namespace reject all previous sessions. Sign in again after deployment. New sessions last at most one hour, bounded by the Google token expiry; each request checks the stored expiry and current user/role.
- A small google_auth_challenges table is created automatically in the existing database. Challenges expire after ten minutes and are consumed atomically once. Email/IP limits use the existing login_attempts table. No manual database migration or upload is required.
- Create attempts are limited to five per email per hour. Both flows also have IP limits of 30 start/30 POST requests per 15 minutes. Standard sign-in cannot bypass the email creation limit. Server logs record starts, successes and rejection reasons without tokens or email addresses.

## Google Cloud: check the existing sign-in client

1. Open https://console.cloud.google.com and use the project selector at the top to select your existing Google login project.
2. Open Google Auth platform → Clients. If your console uses the older navigation, use APIs & Services → Credentials.
3. Select the Web application client already used by GOOGLE_CLIENT_ID. This is the website sign-in client, not the separate Gmail sending client created for the old OTP feature.
4. Under Authorized JavaScript origins, add https://kutaslsu.vercel.app (no trailing slash).
5. For local testing, also add http://localhost and http://localhost:3000. If using another port, authorize that exact origin.
6. Click Save. This popup/callback implementation does not need an Authorized redirect URI. Do not add OAuth Playground for website sign-in; that was for Gmail.
7. Open Google Auth platform → Audience. For personal Google accounts, keep External. While in Testing, add the Google accounts you will test under Test users → Add users. Publish to production when ready for general use and complete any review Google requires.
8. No new Gmail API, Gmail scope, refresh token, or OAuth client secret is needed by this ID-token flow. Basic Google profile identity is sufficient.
9. Do not choose Internal unless you deliberately want only your Google Workspace organization. This implementation currently allows all verified Google identities, including Google accounts with non-Gmail addresses. An organization-only restriction would also need a server-side verified hd claim check; a suggested domain in the browser is not enforcement.
10. Changing preview deployment URLs must be authorized individually to use Google login. Prefer your stable production domain for the final test.

Reference: [Google client setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [server token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## Vercel environment variables

In Vercel, open the 1kuta project → Settings → Environment Variables (or the relevant environment's variable settings). Keep these names configured for Production:

- GOOGLE_CLIENT_ID
- SESSION_SECRET
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
- BLOB_READ_WRITE_TOKEN

Use your private values already stored in the project's private configuration. Do not post them in chat or GitHub. The Google client ID is public by design; session/database/blob secrets stay server-side. No NEXT_PUBLIC secret variables are used.

GOOGLE_CLIENT_SECRET, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL and ARCHIVE_ADMIN_SETUP_TOKEN are not used by this Google-only flow. They can be removed from this project's Vercel settings if nothing else uses them. Do not delete OAuth clients used by other applications.

The connected Blob store may manage BLOB_READ_WRITE_TOKEN automatically; keep that existing variable instead of adding a duplicate. Use an appropriately strong SESSION_SECRET (at least 32 characters). Redeploy after changing variables.

## Private administrator command

1. Wait for the new deployment to show Ready in Vercel.
2. Open https://kutaslsu.vercel.app/login and sign in using the Google account you want as administrator. This first sign-in creates an ordinary account.
3. Open PowerShell on your own computer.
4. Run:

~~~powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run admin:google
~~~

5. At the email prompt, type the same Google email you just used. This is an email address, not a password or token.
6. The command uses the Turso credentials in your private .env.vercel.local file. It only promotes an existing Google-linked account. It cannot create an administrator from an unverified email. It does not upload or replace your database.
7. After the success message, refresh the website and open https://kutaslsu.vercel.app/admin.

For your local development database only, use npm run admin:google -- --local. Never run the local option expecting it to change your hosted account.

The previous admin@kuta.local account cannot use Google sign-in. Keep its records; promote your real Google account instead. If an existing non-Google account has the same real email you want to use, the site will block automatic linking. Contact the owner/developer for a deliberate identity migration that preserves that account's ID and relationships; do not delete the account to bypass this check.

## Tests completed and limits

Automated tests use disposable local databases and test RSA signing keys. They do not authorize a real Google account, send email, or access the production database.

~~~powershell
npm run test:auth
npm run build
npm run test:auth:http
node scripts/test-google-http.mjs --regressions
~~~

Coverage includes signed token verification; wrong audience, issuer, signature, expiry, nonce and unverified email; actual create/sign-in route handlers; email mismatch; replay; legacy administrator collision; rate limits; session expiry/revocation; roles; protected pages and APIs; removed routes; logout; research editing, PDF storage, citations and theme/layout checks.

The real popup must still be tested in your browser with your own account:

1. In an incognito window, open the homepage or a research URL. Expect the login page.
2. Click Create account, enter your Google email, then Create account with this email. Click the Google button and choose that same account. Expect entry into the archive.
3. Repeat with a different Google account than the entered email. Expect a matching-email error. Use Retry Google sign-in for a fresh challenge.
4. For an address that has no Google account, Google's sign-in screen will refuse it or offer account creation. KUTA cannot look up an arbitrary email or honestly label a cancelled popup as an unknown account. No KUTA account is created until Google authenticates it successfully.
5. Sign out, then use Sign in with Google. Expect successful login to the same account. Try a new Google identity: it receives only reader access.
6. As a reader, open /admin or try a PDF endpoint. Expect denied administrator access. Run the private command for your chosen account and retry; expect the dashboard.
7. Close/cancel the Google popup or block its script/network connection. Expect instructions to retry; no account/session should be created.
8. Wait for session expiry or remove the session cookie, then open a protected URL. Expect login again. An expired stored cookie shows the session-expired message; when a browser has already discarded it, the normal login page appears.
9. In incognito, /api/papers should return 401. Old password endpoints cannot sign you in; they return 401 when unauthenticated or 404 with a valid session.
10. Check that existing research and PDFs are still present and administrator uploads still work.

Google proves control of the Google identity, not continuing ownership of every third-party email mailbox. We use sub rather than email for identity and never auto-link an old account by email. Google handles disabled/nonexistent account messages during its sign-in UI; this site cannot detect account disablement immediately during an already issued session. A valid existing Google token can remain usable until its expiry. The application limits sessions to at most one hour; immediate disablement notifications would require an additional account-security integration. Deleting a local user prevents its old sessions from working; a future verified Google login can recreate an ordinary account.

## Deploy

Push the completed changes to GitHub main; the connected Vercel project builds and deploys automatically. In Vercel → Deployments, wait for Ready and confirm the deployment uses the new commit. Keep Framework Preset Next.js, Install Command npm ci, Build Command npm run build, and the default Next.js output directory. No vercel.json change is needed.

Never use the 30-second auto-sync watcher while you are halfway through authentication changes on the production branch.
