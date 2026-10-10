type Counts={papers:number;years:number;authors:number};
export function StatsStrip({counts}:{counts:Counts|null}){
 const rows:[keyof Counts,string][]=[['papers','Verified papers'],['years','Research years'],['authors','Researchers indexed']];
 if(!counts||counts.papers<=0)return null;
 return <div className="stats-strip" aria-label="Live archive statistics">{rows.filter(([key])=>Number.isFinite(counts[key])&&counts[key]>0).map(([key,label])=><div key={key}><span className="sr-only">{counts[key]} {label}</span><strong aria-hidden="true" style={{minWidth:Math.max(2,String(counts[key]).length)+'ch'}}>{counts[key]}</strong><span aria-hidden="true">{label}</span></div>)}</div>;
}
