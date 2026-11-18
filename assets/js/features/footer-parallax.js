(()=>{

const SETTINGS = {
  "start": "clamp(top bottom)",
  "end": "clamp(top top)",
  "offsetPercent": -25,
  "overlayOpacity": 0.5,
  "overlayColour": "var(--_theme---neutral--700)",
  "ease": "none"
};

const states=new Map();
function freeze(page){states.forEach((s,footer)=>{if(page.contains(footer)){s.tl.scrollTrigger?.kill(false);s.tl.pause();}});}
function dispose(page){states.forEach((s,footer)=>{if(page.contains(footer)){s.tl.scrollTrigger?.kill(false);s.tl.kill();states.delete(footer);}});}
function init(page){if(!page||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
page.querySelectorAll('[data-footer-parallax]').forEach(footer=>{
 if(states.has(footer)){const old=states.get(footer);old.tl.scrollTrigger?.kill();old.tl.kill();states.delete(footer);}footer.style.setProperty('transform','none','important');
 const inner=footer.querySelector('[data-footer-parallax-inner]'),dark=footer.querySelector('[data-footer-parallax-dark]');if(!inner||!dark)return;dark.style.backgroundColor=SETTINGS.overlayColour;
 const tl=gsap.timeline({scrollTrigger:{trigger:footer,refreshPriority:-100,start:SETTINGS.start,end:SETTINGS.end,scrub:true,invalidateOnRefresh:true}});
 tl.fromTo(inner,{yPercent:SETTINGS.offsetPercent},{yPercent:0,ease:SETTINGS.ease},0).fromTo(dark,{opacity:SETTINGS.overlayOpacity},{opacity:0,ease:SETTINGS.ease},0);states.set(footer,{tl});
});}
function boot(){if(!window.gsap||!window.ScrollTrigger)return;if(!window.barba){init(document);return;}barba.hooks.beforeLeave(d=>freeze(d.current.container));barba.hooks.afterEnter(d=>init(d.next.container));barba.hooks.afterOnce(d=>init(d.next.container));barba.hooks.after(d=>dispose(d.current.container));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
