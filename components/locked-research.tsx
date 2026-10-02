import Link from '@/components/native-link';
export function LockedResearch({slug}:{slug:string}){
 const href='/login?return_to='+encodeURIComponent('/research-papers/'+encodeURIComponent(slug));
 return <section className="locked-research" aria-label="Abstract and citation require login"><div className="locked-placeholder" aria-hidden="true">A summary of the study and its research context.<br/>The abstract becomes available after signing in.</div><p><span aria-hidden="true">🔒 </span>Log in to read the abstract and cite this paper.</p><Link className="button button-primary" href={href} aria-label="Log in to unlock this paper’s abstract and citations">Log in</Link></section>;
}
