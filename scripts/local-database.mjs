import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {migrateArchive} from './migrate-archive.mjs';
import {migrateKeywords} from './migrate-keywords.mjs';
// SQLite is runtime-local data, not an asset to trace into a Next build.
const filename=path.resolve(/* turbopackIgnore: true */ process.cwd(),process.env.DATABASE_PATH||'data/kuta.sqlite');
if(!filename.startsWith(process.cwd()+path.sep))throw new Error('DATABASE_PATH must stay inside the project');
mkdirSync(path.dirname(filename),{recursive:true});
const sqlite=new DatabaseSync(filename);
sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
for(const name of ['0000_blue_galactus.sql','0001_pretty_doomsday.sql','0002_curly_the_enforcers.sql']){
 if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){
 sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(path.join(process.cwd(),'drizzle',name),'utf8'));sqlite.prepare('INSERT INTO local_migrations VALUES (?)').run(name);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}
 }
}
if(!sqlite.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='name'))sqlite.exec("ALTER TABLE users ADD name TEXT NOT NULL DEFAULT ''; ALTER TABLE users ADD username TEXT; CREATE UNIQUE INDEX users_username_unique ON users(username)");
migrateArchive(sqlite,filename);
migrateKeywords(sqlite,filename);
if(!sqlite.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='google_sub')){
 sqlite.exec('BEGIN');
 try{sqlite.exec('ALTER TABLE users ADD google_sub TEXT; ALTER TABLE users ADD picture TEXT; CREATE UNIQUE INDEX users_google_sub_unique ON users(google_sub)');sqlite.exec('COMMIT');}
 catch(e){sqlite.exec('ROLLBACK');throw e;}
}
class Statement{
 constructor(sql,values=[]){this.sql=sql;this.values=values;}
 bind(...values){return new Statement(this.sql,values);}
 async first(){return sqlite.prepare(this.sql).get(...this.values)||null;}
 async all(){return {results:sqlite.prepare(this.sql).all(...this.values)};}
 runSync(){const r=sqlite.prepare(this.sql).run(...this.values);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
 async run(){return this.runSync();}
}
export const localDatabase={prepare:sql=>new Statement(sql),async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(s.runSync());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
export {sqlite};


