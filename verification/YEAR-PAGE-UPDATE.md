# Browse by year and theme update

## Diagnosis and implementation
Turso rejected PRAGMA data_version with SQL_PARSE_ERROR before the old year query could run. A read-only diagnostic confirmed the aggregate succeeds: one verified paper in 2026 and one in 2024. There was no previous year-count HTTP endpoint; the homepage called the server helper directly.

The helper now uses one grouped query against research_papers and programs, without connection-local cache checks. Both the page and GET /api/year-counts reuse it. The page does not make an extra HTTP request. The endpoint returns {"years":[...]} with year, count and department counts; database errors return {"years":[]} with status 503, without leaking SQL or credentials. Existing public rate limits still apply. Years remain within the existing 2009–2026 archive range; only verified records count. The research list can also show clearly labeled demos, as before.

Approved choices: /browse-by-year; cards open /research-papers?year=YYYY; populated years get more space, with the highest count spanning two rows and columns; circular theme knob; existing colors and reduced-motion support.

Homepage year grid/error and Open the archive link were replaced with a compact Browse Papers by Year calendar link. Navigation includes the new page. The theme switch is visible in the header on mobile and desktop, supports Tab/Enter/Space, and retains the existing cookie/localStorage persistence. Transitions use 300ms CSS, disabled for reduced motion. Initial theme selection still happens before paint. No new dependency, database migration, environment variable or vercel.json change is needed.

## Appearance
Light: existing warm cream background, raised cream cards, green year numbers and relative-count bars, dashed borders for empty years. Dark: deep green background, lighter green cards and mint year numbers. The circular sun/moon knob moves right in dark mode. Larger cards emphasize the most populated years. Screenshots in outputs/year-update use disposable example records (8/3/1), not production counts.

## Verification checklist
| Check | Result |
|---|---|
| Production build and TypeScript | PASS |
| Year API: empty database, populated years, verified-only counts | PASS, isolated production HTTP server |
| Immediate counts after year/status changes | PASS |
| Query failure returns an empty years array | PASS, deliberately unavailable fixture table |
| Homepage error/archive message removed, replacement link present | PASS |
| New page renders and year links filter papers | PASS, HTTP plus browser: 2024 selected with 3 fixture results |
| Desktop1920/tablet768/mobile375 columns | PASS: 4/2/1 computed columns, no horizontal overflow in in-app browser |
| Theme visible in header at mobile and desktop sizes | PASS, browser |
| Theme Tab/Enter/Space support and reload persistence | PASS, browser and automated persistence tests |
| Reduced-motion behavior | PASS: browser preference enabled, computed transition duration 0s |
| Normal-motion hover/fade/slide smoothness | NOT VERIFIED visually: preview browser requests reduced motion; 300ms CSS implemented |
| No browser console warnings/errors | PASS on inspected year/filter pages |
| Auth, permissions, archive CRUD, uploads, citations, theme and layout regressions | PASS, disposable local fixtures |
| Chrome and Brave specifically; macOS | NOT VERIFIED: unavailable through the connected browser controls |
| Under1second on3G, production cold-start performance | NOT VERIFIED; requires deployed-network profiling, not guaranteed |

Commands: npm run build; npm run test:auth; node scripts/test-google-http.mjs --regressions; git diff --check. Full HTTP/regression output is outputs/year-update/tests.txt.

## Final successful build excerpt
    > site-creator-vinext-starter@0.1.0 build
    > next build
    Next.js 16.3.4 (Turbopack)
    Compiled successfully in 1176ms
    Finished TypeScript in 5.1s
    Generating static pages (3/3) in 161ms
    Route: /api/year-counts (dynamic)
    Route: /browse-by-year (dynamic)
    Exit code: 0

## Deploy
From the project folder, run git push origin main to trigger the connected Vercel deployment. No settings changes are required. After it is Ready, open /browse-by-year, click a populated year, and test the theme switch in Chrome and Brave. With reduced motion disabled, inspect the 300ms transitions; use network throttling to measure the 3G target.
