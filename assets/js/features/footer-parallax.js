/* Two sequential parallax reveals. Geometry, rather than an opaque mask, hides the name. */
(() => {
  const states=new Map();
  const OVERLAP=.7; // Half of the visible glyph, allowing for the font’s line box.
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
      let frozen=false;const mm=gsap.matchMedia();
      const measure=()=>{if(!frozen)wrap.style.setProperty('--footer-overlap',name.offsetHeight*OVERLAP+'px');};
      const ro=new ResizeObserver(measure);ro.observe(name);measure();
      mm.add('(min-width:992px) and (prefers-reduced-motion:no-preference)',()=>{
        // The half-height overlap follows normal flow until the panel bottom arrives.
        // Read the actual flow box, so a resize or a preceding pin cannot leave a stale end.
        let lastOffset,lastEntry;
        const legal=inner.querySelector('.footer-legal');
        let placeholder,legalStyle;
        if(legal){
          legalStyle=legal.getAttribute('style');placeholder=document.createElement('div');
          placeholder.className='footer-legal-placeholder';placeholder.style.height=legal.offsetHeight+'px';placeholder.style.marginTop='auto';
          legal.before(placeholder);wrap.append(legal);legal.dataset.footerLegalFloating='';
        }
        const paint=()=>{
          if(frozen)return;
          const entry=Math.max(0,Math.min(1,(innerHeight-panel.getBoundingClientRect().top)/innerHeight));
          if(entry!==lastEntry){
            inner.style.setProperty('--footer-entry-y',(-20*(1-entry))+'%');
            tint.style.opacity=String(.55*(1-entry));lastEntry=entry;
          }
          const height=name.offsetHeight,top=stage.getBoundingClientRect().top;
          if(!height)return;
          const progress=Math.max(0,Math.min(1,(innerHeight-top)/height));
          const offset=-height*OVERLAP*(1-progress);
          if(offset!==lastOffset){name.style.setProperty('--footer-reveal-y',offset+'px');lastOffset=offset;}
          if(legal){const a=placeholder.getBoundingClientRect(),b=wrap.getBoundingClientRect();legal.style.left=(a.left-b.left)+'px';legal.style.top=(a.top-b.top)+'px';legal.style.width=a.width+'px';}
        };
        paint();gsap.ticker.add(paint);
        return ()=>{if(legal){placeholder.replaceWith(legal);delete legal.dataset.footerLegalFloating;if(legalStyle===null)legal.removeAttribute('style');else legal.setAttribute('style',legalStyle);}gsap.ticker.remove(paint);name.style.removeProperty('--footer-reveal-y');inner.style.removeProperty('--footer-entry-y');tint.style.opacity='0';};
      });
      states.set(panel,{
        freeze(){if(frozen)return;frozen=true;ro.disconnect();},
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
