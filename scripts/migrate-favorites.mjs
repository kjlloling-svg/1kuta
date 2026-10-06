import 'dotenv/config';
import {pathToFileURL} from 'node:url';

// Run explicitly, never during a request or deployment build.
export async function migrateFavorites(db){
 const info=await db.prepare('PRAGMA table_info(bookmarks)').all();
 if(!info.results.length)throw new Error('Existing bookmarks table is required.');
 const statements=[];
 if(!info.results.some(column=>column.name==='created_at'))statements.push(db.prepare('ALTER TABLE bookmarks ADD COLUMN created_at INTEGER'));
 statements.push(db.prepare('CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx ON bookmarks(user_id,created_at DESC,paper_id)'));
 statements.push(db.prepare('CREATE INDEX IF NOT EXISTS papers_review_queue_idx ON research_papers(status,program_id,year DESC,id DESC)'));
 await db.batch(statements);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const target=process.argv[2];
 if(target!=='--local'&&target!=='--remote')throw new Error('Choose --local or --remote explicitly.');
 let db;
 if(target==='--local')db=(await import('./local-database.mjs')).localDatabase;
 else{
  if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw new Error('Remote database configuration is unavailable.');
  db=(await import('../lib/runtime-database.mjs')).runtimeDatabase;
 }
 await migrateFavorites(db);
 console.log('Favorites timestamp and review indexes are ready. Existing records were preserved.');
}
