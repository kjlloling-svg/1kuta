'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from './native-link';
import {FavoriteButton} from './favorite-button';
import {useFavorites} from './favorites-store';
import {programFor} from '@/lib/programs';
type Paper={id:number;slug:string;title:string;authors:string|null;year:number;program:string;program_slug:string|null};
type Result={papers:Paper[];total:number;page:number;pages:number};
export function FavoritesPanel(){
 const saved=useFavorites(),[result,setResult]=useState<Result|null>(null),[page,setPage]=useState(1),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const response=await fetch('/api/favorites?page='+page,{cache:'no-store'});if(!response.ok)throw new Error('Unable to load Favorites. Please try again.');setResult(await response.json());}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[page]);
 useEffect(()=>{void load();const refresh=()=>void load();window.addEventListener('favorites-changed',refresh);window.addEventListener('focus',refresh);return()=>{window.removeEventListener('favorites-changed',refresh);window.removeEventListener('focus',refresh);};},[load]);
 const papers=result?.papers.filter(p=>!saved.ready||saved.slugs.has(p.slug))||[];
 return <section aria-labelledby="favorites-heading" className="favorites-panel"><h2 id="favorites-heading">Favorites</h2><p role="status">{loading?'Loading Favorites…':''}</p>{error?<div role="alert"><p>{error}</p><button type="button" onClick={()=>void load()}>Retry</button></div>:result&&<>{papers.length?<ul className="favorites-list">{papers.map(p=><li key={p.id}><div><h3><Link href={'/research-papers/'+encodeURIComponent(p.slug)}>{p.title}</Link></h3><p>{p.authors||'Authors not recorded'}</p><p>{p.year} · {programFor(p.program_slug||'')?.label||p.program}</p></div><FavoriteButton slug={p.slug}/></li>)}</ul>:<div className="state-card"><p>You haven&apos;t saved any papers yet.</p><Link className="button button-outline" href="/research-papers">Browse the archive</Link></div>}{result.pages>1&&<nav className="pagination" aria-label="Favorites pages"><button disabled={loading||result.page<=1} onClick={()=>setPage(result.page-1)}>Previous</button><span>Page {result.page} of {result.pages}</span><button disabled={loading||result.page>=result.pages} onClick={()=>setPage(result.page+1)}>Next</button></nav>}</>}</section>;
}
