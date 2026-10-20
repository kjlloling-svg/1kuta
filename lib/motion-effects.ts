const revealSelector='main>section,main .section-heading,main .page-intro,main .about-section,main .about-person,main .directory-card,main .paper-card,main .year-item,main .faq-list details,main .admin-panel,main .auth-card,main .prose-section,main .detail-panel,main .favorites-list>li,main .admin-records>li,main .state-card';
const cardSelector='.directory-card,.paper-card';

/** Progressive enhancement: the observer starts animations, never hides waiting content. */
export function mountMotion(root:HTMLElement){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine) and (min-width:640px)'),solid=matchMedia('(prefers-reduced-transparency: reduce), (forced-colors: active)');
 const tracked=new Set<HTMLElement>(),lights=new Map<HTMLElement,HTMLSpanElement>();
 let scanFrame=0,pointFrame=0,active:HTMLElement|null=null,x=0,y=0,pressed=false,pointerId:number|null=null;
 const finish=(element:HTMLElement)=>{element.dataset.reveal='done';element.style.removeProperty('--reveal-index');};
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const element=entry.target as HTMLElement;observer?.unobserve(element);if(reduced.matches||element.contains(document.activeElement))finish(element);else element.dataset.reveal='running';}
 },{threshold:.08}):null;
 const scan=()=>{
  scanFrame=0;
  for(const element of root.querySelectorAll<HTMLElement>(revealSelector)){
   if(tracked.has(element)||element.querySelector(revealSelector)||element.closest('dialog'))continue;
   tracked.add(element);
   const siblings=element.parentElement?[...element.parentElement.children].filter(child=>child.matches(revealSelector)):[];
   element.style.setProperty('--reveal-index',String(Math.max(0,siblings.indexOf(element))%4));
   if(reduced.matches||!observer)finish(element);else observer.observe(element);
  }
  for(const element of tracked){if(!element.isConnected){observer?.unobserve(element);tracked.delete(element);}}
  for(const card of root.querySelectorAll<HTMLElement>(cardSelector)){if(!lights.has(card)){const light=document.createElement('span');light.className='card-spotlight';light.setAttribute('aria-hidden','true');card.appendChild(light);lights.set(card,light);}}
  for(const [card,light] of lights){if(!card.isConnected){light.remove();lights.delete(card);}}
 };
 const mutations=new MutationObserver(()=>{if(!scanFrame)scanFrame=requestAnimationFrame(scan);});
 const end=(event:AnimationEvent)=>{if(event.animationName==='motion-reveal')finish(event.target as HTMLElement);};
 const reset=()=>{cancelAnimationFrame(pointFrame);pointFrame=0;if(active){delete active.dataset.spotlight;delete active.dataset.pressed;active.style.removeProperty('--mx');active.style.removeProperty('--my');}active=null;pressed=false;pointerId=null;};
 const cardFor=(event:Event)=>event.target instanceof Element?event.target.closest<HTMLElement>(cardSelector):null;
 const place=()=>{pointFrame=0;if(!active)return;const rect=active.getBoundingClientRect();active.style.setProperty('--mx',x-rect.left+'px');active.style.setProperty('--my',y-rect.top+'px');};
 const track=(event:PointerEvent)=>{
  const card=cardFor(event);if(!card||solid.matches)return;
  const down=event.type==='pointerdown';
  if(!down&&(!pointer.matches||reduced.matches||event.pointerType==='touch'||pressed))return;
  if(down&&event.button!==0)return;
  if(active!==card)reset();active=card;x=event.clientX;y=event.clientY;
  if(down){pressed=true;pointerId=event.pointerId;card.dataset.pressed='true';}
  card.dataset.spotlight='true';if(!pointFrame)pointFrame=requestAnimationFrame(place);
 };
 const release=(event:PointerEvent)=>{if(pointerId===event.pointerId)reset();};
 const out=(event:PointerEvent)=>{if(active&&!(event.relatedTarget instanceof Node&&active.contains(event.relatedTarget)))reset();};
 const focus=(event:FocusEvent)=>{if(!(event.target instanceof Element))return;for(const element of tracked){if(element.contains(event.target)){observer?.unobserve(element);finish(element);}}reset();};
 const preference=()=>{reset();if(reduced.matches)for(const element of tracked){observer?.unobserve(element);finish(element);}};
 scan();mutations.observe(root,{childList:true,subtree:true});
 root.addEventListener('animationend',end);root.addEventListener('focusin',focus);
 root.addEventListener('pointerover',track,{passive:true});root.addEventListener('pointermove',track,{passive:true});root.addEventListener('pointerdown',track,{passive:true});root.addEventListener('pointerout',out,{passive:true});
 window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',release,{passive:true});window.addEventListener('blur',reset);window.addEventListener('resize',reset,{passive:true});
 reduced.addEventListener('change',preference);pointer.addEventListener('change',reset);solid.addEventListener('change',reset);
 return()=>{observer?.disconnect();mutations.disconnect();cancelAnimationFrame(scanFrame);reset();root.removeEventListener('animationend',end);root.removeEventListener('focusin',focus);root.removeEventListener('pointerover',track);root.removeEventListener('pointermove',track);root.removeEventListener('pointerdown',track);root.removeEventListener('pointerout',out);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',reset);window.removeEventListener('resize',reset);reduced.removeEventListener('change',preference);pointer.removeEventListener('change',reset);solid.removeEventListener('change',reset);for(const light of lights.values())light.remove();for(const element of tracked){delete element.dataset.reveal;element.style.removeProperty('--reveal-index');}};
}
