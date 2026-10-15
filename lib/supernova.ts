type Theme = 'light' | 'dark';
const DURATION = 1200;
const SWAP_AT = 270;
const BLOOM_GROW = 500;
const BLOOM_HOLD = 280;
const BLOOM_END = 750;
const BLOOM_ALPHA = .85;
const PARTICLE_COUNT = 70;
const GRADIENT_STEP = 10;
const PALETTES = {dark:['#ffffff','#f5c451','#2a2f8f'],light:['#ffffff','#ffe9a8','#e8962e']} as const;
let running = false;
const ease = (p:number) => 1 - (1 - Math.min(1,p)) ** 3;
const noop = () => {};

/** Returns an idempotent cancellation function; cancellation never forces a pending swap. */
export function supernova(originX:number,originY:number,nextTheme:Theme,onSwap:()=>void):()=>void {
 if(running)return noop;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){onSwap();return noop;}
 running=true;
 const canvas=document.createElement('canvas');
 canvas.setAttribute('aria-hidden','true');canvas.dataset.supernova='';
 canvas.style.cssText='position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none;z-index:2147483647;pointer-events:none;background:transparent;';
 const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 const ctx=canvas.getContext('2d');
 if(!ctx){running=false;onSwap();return noop;}
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const maxR=Math.hypot(Math.max(originX,width-originX),Math.max(originY,height-originY));
 const palette=PALETTES[nextTheme];
 const bloom:CanvasGradient[]=[];
 // Gradients and particle storage are allocated before the animation, never per frame.
 for(let t=0;t<=BLOOM_GROW;t+=GRADIENT_STEP){
  const gradient=ctx.createRadialGradient(originX,originY,0,originX,originY,Math.max(1,1.35*maxR*ease(t/BLOOM_GROW)));
  gradient.addColorStop(0,palette[0]);gradient.addColorStop(.35,palette[1]);gradient.addColorStop(.8,palette[2]);gradient.addColorStop(1,palette[2]+'00');bloom.push(gradient);
 }
 const star=new Path2D('M0 -1 Q.17 -.17 1 0 Q.17 .17 0 1 Q-.17 .17 -1 0 Q-.17 -.17 0 -1Z');
 const particles=new Float32Array(PARTICLE_COUNT*8);
 let seed=0x4b555441;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<particles.length;i+=8){const angle=random()*Math.PI*2,speed=50+random()**2*700;particles[i]=originX;particles[i+1]=originY;particles[i+2]=Math.cos(angle)*speed;particles[i+3]=Math.sin(angle)*speed;particles[i+4]=600+random()*500;particles[i+5]=2+random()*5;particles[i+6]=random()*Math.PI;particles[i+7]=random();}
 const rayAngles=new Float32Array(10),rayLengths=new Float32Array(10);
 for(let i=0;i<10;i++){rayAngles[i]=i*Math.PI/5+random()*.12;rayLengths[i]=.12+random()*.22;}
 let frame=0,started=-1,last=0,swapped=false,disposed=false;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);canvas.remove();running=false;window.removeEventListener('pagehide',cleanup);window.removeEventListener('resize',cleanup);document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',onMotion);};
 const swap=()=>{if(swapped)return;swapped=true;onSwap();};
 const onMotion=()=>{if(motion.matches){try{swap();}finally{cleanup();}}};
 const onVisibility=()=>{if(document.hidden)cleanup();};
 function draw(now:number){
  if(disposed)return;
  if(started<0){started=now;last=now;}
  const t=now-started,dt=Math.min(40,Math.max(0,now-last));last=now;
  ctx!.clearRect(0,0,width,height);
  if(t<BLOOM_END){ctx!.globalAlpha=BLOOM_ALPHA*Math.min(1,t/100)*(t<=BLOOM_HOLD?1:Math.max(0,1-(t-BLOOM_HOLD)/(BLOOM_END-BLOOM_HOLD)));ctx!.fillStyle=bloom[Math.min(bloom.length-1,Math.floor(t/GRADIENT_STEP))];ctx!.fillRect(0,0,width,height);}
  if(!swapped&&t>=SWAP_AT){try{swap();}catch(error){cleanup();throw error;}}
  ctx!.strokeStyle=palette[1];
  for(let i=0;i<2;i++){const p=(t-i*75)/670;if(p<0||p>=1)continue;ctx!.globalAlpha=(1-p)*.42;ctx!.lineWidth=2.5*(1-p)+.3;ctx!.beginPath();ctx!.arc(originX,originY,maxR*ease(p),0,Math.PI*2);ctx!.stroke();}
  if(t<600){const p=t/600;ctx!.globalAlpha=(1-p)*.3;ctx!.lineWidth=1.5;ctx!.beginPath();for(let i=0;i<10;i++){const a=rayAngles[i],r=maxR*ease(p)*rayLengths[i];ctx!.moveTo(originX+Math.cos(a)*r*.35,originY+Math.sin(a)*r*.35);ctx!.lineTo(originX+Math.cos(a)*r,originY+Math.sin(a)*r);}ctx!.stroke();}
  ctx!.globalCompositeOperation='lighter';ctx!.fillStyle=palette[1];
  const friction=.96**(dt/(1000/60));
  for(let i=0;i<particles.length;i+=8){const p=t/particles[i+4];if(p>=1)continue;particles[i+2]*=friction;particles[i+3]*=friction;particles[i]+=particles[i+2]*dt/1000;particles[i+1]+=particles[i+3]*dt/1000;const size=particles[i+5]*(1-p);ctx!.globalAlpha=(1-p)*(.35+particles[i+7]*.4);ctx!.save();ctx!.translate(particles[i],particles[i+1]);ctx!.rotate(particles[i+6]);ctx!.scale(size,size);ctx!.fill(star);ctx!.restore();}
  ctx!.globalCompositeOperation='source-over';ctx!.globalAlpha=1;
  if(t>=DURATION){cleanup();return;}frame=requestAnimationFrame(draw);
 }
 document.body.appendChild(canvas);
 // The top layer keeps this decorative canvas above modal dialogs without capturing focus.
 if('showPopover' in canvas){canvas.setAttribute('popover','manual');try{canvas.showPopover();}catch{/* Fixed positioning is the fallback. */}}
 window.addEventListener('pagehide',cleanup);window.addEventListener('resize',cleanup);document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',onMotion);
 frame=requestAnimationFrame(draw);return cleanup;
}
