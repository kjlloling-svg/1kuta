type Counts={papers:number;years:number;authors:number};
export function StatsStrip({counts}:{counts:Counts|null}){
 const rows:[keyof Counts,string,string][]=[['papers','Verified paper','Verified papers'],['years','Research year','Research years'],['authors','Researcher indexed','Researchers indexed']];
 if(!counts||counts.papers<=0)return null;
 return <div className="stats-strip" role="group" aria-label="Live archive statistics">{rows.filter(([key])=>Number.isFinite(counts[key])&&counts[key]>0).map(([key,singular,plural])=>{
  const label=counts[key]===1?singular:plural;
  return <div key={key}><span className="sr-only">{counts[key]} {label}</span><strong aria-hidden="true" style={{minWidth:Math.max(2,String(counts[key]).length)+'ch'}}>{counts[key]}</strong><span aria-hidden="true">{label}</span></div>;
 })}</div>;
}
