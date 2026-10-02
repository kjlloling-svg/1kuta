# KUTA UI and details update

Updated the existing Next.js 16.3.4 / React 19 application served by the existing local Express wrapper. No rebuild, cloud service, deployment, system installation or original file deletion. The source/configuration/database/PDF backup was completed before edits at backup-before-ui-update-20261001-223122.

## Diagnosis

Node SQLite returns rows with a null prototype. getPaperAuthors forwarded those rows to a Server Component, which passed them into the client CitationPanel. Next rejects that prop shape. Explicit typed mappers now produce plain objects; no stringify/parse workaround. The stylesheet also accumulated repeated competing overrides and blanket 17px glass blur. Colors now originate in the two theme token blocks and content sits on opaque surfaces.

## Complete changed files

| File | Change |
|---|---|
| .gitignore | Exclude the new backup from generated source scans. |
| app/globals.css | Consolidate theme tokens, neutralize large green bands, opaque readable surfaces, subtler shadows, overlay-only blur/fallback, local font token, scoped Tailwind sources, deferred below-fold rendering, reduced motion and progress styles. |
| app/layout.tsx | Remove global photograph/bokeh; add global scroll progress and local Inter font loading. |
| app/page.tsx | Mount the locality/background layers on the homepage only; keep the KUTA welcome header and existing sections. |
| app/research-papers/page.tsx | Resolve role on the server and pass one boolean to the explorer. |
| app/research-papers/[slug]/page.tsx | Pass a typed explicit citation DTO rather than driver rows to the client Cite menu. |
| app/api/papers/[id]/route.ts | Explicitly select/coerce admin-only full text/program id instead of spreading a driver row. |
| components/site-shell.tsx | Replace the K mark with the fixed-size optimized local campus logo and alt text inside the existing home link. |
| components/home-background.tsx | New decorative lazy picture with local WebP/JPEG sources, nonblocking decoding and low fetch priority. |
| components/scroll-progress.tsx | New global accessible progressbar with passive listeners, rAF batching, resize observation and short-page handling. |
| components/home-search.tsx | Replace the client-only handler with an accessible native GET form. |
| components/archive-stats.tsx | Replace fetch/animation state with server-rendered counters, eliminating the statistics request and animation rerenders. |
| components/archive-explorer.tsx | Pass server role to each card; keep abortable debounced search and existing filters. |
| components/interactive-paper-card.tsx | Remove per-card session fetching; use role prop and retain author suffixes in displays/citations. |
| lib/archive-dto.ts | New typed allowlist mappers for paper/author/public/citation shapes; explicit date/string/integer conversion and safe public fields. |
| lib/archive.ts | Map search/recent/detail/authors/programs/abstract/full-text results at the database boundary; use public projection for paper APIs. |
| lib/citations.ts | Retain suffixes when optional name fields are missing, punctuation for reversed names, and correct BibTeX three-part name order. |
| package.json | Add test:ui script without changing dependencies. |
| README.md | Add design/runtime changes, backup location, verification commands and deliverable references. |
| scripts/test-ui.mjs | New real SQLite/null-prototype fixtures, eight visitor/admin author/detail cases, citation checks, private-field checks and all-page progress/background checks; cleans up its temporary records. |
| scripts/verify-theme.mjs | New repeatable WCAG luminance checks and CSS/asset metrics report generator. |
| tsconfig.json | Exclude the source backup from TypeScript checks. |
| public/assets/slsu-gumaca-original.jpg | Unmodified copy of supplied campus logo. |
| public/assets/slsu-gumaca-logo.webp | 192px optimized campus logo (14,448 bytes). |
| public/assets/kuta-locality-original.jpg | Unmodified copy of supplied locality image. |
| public/assets/kuta-locality.webp | Compressed full-image WebP (106,790 bytes). |
| public/assets/kuta-locality.jpg | Lightweight full-image JPEG fallback (98,302 bytes). |

Verification artifacts include this report, THEME-CONTRAST.md, UI-METRICS.json, UI-ARCHIVE-TESTS.txt, UI-DETAIL-TESTS.txt, UI-AUTH-TESTS.txt, compiled-css-before.json, UI-CHANGED-FILES.txt and ui-home-desktop.jpg. The ZIP contains complete files with their project paths; it excludes .env, private SQLite/PDF data, backups and node_modules.

## Verification

- PASS: npm start starts localhost:3000 without application startup errors; the server is left running.
- PASS: tsc --noEmit and npm run lint; zero TypeScript errors and zero lint warnings/errors.
- PASS: warm light and consistent dark theme tokens. Every listed text pair exceeds 4.5:1; all listed focus/border/accent component pairs exceed 3:1. Disabled controls use full-contrast colors instead of opacity. Automated rendered text scans of light/dark homepage, detail, login and citation dialog found zero contrast failures; all 93 homepage text nodes inspected. Full ratios are in THEME-CONTRAST.md, calculated from the W3C relative-luminance formula.
- PASS: copied logo/background load locally. Header logo uses next/image with fixed dimensions and responsive image candidates. No asset references use a Windows path. Original ESSENTIALS files remain untouched.
- PASS: homepage photograph is contained, not cropped, at 320px/390px mobile and 1440px desktop. No horizontal overflow at both mobile widths. Background absent from other route HTML.
- PASS: blur is limited in source to the header and two dialog classes, configured at 6px; inputs/buttons/cards have no backdrop filtering. Opaque fallback renders in the preview. Subtle shadows and transform/opacity-only animations; reduced-motion overrides inspected.
- PASS: progressbar appears on all seven tested routes. At the top value=0; mobile intermediate scroll 738.4/4081 gives 18%; bottom value=100 and scaleX(1). At a viewport taller than the detail page, value=100 and the bar hides. ARIA attributes/label and safe-area positioning verified in markup/styles.
- PASS: details return HTTP 200 and render without serialization errors for one author, several authors, suffix, missing optional fields, as both visitor and admin (8 checks). Fixture rows explicitly confirmed null prototype; mapped objects recursively confirmed ordinary prototypes. Dates/BigInt normalization and suffix-preserving citations checked.
- PASS: public/API private fields absent; full-text/download and admin mutations denied for visitor/public. Admin add/edit/upload/view/download/delete checks pass. Existing two papers remain and SQLite foreign-key checks are clean.
- PASS: correct login, wrong password, unknown user, empty/malformed inputs, remember/session persistence, logout, logged-out dashboard redirect, public dashboard denial, bcrypt hashes, cross-origin rejection and rate limiting. Browser also confirmed logout redirect, protected Login redirect and successful login state/navigation.
- PASS: all eight citation formats and 0/1/2/3/7/21 author counts; menu switching, APA copy-success toast, keyboard dialog/focus and citation fallback tests. Merged Nursing/Midwifery catalog and legacy filters remain working.
- PASS: clean browser tab loaded homepage and used View Details with no console errors/warnings. Final server requests completed without runtime exceptions. Earlier development compile errors were corrected and are present only in historical logs.

## Practical measurements

| Metric | Before | After |
|---|---|---|
| Custom CSS bytes | 35742 | 34342 |
| Gzip custom CSS bytes | 8488 | 7736 |
| Served development CSS bytes before/after source scoping | 163733 | 50643 |
| Supplied locality image bytes / served WebP | 769172 | 106790 |
| Supplied logo bytes / optimized source | 507443 | 14448 |
| Session fetches per 12-card results page | 12 | 0 |
| Client statistics API calls / animation rerenders | 1 / repeated | 0 / 0 |
| Blanket glass radius / new overlay radius | 17px | 6px |

Source CSS gzip decreased 8.9%; generated dev CSS decreased about 69.1%. Image bytes decreased 86.1%. CSS dev measurements reflect source scanning changes on this machine, with a fresh server restart to clear accumulated Tailwind development candidates. They are not a Lighthouse score, production JS bundle measurement or measured unused-CSS percentage. Tailwind scanning follows [official source controls](https://tailwindcss.com/docs/detecting-classes-in-source-files).

## Run locally

If a server is already running, use that one or stop its terminal with Ctrl+C before starting another.

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm install
npm run seed
npm start
```

In another PowerShell window:

```powershell
Start-Process 'http://localhost:3000'
```

Existing demo accounts are preserved by seed. Verification commands: npm run test:ui, npm run test:archive, npm run test:auth, npm run lint, npx tsc --noEmit, node scripts/verify-theme.mjs. Keep .env and data/private backups local.

## Not verified

- Lighthouse score, production JavaScript bundle size, or a formal screen-reader/full-WCAG audit.
- Physical high-DPI/mobile hardware, safe-area insets on a real device, GPU-backed backdrop blur, and an OS-level reduced-motion setting. Configured source/fallback/contrast/responsive behavior was checked; browser preview reports no computed backdrop filtering.
- Actual OS clipboard paste/rich-text formatting or native citation download dialog. The copy-success toast/fallback tests pass; the browser clipboard read returned an older RIS item, so native clipboard contents were not confirmed.
