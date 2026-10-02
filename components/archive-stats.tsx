import {stats} from '@/lib/archive';
import {StatsStrip} from './stats-strip';
export async function ArchiveStats(){let counts:Awaited<ReturnType<typeof stats>>|null=null;try{counts=await stats();}catch(e){console.error('Archive counts unavailable',e);}return <StatsStrip counts={counts}/>;}
