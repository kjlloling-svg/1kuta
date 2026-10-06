import {getCurrentUser} from '@/lib/auth';
import {FavoriteButton} from './favorite-button';
import {departmentAccentFor} from '@/lib/departments';
import {KeywordChips} from './keyword-chips';
import Link from '@/components/native-link';
import type { Paper } from '@/lib/archive';
import { programFor } from '@/lib/programs';
export async function PaperCard({paper}: {paper: Paper}) { const program=programFor(paper.program_slug),user=await getCurrentUser(); return <article className={`paper-card ${departmentAccentFor(paper.program_slug).className}`}>
  <div className="card-top"><span className={`tag ${departmentAccentFor(paper.program_slug).className}`}>{program?.label || paper.program_name}</span><span className="paper-year">{paper.year}</span></div>
  <h3><Link href={`/research-papers/${encodeURIComponent(paper.slug)}`}>{paper.title}</Link></h3>
  <p className="card-authors">{paper.authors || 'Authors not recorded'}</p>
  <KeywordChips keywords={paper.keywords}/>
  {user?.role!=='admin'&&<FavoriteButton slug={paper.slug} status={paper.status}/>}
  <div className="card-bottom"><Link href={`/research-papers/${encodeURIComponent(paper.slug)}`} aria-label={`View ${paper.title}`}>View details <span aria-hidden="true">↗</span></Link></div>
</article>; }



