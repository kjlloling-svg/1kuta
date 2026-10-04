# KUTA setup

Authentication is now Google-only. See [GOOGLE-ONLY-AUTH.md](GOOGLE-ONLY-AUTH.md) for Google Cloud, Vercel, private administrator setup and test instructions. This guide supersedes authentication instructions in historical update documents below.

Requires Node.js 24.x. Use npm (Vercel runs npm ci). Production uses Next.js, Turso and private Vercel Blob; local development uses SQLite and local PDF storage.

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm ci
npm run seed
# Set GOOGLE_CLIENT_ID in your private .env, then:
npm start
```

The seed creates private local configuration and initializes the database. It never creates password accounts. Sign in with Google first, then run `npm run admin:google -- --local` to promote your local Google account. Existing data is preserved. Google sign-in requires an internet connection and the correct authorized origin.

GitHub upload and automatic syncing: [SYNC.md](SYNC.md). Keep the watcher stopped while editing authentication, and push completed, tested changes.

```powershell
npm run test:auth
npm run build
npm run test:auth:http
```

The new authentication suites run against disposable databases and synthetic signed test tokens, without contacting Google or changing hosted data. The HTTP suite starts and stops its own production server. Research and layout regression suites can also run in this isolated server with `node scripts/test-google-http.mjs --regressions`.

## Archive management update

The dashboard now contains only title, authors, program, year, department, category, keywords, abstract, admin-only PDF upload, and status. The retired six fields are absent from the active database, UI and API. DOI and the separate Introduction input were also removed to match this field list. Existing Introduction text is retained as private `full_text`, accessible only to administrators; complete papers are available to admins through the attached PDF.

All pages and research APIs require Google sign-in. Signed-in public accounts can read abstracts and cite in all formats. They receive no file information or private full text from paper APIs. Full-text/PDF endpoints return 403 for non-admins, and uploaded PDFs are kept outside public static files. Administrators can view PDFs inline or download them, including pending/demo records.

The program group is **BS Nursing / Diploma in Midwifery** (`bs-nursing-midwifery`). Old `bs-nursing` and `diploma-midwifery` filter URLs still resolve to the merged group. The catalog has five programs.

Stop a running server with Ctrl+C before updating a database from an older code version. Then run:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run db:migrate
npm start
```

Migrations also run automatically during startup. `db:migrate` is safe to repeat. It takes a SQLite snapshot under `data/migration-backups`, removes the retired active columns, retains Introduction text privately, reassigns papers to the merged program, removes the two old program rows, and checks paper counts and foreign keys inside a transaction. Failed migrations roll back. Historical migration files stay intact; retired values remain in the private backup snapshots.

A source/database backup is in `backup-before-archive-update-20261001-214648`; original PDF attachments are included there as well. No existing paper or attachment was deleted by the migration.

For signed-in users, Cite opens a keyboard-accessible chooser with APA 7, MLA 9, Chicago bibliography, Harvard author-date, IEEE, Vancouver, BibTeX and RIS. It previews formatting, copies plain text and rich text when supported, and falls back to a dialog-safe copy method or manual selection when clipboard access is blocked. BibTeX and RIS exports contain citation text only. All formats use the shared archive/publisher constant and never add file URLs.

Verify with the server running:

```powershell
npm run test:archive
npm run test:auth
npm run lint
```

Optional fictional sample (clearly labeled demo; never verified):

```powershell
npm run seed:demo
```

See `verification/ARCHIVE-UPDATE.md` for per-file changes, test results, and verification limits.

## Theme, locality and details fix

The interface uses warm cream/stone light colors and green-gray dark colors from the single token block in app/globals.css. Content surfaces are opaque; the header and mobile menu are opaque, while dialogs retain a light 6px backdrop blur with an opaque fallback. The supplied SLSU logo is copied locally and rendered with next/image. The compressed locality photograph is decorative, lazy-loaded, contained without cropping, and appears on the homepage only. Inter is bundled through next/font/local.

The global scroll progress bar uses passive listeners, requestAnimationFrame and ResizeObserver without React scroll-state rerenders. It hides on short pages and disables its transition under reduced motion. Home search and archive statistics are supplied by Server Components; the stats strip uses a small client count-up component; search filters retain their 300ms debounce. Role is passed once from the server to the archive explorer, avoiding one session request per card.

SQLite rows are mapped explicitly through lib/archive-dto.ts. Paper, author and citation objects have plain prototypes, dates become ISO strings, integers are checked for safe conversion, and public projections exclude private paper data. Author suffixes are preserved, including BibTeX surname/suffix/given order.

Source/database/upload backup: backup-before-ui-update-20261001-223122. Original ESSENTIALS images remain untouched. No dependencies were installed for this update.

With npm start already running, check:

```powershell
npm run test:ui
npm run test:archive
npm run test:auth
npm run lint
npx tsc --noEmit
node scripts/verify-theme.mjs
```

See verification/UI-UPDATE.md for per-file changes, results and limitations; verification/THEME-CONTRAST.md lists both palettes and all measured contrast pairs. The complete changed files are in KUTA-ui-update-complete-files.zip. It excludes secrets, the live database, private backups, dependencies and generated build files.


## Header, welcome, keyword and department update

Runtime confirmed: Next.js 16.3.4 with Turbopack through the local Express server. Header height and the 4px progress rail share CSS variables; the safe-area inset is reserved once. The keyboard skip link is fixed outside document flow. Mobile navigation is an accessible full-width disclosure below the header with all account controls, a solid background, 44px targets and scrolling on short screens.

Home now has one KUTA welcome hero, two actions, local-font search and server-supplied statistics with an intersection-triggered count-up and reduced-motion fallback. The 44px logo preloads only 44px/88px density variants.

Keywords normalize at the DTO/input boundary, render as working chips (four plus a filter for another keyword), and export cleanly in BibTeX/RIS. Migration 0004_normalize_keywords changes only keyword values and snapshots SQLite first if anything needs changing. The two existing records were already canonical; zero records changed here. Five department accents and an unknown-program fallback are defined in lib/departments.ts and the theme tokens.

After stopping an old server with Ctrl+C:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run db:migrate
npm start
```

In another window, with the server running:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run test:layout
npm run test:ui
npm run test:archive
npm run test:auth
npm run lint
npx tsc --noEmit
Start-Process 'http://localhost:3000'
```

No new dependencies are required for this update. Backup: backup-before-header-update-20261001-231214 (source, private configuration, SQLite snapshot and uploads). See verification/HEADER-UPDATE.md for the diagnosis, complete file manifest, measurements and limits; verification/DEPARTMENT-PALETTE.md contains both palettes and contrast ratios. KUTA-header-update-complete-files.zip contains complete changed/new files, excluding secrets, database snapshots, uploads and dependencies.


## Theme, inset accents and guest access update — 2 October 2026

Theme choices persist in both the kuta-theme cookie and archive-theme localStorage. The root layout renders the cookie theme; a blocking head script migrates older localStorage preferences or applies the system preference before paint. Native theme checkboxes expose matching checked state; initialization/toggling briefly suppresses transitions. Back/forward snapshots reload instead of restoring session-dependent content. HTML, RSC and APIs use private no-store responses varied by Cookie.

Card accents are clipped 6px inset gradient edges with restrained light/dark glow and visible department names. Credits on About and the footer now say **Kurt John Lenoel Loling**. No matching researcher name existed in seed files or database rows, so no name migration was needed.

Guests receive no abstract field, abstract text or citation output. The abstract and citation endpoints return 401 without a valid session. Signed-in readers can read abstracts and use all eight citation formats; paper/PDF access remains admin-only. Cite now requests authenticated server output for preview, copy and citation-text export. Login links return to the validated same-site paper path and show an unlock confirmation. Existing native navigation is retained.

No new dependencies or schema migration are needed. Stop an old running server with Ctrl+C, then:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run db:migrate
npm start
```

With the server running:

```powershell
npm run test:access
npm run test:ui
npm run test:archive
npm run test:layout
npm run test:auth
npm run lint
npx tsc --noEmit
```

Backup: backup-before-theme-access-update-20261002-001055. See verification/THEME-ACCESS-UPDATE.md and verification/DEPARTMENT-PALETTE.md for results, exact changes and limits. Complete files are in KUTA-theme-access-update-complete-files.zip; private configuration/data/backups and dependencies are excluded.
