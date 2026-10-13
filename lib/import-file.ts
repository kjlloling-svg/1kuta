import {IMPORT_COLUMNS,MAX_IMPORT_ROWS,MAX_IMPORT_BYTES,type ImportRow} from './record-validation.ts';

export function parseCsv(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
 const endCell=()=>{row.push(cell);cell='';closed=false;if(row.length>7)throw new Error('Use exactly the seven template columns.');};
 const endRow=()=>{endCell();rows.push(row);row=[];if(rows.length>MAX_IMPORT_ROWS+1)throw new Error('Choose a file with no more than 500 rows.');};
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
  else if(c==='"'){if(cell||closed)throw new Error('Invalid CSV quoting. Export the template as CSV again.');quoted=true;}
  else if(c===',')endCell();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;endRow();}
  else {if(closed)throw new Error('Unexpected text after a quoted CSV value.');cell+=c;}
  if(cell.length>20000)throw new Error('A cell is too long (maximum 20,000 characters).');
 }
 if(quoted)throw new Error('A quoted CSV value is not closed.');
 if(cell||row.length||closed)endRow();
 return rows;
}
// Bound ZIP expansion before handing the workbook to ExcelJS.
export function checkWorkbookZip(buffer:ArrayBuffer){
 const v=new DataView(buffer);let end=-1;
 for(let i=v.byteLength-22;i>=Math.max(0,v.byteLength-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('This is not a valid XLSX workbook.');
 const count=v.getUint16(end+10,true);let offset=v.getUint32(end+16,true),total=0;
 if(count>1000)throw new Error('The workbook is too complex. Use a fresh template.');
 for(let i=0;i<count;i++){
  if(offset+46>v.byteLength||v.getUint32(offset,true)!==0x02014b50)throw new Error('Unsupported or damaged XLSX file.');
  total+=v.getUint32(offset+24,true);if(total>40*1024*1024)throw new Error('The expanded workbook is too large. Remove images and unused sheets.');
  offset+=46+v.getUint16(offset+28,true)+v.getUint16(offset+30,true)+v.getUint16(offset+32,true);
 }
}
export async function parseImportFile(file:File):Promise<ImportRow[]>{
 if(file.size>MAX_IMPORT_BYTES)throw new Error('Choose a CSV or XLSX file of 5 MiB or less.');
 let matrix:string[][];const errors=new Map<number,string>();
 if(/\.csv$/i.test(file.name))matrix=parseCsv(await file.text());
 else if(/\.xlsx$/i.test(file.name)){
  const buffer=await file.arrayBuffer();checkWorkbookZip(buffer);
  const {default:ExcelJS}=await import('exceljs');const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  if(workbook.worksheets.length!==1)throw new Error('Use one worksheet only.');
  const sheet=workbook.worksheets[0];
  if(sheet.rowCount>501||sheet.columnCount>7)throw new Error('Use seven columns and at most 500 data rows.');
  matrix=Array.from({length:sheet.rowCount},(_,i)=>Array.from({length:7},(_,j)=>{
   const cell=sheet.getCell(i+1,j+1),value=cell.value;
   if(value&&typeof value==='object'&&('formula' in value||'sharedFormula' in value)){errors.set(i+1,'Spreadsheet formulas are not accepted. Paste values instead.');return '';}
   const text=cell.text;if(text.length>20000)throw new Error('A cell exceeds 20,000 characters.');return text;
  }));
 }else throw new Error('Choose a .csv or .xlsx file.');
 if(matrix[0]?.map(s=>s.trim().toLowerCase()).join(',')!==IMPORT_COLUMNS.join(','))throw new Error('Headers must be: '+IMPORT_COLUMNS.join(', '));
 const result=matrix.slice(1).flatMap((cells,i)=>{
  if(cells.every(c=>!c.trim())&&!errors.has(i+2))return [];
  return [{row:i+2,values:Object.fromEntries(IMPORT_COLUMNS.map((key,j)=>[key,cells[j]||''])),...(errors.has(i+2)?{error:errors.get(i+2)}:{}),...(cells.length!==7?{error:'Each row must have seven columns.'}:{})}];
 });
 if(!result.length)throw new Error('The file contains no records.');
 return result;
}
