import {canonicalProgram, programs} from './programs.ts';

export const archivePeriod={from:2009,to:2026} as const;
export type YearSummary={year:number;count:number;departments:{slug:string;name:string;count:number}[]};
type YearRow={year:unknown;program_slug:unknown;count:unknown};

/** Allowlisted, ordinary objects only: no record content enters this summary. */
export function toYearSummaries(rows:YearRow[]):YearSummary[]{
 const years=Array.from({length:archivePeriod.to-archivePeriod.from+1},(_,i)=>({year:archivePeriod.to-i,count:0,departments:programs.map(p=>({slug:p.slug as string,name:p.label as string,count:0}))}));
 for(const row of rows){
  const year=Number(row.year),count=Number(row.count),target=years.find(y=>y.year===year);
  if(!target||!Number.isSafeInteger(count)||count<0)continue;
  target.count+=count;
  const slug=canonicalProgram(String(row.program_slug)),department=target.departments.find(d=>d.slug===slug);
  if(department)department.count+=count;
  else {const other=target.departments.find(d=>d.slug==='other');if(other)other.count+=count;else target.departments.push({slug:'other',name:'Other program',count});}
 }
 return years;
}

/** Revision includes local writes and other SQLite connections; TTL is a backstop. */
export function createYearSummaryCache(load:()=>Promise<YearRow[]>,revision:()=>Promise<string>,clock=Date.now){
 let cached:{key:string;until:number;value:YearSummary[]}|undefined;
 return async()=>{
  const key=await revision();
  if(cached&&cached.key===key&&cached.until>clock())return structuredClone(cached.value);
  const value=toYearSummaries(await load());
  cached={key,until:clock()+60_000,value};
  return structuredClone(value);
 };
}
