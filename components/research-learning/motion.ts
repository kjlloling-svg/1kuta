/** CSS owns loops; pointer events share one scheduled transform update. */
export function mountLearningMotion(root:HTMLElement){
 const paper=root.querySelector<HTMLElement>('.learning-paper'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine) and (hover: hover)');
 const blocks=[...root.querySelectorAll<HTMLElement>('.learning-block')];let frame=0,x=0,y=0,box:DOMRect|undefined;
 const low=()=>!!(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
 const allowed=()=>!reduced.matches&&fine.matches&&!low()&&!document.hidden;
 const draw=()=>{frame=0;if(allowed()&&paper){paper.style.setProperty('--learn-x',`${x}px`);paper.style.setProperty('--learn-y',`${y}px`);paper.dataset.pointer='true';}};
 const move=(e:PointerEvent)=>{if(!allowed()||e.pointerType==='touch')return;box??=paper?.getBoundingClientRect();if(!box)return;x=e.clientX-box.left;y=e.clientY-box.top;if(!frame)frame=requestAnimationFrame(draw);};
 const leave=()=>{if(paper)delete paper.dataset.pointer;box=undefined;cancelAnimationFrame(frame);frame=0;};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target as HTMLElement;el.dataset.learningVisible=String(entry.isIntersecting);if(entry.isIntersecting)el.dataset.learningEntered='true';}},{threshold:.05});blocks.forEach(b=>observer.observe(b));
 const visibility=()=>{root.dataset.learningHidden=String(document.hidden||low());if(document.hidden)leave();};
 const resize=new ResizeObserver(()=>{box=undefined;});if(paper)resize.observe(paper);
 paper?.addEventListener('pointermove',move,{passive:true});paper?.addEventListener('pointerleave',leave,{passive:true});window.addEventListener('scroll',leave,{passive:true});window.addEventListener('resize',leave,{passive:true});document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',leave);fine.addEventListener('change',leave);visibility();
 return()=>{leave();observer.disconnect();resize.disconnect();paper?.removeEventListener('pointermove',move);paper?.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',leave);window.removeEventListener('resize',leave);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',leave);fine.removeEventListener('change',leave);};
}
