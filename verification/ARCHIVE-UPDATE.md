# KUTA archive update — 1 October 2026

## Summary and migration

The requested management fields, public permissions, citation formats and course merge were implemented in the existing application. Login and its demo accounts were preserved.

Source and SQLite backup: `backup-before-archive-update-20261001-214648`. The active SQLite database was snapshotted before edits. Its original PDF attachments are also preserved in the backup. Migration adds a separate snapshot under `data/migration-backups` before changing the schema.

The six retired fields are absent from the active schema and API. The old sections JSON was retired; only its Introduction is preserved in private `full_text`. DOI and the Introduction form input were removed as well so the dashboard matches the remaining-field list. Admins can read any retained Introduction and view/download the attached complete PDF. Retired values remain recoverable in the private snapshots. Historical migrations are kept as history, not rewritten.

Nursing and Midwifery papers now reference one `bs-nursing-midwifery` program. The migration retains paper IDs, author links, file references, users and sessions. It checks paper count and foreign keys inside a transaction, and rolls back on failure. Existing Nursing and Midwifery URLs remain working aliases.

## File changes

| File | Change |
| --- | --- |
| `components/admin-console.tsx` | Removes retired inputs and payload fields; retains requested form fields; fixes upload retry and file-input reset; verifies edits and saves. |
| `lib/paper-input.ts` | Strictly validates the reduced input contract, rejects retired/unknown fields, saves paper and author links atomically. |
| `db/schema.ts` | Removes retired active schema fields; defines private full_text. |
| `db/seed.sql` | Seeds five programs with the merged Nursing/Midwifery group. |
| `db/seed-demo.sql` | Removes retired sections; retains only a fictional Introduction and permitted demo metadata. |
| `scripts/migrate-archive.mjs` | Backs up SQLite, migrates fields and merged programs transactionally, checks preservation. |
| `scripts/run-migrations.mjs` | Adds an explicit PowerShell-friendly migration entry point. |
| `scripts/local-database.mjs` | Runs migration once; executes transaction batches synchronously to avoid interleaved writes. |
| `scripts/seed-demo.mjs` | Adds an optional, clearly fictional sample seed. |
| `lib/archive.ts` | Selects active fields, projects public/admin responses separately, resolves old course filters, orders the five programs. |
| `app/api/papers/route.ts` | Uses actual admin role for private fields and management visibility. |
| `app/api/papers/[id]/route.ts` | Returns only permitted public data; admin responses include retained full text; protects edits/deletes. |
| `app/api/papers/[id]/sections/route.ts` | Returns 403 to every non-admin; exposes retained text only to admins. |
| `app/api/papers/[id]/download/route.ts` | Restricts all downloads to admins; supports permission-checked inline PDF viewing. |
| `app/api/research-papers/[slug]/abstract/route.ts` | Makes public abstracts readable without login. |
| `components/interactive-paper-card.tsx` | Removes public full-paper, PDF and bookmark controls; shares the citation chooser; shows admin actions only to admins. |
| `components/detail-actions.tsx` | Provides admin-only full-paper/PDF controls and viewer. |
| `app/research-papers/[slug]/page.tsx` | Shows public abstract/basic metadata; serializes private controls only for admins. |
| `components/paper-card.tsx` | Removes extra category metadata from public home cards. |
| `lib/site-info.mjs` | Defines one site-wide archive/publisher name for citations. |
| `lib/citations.ts` | Implements all eight styles, author-count rules, italic preview segments, and sanitized BibTeX/RIS exports without file URLs. |
| `lib/clipboard.mjs` | Copies rich/plain text with a dialog-safe fallback and manual-copy result. |
| `components/citation-panel.tsx` | Accessible format chooser, preview, copy feedback and citation-only exports; editable reference number for IEEE/Vancouver. |
| `lib/programs.ts` | Defines the five-program catalog and canonical merged slug. |
| `components/archive-explorer.tsx` | Canonicalizes legacy filter URLs; corrects initial state scheduling. |
| `components/archive-stats.tsx` | Corrects reduced-motion state scheduling; counts still reflect verified records. |
| `app/page.tsx` | Shows five program cards and updates the pathway count. |
| `app/programs/page.tsx` | Shows five groups and derives its numbering from the catalog. |
| `app/faq/page.tsx` | Removes retired metadata claims; explains public/admin access and course merge. |
| `app/globals.css` | Preserves existing theme; styles citation previews, keyboard focus and admin PDF viewer. |
| `lib/local-env.ts` | Marks the existing upload options argument as intentionally accepted. |
| `package.json` | Adds db:migrate, seed:demo and test:archive scripts. |
| `tsconfig.json` | Excludes the new source backup from compilation. |
| `.gitignore` | Excludes the private source backup. |
| `README.md` | Documents the updated behavior, migrations, verification and optional demo seed. |
| `scripts/test-archive.mjs` | Tests CRUD, PDF access, public projections, merged filters, migration preservation, citations and blocked clipboard fallback. |

## Verification results

| Requested check | Result and evidence |
| --- | --- |
| Six removed fields gone | PASS: inspected admin add/edit UI, active schema and strict API input/output. Historical snapshots preserve original values. |
| Admin add/edit/delete | PASS: API tests; browser created and edited a temporary demo record successfully; protected API deleted it afterward. |
| Public title/abstract/basic details only | PASS: visitor and public-account list/detail responses lack private fields; HTML lacks full-paper/PDF controls. Logged-out abstract opened in browser. |
| Direct download/full text blocked | PASS: 403 for both visitor and public-account requests, even with admin=1; direct static-file paths return 404. |
| Admin PDF access | PASS: browser opened the retained private Introduction; upload and exact downloaded-byte comparison, admin full-text access; inline serving implemented and permission checked. |
| Eight citation formats | PASS: browser copied all eight formats while logged out, as a public account, and as an admin; clipboard matched each preview; automated output checks cover 0, 1, 2, 3, 7 and 21 authors, formatting and private-field omission. |
| Blocked clipboard | PASS in simulated permission-denial tests: fallback copies exact text, restores focus, or returns manual-copy feedback if copying is also blocked. |
| One merged course and working filters | PASS: API has exactly five programs; new and both legacy slugs return merged records. Browser dropdown has one merged choice. Home shows five cards. |
| Migration preserves records | PASS: fixture with both old courses retains all papers, author links, file references and Introduction text; foreign-key checks pass; repeat migration is a no-op. |
| Working login retained | PASS: full original authentication regression suite after archive changes. |
| Console/server errors | PASS: no console warnings/errors captured during tested public/admin flows; server test responses succeeded with expected 400/403/404 cases. |
| TypeScript | PASS. |
| Lint | PASS with zero errors and two existing warnings (local font stylesheet link and home-search navigation). |
| Design and welcome header | PASS: browser inspected existing Inter, campus/bokeh and glass/neumorphic styling, welcome header and updated dashboard. |

A clearly labeled fictional sample paper was seeded for citation checks. The user's pre-existing test paper and PDF were preserved. Temporary API/browser verification records were removed after testing.

## Verification limits

- Other browsers, mobile layouts and screen-reader software were not tested.
- Clipboard permission denial was simulated in automated tests, not forced in the real browser.
- Citation export showed download confirmation, but the browser automation did not return a saved-file path, so downloaded BibTeX/RIS files were not opened. Their text generation and copying were verified.
- PDF bytes and access controls were verified; visual rendering of arbitrary uploaded PDFs inside the browser's PDF viewer was not verified.

Citation templates use the available archive-report metadata; Harvard uses an author-date variant and Chicago uses bibliography formatting. Author rules were checked against [MLA Style Center](https://style.mla.org/same-author-different-coauthors/), [Chicago citation guidance](https://www.chicagomanualofstyle.org/tools_citationguide/citation-guide-1.html), [APA report guidance](https://apastyle.apa.org/style-grammar-guidelines/references/examples/report-individual-authors-references), and the [IEEE Reference Guide](https://journals.ieeeauthorcenter.ieee.org/wp-content/uploads/sites/7/IEEE_Reference_Guide.pdf). Vancouver formatting uses surname/initials and publisher/year conventions from [NLM Citing Medicine](https://www.ncbi.nlm.nih.gov/books/NBK7256/).

## PowerShell migration and run

Stop the previous server with Ctrl+C, then:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
npm run db:migrate
npm start
```

Open in another window:

```powershell
Start-Process 'http://localhost:3000'
```

Verification with the server running:

```powershell
npm run test:archive
npm run test:auth
npm run lint
```

No new dependencies were required for this update. `npm install` remains available for fresh setups. The archive update ZIP contains complete updated code and this report, not private databases, secrets, original PDFs or backup folders.


