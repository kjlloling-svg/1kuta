# KUTA header, welcome, keywords and departments update

Updated in place on 1 October 2026. Runtime confirmed in package.json and scripts/local-server.mjs: Next.js 16.3.4, Turbopack, React 19, local Express/SQLite. No dependencies installed for this update.

## Diagnosis

- Header gap: a later shared CSS rule changed the fixed skip link to position:relative. That hidden link occupied approximately 44.4px in normal document flow, moving the header down. The rail/header offsets were also defined separately. The skip link is fixed again; shared progress/header/safe-area variables reserve the top space once.
- Mobile menu: the native details disclosure lived inside the narrow header flex row. Its panel and desktop account actions competed for the same space. A small Client Component now opens an absolutely positioned, full-width, opaque panel below the header, supplied with server-rendered navigation/account slots.
- Keywords: SQLite stored JSON text, and PaperCard printed it directly. Normalization now happens in the explicit DTO mapper and server input validator, before client serialization. Cards, details, admin lists/forms, search filters and BibTeX/RIS use clean keywords.
- Department colors: a previous theme override mapped gold, rose, blue and maroon to the same green tokens. A typed five-slug map now references separate text/tint/edge variables in each theme, including the merged Nursing/Midwifery group and a safe unknown-program fallback.

## Backup and migration

Before editing, source, configuration, SQLite snapshot and uploads were preserved in backup-before-header-update-20261001-231214. Private configuration/backups are excluded from the delivery ZIP.

Migration 0004_normalize_keywords is repeat-safe, changes only keywords, validates record counts/foreign keys in a transaction and snapshots SQLite before any changed values. Both existing records were already canonical JSON arrays: **zero records changed**. Their keyword values were compared with the pre-edit SQLite snapshot. Malformed JSON becomes an empty array, with its original value retained in the pre-migration snapshot when a change is necessary. The isolated migration fixture verifies snapshots, duplicate removal, null conversion, repeat safety and preservation of title/full text.

Stop any old server with Ctrl+C, then use PowerShell:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run db:migrate
npm start
```

Open in another window:

```powershell
Start-Process 'http://localhost:3000'
```

For a fresh dependency setup, run npm install --cache .npm-cache and npm run seed first. Existing accounts are preserved. Secrets remain in .env. npm start and npm run dev now both use the existing local Next/Express server; npm run build uses Next directly, matching that runtime. Legacy framework files remain intact.

## Verification results

| Requested check | Result |
|---|---|
| Header directly below rail | PASS: header top 4px with zero safe-area inset, 72px mobile/tablet and 80px desktop. 126 top/middle/bottom measurements across seven pages, both themes and 360/768/1280 widths; another 36 measurements on signed-out login/register in both themes. No horizontal overflow. |
| Mobile menu | PASS: 320x800, 360x800, 390x844, 768x1024, 800x320, 800x360, 844x390, 1024x768, 1280x800 breakpoint and 1440x900 in both themes. Full width, top 76px directly beneath the mobile header, opaque background, minimum 44px controls; short landscape panels scroll. Header height unchanged. |
| Menu close/focus | PASS: Escape, outside pointer, link navigation/route change and desktop resize. Keyboard opening focuses Home; Tab advances to Research Papers with visible focus; Escape returns focus to Menu. Desktop resize focuses the visible home brand since the Menu button becomes hidden. |
| Neumorphism/themes | PASS: shared raised/hover/inset shadows, light gradient surfaces, 240ms transform/shadow/opacity transitions, focus ring and opaque header/menu. Dialog blur remains 6px. Reduced-motion CSS and count-up fallback implemented. |
| Hero/logo/stats | PASS: responsive 360px hero, one home h1, Inter via next/font/local, welcome text, both CTA links and working search. Logo preload and source set verified at 44px/88px only. Stats come from SQLite through the server; intersection count-up preserves final accessible labels and reserves digit width. |
| Keywords | PASS: null/empty/JSON/comma/array/malformed normalization, trim/dedupe, public DTO, clean exports, API create/edit and search. Browser verified four chips plus +2 more filtering Campus, detail filter navigation, admin preview and clean saved JSON after duplicate input. Temporary test records removed; existing records retained. |
| Department accents | PASS: all five mappings, unknown/prototype-name fallback, visible program labels on demo and normal cards, shared colors on program tiles, badges, edges, selected filters/chips and admin labels. Text/tint ratios 5.33–5.64 light and 7.21–7.52 dark. Edge/surface ratios all above 3. |
| Color-vision screening | PASS: approximate severity-1 linear-sRGB Machado protanopia/deuteranopia/tritanopia screening gives minimum text/tint ratios 5.09/5.10/5.34. Hues can converge; visible names and program-card numbers preserve identification without color. This is simulated screening. |
| Authentication | PASS: correct admin/public login, wrong password, unknown user, empty fields, malformed email, logout, remembered/session cookies, refresh persistence, logged-out protected redirect, public admin denial, bcrypt storage, origin rejection and rate limiting. Browser verified Demo Reader after refresh and protected redirect after logout. |
| Admin/public permissions | PASS: create/edit/upload/download/delete on temporary admin fixtures; non-admin API/HTML excludes private full text/file information; private endpoints reject public access. Five programs and both legacy Nursing/Midwifery filter URLs still work. |
| Citation/progress/background | PASS: all eight formats, zero/one/multiple/suffixed/missing-optional authors, clipboard fallback fixture, browser RIS keyword preview. Progress exists on all routes; homepage-only campus image and bokeh retained. |
| Errors/build | PASS: lint and TypeScript, 22 archive checks, 15 DTO/UI checks, 14 auth checks, layout/migration/contrast checks and Next production build. Fresh browser console has no warnings/errors during final navigation. Normal tested server routes return expected success/authorization statuses. |

Build verification also exposed Next static-generation control-flow messages in the session-aware header. The shared layout now explicitly renders dynamically, which is appropriate for per-session navigation. A tracing annotation keeps the configurable runtime SQLite path from making Turbopack trace the entire workspace. The subsequent Next build passed without warnings/errors.

## Complete changed/new files

See HEADER-CHANGED-FILES.txt for the exact 31-file source manifest. The ZIP preserves their project-relative paths and includes complete files, README, this report, palette/neutral contrast tables, JSON measurements and screenshots. No snippets, session secret, passwords, live database, private backups, uploads, node_modules or generated build files are included.

- app/globals.css: header/rail/menu layout, welcome hero, shared neumorphic states, responsive rules, safe-area handling and light/dark department tokens.
- app/layout.tsx: dynamic session-aware layout and viewport-fit cover; existing local font, progress and skip link retained.
- app/page.tsx and app/programs/page.tsx: one home welcome hero and central department accents on program cards.
- app/research-papers/[slug]/page.tsx: normalized detail keyword links and department badge/edge.
- components/mobile-menu.tsx: accessible disclosure state, closing behavior and focus management.
- components/site-shell.tsx: desktop/mobile account slots and fixed 44px preloaded logo.
- components/stats-strip.tsx and archive-stats.tsx: server counts with an accessible intersection-triggered count-up.
- components/keyword-chips.tsx, paper-card.tsx, interactive-paper-card.tsx: four clean filter chips plus overflow filter and named department accents.
- components/archive-explorer.tsx and admin-console.tsx: selected department styling, normalized keyword form/save/preview and admin record chips/labels.
- lib/keywords.mjs, archive-dto.ts, archive.ts and paper-input.ts: shared normalization, explicit plain metadata boundary and clean storage.
- lib/citations.ts: clean keyword fields in BibTeX and RIS; ordinary formatted citation rules preserved.
- lib/departments.ts and programs.ts: typed five-department token map and safe fallback.
- scripts/migrate-keywords.mjs and local-database.mjs: transactional repeat-safe keyword migration, startup integration and local-path tracing annotation.
- scripts/test-layout.mjs, test-archive.mjs and verify-theme.mjs: meaningful normalization/migration/permissions/contrast checks and theme reporting.
- package.json, next.config.ts, tsconfig.json, .gitignore and README.md: matching Next scripts, logo density widths, backup exclusions and exact setup instructions.

## Not verified

- Physical phones/tablets, actual notch insets, iOS Safari and other browser engines. Measurements used the in-app Chromium browser with viewport overrides.
- Formal NVDA/VoiceOver screen-reader testing and an OS-level reduced-motion setting. Semantic labels, keyboard behavior, CSS/media fallback and accessible final stats were checked.
- Lighthouse/Core Web Vitals scores, a measured production LCP/CLS score and production hosting. Local development behavior and an optimized build were verified; no deployment was performed.
- User testing with people who have color-vision deficiencies. Palette checks used the documented numerical simulation.

## Sources

[Next image documentation](https://nextjs.org/docs/app/api-reference/components/image): fixed-size images without sizes use density source sets; Next 16 preload replaces the older priority option. [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). [Machado primary-source thesis, Appendix A](https://www.inf.ufrgs.br/~oliveira/students_dissertations/Masters/Gustavo_Machado_Masters_thesis_UFRGS_2010.pdf) documents the color-vision simulation matrices.
