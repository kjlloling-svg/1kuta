# Setup record — 2026-10-02

Working folder: `C:\Users\KurtJohn\Desktop\1KUTA`.

## Files changed

- `.gitignore`: expanded existing exclusions for OAuth files, environment files, keys, databases, Python environments, logs, generated output, local backups, ZIP deliveries and `.sync/`.
- `package.json`: added `npm run sync` and `npm run sync:stop`; no dependency installation required.
- `README.md`: retained existing documentation and added a link to `SYNC.md`.
- `scripts/sync.mjs`: dependency-free Git-aware polling watcher.
- `scripts/test-sync.mjs`: isolated integration tests using temporary local repositories under `.sync/`.
- `SYNC.md`: authentication, usage, testing and conflict recovery instructions.
- `SYNC-SETUP.md`: this record.
- `.sync/tools/gh/`: official portable GitHub CLI (ignored, never uploaded).
- `.git/`: initialized repository metadata (never part of commits).

## Inspection commands

The session ran these commands, with some checks repeated after changes:

```powershell
Get-Location
rg --files -g AGENTS.md -g '!node_modules' -g '!.git' -g '!venv'
git rev-parse --is-inside-work-tree
git status --short
git remote -v
Get-ChildItem -Force | Select-Object Mode,Name
Get-Command git,gh,node,python -ErrorAction SilentlyContinue | Select-Object Name,Source
Get-Content .gitignore
Get-Content package.json
Get-Content README.md -TotalCount 70
Get-ChildItem scripts -Name
node --version
git config --get user.name
git config --get user.email
git config --get credential.helper
git credential-manager --version
Get-Content .npmrc
Get-Content .openai/hosting.json
rg --files vendor -g AGENTS.md -g package.json
Get-ChildItem vendor -Force | Select-Object Mode,Name
Get-Command winget -ErrorAction SilentlyContinue | Select-Object Name,Source
```

Additional read-only inspections looked for parent `AGENTS.md` files, GitHub CLI/winget installations, source files excluding generated/dependency/backup folders, and files over 50 MB. PowerShell `Select-String` scanned candidate files for embedded passwords, client secrets, API keys, tokens, known credential prefixes and private-key headers. Results exposed only paths and line numbers. Follow-up `Get-Content`/`rg` inspections reviewed the matching login form, test scripts, authentication modules, seed scripts, setup documentation and verification reports. Actual `.env` secrets were not printed. The real credentials found were already environment configuration excluded from upload; source matches were UI messages and deliberately invalid test values.

## Setup and verification commands

```powershell
git init -b main
git remote add origin https://github.com/kjlloling-svg/1kuta.git
git ls-files --others --exclude-standard
git check-ignore .env .env.example client_secret-test.json credentials-test.json verification/example.sqlite build/example.js .sync/tools/gh/bin/gh.exe
git diff --check
node --check scripts/sync.mjs
node scripts/test-sync.mjs
```

Some repository inspections used `git -c safe.directory=C:/Users/KurtJohn/Desktop/1KUTA ...` because the restricted tool account differs from the folder owner. A trust exception for this exact directory was subsequently added under the user's account so normal Git and the watcher work. Tests use separate local Git repositories and do not push fixtures to GitHub. The first two test runs exposed Windows newline assumptions in the fixtures, which were corrected with `core.autocrlf=false` at clone time. The final integration run passed all scenarios.

GitHub CLI was downloaded from the official release API with these commands:

```powershell
$release = Invoke-RestMethod 'https://api.github.com/repos/cli/cli/releases/latest'
$asset = $release.assets | Where-Object name -Match 'windows_amd64.zip$' | Select-Object -First 1
New-Item -ItemType Directory -Force .sync/tools | Out-Null
Invoke-WebRequest $asset.browser_download_url -OutFile .sync/tools/gh.zip
Expand-Archive .sync/tools/gh.zip .sync/tools/gh -Force
Get-ChildItem .sync/tools/gh -Recurse -Filter gh.exe | Select-Object FullName
.\.sync\tools\gh\bin\gh.exe auth status
.\.sync\tools\gh\bin\gh.exe auth login --hostname github.com --git-protocol https --web
```

Authentication and final upload outcome are reported in the chat. Browser authorization requires the repository owner's participation. No token or password belongs in any command recorded here.

Authentication completed as `kjlloling-svg`. Additional commands run:

```powershell
.\.sync\tools\gh\bin\gh.exe auth setup-git --hostname github.com
.\.sync\tools\gh\bin\gh.exe repo view kjlloling-svg/1kuta --json nameWithOwner,isEmpty,visibility,defaultBranchRef
git config --global --add safe.directory C:/Users/KurtJohn/Desktop/1KUTA
git remote -v
git ls-remote origin
git fetch origin
git log origin/main -5 --oneline
git ls-tree -r --name-only origin/main
git show origin/main:README.md
git status --short
git config --get-regexp '^credential\.'
```

The remote was public and contained commit `5a67f7a` with only a two-line README. That existing history is preserved, with the project's fuller README replacing the placeholder in the new commit. An early staging attempt failed on the ownership check before staging any files; it was repeated after adding the directory trust exception.

Final upload and verification sequence (outcome confirmed in chat):

```powershell
git reset --mixed origin/main
git add -A
git diff --cached --stat
git ls-files -ci --exclude-standard
git diff --cached --check
git diff --cached --check -- .gitignore package.json README.md SYNC.md SYNC-SETUP.md scripts/sync.mjs scripts/test-sync.mjs
node scripts/test-sync.mjs
git commit -m 'Initial commit'
git pull --rebase origin main
git push -u origin main
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/main
Start-Process -FilePath (Get-Command node).Source -ArgumentList 'scripts/sync.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput '.sync/watcher-output.log' -RedirectStandardError '.sync/watcher-error.log' -PassThru
Get-Content .sync/sync.log -Tail 20
```

The full imported project has pre-existing trailing whitespace and blank lines at EOF; these were left intact. The new/edited sync files were checked separately. The watcher integration tests also cover the background stop request. The user's existing commit identity was retained.

Initial upload succeeded: local HEAD and GitHub `main` both resolved to `092b33c64be2a4b0d9db9c42220472f2153b284f` (`Initial commit`). The working tree was clean. The background watcher was launched successfully; this final documentation update is the live automatic-sync verification change. Its resulting `Auto-sync:` commit can be checked in the GitHub commit history. Authentication and package setup require no further manual steps. The watcher must be started again after reboot, as documented in `SYNC.md`.
