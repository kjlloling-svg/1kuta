# Vercel fixes — October 2, 2026

Verdict: Yes, with the approved hosted database and private PDF storage changes. Code builds successfully; live deployment and cloud connectivity remain unverified until the services, secrets, and data import are completed.

## Numbered causes and changes

1. **Blocker: home page crashed while creating /var/task/data.** Importing lib/local-env.ts immediately opened local SQLite and created a directory. Vercel cannot persist application data there. Before: eager localDatabase import. After: lazy remote database selection, using Turso over HTTPS on Vercel and retaining SQLite for ordinary local development. Files: lib/local-env.ts:1; lib/runtime-database.mjs:2, :5, :17. SQL call sites retain their existing interface. The build passed after this fix.
2. **Blocker: runtime PDF writes used the local disk.** Before: data/uploads filesystem storage. After: private Vercel Blob storage when hosted; local storage remains available for local development. File: lib/paper-storage.mjs:5, :10; connected in lib/local-env.ts:3. Credentials are read only on the server.
3. **Needs change: existing 10 MB uploads exceed Vercel's 4.5 MB function request limit.** Before: the entire multipart PDF passed through the upload route. After: small authenticated prepare/complete requests and direct browser upload to private storage. Signed 15-minute tickets restrict the administrator, paper, path, and size; the server checks PDF bytes before linking the file. Files: lib/upload-paper.ts:2; lib/upload-ticket.mjs:5; app/api/papers/[id]/upload/route.ts:17; app/api/papers/[id]/upload/token/route.ts:1; components/admin-console.tsx:6, :47. Existing visual controls and access rules stay the same. Initial new TypeScript JSON-response typing errors were corrected in lib/upload-paper.ts; the build then passed.
4. **Needs change: cloud visitors shared the local fallback login limit.** Before: login only looked for the header supplied by the local Express launcher, so Vercel requests shared the value local. After: Vercel's forwarded client IP identifies requests; rate-limit increments are one atomic SQL statement to work across function instances. Files: lib/client-ip.mjs:1; app/api/auth/login/route.ts:3, :16; app/api/auth/google/route.ts:4, :20; lib/auth.ts:44. The build passed after this fix.
5. **Blocker in the earlier log: outdated pnpm lockfile.** Before: Vercel selected pnpm automatically and stopped before building. After: vercel.json:1 explicitly selects Next.js, npm ci and npm run build. package-lock.json includes the two required storage SDKs; package.json:29, :31 declares them. The existing pnpm and Vite files are preserved; npm is the deployment installation path. A fresh npm ci and production build passed from a clean copy of publishable files.
6. **Minor: open-ended Node version warning.** Before: package.json allowed any Node version above 22.13.0. After: package.json:6 selects 24.x, with the npm lock's root metadata synchronized. This is a supported Vercel runtime and matches the local validation environment. The build passed after the configuration fix.
7. **Earlier TypeScript blocker: missing local Vite plugin files.** vite.config.ts imports ignored build helper files belonging to the earlier preview environment. The repository already contained the targeted fix in commit 669a090: tsconfig.json:54 excludes vite.config.ts from the Next production type check. That commit was pulled and retained. The local vite.config.ts was read in full and matches the committed file; it is preserved unchanged in the resulting repository. Its development host/plugins and absence of explicit base/outDir are irrelevant to next build; no Vite output override should be used.
8. **Required migration/configuration, still manual:** local records and PDFs are not in Git and cannot arrive through a code deployment. scripts/configure-hosting.ps1:1 privately collects connection details; scripts/migrate-hosting.mjs:1 creates consistent backups and runs the import; scripts/hosting-import.mjs:8, :29, :47 verifies files and transfers schema/data without overwriting an existing database. The dry run verified four users, two papers and one PDF. No cloud import has run because neither hosted service exists yet.

## Additional files

- scripts/test-hosting.mjs: isolated migration, remote-adapter, rollback, and upload-capability tests.
- scripts/test-hosting-runtime.mjs: production Next server with an isolated synthetic database, running existing authentication/archive/Google-verification tests.
- VERCEL-SETUP.md: detailed dashboard, private configuration, import, Google origin, deployment, testing, and auto-sync instructions.
- VERCEL-CHANGES.md: this report and the complete final configuration files below.

No UI redesign, unrelated dependency upgrade, source-file deletion, or conversion to Vite was performed. The sole admin component behavior change sends PDFs through the hosted upload path. Secrets, local database files, backups and PDFs remain ignored by Git.

## Checks and commands

Relevant commands used for the fix and validation:

~~~powershell
node scripts/sync.mjs --stop
git pull --ff-only origin main
npm install @libsql/client --save-exact --ignore-scripts
npm install @vercel/blob --save-exact --ignore-scripts
npm install --package-lock-only --ignore-scripts
npm run build
node scripts/test-hosting.mjs
node scripts/migrate-hosting.mjs
node scripts/test-hosting-runtime.mjs
npm ci
npm run build
git diff --check
~~~

The build was run after each application fix; the final npm ci/build pair ran in a fresh temporary copy without local environment files, ignored build helpers, SQLite data, or existing node_modules. VERCEL=1 was set for the clean build. PowerShell syntax checking passed for configure-hosting.ps1. A TypeScript-based import audit checked 249 application imports against exact publishable filename casing. Existing runtime tests passed for login/logout, session persistence, cross-origin protection, rate limiting, page refresh, research CRUD, PDF upload/download and private-data restrictions. Google verification tests used synthetic signed tokens and checked rejected signatures, audiences, issuers, expiry, nonce and email status.

Remote-adapter and import tests used a local libSQL client and synthetic records. They checked account fields/roles/password hashes/Google IDs, record relationships, preserved ID sequences, nonempty-target refusal and rollback. This is not proof of connectivity to a real Turso database or private Blob account. Real direct uploads, streamed downloads on Vercel, and interactive Google login require the manual deployment smoke test in VERCEL-SETUP.md.

The automatic watcher was stopped for this work and is left stopped while the services/data are being configured. The approved code push is separate from importing data. Starting the existing watcher with npm run sync resumes its original main-branch behavior.

## Full final vite.config.ts (unchanged)

~~~typescript
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";
import { connectorPreview } from "./build/connector-preview-plugin.mjs";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const localBindingConfig = {
  main: "./build/sites-worker.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      connectorPreview(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          ...(command === "serve"
            ? {
                services: [
                  {
                    binding: "CONNECTORS",
                    service: "sites-connector-preview",
                    entrypoint: "ConnectorPreview",
                  },
                ],
              }
            : {}),
        },
        ...(command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./build/connector-preview-worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
    ],
  };
});
~~~

## Full final vercel.json (added)

~~~json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
~~~

## Vercel environment variable names

~~~text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
BLOB_READ_WRITE_TOKEN
SESSION_SECRET
GOOGLE_CLIENT_ID
~~~

ARCHIVE_ADMIN_SETUP_TOKEN is optional for the existing bootstrap endpoint and unnecessary when importing existing administrator accounts. GOOGLE_CLIENT_SECRET is not used by this Google ID-token flow. No secret should have a VITE_ or NEXT_PUBLIC_ prefix.

## References

- [Vercel private storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Direct client uploads](https://vercel.com/docs/vercel-blob/client-upload)
- [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Trusted Vercel request headers](https://vercel.com/docs/headers/request-headers)
- [Google web login setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
