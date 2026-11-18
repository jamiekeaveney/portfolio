/* Two sequential parallax reveals. Geometry, rather than an opaque mask, hides the name. */
(() => {
  const states=new Map();
  function init(page) {
    page.querySelectorAll('.footer-editorial-panel').forEach(panel=>{
      if(states.has(panel))return;
      const wrap=panel.closest('.footer-wrap'),inner=panel.querySelector('.footer-editorial');
      const stage=wrap?.querySelector('.sticky-footer'),name=stage?.querySelector('.footer');
      if(!wrap||!inner||!stage||!name)return;
      const title=panel.querySelector('.footer-editorial__contact');
      if(title){title.removeAttribute('href');title.removeAttribute('tabindex');title.removeAttribute('data-trigger');title.setAttribute('role','heading');title.setAttribute('aria-level','2');}
      let tint=panel.querySelector(':scope > .footer-parallax__tint');
      if(!tint){tint=document.createElement('div');tint.className='footer-parallax__tint';tint.setAttribute('aria-hidden','true');panel.append(tint);}
      let frozen=false;const animations=[],mm=gsap.matchMedia();
      const measure=()=>{if(!frozen)wrap.style.setProperty('--footer-overlap',name.offsetHeight*.5+'px');};
      const ro=new ResizeObserver(measure);ro.observe(name);measure();
      mm.add('(min-width:992px) and (prefers-reduced-motion:no-preference)',()=>{
        const entry=gsap.timeline({scrollTrigger:{trigger:panel,start:'clamp(top bottom)',end:'clamp(top top)',scrub:true,invalidateOnRefresh:true}});
        entry.fromTo(inner,{yPercent:-20},{yPercent:0,ease:'none',duration:1},0)
          .fromTo(tint,{opacity:.55},{opacity:0,ease:'none',duration:1},0);
        // The half-height overlap follows normal flow until the panel bottom arrives.
        // Read the actual flow box, so a resize or a preceding pin cannot leave a stale end.
        let lastOffset;
        const paint=()=>{
          if(frozen)return;
          const height=name.offsetHeight,top=stage.getBoundingClientRect().top;
          const progress=Math.max(0,Math.min(1,(innerHeight-top)/height));
          const offset=-height*.5*(1-progress);
          if(offset!==lastOffset){name.style.setProperty('--footer-reveal-y',offset+'px');lastOffset=offset;}
        };
        paint();gsap.ticker.add(paint);animations.push(entry);
        return ()=>{gsap.ticker.remove(paint);name.style.removeProperty('--footer-reveal-y');animations.length=0;};
      });
      states.set(panel,{
        freeze(){if(frozen)return;frozen=true;ro.disconnect();animations.forEach(a=>{a.scrollTrigger?.kill(false);a.pause();});},
        dispose(){this.freeze();mm.revert();}
      });
    });
  }
  function freeze(page){states.forEach((s,el)=>{if(page?.contains(el))s.freeze();});}
  function dispose(page){states.forEach((s,el)=>{if(page?.contains(el)){s.dispose();states.delete(el);}});}
  window.JKFooter={freeze};
  function boot(){
    if(!window.gsap||!window.ScrollTrigger)return;
    if(window.barba){barba.hooks.afterEnter(d=>init(d.next.container));barba.hooks.afterOnce(d=>init(d.next.container));barba.hooks.beforeLeave(d=>freeze(d.current.container));barba.hooks.after(d=>dispose(d.current.container));}
    else init(document);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
