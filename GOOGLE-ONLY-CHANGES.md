# Google-only authentication changes

Complete new/modified files are included at their original paths in the accompanying ZIP. Removed files are listed below and must be removed when applying the update manually. No secrets, database files, uploads or dependencies are included.

## New or modified files

| File | Why |
|---|---|
| README.md | Replace obsolete local password-login instructions. |
| app/admin/page.tsx | Remove password/setup UI and connect Google-only navigation. |
| app/api/auth/google/route.ts | Verify both Google flows, bind entered email, prevent replay and log attempts. |
| app/api/keywords/route.ts | Require a server-verified session before exposing research data. |
| app/api/papers/[id]/route.ts | Require a server-verified session before exposing research data. |
| app/api/papers/route.ts | Require a server-verified session before exposing research data. |
| app/api/programs/route.ts | Require a server-verified session before exposing research data. |
| app/api/stats/route.ts | Require a server-verified session before exposing research data. |
| app/login/page.tsx | Remove password/setup UI and connect Google-only navigation. |
| app/register/page.tsx | Remove password/setup UI and connect Google-only navigation. |
| components/google-sign-in.tsx | Suggest the requested email and connect the verified Google response. |
| components/login-form.tsx | Offer only Google sign-in and Create account. |
| lib/auth.ts | Remove password helpers and use Google-only sessions. |
| lib/google-auth.ts | Preserve Google sub identity and block unsafe legacy account linking. |
| lib/local-env.ts | Remove the unused browser administrator setup token. |
| package-lock.json | Keep npm installation reproducible after removing dependencies. |
| package.json | Remove obsolete password/Gmail dependencies and add admin/test commands. |
| scripts/local-server.mjs | Remove the obsolete demo-password setup instruction. |
| scripts/seed-local.mjs | Initialize local configuration without creating password accounts. |
| scripts/test-archive.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-google-auth.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-layout.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-local-auth.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-theme-access.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-ui.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| verification/THEME-ACCESS-TESTS.txt | Record updated access regression results. |
| GOOGLE-ONLY-AUTH.md | Provide setup, deployment, administrator and manual testing instructions. |
| components/google-create-account.tsx | Add the email-first Google account creation screen. |
| lib/google-challenge.mjs | Store single-use Google challenges and rate limits in the existing database. |
| lib/google-session.mjs | Check expiring/revocable sessions and invalidate old password sessions. |
| proxy.ts | Require a stored Google session for every protected page and API. |
| scripts/admin-google.mjs | Privately promote an existing Google account using owner-held database credentials. |
| scripts/test-google-http.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-google-routes.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |
| scripts/test-google-session.mjs | Update or add isolated tests for Google authentication and protected archive behavior. |

## Removed files

- GMAIL-PASSWORD-RESET.md
- app/admin/setup/page.tsx
- app/api/admin/setup/route.ts
- app/api/auth/login/route.ts
- app/api/auth/password-reset/route.ts
- app/api/auth/register/route.ts
- app/chatgpt-auth.ts
- app/forgot-password/page.tsx
- components/forgot-password-form.tsx
- lib/gmail-reset.mjs
- lib/password-reset.mjs
- scripts/configure-gmail.ps1
- scripts/test-password-reset-http.mjs
- scripts/test-password-reset.mjs

## Validation

- npm run test:auth: passed.
- npm run build: passed.
- node scripts/test-google-http.mjs --regressions: passed.
- Targeted ESLint checks on Google auth, login/create-account UI and proxy: passed.
- git diff --check: passed.

Real Google popup authorization and hosted deployment readiness must still be confirmed in the browser. All automated tests used isolated local databases. No production data or administrator role was changed.
