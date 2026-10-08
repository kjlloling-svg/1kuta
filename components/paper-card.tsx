import {getCurrentUser} from '@/lib/auth';
import type {Paper} from '@/lib/archive';
import {InteractivePaperCard} from './interactive-paper-card';

export async function PaperCard({paper}:{paper:Paper}){
 const user=await getCurrentUser();
 return <InteractivePaperCard authenticated={!!user} admin={user?.role==='admin'} paper={{
  id:paper.id,slug:paper.slug,title:paper.title,year:paper.year,
  program_id:paper.program_slug,program:paper.program_name,status:paper.status,
  authors:paper.authors?[{name:paper.authors,given:'',family:''}]:[],keywords:paper.keywords,
  ...(user&&paper.abstract!==undefined?{abstract:paper.abstract}:{}),
  ...(user?.role==='admin'?{category:paper.paper_type,has_file:!!paper.file_name}:{})
 }}/>
}
