# Research record form and batch import

Implemented on `codex/admin-batch-import`. Testing used isolated local data; the production Demo audit was read-only.

## Decisions

- **Department:** the existing column is already nullable. Keep it, ignore it in new writes, preserve existing values on edits, and remove it from forms, payloads, DTOs, details, and citations. No migration is required. The internal `departments` accent helpers and year-summary property describe programs, not the retired database field; they remain to preserve existing program styling and analytics.
- **Demo:** new records accept only `pending` and `verified`. Editing an existing Demo record preserves its status. A read-only audit of `kuta-production` on October 13, 2026 returned **0 Demo records**, so there are none to list for review. Preservation was tested with local fixtures.
- **Year:** 2009 through the current year in Asia/Manila, newest first, default current year. The server calculates the upper limit at validation time. Search/year summaries use the same range.
- **Category:** read-only Research Paper in the form, enforced by the shared server schema and write helper. Existing records are not bulk modified.
- **Authorization:** retain the existing `requireAdmin` access check and same-origin protection. This repository has `admin` and `public` roles, not a separate staff role. Staff must have the existing administrative role; no permissions were expanded.
- **Batch size:** CSV/XLSX, exactly seven template columns, one XLSX worksheet, at most 500 physical data rows and 5 MiB. Files are parsed locally; only validated row chunks are sent to the server. Each server request is independently authorized, limited to 20 rows/2 MB, and validated again.
- **Import scope:** metadata only. Existing PDF attachment workflows remain available on individual records.
- **Dependency:** ExcelJS is loaded only when parsing XLSX. No new database or storage service is needed.

## Template

`title,authors,program,year,abstract,keywords,status`

Required values: title, authors, program, year. Authors use `Given name | Family name`, separated by semicolons or new lines. Program accepts a code from the expandable instructions or the exact full program label. Abstract/keywords are optional. Blank status defaults to pending. Replace the downloadable template's example row.

## Implementation

- `components/admin-console.tsx`: corrected form, save lock/loading, retained error values, six-second dismissible status toast.
- `components/batch-importer.tsx`: template, parsing, row preview, confirmation dialog, progress, summary and error report.
- `lib/record-validation.ts`: shared field validation, dynamic year, author parsing, program matching, safe CSV output.
- `lib/import-file.ts`: bounded CSV/XLSX parser, ZIP expansion checks, formula rejection.
- `lib/paper-write.ts`: parameterized transactional writes and retry-safe duplicate prevention. Historical duplicates remain editable if their identity is unchanged.
- `app/api/admin/import/route.ts`: authenticated preview/import endpoint; invalid rows are skipped and failed writes are reported individually.

## Verification checklist

- [x] Department omitted from the application data contract; nullable legacy data preserved without migration.
- [x] Dynamic year dropdown and server bounds; read-only/server-enforced Research Paper; no new Demo status.
- [x] Single save succeeds and resets; duplicate errors retain entered data; loading blocks repeat submits; success toast uses `role=status` and can be dismissed.
- [x] CSV quoted commas/newlines/BOM and XLSX parsing tested; formulas, invalid programs/years/statuses, missing authors, file and row limits rejected.
- [x] Preview detects within-file and existing-archive duplicates. A browser test produced 2 added, 3 skipped, 0 failed.
- [x] Confirmation precedes writes; Escape closes the native dialog and focus returns to the trigger.
- [x] Error CSV downloaded and contents verified, including separate messages for invalid years and both duplicate cases. CSV cells are escaped against formula injection.
- [x] Full 500-record batch imported to an isolated local database in 20-row requests; progress is announced and displayed during work.
- [x] Guest/public access and cross-origin mutations denied; direct API calls cannot bypass field checks. Transaction failure rolls back paper and author links; duplicate retries do not insert another record.
- [x] Single form and batch preview checked at 320, 375, 768, 1024, 1280 and 1440 pixels in both themes with no horizontal page overflow. The wide preview table scrolls inside its own keyboard-focusable region.
- [x] Labels, live error/status messages, native keyboard controls, visible focus and existing light/dark contrast tokens retained. Targeted checks are not a full-site WCAG certification.
- [x] TypeScript, targeted ESLint, transaction/parser tests and Next.js production build passed.

## Reproducing tests

Run `npm run test:record-import` for the in-memory validation/transaction/parser tests.

For isolated HTTP/browser checks, run `node scripts/test-import-server.mjs`. It binds only to localhost:3018, uses `data/import-verification.sqlite`, creates synthetic accounts with an ephemeral session secret, and refuses a Vercel/Turso environment. Pass its printed local admin URL to `node scripts/test-import-http.mjs <local-test-url>`. This test creates synthetic records only in that local test database. Stop the server after testing. The fixture login route is not part of Next.js and is never deployed.

Deployment should publish this branch's application code and lockfile together. No migration or environment-variable changes are needed. Production import behavior still depends on normal database availability; interrupted requests can be retried safely, with already-saved records skipped.
