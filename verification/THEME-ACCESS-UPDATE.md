# KUTA theme, inset accents, researcher credit and access rules

Updated in place on 2 October 2026. Confirmed Next.js 16.3.4/Turbopack, React 19 and the existing local Express/SQLite server. No new dependencies installed.

## Diagnosis and changes

**Theme flash:** the previous ThemeToggle applied localStorage in a mount effect, while server HTML had no theme attribute. Light CSS therefore painted first. The root now reads the validated kuta-theme cookie and renders data-theme immediately. A synchronous inline head script migrates an older archive-theme localStorage choice, or uses the system preference if neither choice exists. It runs before body markup, has no async/defer, and sets the HTML background and color-scheme through the theme variables. Transition suppression lasts until two animation frames have passed and briefly applies during toggles. Native labeled checkbox controls expose the matching checked state and CSS-driven sun/moon icons without hydration text changes. The html hydration suppression is confined to the bootstrap-managed root attributes.

**Accent overflow:** the old absolutely positioned program-card pseudo-element was not clipped by its rounded parent, and a separate colored top border doubled the treatment. Program/research/detail/admin cards now clip a 6px inset gradient strip inside their radius. The card's own neumorphic shadow remains outside; the colored glow stays inside. Hover/focus increases only glow/opacity; there are no glow pulses. Light glow is restrained at 14% color mixing and dark glow is 30%. Admin rows have rounded borders and padding so the strip cannot overlap their labels.

**Guest access:** the old policy intentionally returned abstracts and rendered client-built citations for everyone. This policy is replaced at both SQL selection and the explicit DTO boundary. Guest queries do not select abstract/file-name columns; the mapper also strips them even if a caller accidentally supplies those fields. Defaults fail closed, including invalid access values. Session-derived roles control pages and APIs, never query parameters or client flags. The new authenticated citation route builds all formats on the server, and preview/copy/export requests recheck the session. Guests get placeholder text and a labeled login link; no real abstract is blurred or hidden in their HTML.

Session-sensitive HTML, RSC and API responses use private no-store and vary on Cookie. The local server preserves this policy even when Next's development renderer would set only no-cache. Back/forward snapshots hide content before leaving and reload when restored, preventing old session-dependent content from being reused. Metadata contains title/basic archive description only; there is no sitemap/feed exposing abstracts. Existing search does not match abstract text for any role.

Login return paths are validated as same-site paths, reject external/protocol-relative/backslash/API destinations, and safely handle repeated query parameters. Returning to a paper shows an unlock toast; its timing was tested under development Strict Mode.

## Researcher name changes

1. app/about/page.tsx, project-team entry: Kurt John Lenol Loling → **Kurt John Lenoel Loling**.
2. components/site-shell.tsx, shared footer researcher credit: the same correction.

The active source, metadata, seed/demo scripts, README and content folders were searched case-insensitively. No matching researcher name existed in seeds or database user/author names. No name/schema migration was needed. README now documents the corrected credit. Windows paths, identifiers, file names and environment values were retained; historical backups and dependency/cache metadata were left intact. No ambiguous active researcher reference was found.

## Verification

| Requested check | Result |
|---|---|
| Dark reload/navigation | PASS in the in-app Chromium browser: dark theme and both checkbox states remained correct after hard reload, existing navigation, back and forward. The browser console was clean. Cookie-based server HTML and blocking head-script placement were checked. |
| Legacy storage/system preference | PASS in a deterministic pre-paint script harness: cookie wins, old dark localStorage migrates to a cookie, system dark works without an explicit choice, unavailable localStorage is handled, and cached-page restore triggers a fresh request. Actual OS preference changes were not performed. |
| Inset accents | PASS across 48 page/theme/viewport combinations: Home, Programs, Research and Admin at 320, 360, 390, 768, 1280 and 1440 widths in both themes. No horizontal overflow or header offset regression; strip inset is 0px on top/left/bottom, width 6px, parent relative and overflow hidden. |
| Growing/focused cards | PASS: a 360px research card grew from 470.4px to 563.4px when expanded; the strip stayed clipped with bottom 0px. Keyboard focus increased edge opacity to 1 and retained the outer focus ring. Mobile checkbox keyboard toggling updated both controls and theme; menu remained below the header at 76px. |
| Name | PASS: About and shared footer show the corrected full name; original folder path is unchanged. |
| Guest restrictions | PASS: list/detail JSON omit the abstract field. Guest HTML and Next RSC payloads exclude a unique abstract sentinel and private full-text sentinel. Home/archive responses exclude it too. Abstract-only guest search returns no result. Direct abstract/citation requests return 401. Forged admin=1 requests do not elevate access. |
| Reader access | PASS: logged-in public API/page includes the abstract, all eight citation formats return authenticated output, and full-paper/PDF access remains denied. Browser tested every citation format and confirmed no View full paper control. |
| Admin | PASS: abstract/citation/full-paper controls and dashboard remain available. Archive regression fixtures verify private full text and PDF upload/download plus all existing admin operations. |
| Return/unlock | PASS: reader login from the lock prompt returned to the original paper and displayed “The abstract and citation are now unlocked.” Unsafe redirect cases and revoked-session requests were tested. |
| Existing features/errors | PASS: 17 new theme/access checks, 22 archive checks, 15 DTO/UI checks, 14 authentication checks, layout/keyword/migration/contrast checks, lint, TypeScript and the optimized Next build. Fresh browser warning/error log was empty. Expected 401/403/429 responses are authorization/rate-limit results. |

The existing site uses native same-origin anchors, which were retained. Their navigation and back/forward behavior were tested; Next RSC responses were tested separately with the protocol's _rsc query parameter. No client-router navigation implementation was introduced.

## Short before/after theme test record

| Stage | Before | After |
|---|---|---|
| Server HTML | Backup root layout has no data-theme; default CSS is light | Request with kuta-theme=dark contains html data-theme="dark" and checked native controls |
| Before first body paint | Theme is applied in a post-hydration useEffect | Blocking head bootstrap selects cookie/storage/system synchronously, before body, with transitions suppressed |
| Reload/navigation/back/forward | Known initial-light implementation | All four browser samples remained dark with checked controls; see THEME-BROWSER-NAV.json |

Screenshots: access-guest-dark.png, access-reader-unlocked.png, access-reader-citation.png, access-programs-light.png, access-programs-dark.png and access-mobile-menu-dark.png. This is a written/screenshot test record, not a frame-by-frame video capture.

## Palette

The full light/dark text, tint, edge and bright-accent values are in DEPARTMENT-PALETTE.md. Text/tint ratios remain:

| Department | Light | Dark | Bright accent, light / dark |
|---|---|---|---|
| BSBA–HRDM | 5.64:1 | 7.21:1 | #bf8a2d / #f3c76e |
| Nursing / Midwifery | 5.50:1 | 7.40:1 | #b06690 / #ecadd4 |
| BSIT–Computer Technology | 5.57:1 | 7.52:1 | #498bc0 / #8dd0f8 |
| BSEd–Social Studies | 5.38:1 | 7.32:1 | #b97059 / #edac94 |
| BSEd–Mathematics | 5.33:1 | 7.26:1 | #438978 / #82d5b8 |

Names/numbers retain identification without color; bright strips are decorative and do not replace accessible text or control borders. Existing approximate color-vision screening and fallback contrast checks still pass.

## Backup, complete files and Windows commands

Before the first edit, source/configuration, SQLite and uploaded files were preserved under backup-before-theme-access-update-20261002-001055. The delivery ZIP contains 32 complete changed/new source/configuration files listed in THEME-ACCESS-CHANGED-FILES.txt, plus reports, measurements and screenshots. It excludes .env, credentials, databases, private backups, uploads, dependencies and generated build outputs.

No new database/schema migration is required. Stop an old running server with Ctrl+C, then:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm start
```

Open in another PowerShell window:

```powershell
Start-Process 'http://localhost:3000'
```

The existing npm run db:migrate remains safe to repeat. Test commands with the server running: npm run test:access, npm run test:ui, npm run test:archive, npm run test:layout and npm run test:auth. The auth suite intentionally exercises rate limiting; repeated runs can reach the existing fifteen-minute limit. npm run lint, npx tsc --noEmit and npm run build verify source/build health.

## Not verified

- Standalone latest Chrome, Firefox and Safari. Browser UI checks used the available in-app Chromium surface.
- Physical devices, notches and OS-level system-theme/reduced-motion changes. Viewport and deterministic script/media fallback checks were performed.
- A frame-by-frame first-paint video or browser paint trace; no light flash was observed in the tested browser, and pre-paint server/script behavior was verified structurally.
- Formal screen-reader and production performance/hosting audits. Keyboard controls, accessible states and the local optimized build were checked.

References: [Next cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
