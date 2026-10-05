import {database} from './archive';
import {archivePeriod,toYearSummaries} from './year-data';

// Turso's HTTP API rejects PRAGMA data_version. One aggregate query is portable
// and immediately reflects edits without connection-local counters or stale caches.
export async function archiveYears(){
 const rows=await database().prepare("SELECT p.year,g.slug AS program_slug,COUNT(*) AS count FROM research_papers p JOIN programs g ON g.id=p.program_id WHERE p.status='verified' AND p.year BETWEEN ? AND ? GROUP BY p.year,g.slug").bind(archivePeriod.from,archivePeriod.to).all<{year:number;program_slug:string;count:number}>();
 return toYearSummaries(rows.results);
}
