'use client';
import {useEffect,useRef,useState} from 'react';
import {IMPORT_COLUMNS,IMPORT_CHUNK_SIZE,currentResearchYear,csvDocument,duplicateKey,importInput,issueMessage,type ImportRow,type ImportResult,type ProgramOption} from '@/lib/record-validation';

function download(name:string,content:string){const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function BatchImporter({programs,onImported,onBusy}:{programs:ProgramOption[];onImported:()=>Promise<void>;onBusy:(busy:boolean)=>void}){
 const [rows,setRows]=useState<ImportRow[]>([]),[results,setResults]=useState<ImportResult[]>([]),[busy,setBusy]=useState(false),[phase,setPhase]=useState(''),[progress,setProgress]=useState(0),[error,setError]=useState(''),[complete,setComplete]=useState(false);
 const lock=useRef(false),dialog=useRef<HTMLDialogElement>(null),confirmButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>()=>{onBusy(false);},[onBusy]);
 function working(value:boolean){lock.current=value;setBusy(value);onBusy(value);}
 async function request(action:'preview'|'import',chunk:ImportRow[]){
  const response=await fetch('/api/admin/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,rows:chunk}),signal:AbortSignal.timeout(60000)});
  const data=await response.json().catch(()=>{throw new Error('The import service did not respond correctly. Please try again.');}) as {error?:string;results:ImportResult[]};
  if(!response.ok)throw new Error(response.status===403||response.status===401?'Please sign in as an administrator, then try again.':data.error||'The import service is unavailable. Try again.');
  return data.results as ImportResult[];
 }
 async function choose(file?:File){
  if(!file||lock.current)return;working(true);setError('');setComplete(false);setRows([]);setResults([]);setProgress(0);setPhase('Reading file');
  try{
   const {parseImportFile}=await import('@/lib/import-file');const records=await parseImportFile(file);setRows(records);
   const checked:ImportResult[]=[],seen=new Set<string>(),candidates:ImportRow[]=[];
   for(const row of records){
    try{const input=importInput(row,programs),key=duplicateKey(input.title,input.year,input.program_id);if(seen.has(key))throw new Error('Duplicate title, year, and program in this file.');seen.add(key);candidates.push(row);}
    catch(e){checked.push({row:row.row,title:row.values.title,outcome:'skipped',message:issueMessage(e)});}
   }
   setPhase('Checking records against the archive');setProgress(checked.length);
   for(let i=0;i<candidates.length;i+=IMPORT_CHUNK_SIZE){checked.push(...await request('preview',candidates.slice(i,i+IMPORT_CHUNK_SIZE)));setProgress(checked.length);setResults([...checked].sort((a,b)=>a.row-b.row));}
   setResults(checked.sort((a,b)=>a.row-b.row));setPhase('Preview ready');
  }catch(e){setError(issueMessage(e));setPhase('Preview could not be completed');setResults([]);}
  finally{working(false);}
 }
 async function runImport(){
  if(lock.current)return;dialog.current?.close();working(true);setError('');setPhase('Importing records');setProgress(0);
  const eligible=new Set(results.filter(r=>r.outcome==='valid').map(r=>r.row));const candidates=rows.filter(r=>eligible.has(r.row));
  const output=results.filter(r=>!eligible.has(r.row));setProgress(output.length);
  try{
   for(let i=0;i<candidates.length;i+=IMPORT_CHUNK_SIZE){
    try{output.push(...await request('import',candidates.slice(i,i+IMPORT_CHUNK_SIZE)));}
    catch(e){const message=issueMessage(e)+' Some records may already have saved. Retry this file safely to check.';output.push(...candidates.slice(i).map(r=>({row:r.row,title:r.values.title,outcome:'failed' as const,message})));setError(message);break;}
    setResults([...output].sort((a,b)=>a.row-b.row));setProgress(output.length);
   }
   setResults(output.sort((a,b)=>a.row-b.row));setProgress(rows.length);setComplete(true);setPhase('Import complete');await onImported();
  }finally{working(false);}
 }
 const valid=results.filter(r=>r.outcome==='valid').length,added=results.filter(r=>r.outcome==='added').length,skipped=results.filter(r=>r.outcome==='skipped').length,failed=results.filter(r=>r.outcome==='failed').length;
 function template(){download('kuta-research-template.csv',[IMPORT_COLUMNS.join(','),csvDocument([['Example research title','Ana | Reyes; Ben | Cruz',programs[0]?.slug||'bsba-hrdm',currentResearchYear(),'Replace this example with your abstract.','education, community','pending']]).replace(/^\uFEFF/,'')].join('\r\n'));}
 return <div className="batch-import">
  <h3>Upload multiple records</h3><p id="batch-help">CSV or XLSX, one worksheet, up to 500 rows and 5 MiB. This imports record details, not PDF attachments. Replace the example row in the template before uploading.</p>
  <button type="button" className="button button-outline" onClick={template}>Download CSV template</button>
  <details><summary>Column instructions and valid programs</summary><p>Required: title, authors, program, year. Authors: Given name | Family name, separated by semicolons. Optional: abstract and comma-separated keywords. Status: pending or verified; blank defaults to pending. Category is always Research Paper. Formulas are rejected.</p><ul>{programs.map(p=><li key={p.id}><code>{p.slug}</code> — {p.name}{p.major?` — ${p.major}`:''}</li>)}</ul></details>
  <label className="batch-file">Choose records file<input type="file" accept=".csv,.xlsx" disabled={busy} aria-describedby="batch-help batch-error" onChange={e=>void choose(e.target.files?.[0])}/></label>
  <p id="batch-error" role="alert">{error}</p>
  <p role="status" aria-live="polite">{phase}{rows.length?` — ${progress} of ${rows.length} rows checked`:''}</p>
  {busy&&<progress aria-label={phase} max={Math.max(1,rows.length)} value={progress}/>}
  {results.length>0&&<>
   <p role="status">{complete?`${added} added · ${skipped} skipped · ${failed} failed`:`${valid} ready · ${skipped} will be skipped · ${failed} could not be checked`}</p>
   <div className="batch-table-scroll" tabIndex={0} role="region" aria-label="Record validation preview, scroll horizontally for all columns"><table className="batch-table"><caption>Review each row before importing</caption><thead><tr><th scope="col">Row</th>{IMPORT_COLUMNS.map(c=><th scope="col" key={c}>{c}</th>)}<th scope="col">Result</th></tr></thead><tbody>{results.map(result=>{const row=rows.find(r=>r.row===result.row)!;return <tr key={result.row}><th scope="row">{result.row}</th>{IMPORT_COLUMNS.map(c=><td key={c}><span title={row.values[c]}>{row.values[c]||'—'}</span></td>)}<td><strong>{result.outcome}</strong><p>{result.message}</p></td></tr>;})}</tbody></table></div>
   <div className="admin-form-actions">
    {!complete&&<button ref={confirmButton} type="button" className="button button-primary" disabled={busy||!valid||!!error} onClick={()=>dialog.current?.showModal()}>Import {valid} valid records</button>}
    <button type="button" className="button button-outline" disabled={busy} onClick={()=>download('kuta-import-report.csv',csvDocument([['row',...IMPORT_COLUMNS,'result','message'],...results.filter(r=>r.outcome==='skipped'||r.outcome==='failed').map(r=>[r.row,...IMPORT_COLUMNS.map(c=>rows.find(row=>row.row===r.row)?.values[c]||''),r.outcome,r.message])]))}>Download error report</button>
   </div>
  </>}
  <dialog className="citation-dialog" ref={dialog} aria-labelledby="import-confirm-title" aria-describedby="import-confirm-description" onClose={()=>confirmButton.current?.focus()}>
   <h2 id="import-confirm-title">Confirm import</h2><p id="import-confirm-description">Add {valid} research records? {skipped} invalid or duplicate rows will be skipped. Verified records become visible in the public archive. PDFs are not uploaded.</p><div className="admin-form-actions"><button type="button" className="button button-outline" autoFocus onClick={()=>dialog.current?.close()}>Cancel</button><button type="button" className="button button-primary" onClick={()=>void runImport()}>Confirm import</button></div>
  </dialog>
 </div>;
}
