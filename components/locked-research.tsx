export function LockedResearch({slug,compact=false}:{slug:string;compact?:boolean}) {
  const paper='/research-papers/'+encodeURIComponent(slug);
  return <section className={compact?'locked-research locked-research-compact':'locked-research'} aria-label="Sign in to access research">
    <p>Sign in with your SLSU account to read the abstract or cite this paper.</p>
    <div className="card-actions"><a className="button button-outline" href={'/login?return_to='+encodeURIComponent(paper+'#abstract')}>Abstract</a>
    <a className="button button-outline" href={'/login?return_to='+encodeURIComponent(paper+'#cite')}>Cite</a></div>
  </section>;
}
