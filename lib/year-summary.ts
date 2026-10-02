import {database} from './archive';
import {archivePeriod,createYearSummaryCache} from './year-data';

// SQLite's data_version detects seed/migration/other-process commits. total_changes
// detects this connection's admin writes, so add/verify/edit/delete refresh immediately.
export const archiveYears=createYearSummaryCache(async()=>{
 const rows=await database().prepare("SELECT p.year,g.slug AS program_slug,COUNT(*) AS count FROM research_papers p JOIN programs g ON g.id=p.program_id WHERE p.status='verified' AND p.year BETWEEN ? AND ? GROUP BY p.year,g.slug").bind(archivePeriod.from,archivePeriod.to).all<{year:number;program_slug:string;count:number}>();
 return rows.results;
},async()=>{
 const db=database();
 const version=await db.prepare('PRAGMA data_version').first<{data_version:number}>();
 const changes=await db.prepare('SELECT total_changes() AS n').first<{n:number}>();
 return `${version?.data_version}:${changes?.n}`;
});
