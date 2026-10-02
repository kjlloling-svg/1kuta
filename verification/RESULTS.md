# Local login verification — 1 October 2026

Diagnosis: The original form and POST route existed, but authentication and archive queries required Cloudflare D1 bindings. The start script required a prebuilt worker rather than a standalone Node server. There was no local demo seed. The form used full-page POST navigation and lacked the requested fetch handling, password toggle, Remember me, inline errors, loading feedback and toasts. The navigation did not display an account name.

Backup made before edits: backup-before-local-login-20261001-211122. No original source files were deleted. The old dependency layout was preserved after npm encountered pnpm link errors and an old development process locked the folder.

## Required cases

| Case | Result |
| --- | --- |
| npm start at localhost:3000 | PASS; Express serves existing Next application |
| KUTA welcome header, Inter, campus bokeh, glass/neumorphic design | PASS; checked in browser; assets stored locally |
| Correct seeded admin login | PASS; email and username tested; redirect to /admin |
| Nav shows name and Logout | PASS; Demo Administrator displayed |
| Wrong password | PASS; 401, generic inline error and toast |
| Empty fields | PASS; client inline errors, toast, focus on first invalid field; API 400 |
| Malformed email | PASS; server rejects with 400; client validation implemented |
| Unknown user | PASS; same 401 message as wrong password |
| Logout | PASS; database session revoked, cookie removed, home redirect |
| Refresh while logged in | PASS; browser reload retains authenticated nav and admin access |
| Protected page while logged out | PASS; /admin redirects to /login with return path |
| Password toggle and Remember me | PASS; browser toggle and checkbox; 14-day cookie verified |
| Keyboard login | PASS; Enter submitted login using demo username |
| Public role | PASS; goes home and lacks administrator access |
| Password storage | PASS; bcrypt hash checked; API does not return passwords |
| Rate limiting | PASS; repeated attempts return 429 |
| Cross-origin login | PASS; rejected with 403 |
| Browser console | PASS; no errors or warnings captured during tested login/admin/home flow |
| TypeScript | PASS |
| Authentication file lint | PASS |
| Repeat seed | PASS; existing account passwords preserved |
| npm install with project configuration | PASS; follow-up offline install completed |

## Limits and unrelated findings

- Other browsers and screen-reader software were not tested.
- Archive record editing and PDF upload/download were not exercised end-to-end; their cloud storage imports now point to local storage.
- Full-project lint remains unsuccessful because of five pre-existing React-effect lint errors in archive components, plus warnings. The changed authentication files pass their targeted lint check. These are separate from browser/server runtime errors.
- No cloud deployment was attempted.

The local database is data/kuta.sqlite; private configuration is .env. Both remain outside the source delivery ZIP. The ZIP contains complete changed source/configuration files, local visual assets, this report and screenshots. .env.example documents configuration without exposing the generated secret.
