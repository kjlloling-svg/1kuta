import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, appendFileSync, renameSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { startSync } from './sync.mjs';

if (process.argv[2] === '--worker') {
  startSync({ root: process.argv[3], debounceMs: 700, pollMs: 100, retryMs: 1000 });
} else {
  const project = resolve(fileURLToPath(new URL('..', import.meta.url)));
  mkdirSync(join(project, '.sync'), { recursive: true });
  const base = mkdtempSync(join(project, '.sync', 'test-'));
  const remote = join(base, 'remote.git'), local = join(base, 'local'), other = join(base, 'other');
  function git(cwd, ...args) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
    return r.stdout.trim();
  }
  function configure(cwd) { git(cwd, 'config', 'user.name', 'Sync Test'); git(cwd, 'config', 'user.email', 'sync-test@example.invalid'); git(cwd, 'config', 'core.autocrlf', 'false'); }
  async function until(check) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) { if (check()) return; await sleep(150); }
    throw new Error('Timed out waiting for sync.');
  }
  git(base, 'init', '--bare', '--initial-branch=main', remote);
  git(base, 'clone', '-c', 'core.autocrlf=false', remote, local); configure(local);
  writeFileSync(join(local, '.gitignore'), '.sync/\n.env*\nignored/\n');
  writeFileSync(join(local, 'file.txt'), 'initial\n');
  git(local, 'add', '-A'); git(local, 'commit', '-m', 'Initial commit'); git(local, 'push', '-u', 'origin', 'main');
  git(base, 'clone', '-c', 'core.autocrlf=false', remote, other); configure(other);
  const count = () => Number(git(remote, 'rev-list', '--count', 'main'));
  const worker = spawn(process.execPath, [fileURLToPath(import.meta.url), '--worker', local], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = ''; worker.stdout.on('data', b => output += b); worker.stderr.on('data', b => output += b);
  try {
    await sleep(1100);
    assert.equal(count(), 1);
    writeFileSync(join(local, '.env'), 'ignored test fixture\n');
    await sleep(1000); assert.equal(count(), 1);
    for (let i = 0; i < 4; i++) { appendFileSync(join(local, 'file.txt'), `edit ${i}\n`); await sleep(300); assert.equal(count(), 1); }
    await until(() => count() === 2);
    assert.equal(git(local, 'status', '--porcelain'), '');
    renameSync(join(local, 'file.txt'), join(local, 'renamed.txt'));
    writeFileSync(join(local, 'new.txt'), 'created\n');
    await until(() => count() === 3);
    unlinkSync(join(local, 'new.txt')); await until(() => count() === 4);
    git(other, 'pull', '--rebase'); writeFileSync(join(other, 'remote.txt'), 'remote change\n');
    git(other, 'add', '-A'); git(other, 'commit', '-m', 'Remote change'); git(other, 'push');
    appendFileSync(join(local, 'renamed.txt'), 'local with remote ahead\n');
    await until(() => count() === 6);
    assert.equal(readFileSync(join(local, 'remote.txt'), 'utf8'), 'remote change\n');
    git(local, 'remote', 'set-url', 'origin', join(base, 'unavailable.git'));
    appendFileSync(join(local, 'renamed.txt'), 'offline change\n');
    await until(() => output.includes('unavailable.git'));
    assert.equal(count(), 6);
    git(local, 'remote', 'set-url', 'origin', remote);
    await until(() => count() === 7);
    git(other, 'pull', '--rebase'); writeFileSync(join(other, 'renamed.txt'), 'conflicting remote\n');
    git(other, 'add', '-A'); git(other, 'commit', '-m', 'Conflict fixture'); git(other, 'push');
    writeFileSync(join(local, 'renamed.txt'), 'conflicting local\n');
    await until(() => git(local, 'ls-files', '-u').length > 0);
    await sleep(1400); assert.equal(count(), 8);
    assert.ok(output.includes('paused'));
    writeFileSync(join(local, '.sync', 'stop'), 'stop');
    await until(() => worker.exitCode !== null);
    assert.equal(worker.exitCode, 0);
    console.log('PASS: no-op, ignored files, debounce, create/edit/delete/rename, remote rebase, retry without new edits, and safe conflict pause.');
    console.log(`Isolated fixtures retained in ${base}`);
  } catch (error) { console.error(output); throw error; }
  finally { worker.kill(); }
}
