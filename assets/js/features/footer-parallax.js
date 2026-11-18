/* The editorial panel enters with parallax; its last strip reveals the pinned name. */
(() => {
 const states=new Map;
 function dispose(page){states.forEach((s,el)=>{if(page.contains(el)){s.mm.revert();s.ro.disconnect();states.delete(el);}});}
 function init(page){
  page.querySelectorAll('.footer-editorial-panel[data-footer-parallax]').forEach(footer=>{
   if(states.has(footer))return;
   const wrap=footer.closest('.footer-wrap'), inner=footer.querySelector('[data-footer-parallax-inner]');
   const name=wrap?.querySelector('.sticky-footer');
   const title=footer.querySelector('.footer-editorial__contact');
   if(title){title.removeAttribute('href');title.removeAttribute('tabindex');title.removeAttribute('data-trigger');title.setAttribute('role','heading');title.setAttribute('aria-level','2');}
   let tint=footer.querySelector(':scope > .footer-parallax__tint');
   if(!tint){tint=document.createElement('div');tint.className='footer-parallax__tint';tint.setAttribute('aria-hidden','true');footer.append(tint);}
   const measure=()=>{if(name)wrap.style.setProperty('--footer-frost-height',name.offsetHeight*.5+'px');};
   const ro=new ResizeObserver(measure);if(name)ro.observe(name);measure();
   const mm=gsap.matchMedia();states.set(footer,{mm,ro});
   mm.add('(min-width:992px) and (prefers-reduced-motion:no-preference)',()=>{
    if(!inner)return;
    const tl=gsap.timeline({scrollTrigger:{trigger:footer,start:'clamp(top bottom)',end:'clamp(top top)',scrub:true,invalidateOnRefresh:true}});
    tl.fromTo(inner,{yPercent:-20},{yPercent:0,ease:'none',duration:1},0)
      .fromTo(tint,{opacity:.55},{opacity:0,ease:'none',duration:1},0);
   });
  });
 }
 function boot(){if(!window.gsap||!window.ScrollTrigger)return;if(window.barba){barba.hooks.afterEnter(d=>init(d.next.container));barba.hooks.afterOnce(d=>init(d.next.container));barba.hooks.beforeLeave(d=>dispose(d.current.container));}else init(document);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
