import {mkdirSync} from 'node:fs';
import path from 'node:path';
export function migrateArchive(sqlite,filename){
 const name='0003_local_archive_access';
 if(sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name))return;
 const backupDir=path.join(path.dirname(filename),'migration-backups');mkdirSync(backupDir,{recursive:true});
 const backup=path.join(backupDir,`before-archive-update-${Date.now()}.sqlite`);
 sqlite.exec(`VACUUM INTO '${backup.replaceAll("'","''")}'`);
 sqlite.exec('BEGIN IMMEDIATE');
 try{
 const before=sqlite.prepare('SELECT COUNT(*) AS n FROM research_papers').get().n;
 const columns=sqlite.prepare('PRAGMA table_info(research_papers)').all().map(c=>c.name);
 if(columns.includes('sections')){
 sqlite.exec('ALTER TABLE research_papers ADD full_text TEXT');
 const update=sqlite.prepare('UPDATE research_papers SET full_text=? WHERE id=?');
 for(const row of sqlite.prepare('SELECT id,sections FROM research_papers').all()){
 let introduction=null;try{const parsed=JSON.parse(row.sections||'{}');if(typeof parsed.Introduction==='string')introduction=parsed.Introduction;}catch{throw new Error(`Invalid legacy sections in paper ${row.id}; migration rolled back. Original database is backed up.`);}
 update.run(introduction,row.id);
 }
 }
 for(const column of ['publication_url','institution','adviser','doi','sections'])if(columns.includes(column))sqlite.exec(`ALTER TABLE research_papers DROP COLUMN ${column}`);
 sqlite.prepare("INSERT OR IGNORE INTO programs (slug,name,major,description) VALUES (?,?,NULL,?)").run('bs-nursing-midwifery','BS Nursing / Diploma in Midwifery','Nursing and Midwifery research at SLSU Gumaca Campus');
 const merged=sqlite.prepare('SELECT id FROM programs WHERE slug=?').get('bs-nursing-midwifery');
 sqlite.prepare("UPDATE research_papers SET program_id=? WHERE program_id IN (SELECT id FROM programs WHERE slug IN ('bs-nursing','diploma-midwifery'))").run(merged.id);
 sqlite.exec("DELETE FROM programs WHERE slug IN ('bs-nursing','diploma-midwifery')");
 if(sqlite.prepare('SELECT COUNT(*) AS n FROM research_papers').get().n!==before)throw new Error('Paper count changed; migration rolled back');
 if(sqlite.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Foreign key validation failed');
 sqlite.prepare('INSERT INTO local_migrations (name) VALUES (?)').run(name);sqlite.exec('COMMIT');
 console.log(`Archive migration complete. Original database preserved at ${backup}`);
 }catch(e){sqlite.exec('ROLLBACK');throw e;}
}
