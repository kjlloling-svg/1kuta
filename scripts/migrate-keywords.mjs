import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {normalizeKeywords} from '../lib/keywords.mjs';
/** Idempotent metadata-only migration; snapshot the database before any changed values. */
export function migrateKeywords(sqlite,filename){
 const name='0004_normalize_keywords';if(sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))return {changed:0,alreadyApplied:true};
 const rows=sqlite.prepare('SELECT id,keywords FROM research_papers').all();const changes=rows.flatMap(row=>{const clean=JSON.stringify(normalizeKeywords(row.keywords));return clean!==row.keywords?[{id:row.id,clean}]:[];});
 let backup=null;if(changes.length){const dir=path.join(path.dirname(filename),'migration-backups');mkdirSync(dir,{recursive:true});backup=path.join(dir,'before-keywords-'+Date.now()+'.sqlite');sqlite.exec("VACUUM INTO '"+backup.replaceAll("'","''")+"'");}
 sqlite.exec('BEGIN IMMEDIATE');try{const update=sqlite.prepare('UPDATE research_papers SET keywords=? WHERE id=?');for(const row of changes)update.run(row.clean,row.id);if(sqlite.prepare('SELECT count(*) n FROM research_papers').get().n!==rows.length)throw Error('Paper count changed');if(sqlite.prepare('PRAGMA foreign_key_check').all().length)throw Error('Foreign key validation failed');sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(name);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}
 console.log('Keyword migration: '+changes.length+' record(s) normalized; only keyword values changed.'+(backup?' Backup: '+backup:''));return {changed:changes.length,ids:changes.map(c=>Number(c.id)),backup};
}
