# Public browsing changed files

The accompanying public-browsing-full-source.zip contains each file below in full, with its project-relative path. It contains no private configuration or data.

| File | Purpose |
|---|---|
| GOOGLE-ONLY-AUTH.md | Mark the old blanket login policy as superseded without changing Google setup instructions. |
| README.md | Point to the current public-browsing rules. |
| app/api/keywords/route.ts | Restore anonymous metadata access while preserving private fields and write permissions. |
| app/api/papers/[id]/citation/route.ts | Require a verified session and return 403 for restricted data. |
| app/api/papers/[id]/route.ts | Restore anonymous metadata access while preserving private fields and write permissions. |
| app/api/papers/route.ts | Restore anonymous metadata access while preserving private fields and write permissions. |
| app/api/programs/route.ts | Restore anonymous metadata access while preserving private fields and write permissions. |
| app/api/research-papers/[slug]/abstract/route.ts | Require a verified session and return 403 for restricted data. |
| app/api/stats/route.ts | Restore anonymous metadata access while preserving private fields and write permissions. |
| components/citation-panel.tsx | Handle 403/expired sessions and display Google sign-in inside the citation dialog. |
| components/interactive-paper-card.tsx | Check abstract access at click time, rather than displaying stale cached abstract content. |
| components/locked-research.tsx | Show the requested prompt and reuse Google login in an existing-style dialog. |
| components/site-shell.tsx | Label the existing guest link Sign in with Google and mount the invisible session refresh checker. |
| lib/api.ts | Return the exact restricted-content 403 response and log timestamp, IP, endpoint and reason. |
| proxy.ts | Remove public-page login redirects; retain private admin/API gates and add anonymous request limits. |
| scripts/test-archive.mjs | Update automated tests for public metadata and restricted features. |
| scripts/test-google-http.mjs | Update automated tests for public metadata and restricted features. |
| scripts/test-theme-access.mjs | Update automated tests for public metadata and restricted features. |
| tsconfig.json | Exclude ignored source-delivery bundles from application type-checking. |
| verification/THEME-ACCESS-TESTS.txt | Record updated access verification results. |
| PUBLIC-BROWSING.md | Document routes, access rules, testing, deployment and current feature inventory. |
| components/session-refresh.tsx | Refresh current page when server-verified session identity changes across tabs or expires. |

Checks passed: production build, Google authentication tests, production HTTP tests, research/PDF/theme/layout regression tests, targeted ESLint, and git diff whitespace checks. Browser-only Google popup and cross-tab interactions remain in the manual walkthrough in PUBLIC-BROWSING.md. No CSS, database records, hosted secrets, or Vercel configuration were changed.
