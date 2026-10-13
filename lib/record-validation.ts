import {z} from 'zod';
import {normalizeKeywords} from './keywords.mjs';

export const FIRST_RESEARCH_YEAR=2009;
export const currentResearchYear=()=>Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Manila'}).format(new Date()));
export const researchYears=()=>Array.from({length:currentResearchYear()-FIRST_RESEARCH_YEAR+1},(_,i)=>currentResearchYear()-i);
export const IMPORT_COLUMNS=['title','authors','program','year','abstract','keywords','status'] as const;
export const MAX_IMPORT_ROWS=500;
export const MAX_IMPORT_BYTES=5*1024*1024;
export const IMPORT_CHUNK_SIZE=20;
export type ProgramOption={id:number;slug:string;name:string;major:string|null};
export type ImportRow={row:number;values:Record<string,string>;error?:string};
export type ImportResult={row:number;title:string;outcome:'valid'|'added'|'skipped'|'failed';message:string;id?:number};
const plain=(max:number,min=0)=>z.string().trim().min(min,'This field is required').max(max).refine(value=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),'Remove unsupported control characters').refine(value=>!/^\s*[=+@-]/.test(value),'Values cannot begin with a spreadsheet formula character (=, +, -, @)');
const author=plain(100,1);
export const paperInput=z.object({
 title:plain(300,1),
 authors:z.array(z.object({given:author,family:author}).strict()).min(1,'At least one author is required').max(30).refine(value=>new Set(value.map(a=>`${a.given.toLowerCase()}|${a.family.toLowerCase()}`)).size===value.length,'Remove duplicate authors'),
 program_id:z.number().int().positive('Select a program'),
 year:z.number().int().min(FIRST_RESEARCH_YEAR).refine(year=>year<=currentResearchYear(),'Year cannot be in the future'),
 category:z.literal('Research Paper').default('Research Paper'),
 keywords:z.union([plain(5000),z.array(plain(80)).max(30)]).transform(normalizeKeywords).pipe(z.array(plain(80,1)).max(30)),
 abstract:plain(15000).optional().nullable(),
 status:z.enum(['pending','verified']).default('pending'),
}).strict();
export type PaperInput=z.infer<typeof paperInput>;
export function parseAuthors(value:string){
 return value.split(/\r?\n|;/).filter(line=>line.trim()).map(line=>{
  const parts=line.split('|').map(p=>p.trim());
  if(parts.length!==2||!parts[0]||!parts[1])throw new Error('Authors: use Given name | Family name; separate authors with semicolons or new lines.');
  return {given:parts[0],family:parts[1]};
 });
}
export function issueMessage(error:unknown){return error instanceof z.ZodError?error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):error instanceof Error?error.message:'Check the record fields.';}
export const duplicateKey=(title:string,year:number,program:number)=>JSON.stringify([title.trim().toLowerCase(),year,program]);
export function importInput(row:ImportRow,programs:ProgramOption[]):PaperInput{
 if(row.error)throw new Error(row.error);
 const v=row.values;
 if(Object.keys(v).some(key=>!IMPORT_COLUMNS.includes(key as typeof IMPORT_COLUMNS[number])))throw new Error('Unexpected column. Use the downloaded template.');
 const name=(v.program||'').trim().toLowerCase();
 const matches=programs.filter(p=>[p.slug,`${p.name}${p.major?` — ${p.major}`:''}`].some(s=>s.toLowerCase()===name));
 if(matches.length!==1)throw new Error('Program: use a program code from the template instructions.');
 if(!/^\d{4}$/.test((v.year||'').trim()))throw new Error('Year: enter a four-digit year.');
 return paperInput.parse({title:v.title||'',authors:parseAuthors(v.authors||''),program_id:matches[0].id,year:Number(v.year),abstract:v.abstract||'',keywords:v.keywords||'',status:(v.status||'pending').trim().toLowerCase()});
}
export function csvCell(value:unknown){const text=String(value??'');const safe=/^[\s\uFEFF]*[=+@-]/.test(text)?`'${text}`:text;return `"${safe.replace(/"/g,'""')}"`;}
export function csvDocument(rows:unknown[][]){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
