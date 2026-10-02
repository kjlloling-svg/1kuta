import {getCurrentUser} from '@/lib/auth';
import type { Metadata } from 'next';
import { ArchiveExplorer } from '@/components/archive-explorer';
export const metadata:Metadata={title:'Research Papers'};
export default async function Research(){
 const user=await getCurrentUser(),admin=user?.role==='admin';
  return <main id="main" className="page-main"><div className="wrap"><div className="page-intro"><p className="eyebrow">THE COLLECTION</p><h1>Research papers</h1><p>Search and filter research records from 2009 to 2026 by title, author, keyword, program, and year.</p></div><ArchiveExplorer admin={admin} authenticated={!!user}/></div></main>;
}

