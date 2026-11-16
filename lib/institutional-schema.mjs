import {runtimeDatabase as db} from './runtime-database.mjs';

let ready;
export function prepareAccounts() {
  ready ??= db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS institutional_accounts (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      program TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS institutional_codes (
      email TEXT NOT NULL, purpose TEXT NOT NULL, flow TEXT NOT NULL,
      code_hash TEXT NOT NULL, sent_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL, proof TEXT, name TEXT, program TEXT, hash TEXT, salt TEXT,
      PRIMARY KEY(email,purpose)
    )`),
  ]).catch(error => { ready = undefined; throw error; });
  return ready;
}

export function schoolEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 76 && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@slsu\.edu\.ph$/.test(email) ? email : '';
}
