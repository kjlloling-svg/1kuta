'use client';
import {useEffect,useRef} from 'react';
/** One decorative canvas; CSS supplies the complete no-JS/reduced-motion fallback. */
export function AmbientBackground(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  let ctx:CanvasRenderingContext2D|null;try{ctx=element.getContext('2d',{alpha:true});}catch{return;}if(!ctx)return;
  const context=ctx,root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)');
  const device=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean}};
  const modest=(device.hardwareConcurrency||8)<=4||(device.deviceMemory||8)<=4||!!device.connection?.saveData;
  let width=1,height=1,frame=0,last=0,elapsed=0,disposed=false,started=false,idle=0,timer=0;
  let pointer={x:0,y:0,active:false},glow=0,scrollImpulse=0,lastScroll=window.scrollY,interval=modest?1000/30:1000/60;
  let sprites:HTMLCanvasElement[]=[],circles:{x:number;y:number;r:number;phase:number;dx:number;dy:number}[]=[];
  const colorize=()=>{
   const style=getComputedStyle(root);
   sprites=['--mesh-green','--mesh-pink','--mesh-purple','--mesh-warm'].map(name=>{
    const sprite=document.createElement('canvas');sprite.width=sprite.height=192;const paint=sprite.getContext('2d');
    if(paint){const color=style.getPropertyValue(name).trim();const gradient=paint.createRadialGradient(96,96,0,96,96,96);gradient.addColorStop(0,color);gradient.addColorStop(.3,color);gradient.addColorStop(1,'transparent');paint.fillStyle=gradient;paint.fillRect(0,0,192,192);}return sprite;
   });
  };
  const resize=()=>{
   width=window.innerWidth;height=window.innerHeight;
   const ratio=Math.min(window.devicePixelRatio||1,modest?1:1.5,Math.sqrt(1500000/(width*height)));
   element.width=Math.round(width*ratio);element.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);
   const count=width<768||modest?12:20;
   circles=Array.from({length:count},(_,i)=>({x:((i*.61803398875+.12)%1)*width,y:((i*.381966+.08)%1)*height,r:45+(i*37%95),phase:i*2.4,dx:0,dy:0}));
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;last=0;};
  const draw=(time:number)=>{
   frame=0;if(disposed||document.hidden||motion.matches)return;
   frame=requestAnimationFrame(draw);if(time-last<interval-.5)return;
   const step=last?Math.min((time-last)/1000,.06):1/60;last=time;elapsed+=step;
   const costStart=performance.now();context.clearRect(0,0,width,height);
   const ease=1-Math.exp(-step*2);glow+=(Number(pointer.active)-glow)*ease;scrollImpulse*=Math.exp(-step*1.4);
   for(let i=0;i<circles.length;i++){
    const circle=circles[i],x=circle.x+Math.sin(elapsed*.12+circle.phase)*24,y=circle.y+Math.cos(elapsed*.1+circle.phase)*18;
    const vx=x-pointer.x,vy=y-pointer.y,distance=Math.hypot(vx,vy),force=pointer.active?Math.max(0,1-distance/260)*24:0;
    circle.dx+=(vx/Math.max(distance,1)*force-circle.dx)*ease;circle.dy+=((vy/Math.max(distance,1)*force+scrollImpulse)-circle.dy)*ease;
    context.globalAlpha=.12+Math.sin(elapsed*.2+circle.phase)*.025;
    context.drawImage(sprites[i%4],x+circle.dx-circle.r,y+circle.dy-circle.r,circle.r*2,circle.r*2);
   }
   if(glow>.002){context.globalAlpha=glow*.08;context.drawImage(sprites[0],pointer.x-160,pointer.y-160,320,320);}
   context.globalAlpha=1;
   // Back off on devices where a frame consumes a material part of the budget.
   if(performance.now()-costStart>8)interval=1000/30;
  };
  const resume=()=>{if(started&&!disposed&&!document.hidden&&!motion.matches&&!frame){last=0;frame=requestAnimationFrame(draw);}};
  const visibility=()=>{if(document.hidden)stop();else resume();};
  const reduce=()=>{stop();context.clearRect(0,0,width,height);pointer.active=false;glow=0;if(!motion.matches)resume();};
  const move=(event:PointerEvent)=>{if(motion.matches)return;pointer={x:event.clientX,y:event.clientY,active:true};};
  const leave=()=>{pointer.active=false;};
  const release=(event:PointerEvent)=>{if(event.pointerType!=='mouse')leave();};
  const scroll=()=>{if(!motion.matches)scrollImpulse=Math.max(-24,Math.min(24,scrollImpulse+(window.scrollY-lastScroll)*.06));lastScroll=window.scrollY;};
  colorize();resize();
  const observer=new MutationObserver(colorize);observer.observe(root,{attributes:true,attributeFilter:['data-theme','data-cvd']});
  window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',move,{passive:true});window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',leave,{passive:true});document.addEventListener('pointerleave',leave,{passive:true});window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',reduce);
  const start=()=>{started=true;resume();};
  // Keep first paint free of animation setup work; sprites themselves are tiny.
  if(typeof window.requestIdleCallback==='function')idle=window.requestIdleCallback(start,{timeout:2000});else timer=window.setTimeout(start,500);
  return()=>{disposed=true;stop();if(idle)window.cancelIdleCallback(idle);clearTimeout(timer);observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',move);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',leave);document.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',reduce);sprites=[];circles=[];};
 },[]);
 return <canvas ref={canvas} className="ambient-background" aria-hidden="true"/>;
}
