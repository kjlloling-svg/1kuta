# GitHub auto-sync

Remote: https://github.com/kjlloling-svg/1kuta — branch `main`.

## Authentication (one time)

The portable official GitHub CLI is in the ignored `.sync/tools/gh/bin` folder:

```powershell
Set-Location 'C:\Users\KurtJohn\Desktop\1KUTA'
.\.sync\tools\gh\bin\gh.exe auth login --hostname github.com --git-protocol https --web
.\.sync\tools\gh\bin\gh.exe auth setup-git --hostname github.com
.\.sync\tools\gh\bin\gh.exe auth status
```

Sign in as `kjlloling-svg` in the browser, enter the displayed device code, and authorize GitHub CLI. Never paste a token into source code or the remote URL. Keep the portable CLI folder in place after configuring it as the credential helper. A fresh clone needs GitHub CLI installed separately (https://cli.github.com/).

## Start, stop, and test

```powershell
npm run sync
```

Keep that terminal open. Press **Ctrl+C** to stop. No new npm packages are needed (Node 22.13+ and Git must be available). It is a long-running watcher, not a Windows login/startup service; restart it after reboot.

To stop a watcher running in the background, use `npm run sync:stop` from another terminal. It finishes the current Git operation before stopping. To start it hidden in the background on Windows:

```powershell
Start-Process -FilePath (Get-Command node).Source -ArgumentList 'scripts/sync.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput '.sync/watcher-output.log' -RedirectStandardError '.sync/watcher-error.log'
```

The initial setup starts it this way. Use `Get-Content .sync/sync.log -Tail 20` to check progress. Stop the background copy before using `npm run sync` in the foreground.

The watcher checks Git-eligible files every two seconds and waits 30 seconds after the last observed change. Creates, edits, deletions and renames are included. Nested `.gitignore` rules are respected; `.git` and ignored files are excluded. Empty changes produce no commit. An existing unpushed commit is retried after startup, even without new edits. Very short changes reverted between polls have nothing to upload.

Each batch runs `git add -A`, commits actual changes as `Auto-sync: <UTC timestamp>`, runs `git pull --rebase origin main`, and runs `git push origin main`. Errors are written to `.sync/sync.log` and retried after 60 seconds. The watcher never force-pushes, resets, or automatically discards conflicts. Work on `main`; stop the watcher before manual Git operations. Do not run multiple watchers.

To test, add a harmless line to README.md, save, and wait about 35 seconds. Check:

```powershell
git status --short
git log -3 --oneline
git ls-remote origin refs/heads/main
Get-Content .sync/sync.log -Tail 20
```

Confirm the latest commit at https://github.com/kjlloling-svg/1kuta/commits/main. Revert your test line and wait again to sync its removal.

If a rebase conflicts, stop the watcher, run `git status`, resolve the listed files, then `git add <resolved-files>` and `git rebase --continue`. Alternatively, `git rebase --abort` returns to the pre-rebase state. Restart the watcher when ready. Offline or authentication failures keep commits locally for retry.

Automatic syncing publishes all eligible files, including unfinished work. Keep credentials in ignored environment files. The initial scan is not a guarantee that future source edits contain no secrets.

Excluded: `.env*`, OAuth credential JSON, private keys, local databases, dependency/cache folders, build output, logs, backups and the existing project ZIP archives. SQL schema/migration source files remain included.
