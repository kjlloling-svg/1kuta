import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Git supplies the file list so nested .gitignore rules and negations work.
// Polling avoids Windows recursive-watch limits and needs no dependencies.
export function startSync({ root = resolve(fileURLToPath(new URL('..', import.meta.url))), debounceMs = 30000, pollMs = 2000, retryMs = 60000 } = {}) {
  const stateDir = join(root, '.sync');
  mkdirSync(stateDir, { recursive: true });
  const lock = join(stateDir, 'watcher.pid');
  const stopRequest = join(stateDir, 'stop');
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, 'utf8'));
    try { process.kill(pid, 0); throw new Error(`Watcher already running (PID ${pid}).`); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
    unlinkSync(lock);
  }
  writeFileSync(lock, String(process.pid), { flag: 'wx' });
  if (existsSync(stopRequest)) unlinkSync(stopRequest);
  function log(message) {
    const line = `${new Date().toISOString()} ${message}\n`;
    process.stdout.write(line);
    appendFileSync(join(stateDir, 'sync.log'), line);
  }
  function git(args, allowed = [0]) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true,
      timeout: 120000, maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_EDITOR: 'true' } });
    if (result.error || !allowed.includes(result.status)) {
      throw new Error(`git ${args.join(' ')}: ${result.error?.message || result.stderr || result.stdout}`);
    }
    return result.stdout;
  }
  function cleanLock() { if (existsSync(lock) && readFileSync(lock, 'utf8') === String(process.pid)) unlinkSync(lock); }
  let timer;
  function stop() { clearInterval(timer); cleanLock(); }
  try {
    if (git(['branch', '--show-current']).trim() !== 'main') throw new Error('Switch to main before starting auto-sync.');
    git(['rev-parse', '--verify', 'HEAD']);
    git(['remote', 'get-url', 'origin']);
    // Ignoring an already-tracked file does not untrack it: refuse this unsafe state.
    if (git(['ls-files', '-ci', '--exclude-standard']).trim()) throw new Error('Tracked files match ignore rules. Untrack them before syncing.');
  } catch (error) { cleanLock(); throw error; }
  const gitDir = resolve(root, git(['rev-parse', '--git-dir']).trim());
  function fingerprint() {
    const files = [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))].sort();
    const hash = createHash('sha256');
    for (const file of files) {
      hash.update(file);
      try {
        const s = statSync(join(root, file), { bigint: true });
        hash.update(`${s.size}:${s.mtimeNs}:${s.ctimeNs}`);
      } catch (error) { if (error.code !== 'ENOENT') throw error; hash.update('deleted'); }
    }
    return hash.digest('hex');
  }
  function sync() {
    if (git(['branch', '--show-current']).trim() !== 'main') throw new Error('Auto-sync paused: current branch is not main.');
    for (const marker of ['rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'index.lock']) {
      if (existsSync(join(gitDir, marker))) throw new Error(`Auto-sync paused: Git operation in progress (${marker}). Resolve it manually.`);
    }
    if (git(['ls-files', '-u']).trim()) throw new Error('Auto-sync paused: unresolved conflicts.');
    if (git(['ls-files', '-ci', '--exclude-standard']).trim()) throw new Error('Auto-sync paused: tracked files now match ignore rules.');
    git(['add', '-A']);
    if (git(['diff', '--cached', '--name-only', '-z'])) {
      git(['commit', '-m', `Auto-sync: ${new Date().toISOString()}`]);
      log('Committed local changes.');
    }
    // No autostash: edits made during synchronization stay in the working tree.
    // A failed rebase is left for the user to resolve; never reset or force-push.
    git(['pull', '--rebase', 'origin', 'main']);
    git(['push', 'origin', 'main']);
    log('Sync complete.');
  }
  let previous = fingerprint(), changedAt = Date.now(), nextAttempt = 0, pending = true;
  log('Watching main; 30-second quiet period, automatic retry after errors. Ctrl+C stops.');
  timer = setInterval(() => {
    try {
      if (existsSync(stopRequest)) { unlinkSync(stopRequest); log('Stopped by request.'); stop(); return; }
      const current = fingerprint(), now = Date.now();
      if (current !== previous) { previous = current; changedAt = now; pending = true; }
      if (pending && now - changedAt >= debounceMs && now >= nextAttempt) {
        try { sync(); pending = false; }
        catch (error) { log(`ERROR: ${error.message.trim()}`); nextAttempt = Date.now() + retryMs; }
        // Do not swallow writes that happened during Git operations.
        const after = fingerprint();
        if (after !== previous) { previous = after; changedAt = Date.now(); pending = true; }
      }
    } catch (error) { log(`ERROR: ${error.message.trim()}`); }
  }, pollMs);
  process.once('exit', cleanLock);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { log('Stopped.'); stop(); process.exit(0); });
  return { stop };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--stop')) {
      const stateDir = resolve(fileURLToPath(new URL('../.sync', import.meta.url)));
      if (existsSync(join(stateDir, 'watcher.pid'))) { writeFileSync(join(stateDir, 'stop'), 'stop'); console.log('Stop requested; watcher will stop after its current Git operation.'); }
      else console.log('No watcher is running.');
    } else startSync();
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
