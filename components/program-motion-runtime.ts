type Connection=EventTarget&{saveData?:boolean};
type DeviceNavigator=Navigator&{connection?:Connection;deviceMemory?:number};
type Card={element:HTMLElement;top:number;left:number;width:number;height:number;visible:boolean;center:boolean;entered:boolean;entering:boolean;hover:boolean;pressed:boolean};
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
/** One event-batched frame for this grid; CSS owns the idle loops. */
export function mountProgramMotion(root:HTMLElement){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine) and (hover: hover)'),contrast=matchMedia('(forced-colors: active)');
 const device=navigator as DeviceNavigator,connection=device.connection;
 const cards:Card[]=[...root.querySelectorAll<HTMLElement>('.program-showcase-card')].map(element=>({element,top:0,left:0,width:0,height:0,visible:false,center:false,entered:false,entering:false,hover:false,pressed:false}));
 let frame=0,dirty=true,x=0,y=0,scroll=window.scrollY,viewHeight=window.innerHeight,gridTop=0,gridHeight=1,disposed=false;
 const grid=root.querySelector<HTMLElement>('.programs-showcase-grid');
 const limited=()=>!!connection?.saveData||(device.deviceMemory!==undefined&&device.deviceMemory<=2)||(navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=2);
 const staticMode=()=>reduced.matches||contrast.matches;
 const focused=(c:Card)=>c.element.contains(document.activeElement);
 const draw=()=>{
  frame=0;if(disposed||document.hidden)return;
  scroll=window.scrollY;
  if(dirty){
   viewHeight=window.innerHeight;
   const r=grid?.getBoundingClientRect();gridTop=(r?.top||0)+scroll;gridHeight=r?.height||1;
   const boxes=cards.map(c=>c.element.getBoundingClientRect());
   cards.forEach((c,i)=>{const b=boxes[i];c.top=b.top+scroll;c.left=b.left;c.width=b.width;c.height=b.height;});dirty=false;
  }
  const still=staticMode(),low=limited();root.dataset.programMotion=still?'static':low?'low':'full';root.dataset.programsHidden='false';
  root.style.setProperty('--section-progress',String(still?0:clamp((scroll+viewHeight-gridTop)/(gridHeight+viewHeight))));
  root.style.setProperty('--intro-shift',`${still||low?0:clamp(scroll-gridTop+200,-100,300)*-.04}px`);
  for(const c of cards){
   const active=c.hover||focused(c)||c.pressed||c.center;
   c.element.dataset.visible=String(c.visible);c.element.dataset.center=String(c.center);
   c.element.dataset.state=c.pressed?'pressed':active?'active':c.entering?'enter':'idle';
   c.element.dataset.active=String(active);
   const progress=still||low?0:clamp((scroll+viewHeight-c.top)/(viewHeight+c.height));
   c.element.style.setProperty('--progress',String(progress));
   const track=fine.matches&&c.hover&&!still&&!low;
   const px=track?clamp((x-c.left)/Math.max(c.width,1),0,1)*2-1:0,py=track?clamp((y-(c.top-scroll))/Math.max(c.height,1),0,1)*2-1:0;
   c.element.style.setProperty('--pointer-x',String(px));c.element.style.setProperty('--pointer-y',String(py));
   c.element.style.setProperty('--mx',`${(px+1)*c.width/2-12}px`);c.element.style.setProperty('--my',`${track?y-(c.top-scroll)-12:100}px`);
   c.element.style.setProperty('--tilt-x',`${-py*3}deg`);c.element.style.setProperty('--tilt-y',`${px*4}deg`);
   c.element.dataset.moving=String(c.visible&&!still&&!low&&(c.hover||focused(c)));
  }
 };
 const schedule=()=>{if(!frame&&!document.hidden&&!disposed)frame=requestAnimationFrame(draw);};
 const measure=()=>{dirty=true;schedule();};
 const cardFor=(target:EventTarget|null)=>target instanceof Element?cards.find(c=>c.element===target.closest('.program-showcase-card')):undefined;
 const enter=(c:Card)=>{if(c.entered)return;c.entered=true;c.entering=!staticMode()&&!limited();c.element.dataset.enter=c.entering?'running':'done';};
 const visible='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries){const c=cards.find(c=>c.element===e.target);if(c){c.visible=e.isIntersecting;if(c.visible)enter(c);}}schedule();},{threshold:0}):null;
 const center='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries){const c=cards.find(c=>c.element===e.target);if(c)c.center=e.isIntersecting;}schedule();},{rootMargin:'-35% 0px -35% 0px',threshold:0}):null;
 for(const c of cards){if(visible){visible.observe(c.element);center?.observe(c.element);}else{c.visible=true;enter(c);}}
 const resize=new ResizeObserver(measure);resize.observe(root);
 const move=(event:PointerEvent)=>{x=event.clientX;y=event.clientY;const target=cardFor(event.target);for(const c of cards)c.hover=fine.matches&&event.pointerType!=='touch'&&c===target;schedule();};
 const out=(event:PointerEvent)=>{if(root.contains(event.relatedTarget as Node|null))return;for(const c of cards)c.hover=false;schedule();};
 const down=(event:PointerEvent)=>{const c=cardFor(event.target);if(c){c.pressed=true;enter(c);schedule();}};
 const release=()=>{for(const c of cards)c.pressed=false;schedule();};
 const focus=()=>{for(const c of cards)if(focused(c)){c.element.dataset.enter='done';c.entering=false;}schedule();};
 const keydown=(event:KeyboardEvent)=>{if(event.key==='Enter'){const c=cardFor(event.target);if(c){c.pressed=true;schedule();}}};
 const end=(event:AnimationEvent)=>{if(event.animationName!=='program-enter')return;const c=cardFor(event.target);if(c){c.entering=false;c.element.dataset.enter='done';schedule();}};
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;root.dataset.programsHidden='true';for(const c of cards){c.hover=false;c.pressed=false;c.element.dataset.moving='false';}}else measure();};
 const preferences=()=>{for(const c of cards){c.hover=false;c.pressed=false;if(staticMode()){c.entering=false;c.element.dataset.enter='done';}}measure();};
 root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',out,{passive:true});root.addEventListener('pointerdown',down,{passive:true});root.addEventListener('focusin',focus);root.addEventListener('focusout',focus);root.addEventListener('keydown',keydown);root.addEventListener('animationend',end);
 window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',release,{passive:true});window.addEventListener('keyup',release);window.addEventListener('blur',release);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',measure,{passive:true});
 document.addEventListener('visibilitychange',visibility);for(const m of [reduced,fine,contrast])m.addEventListener('change',preferences);connection?.addEventListener('change',preferences);measure();
 return()=>{disposed=true;cancelAnimationFrame(frame);visible?.disconnect();center?.disconnect();resize.disconnect();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',out);root.removeEventListener('pointerdown',down);root.removeEventListener('focusin',focus);root.removeEventListener('focusout',focus);root.removeEventListener('keydown',keydown);root.removeEventListener('animationend',end);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('keyup',release);window.removeEventListener('blur',release);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',visibility);for(const m of [reduced,fine,contrast])m.removeEventListener('change',preferences);connection?.removeEventListener('change',preferences);delete root.dataset.programMotion;delete root.dataset.programsHidden;root.style.removeProperty('--section-progress');root.style.removeProperty('--intro-shift');for(const c of cards){for(const key of ['visible','center','state','active','enter','moving'])delete c.element.dataset[key];for(const key of ['--progress','--pointer-x','--pointer-y','--mx','--my','--tilt-x','--tilt-y'])c.element.style.removeProperty(key);}};
}
