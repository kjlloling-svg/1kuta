/** Copy a citation, with a dialog-safe fallback when clipboard permission is blocked. */
export async function copyCitation(text,html,container,platform=globalThis){
 try{
 const clipboard=platform.navigator?.clipboard;
 if(html&&clipboard?.write&&platform.ClipboardItem){await clipboard.write([new platform.ClipboardItem({'text/plain':new platform.Blob([text],{type:'text/plain'}),'text/html':new platform.Blob([html],{type:'text/html'})})]);}
 else if(clipboard?.writeText)await clipboard.writeText(text);
 else throw new Error('Clipboard unavailable');
 return true;
 }catch{
 const doc=platform.document,focused=doc.activeElement,field=doc.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';(container||doc.body).appendChild(field);field.select();let copied=false;try{copied=doc.execCommand('copy');}catch{}finally{field.remove();focused?.focus();}return copied;
 }
}
