/** Normalize legacy storage and form input into unique, readable keywords. @param {unknown} value @returns {string[]} */
export function normalizeKeywords(value){
 let items=value;
 if(typeof items==='string'){
  const input=items.trim();if(!input)return [];
  try{items=JSON.parse(input);}catch{if(input.startsWith('[')||input.startsWith('{'))return [];items=input.split(',');}
  if(typeof items==='string')items=items.split(',');
 }
 if(!Array.isArray(items))return [];
 const seen=new Set();return items.flatMap(item=>{if(typeof item!=='string')return [];const word=item.replace(/\s+/g,' ').trim();const key=word.toLocaleLowerCase('en');if(!word||seen.has(key))return [];seen.add(key);return [word];});
}
