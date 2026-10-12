import sharp from 'sharp';
import {writeFileSync} from 'node:fs';

const source='public/assets/kuta-logo-source.png';
// Keep the castle/cap/book mark; omit lettering that becomes illegible in a tab.
const mark={left:516,top:399,width:1968,height:1746};
async function icon(size) {
  const padding=Math.max(1,Math.round(size/16));
  return sharp(source).extract(mark)
    .resize(size-padding*2,size-padding*2,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}})
    .extend({top:padding,bottom:padding,left:padding,right:padding,background:{r:0,g:0,b:0,alpha:0}})
    .png({compressionLevel:9}).toBuffer();
}

writeFileSync('app/icon.png',await icon(512));
writeFileSync('app/apple-icon.png',await icon(180));
const sizes=[16,32,48];
const frames=await Promise.all(sizes.map(icon));
// ICO directory entries point at lossless PNG frames, preserving the alpha channel.
const directory=Buffer.alloc(6+sizes.length*16);
directory.writeUInt16LE(1,2);
directory.writeUInt16LE(sizes.length,4);
let offset=directory.length;
frames.forEach((frame,index)=>{
  const entry=6+index*16;
  directory[entry]=sizes[index];directory[entry+1]=sizes[index];
  directory.writeUInt16LE(1,entry+4);
  directory.writeUInt16LE(32,entry+6);
  directory.writeUInt32LE(frame.length,entry+8);
  directory.writeUInt32LE(offset,entry+12);
  offset+=frame.length;
});
writeFileSync('app/favicon.ico',Buffer.concat([directory,...frames]));
console.log('Generated 16/32/48 ICO, 512px icon and 180px Apple icon from the preserved KUTA source.');
