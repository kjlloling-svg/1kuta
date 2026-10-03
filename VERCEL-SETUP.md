# Get KUTA running on Vercel

The application is **Next.js**, with server routes, accounts, and private PDFs. Use the **Next.js** preset, not Vite. Vercel runs the website; Turso keeps the database; a private Vercel Blob store keeps PDFs. The approved code changes are ready, but the two storage services must be created and your data imported before the live site can work.

## 1. Create your database

1. Open [Turso](https://turso.tech/) and sign in.
2. In its dashboard, create an empty database, for example `kuta-production`. Choose a region near your Vercel function region if available. Do not create tables manually.
3. Open that database's connection details. Find its database URL and generate a database authentication token with read/write access. Use a **database token**, not an organization API token.
4. Keep those details private. They correspond to `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. You will enter them on your computer and in Vercel; do not send them in chat.

See [Turso's connection guide](https://docs.turso.tech/sdk/ts/quickstart) for the URL/token instructions if the dashboard labels differ.

## 2. Create private PDF storage

1. Open the [1kuta Vercel project](https://vercel.com/1kuta/1kuta).
2. Open **Storage**, choose **Create Database/Create Store**, then **Blob**. The exact create-button wording can vary.
3. Select **Private** access and name it something like `kuta-pdfs`.
4. Connect it to the `1kuta` project for the **Production** environment. Keep previews on separate storage if you later enable them.
5. The integration adds `BLOB_READ_WRITE_TOKEN` to the project. Find this store's token in its connection/settings panel for the local import as well. Never commit it.

Private storage requires authenticated downloads. The app keeps its existing administrator-only PDF access. Browser uploads go directly to Blob, allowing the existing 10 MB limit without passing a large file through a Vercel function. See [private storage](https://vercel.com/docs/vercel-blob/private-storage) and [client uploads](https://vercel.com/docs/vercel-blob/client-upload).

## 3. Save connection details privately on your computer

Open PowerShell and run these commands one at a time:

```powershell
cd C:\Users\KurtJohn\Desktop\1KUTA
npm run sync:stop
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configure-hosting.ps1
```

The setup script asks for four items: the Turso URL, Turso token, private Blob token, and the **same Google client ID your local login already uses**. Paste each value into its local prompt and press Enter. Input is hidden; that is intentional. It also generates a fresh `SESSION_SECRET` for production.

It saves `.env.vercel.local` inside this folder. Git ignores that file. Do not rename it to a public config file, send it in chat, or upload it to GitHub. If it already exists, the script stops instead of replacing it; edit it privately when necessary.

The setup script does not change your existing `.env` or your local database.

## 4. Copy existing data safely

Stop editing accounts, records, and attachments in the local app during this step. Close or stop its local server so data cannot change while the database and PDFs are being copied. Closing a browser tab alone does not stop a background server.

Run the check first:

```powershell
node scripts/migrate-hosting.mjs
```

This makes a consistent backup under `data/hosting-backups/`, checks the database relationships, checks that every referenced PDF exists, and prints counts. **It does not upload anything.** The check on October 2 found four users, two research records, and one PDF. Your counts may change if you edit the app later.

When the check succeeds and the hosted database is still empty, run:

```powershell
node scripts/migrate-hosting.mjs --apply
```

Wait for **Transfer complete**. The script uploads private PDFs, compares their checksums, imports your database in a transaction, and checks row counts and relationships. It preserves account IDs, password hashes, Google identities, roles, research records, authors, bookmarks, and PDF links. Existing login sessions and login-attempt counters are intentionally cleared: sign in again on the website.

Your original local data and backup stay on your computer. The importer refuses a nonempty destination database. If it reports failure, do not delete either database or rerun seed scripts. Share only the non-secret error text. Retrying after an interrupted PDF transfer accepts existing identical files but refuses to overwrite different files.

This is a one-time move. GitHub auto-sync copies code, **not** databases or PDFs. After launch, use the hosted site for real data updates; changes made in the old local database do not automatically appear online.

## 5. Add Vercel environment variables

Open **Project → Settings → Environment Variables**. Add these names for **Production**, using the corresponding values from your private `.env.vercel.local` file:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
BLOB_READ_WRITE_TOKEN
SESSION_SECRET
GOOGLE_CLIENT_ID
```

The Blob integration may already have added its token; do not replace it with a token from another store. Enter each value without the surrounding quotes from the local file. Keep the same `SESSION_SECRET` across production deployments; changing it signs everyone out.

`ARCHIVE_ADMIN_SETUP_TOKEN` is optional only if you deliberately use the existing administrator-bootstrap endpoint. Existing administrator roles are imported, so it is not needed for this migration.

Do not add `DATABASE_PATH`, `PORT`, or a `VITE_` prefix. Next.js serves the Google client ID through the existing login-config endpoint. No frontend environment prefix is needed for this implementation. Its Google ID-token flow does not use `GOOGLE_CLIENT_SECRET`; keep any existing secret credential file off GitHub.

## 6. Check Vercel build settings and redeploy

In **Project → Settings → Build and Deployment**, use:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root; leave the subdirectory field empty |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the override OFF; Next.js manages `.next` |
| Node.js version | 24.x |
| Production branch | main |

The committed `vercel.json` sets the framework and commands. Remove old overrides such as `dist`, `.vercel/output`, Vite, or `pnpm install` from the dashboard. The legacy Vite file remains in the repository but is not the production build entry point.

Open **Deployments** and deploy the latest `main` commit containing these fixes. Check its commit rather than redeploying the old `2578093` build. If the latest deployment happened before environment variables were saved, redeploy that latest commit once the settings and import are complete.

## 7. Allow Google login on the production address

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Choose the project containing your existing web OAuth client.
3. Go to **Google Auth Platform → Clients**, or **APIs & Services → Credentials**, and open the web client whose ID you used above.
4. Under **Authorized JavaScript origins**, add `https://1kuta-azure.vercel.app` with no trailing slash or path. Confirm this is still your assigned production domain in Vercel; add a custom domain too if you use one.
5. Save. Keep your existing localhost entries for local testing.
6. If the consent screen is in testing mode, add the Google account you will use under test users.

This app uses the Google popup and JavaScript callback flow, so no redirect URI is required. Do not invent an `/api/auth/callback/google` endpoint. Preview deployment URLs change; Google login will fail on an unregistered preview origin. Use the stable production URL for your initial test. See [Google's setup instructions](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## 8. Verify the finished site

Local checks (Node 24 installed):

```powershell
npm ci
npm run build
node scripts/test-hosting.mjs
node scripts/test-hosting-runtime.mjs
```

The tests use synthetic data. They do not verify connectivity to your real cloud accounts. After the import and redeploy, open the production site and check:

1. Home page and `/research-papers` load, including a browser refresh on a detail page.
2. Your two original research records appear and your existing administrator password still works.
3. Refresh after login: the session remains. Log out: protected pages are unavailable.
4. Google sign-in works with an allowed account. Existing password/admin accounts are not automatically linked to a Google account with a matching email; that collision protection is intentional.
5. As administrator, download the existing PDF and check its contents. Try an upload below 10 MB, including one above 4.5 MB, then download it. Try replacing and deleting a test attachment.
6. Logged-out visitors and ordinary users cannot download private PDFs or call administrator actions.
7. In Vercel runtime logs there is no `/var/task/data` error. Missing tables mean the import was not completed; missing-variable messages mean settings were not saved for this deployment.

An interrupted browser upload can leave an unlinked private Blob. Keep it private and remove it only after confirming no research record references it; there is no automatic orphan cleanup in this minimal migration.

## 9. Code syncing and automatic deployment

Pushing to `main` triggers a Vercel production deployment when its Git integration is enabled. The existing watcher commits after a 30-second quiet period; that can publish unfinished changes.

For controlled releases, leave it stopped with `npm run sync:stop`, make changes on a development branch, test a preview with separate non-production database/storage, then merge to `main` when ready. The existing watcher deliberately accepts only `main`; using it on `dev` would need a separate adjustment.

If you choose the original automatic-main behavior, start it with `npm run sync` in PowerShell. Stop with Ctrl+C or `npm run sync:stop`. Never add the private environment file, database backups, or PDF folder to Git. Confirm commits in [GitHub](https://github.com/kjlloling-svg/1kuta/commits/main) and corresponding deployments in Vercel.
