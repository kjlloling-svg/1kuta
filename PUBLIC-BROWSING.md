# Public browsing with Google-only restricted features

## Access rules

Visitors can open the homepage, research listings and individual public paper pages, search/filter metadata, and browse Programs, About and FAQ without being redirected to login. Titles, authors, research year, program and keywords remain public. Pending records remain administrator-only. There is no separate summary column, bibliography viewer or related-papers feature in the existing application; the locked area uses a generic placeholder, never a concealed real abstract.

Google sign-in unlocks full abstracts and citation generation/copy/export. As agreed, full papers/PDF downloads and editing remain administrator-only. The administrator dashboard still redirects anonymous users to login. Personal bookmark APIs require a session; there is no separate My Library or settings page currently implemented.

Authentication continues to use the HttpOnly kuta_google_session cookie and a database session check. Browser storage never grants access. Google-only login and private administrator promotion remain unchanged.

## Exact feature inventory

Abstracts:
- app/research-papers/[slug]/page.tsx renders the full abstract for authenticated readers and LockedResearch for guests.
- components/interactive-paper-card.tsx loads the abstract when an authenticated reader clicks Read abstract; it rechecks access at that moment.
- app/api/research-papers/[slug]/abstract/route.ts serves the dedicated abstract response.
- app/api/papers/route.ts and app/api/papers/[id]/route.ts can include abstract fields for authenticated readers. For guests they return public metadata only.
- lib/archive.ts selects fields by server-verified access; lib/archive-dto.ts prevents abstract/full-text/file fields from entering guest responses.

Citations:
- components/citation-panel.tsx provides APA, MLA, Chicago, Harvard, IEEE, Vancouver, BibTeX and RIS previews, copy, and citation-text downloads.
- It appears on app/research-papers/[slug]/page.tsx and components/interactive-paper-card.tsx for signed-in readers.
- app/api/papers/[id]/citation/route.ts produces each citation on the server.
- lib/citations.ts formats citations; lib/archive-dto.ts checks access before producing citation input.
- Exported citation files use the same protected endpoint. There is no separate public citation export route.

## Restricted API responses

Without a valid session, these GET endpoints return HTTP 403:

- https://kutaslsu.vercel.app/api/research-papers/<slug>/abstract
- https://kutaslsu.vercel.app/api/papers/<id>/citation (including style and number query parameters)

Response:

~~~json
{"error":"Login required","type":"auth_required"}
~~~

They do not return any abstract or citation data. Each denial records timestamp, client IP, endpoint path and reason in server logs. The IP is taken from Vercel's supplied forwarding header in production; local development uses the local server's trusted header, with a shared local fallback. Tokens and cookies are not logged.

GET /api/papers, /api/papers/<id>, /api/programs, /api/keywords and /api/stats return public data without a session. Guest paper list/detail responses omit abstracts and private full-text/file fields. Metadata endpoints are intentionally 200, not 403.

Anonymous non-static browsing requests are limited to 120 per IP per 60-second window in the existing database. Exceeding the limit returns 429 with Retry-After: 60, including when repeatedly requesting protected endpoints. This deters rapid automated requests, not determined distributed scraping. No new service is used.

## Sign-in and session behavior

The restricted-content prompt says “Sign in with Google to view the full abstract and citations”. Its existing Sign in button opens a dialog containing the existing Google sign-in component, using existing dialog/button classes. Cancel leaves the user browsing the same page. Successful login reloads the same path, query and fragment, keeping an archive filter or shared paper URL.

The header shows Sign in with Google to guests, and the existing account name/avatar and sign-out control to signed-in users. Fully public pages have no login banner.

A small invisible session checker compares the server-verified account on window focus, when the tab becomes visible, and every 60 seconds while visible. If login/logout/role changes in another tab, the current page reloads at the same URL. A network failure does not force a redirect. An expired session returns a restricted-content prompt; public pages remain open. Content already downloaded while signed in cannot be retroactively removed from a user's possession, but new restricted requests are rejected and the page refreshes after expiry is detected.

## Test walkthrough

1. Open an incognito browser and go to https://kutaslsu.vercel.app. Expect the homepage, not /login.
2. Browse Research Papers, search for a title/author/keyword, change filters and open a paper. Expect title, authors, program, year and keywords without the full abstract or citation.
3. In the abstract area, expect the exact sign-in prompt and placeholder. Click Sign in: a dialog opens without changing the URL. Close it and keep browsing.
4. Open the dialog again and complete Google sign-in. Expect the same paper/list URL to reload. Full abstracts and citation controls are now available without a prompt.
5. Choose a citation format and copy/download it. All eight formats should work when signed in.
6. Keep two tabs open. Sign out in one, then focus the other. Expect its session-dependent content to refresh while its public URL stays open. Repeat by signing in in another tab.
7. After session expiry, try Read abstract or Cite. Expect a sign-in prompt instead of private data. Opening a public page still works.
8. Share a paper URL with an incognito browser. The recipient sees metadata and the restricted-feature prompt, never a forced page redirect.
9. In browser developer tools → Network, request either restricted API without signing in. Expect 403 and the documented JSON. Public paper APIs should respond 200 without an abstract field.
10. Confirm /admin remains private and that only an administrator can view full papers/PDFs or edit records.

## Verification and deployment

Automated checks use isolated databases and synthetic test identities, not production data:

~~~powershell
npm run test:auth
npm run build
node scripts/test-google-http.mjs --regressions
~~~

They cover anonymous page loading, public metadata, guest HTML/RSC/API leakage, all eight restricted citation formats, expired/revoked sessions, private administrator access, rate limiting and audit logs, Google authentication, research edits, PDFs, citations, theme and layout. The real Google popup and cross-tab browser interaction still need the manual walkthrough above.

No environment variables, Google Cloud settings, database schema or vercel.json changes are required. tsconfig.json now excludes outputs because source-delivery bundles in that ignored folder otherwise get incorrectly type-checked as application source.

After the changes are committed locally, deploy with:

~~~powershell
git push origin main
~~~

Wait for the connected Vercel deployment to become Ready, then perform the incognito checks. No data migration is needed.
