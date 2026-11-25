/* The editorial footer stays in flow; only the name has a parallax reveal. */
(() => {
  const states=new Map();
  const OVERLAP=.6; // Fallback until the actual font metrics are available.
  function glyphMidpoint(name){
    const text=name.querySelector?.('.marquee_text');if(!text)return name.offsetHeight*OVERLAP;
    const css=getComputedStyle(text),ctx=document.createElement('canvas').getContext('2d');ctx.font=css.font;
    const m=ctx.measureText('e'),size=parseFloat(css.fontSize),line=parseFloat(css.lineHeight)||size*1.08;
    const ascent=m.fontBoundingBoxAscent||size*.8,descent=m.fontBoundingBoxDescent||size*.2;
    const baseline=(line-ascent-descent)/2+ascent;
    const top=text.getBoundingClientRect().top-name.getBoundingClientRect().top;
    return Math.max(0,Math.min(name.offsetHeight,top+baseline-(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2));
  }
  function init(page) {
    page.querySelectorAll('.footer_editorial_panel').forEach(panel=>{
      if(states.has(panel))return;
      const wrap=panel.closest('.footer_wrap'),inner=panel.querySelector('.footer_editorial_wrap');
      const stage=wrap?.querySelector('.footer_sticky'),name=stage?.querySelector('.footer_main');
      if(!wrap||!inner||!stage||!name)return;
      const legal=inner.querySelector('.footer_legal');
      let frozen=false;const mm=gsap.matchMedia();
      let overlap=0,paintNow=()=>{};
      const measure=()=>{if(!frozen){overlap=glyphMidpoint(name);wrap.style.setProperty('--footer-overlap',overlap+'px');}};
      const ro=new ResizeObserver(measure);ro.observe(name);measure();
      mm.add('(min-width:62rem) and (prefers-reduced-motion:no-preference)',()=>{
        // The half-height overlap follows normal flow until the panel bottom arrives.
        // Read the actual flow box, so a resize or a preceding pin cannot leave a stale end.
        let lastOffset;
        let placeholder,legalStyle;
        if(legal){
          legalStyle=legal.getAttribute('style');placeholder=document.createElement('div');
          placeholder.className='footer_legal_placeholder';placeholder.style.height=legal.offsetHeight+'px';placeholder.style.marginTop='auto';
          legal.before(placeholder);wrap.append(legal);legal.classList.add('footer_legal_floating');
        }
        const paint=()=>{
          if(frozen)return;
          const height=name.offsetHeight,top=stage.getBoundingClientRect().top-(page.hasAttribute?.("data-loader-revealing")?(Number(gsap.getProperty(page,"y"))||0):0);
          if(!height)return;
          const progress=Math.max(0,Math.min(1,(innerHeight-top)/height));
          const offset=-overlap*(1-progress);
          if(offset!==lastOffset){name.style.setProperty('--footer-reveal-y',offset+'px');lastOffset=offset;}
          if(legal){const a=placeholder.getBoundingClientRect(),b=wrap.getBoundingClientRect();legal.style.left=(a.left-b.left)+'px';legal.style.top=(a.top-b.top)+'px';legal.style.width=a.width+'px';}
        };
        paintNow=paint;paint();gsap.ticker.add(paint);
        return ()=>{if(legal){placeholder.replaceWith(legal);legal.classList.remove('footer_legal_floating');if(legalStyle===null)legal.removeAttribute('style');else legal.setAttribute('style',legalStyle);}gsap.ticker.remove(paint);name.style.removeProperty('--footer-reveal-y');};
      });
      states.set(panel,{
        refresh(){measure();paintNow();},
        freeze(){if(frozen)return;frozen=true;ro.disconnect();},
        dispose(){this.freeze();mm.revert();}
      });
    });
  }
  function freeze(page){states.forEach((s,el)=>{if(page?.contains(el))s.freeze();});}
  function dispose(page){states.forEach((s,el)=>{if(page?.contains(el)){s.dispose();states.delete(el);}});}
  window.JKFooter={freeze,refresh(page){states.forEach((s,el)=>{if(page?.contains(el))s.refresh();});}};
  function boot(){
    if(!window.gsap||!window.ScrollTrigger)return;
    document.addEventListener('jk:loader-prepare',e=>init(e.detail.page));
    if(window.barba){barba.hooks.afterEnter(d=>init(d.next.container));barba.hooks.afterOnce(d=>init(d.next.container));barba.hooks.beforeLeave(d=>freeze(d.current.container));barba.hooks.after(d=>dispose(d.current.container));}
    else init(document);
    if(!document.querySelector('[data-barba="wrapper"]'))init(document);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
