# KUTA password reset: setup and testing

The login page now has a **Forgot password?** link. The new page asks for email, then a six-digit code, then a new password and confirmation. After success it returns to login. Existing login controls and styling are retained.

This repository deploys with **Next.js**, as specified by its existing package.json and vercel.json. The older vite.config.ts is unchanged. No Vercel configuration change or new database service is needed. The `/api/auth/password-reset` Next route runs as a Node serverless function.

The code is ready, but real email delivery requires the private Google configuration below. The automated tests mock Gmail; they do not prove delivery to your inbox. No real OTP email was sent during development.

## 1. Select your existing Google project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project selector beside the Google Cloud logo at the top.
3. Select the project that already contains your KUTA Google sign-in client.
4. Keep the existing sign-in client. We will create a separate client for the Gmail sender.

Only the sending Gmail account authorizes this new client. People receiving codes do not need to authorize Gmail access, create Google Cloud projects, or use Gmail themselves; they need a working mailbox matching their KUTA account.

## 2. Enable Gmail API

1. Open the navigation menu (three horizontal lines).
2. Choose **APIs & Services → Library**.
3. Search for **Gmail API**, open Google's result, and click **Enable**. If it already says **Manage**, it is enabled.

## 3. Configure consent and the sender

1. Open **Google Auth Platform → Branding**. The older **APIs & Services → OAuth consent screen** entry can lead to the same area.
2. If configuration already exists, retain the existing application name, support address and branding. If Google shows **Get Started**, complete the requested app name, support email and developer contact details.
3. Open **Audience**. For a normal personal Gmail account, the audience is **External**. Internal is available only for eligible Workspace organizations and restricts authorization to their organization.
4. While **Publishing status** is **Testing**, find **Test users → Add users**.
5. Enter the Gmail address you own that will send the verification messages. Click **Save**.

This test-user list controls who can authorize the sender; it is not the list of addresses allowed to receive verification emails. Google documents the current menus in its [consent-screen guide](https://developers.google.com/workspace/guides/configure-oauth-consent).

## 4. Add only the sending scope

1. Open **Google Auth Platform → Data Access**.
2. Click **Add or Remove Scopes**.
3. Find Gmail API's sending scope, or paste this into the manual scope entry:

   ```text
   https://www.googleapis.com/auth/gmail.send
   ```

4. Click **Update**, then **Save** as offered by the console.

Do not remove the existing basic sign-in scopes. The sender requests gmail.send only; the existing Google login still requests its existing identity permissions. This scope permits sending, not reading your inbox. See the [Gmail send method](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send).

## 5. Create a separate OAuth client

1. Open **Google Auth Platform → Clients → Create client**. In the older layout, use **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Select **Web application**.
3. Name it **KUTA Gmail Sender**.
4. Under **Authorized redirect URIs**, click **Add URI** and enter exactly:

   ```text
   https://developers.google.com/oauthplayground
   ```

5. Click **Create**.
6. Save the new **Client ID** and **Client secret** privately. These are GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET. Do not overwrite GOOGLE_CLIENT_ID, which belongs to sign-in.

No JavaScript origin is required for this sender's server-side flow. Keep the existing sign-in client's production origin, including https://kutaslsu.vercel.app, unchanged.

## 6. Get your refresh token privately

1. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the **gear icon** in the upper-right.
3. Check **Use your own OAuth credentials**.
4. Enter the new Gmail sender **OAuth Client ID** and **OAuth Client secret** into the Playground, not into chat.
5. Set **OAuth flow: Server-side**, **Access type: Offline**, and **Force prompt: Consent Screen**.
6. Close the configuration panel.
7. In **Step 1**, enter `https://www.googleapis.com/auth/gmail.send` in **Input your own scopes**, then click **Authorize APIs**.
8. Sign in as the sending Gmail account you added as a test user. Review the app identity and requested permission, then approve your own app. If an organizational policy blocks it, ask the organization administrator; do not disable account protections.
9. In **Step 2**, click **Exchange authorization code for tokens**.
10. Copy **Refresh token** privately. This is GMAIL_REFRESH_TOKEN. Do not copy the short-lived Access token instead.

Using your own client credentials is essential: the Playground says its default credentials' refresh tokens are automatically revoked after 24 hours. The [Playground documentation/interface](https://developers.google.com/oauthplayground) explains the configuration.

## 7. Avoid the seven-day testing expiry

For an External app in **Testing**, a refresh token with Gmail scopes expires after **seven days**. Before relying on this in production:

1. Return to **Google Auth Platform → Audience**.
2. Under **Publishing status**, click **Publish app** and confirm to change it to **In production**.
3. Check **Verification Center** and **Branding/Data Access** for any requirements. Publishing is not the same as Google verification. gmail.send is a sensitive scope; verification, warnings or user caps can apply depending on the app's use. Follow Google's review requirements if requested.
4. Repeat the Playground authorization and exchange after publishing to obtain a new refresh token for the production configuration.
5. Save that new token in Vercel and redeploy.

Production removes the seven-day testing restriction; it does not make tokens permanent. Revoked consent, Gmail password changes, organization policies and other conditions can still invalidate them. See [Google's refresh-token rules](https://developers.google.com/identity/protocols/oauth2#expiration).

## 8. Save the five settings without posting secrets

The new Vercel variable names are:

```text
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
GMAIL_SENDER_EMAIL
PASSWORD_RESET_SECRET
```

Existing TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, SESSION_SECRET and other site settings remain necessary. Do not add VITE_ or NEXT_PUBLIC_ prefixes. The new password-reset secret must be a separate randomly generated value of at least 32 characters. It protects short-code hashes and is not a Google credential.

To avoid copying secrets into chat, run this in PowerShell:

```powershell
cd C:\Users\KurtJohn\Desktop\1KUTA
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configure-gmail.ps1
```

The script asks for the first four settings with hidden input and generates PASSWORD_RESET_SECRET itself. For GMAIL_SENDER_EMAIL enter the real Gmail address that authorized the refresh token. Paste only each value, without its variable name or quotes. The script creates the ignored `.env.gmail.local` file, without changing your Turso, Blob or sign-in settings. If the file already exists, it stops; edit that file privately to update it.

Open **Vercel → your KUTA project → Settings → Environments → Production → Environment Variables** (some layouts show Environment Variables directly in Settings). Use **Import .env** and select `.env.gmail.local`, or add the five variables manually. When entering values manually, omit surrounding quotes. If a variable already exists, edit it instead of adding a duplicate. Use **Secret** for the client secret, refresh token and password-reset secret.

Save, then **Deployments → latest deployment → ⋯ → Redeploy**. New environment variables do not change already-running deployments. Do not import the unrelated `.env` file or re-import the Blob token.

The Gmail file is only a private dashboard-import helper; Next does not automatically load `.env.gmail.local` by that name. If testing real Gmail locally, privately add its five values to your ignored `.env.local`, and choose a test database/account rather than production.

## 9. What the feature stores and limits

- Turso receives two additive tables, `password_resets` and `password_reset_limits`, automatically on the first configured reset request. No existing account or research table is replaced, and the Vercel function writes no local files.
- OTPs come from Node's cryptographic randomInt. Only a keyed SHA-256 digest is persisted; raw codes exist briefly in the request/email operation. OTPs, credentials, addresses and provider payloads are not logged by this flow.
- Each code expires in ten minutes and allows at most five valid-format wrong guesses. Verification consumes the code atomically and returns a random, hashed, five-minute reset permission. It is kept only in browser memory and consumed once in a transaction. Resending invalidates the previous code/reset permission.
- The resend delay is enforced in the database, not just by the 60-second button. Request limits: 10 per IP and 3 per email per 15-minute window; verification: 30 per IP per 15 minutes; password submissions: 20 per IP per 15 minutes. A conservative 450-send-attempt daily sender budget reduces accidental Gmail quota exhaustion. These are database counters shared across serverless instances.
- Valid-email requests have the same public message for registered, unregistered and email-throttled accounts: **If this email exists, we sent a code.** Email delivery runs in Next's serverless-supported after() callback so provider delay does not distinguish registered accounts. IP-wide throttling can return a friendly 429, and globally missing configuration can return 503, regardless of the entered address. Delivery errors are logged generically; users are not told whether an account exists.
- New passwords use the existing bcrypt method/cost 12, at least 12 characters and at most 72 UTF-8 bytes, preventing silent bcrypt truncation. Resetting revokes existing sessions. Google-only accounts can set a password after mailbox verification and keep Google sign-in and their existing role.
- A correct received code proves access to the mailbox for this reset; it does not prove the person's legal identity or verify arbitrary unregistered addresses. No new account is created by password recovery.
- `admin@kuta.local` cannot receive real internet email. A developer must privately update that account to an owned mailbox before email recovery can work. This feature does not change administrator addresses or grant administrator privileges.

## 10. Test it

Local automated checks (synthetic accounts and mocked Gmail, no real mail):

```powershell
npm run build
node scripts/test-password-reset.mjs
node scripts/test-password-reset-http.mjs
node scripts/test-hosting-runtime.mjs
```

After saving Gmail variables and redeploying:

1. Use a test account already registered in KUTA with a real email inbox you control. Open https://kutaslsu.vercel.app/login and click **Forgot password?**.
2. Enter its email. Check the inbox and spam folder for **Your verification code**. The message contains exactly six digits and says it expires in ten minutes.
3. Enter the code. Enter and confirm a new password of at least 12 characters. Confirm the success message and return to login. Log in with the new password; the old one should fail.
4. Confirm an existing session in another browser is signed out. Check that ordinary users remain ordinary users and administrator roles are unchanged.
5. Wrong code: request a code and submit a different six-digit number five times. The correct code must then fail too. Wait for cooldown/request limits before requesting another.
6. Expired code: request one, wait ten full minutes, and try it. Expect a generic invalid/expired response.
7. Reused code: after successful verification, try the code in another tab. It must fail. A submitted reset permission must also fail on a second password change. Automated tests cover parallel replay as well.
8. Resend: confirm the button is disabled for 60 seconds. After waiting, request another and use only the newest email. The prior code must no longer work.
9. Unknown address: enter a valid-format address not registered in KUTA. The request message must be identical, and it must not create an account.
10. Google-only account: use its real email to complete the flow, then test both password login and Google sign-in.

Do not weaken expiry, rate limits or production records to speed up testing. The automated tests advance an isolated clock for expiry cases. Rate-limited manual testers should wait 15 minutes. If no email arrives, check Vercel logs for the fixed delivery-failure message, Gmail API enabled status, sender authorization, scope, token expiry and quota. No error log should contain the OTP or provider credentials.

## Gmail capacity and the simpler alternative

Personal Gmail can block sending after about **500 emails/day**; this is not a delivery guarantee, and Workspace limits differ. Other mail sent from the same account counts too. For higher volume, a transactional provider such as Resend or SendGrid is a better fit; switching would be a separately approved service change. See [Gmail's sending limits](https://support.google.com/mail/answer/22839).

| Option | Advantages | Tradeoffs |
| --- | --- | --- |
| Gmail API + OAuth2 (implemented) | Narrow gmail.send permission; access tokens refresh automatically; no mailbox password in the app | Google client/consent/refresh-token setup; testing expiry and possible verification requirements |
| Gmail SMTP + App Password through Nodemailer (alternative only) | Fewer setup steps; no OAuth Playground or seven-day OAuth testing expiry | Requires 2-Step Verification and an eligible account; long-lived credential; organization/Advanced Protection restrictions; same Gmail limits |

If you choose the alternative later: open your sender's **Google Account → Security → 2-Step Verification**, enable it if needed, then open [App passwords](https://myaccount.google.com/apppasswords). Create one named KUTA. The server would use Nodemailer with smtp.gmail.com over TLS and an app-specific credential, never your ordinary Google password. GMAIL_SENDER_EMAIL plus a private GMAIL_APP_PASSWORD would replace the OAuth sender variables. This code does not enable SMTP or accept that variable yet; request that change before switching. Google can revoke app passwords after a Google password change and may not offer them for some accounts. See [Google's App Password guide](https://support.google.com/accounts/answer/185833).

## Changed files and complete source

Modified: `components/login-form.tsx` (one recovery link), `package.json` and `package-lock.json` (official googleapis dependency).

Added: `app/forgot-password/page.tsx`, `components/forgot-password-form.tsx`, `app/api/auth/password-reset/route.ts`, `lib/password-reset.mjs`, `lib/gmail-reset.mjs`, `scripts/configure-gmail.ps1`, `scripts/test-password-reset.mjs`, `scripts/test-password-reset-http.mjs`, and this guide.

`vite.config.ts`, `vercel.json`, existing authentication routes, existing database adapter, and stylesheets are unchanged. The delivered source archive contains every new/modified file in full, including the lockfile; it contains no environment files or account data.
