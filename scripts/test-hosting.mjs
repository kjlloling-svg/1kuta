import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createClient} from '@libsql/client';
import {createRemoteDatabase} from '../lib/runtime-database.mjs';
import {inspectSnapshot,assertEmptyTarget,transferDatabase} from './hosting-import.mjs';
import {createUploadTicket,verifyUploadTicket,hasPdfSignature,MAX_PDF_BYTES} from '../lib/upload-ticket.mjs';

// All records are synthetic. Never import the user's working database.
const root=path.resolve('.sync','hosting-test-'+randomUUID());
process.env.DATABASE_PATH=path.join(root,'source.sqlite');
process.env.SESSION_SECRET=randomBytes(48).toString('hex');
const {sqlite}=await import('./local-database.mjs');
const client=createClient({url:':memory:'});
try{
 const user=randomUUID(),hash=randomBytes(32).toString('hex');
 sqlite.prepare('INSERT INTO users(id,email,password_hash,password_salt,created_at,name,username,google_sub,role) VALUES (?,?,?,?,?,?,?,?,?)').run(user,'fixture@example.invalid',hash,'',1,'Fixture','fixture','google-fixture','admin');
 const program=sqlite.prepare('SELECT id FROM programs LIMIT 1').get().id;
 sqlite.prepare('INSERT INTO research_papers(id,slug,title,year,program_id,full_text,keywords,file_key,file_size) VALUES (?,?,?,?,?,?,?,?,?)').run(12,'fixture','Fixture',2026,program,'Preserve full text','["Archive"]','papers/12/fixture.pdf',14);
 sqlite.exec("INSERT INTO authors(id,name) VALUES (3,'Fixture Author'); INSERT INTO research_paper_authors VALUES (12,3,0)");
 sqlite.prepare('INSERT INTO bookmarks VALUES (?,12)').run(user);
 sqlite.prepare('INSERT INTO sessions VALUES (?,?,?)').run('fixture-session',user,9999999999);
 sqlite.exec("INSERT INTO login_attempts VALUES ('fixture-attempt',1,1); UPDATE sqlite_sequence SET seq=99 WHERE name='research_papers'");
 const uploads=path.join(root,'uploads');mkdirSync(path.join(uploads,'papers','12'),{recursive:true});writeFileSync(path.join(uploads,'papers','12','fixture.pdf'),'%PDF-1.4\n%%EOF');
 const snapshot=inspectSnapshot(sqlite,uploads);
 assert.equal(snapshot.files.length,1);
 await assertEmptyTarget(client);
 const counts=await transferDatabase(sqlite,client,snapshot);
 assert.equal(counts.sessions,0);assert.equal(counts.login_attempts,0);
 const db=createRemoteDatabase(client);
 const account=await db.prepare('SELECT * FROM users WHERE id=?').bind(user).first();
 assert.equal(account.password_hash,hash);assert.equal(account.google_sub,'google-fixture');assert.equal(account.role,'admin');
 assert.equal((await db.prepare('SELECT full_text FROM research_papers WHERE id=12').first()).full_text,'Preserve full text');
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM bookmarks').first()).n,1);
 const added=await db.prepare('INSERT INTO research_papers(slug,title,year,program_id) VALUES (?,?,?,?)').bind('next','Next',2026,program).run();
 assert.equal(added.meta.last_row_id,100);assert.equal(added.meta.changes,1);
 assert.equal((await db.prepare('SELECT * FROM authors').all()).results.length,1);
 await assert.rejects(()=>assertEmptyTarget(client));
 await assert.rejects(()=>db.batch([db.prepare("INSERT INTO authors(name) VALUES ('Must roll back')"),db.prepare('INSERT INTO missing_table VALUES (1)')]));
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM authors').first()).n,1);
 console.log('PASS: remote query adapter, atomic batch rollback, migration relationships, account fields, IDs, file verification and nonempty-target protection');
 const rollback=createClient({url:':memory:'});
 try{await assert.rejects(()=>transferDatabase(sqlite,rollback,{...snapshot,counts:{...snapshot.counts,users:999}}));await assertEmptyTarget(rollback);}finally{rollback.close();}
 console.log('PASS: failed migration rolls back all database changes');
 const upload=createUploadTicket(12,user,'paper.pdf',14);
 assert.equal(verifyUploadTicket(upload.ticket,12,user).key,upload.key);
 assert.throws(()=>verifyUploadTicket(upload.ticket,13,user));assert.throws(()=>verifyUploadTicket(upload.ticket,12,'other'));
 assert.throws(()=>verifyUploadTicket(upload.ticket+'x',12,user));assert.throws(()=>createUploadTicket(12,user,'paper.pdf',MAX_PDF_BYTES+1));assert.throws(()=>createUploadTicket(12,user,'paper.exe',14));
 const now=Date.now;try{Date.now=()=>now()+16*60*1000;assert.throws(()=>verifyUploadTicket(upload.ticket,12,user));}finally{Date.now=now;}
 const stream=chunks=>new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(Buffer.from(chunk));controller.close();}});
 assert.equal(await hasPdfSignature(stream(['%P','D','F-1.4'])),true);assert.equal(await hasPdfSignature(stream(['not a PDF'])),false);
 console.log('PASS: signed upload permissions, user/paper binding, tamper/expiry/size checks, streamed PDF validation');
}finally{client.close();sqlite.close();}
