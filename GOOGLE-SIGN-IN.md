# Google sign-in for local KUTA

The existing Next.js/Express login now includes Google's official sign-in button. The browser sends the ID token to `/api/auth/google`; the server checks Google's signature, audience, issuer, expiry, verified email and a browser-bound nonce. Users are keyed by Google's `sub`, receive the existing 14-day HttpOnly session cookie, and see their name/avatar and Log out in the header and mobile menu.

## Configuration and run

The supplied credentials have already been copied into the local, ignored `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The secret is never sent to the browser; this ID-token flow does not need to use it. Only the public client ID is returned by the configuration endpoint. `.gitignore` excludes `.env*` and `client_secret_*.json`.

1. In Google Cloud, confirm this web OAuth client's Authorized JavaScript origins include exactly `http://localhost:3000` (no trailing slash). The supplied JSON already lists it. No redirect URI is required for this popup flow.
2. Keep your account in the consent screen's Test users while the app is in testing.
3. From the project folder, run `npm install` if restoring the project elsewhere. The new `google-auth-library` package is already installed here.
4. Stop the existing local server and run `npm run dev` to load the new environment settings. Open `http://localhost:3000/login`. Database columns/index are added automatically, preserving existing records.

## Test

- Click Sign in with Google and choose your test account. Refresh the page: your name/avatar should remain visible. Click Log out and confirm protected pages require login again.
- Close the Google popup: the login card remains usable and shows retry guidance. The Google button API does not expose a popup-close callback; it does not start a blocking spinner until an ID token arrives.
- Block the Google script or disconnect the network: a friendly loading/sign-in error appears. Reload after restoring the connection if the script itself was blocked.
- An email already used by a different Google or password account is rejected with a message. Existing accounts are never automatically linked by email.
- Run `node scripts/test-google-auth.mjs` for isolated signed-token and account tests, and `npm run test:auth` with the server running for password/session/logout regression tests.

The automated token tests use locally generated test keys, isolated from production verification. A real Google sign-in must still be tested interactively by the account owner.

## Changed files

`.gitignore`, `.env` (local only), `.env.example`, `package.json`, `package-lock.json`, `app/globals.css`, `app/api/auth/google/route.ts`, `components/google-sign-in.tsx`, `components/login-form.tsx`, `components/logout-button.tsx`, `components/site-shell.tsx`, `lib/auth.ts`, `lib/google-auth.ts`, `db/schema.ts`, `scripts/local-database.mjs`, `scripts/test-google-auth.mjs`, and this guide.

Reference: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
