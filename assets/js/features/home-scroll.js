/* Home-only scroll Flip. The preview's caption never contributes to the media ratio. */
(() => {
  const instances = new Map();
  function init(scope) {
    const page = scope?.querySelector ? scope : document.querySelector('[data-barba="container"]');
    const home = page?.querySelector('.scaling-video__wrapper');
    if (!home || instances.has(home) || !window.Flip || !window.ScrollTrigger) return;
    window.JKLightbox?.mount(page);
    const target = home.querySelector('.mini-showreel');
    const destination = page.querySelector('.scaling-element__big-box[data-flip-element="wrapper"]');
    const end = page.querySelector('[data-flip-element="end"]');
    if (!target || !destination || !end) return;
    const originalStyle = target.getAttribute('style');
    const fade = [...page.querySelectorAll('[data-flip-fade]')].filter(el=>!el.matches('[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll-arrow__mask')&&!el.querySelector('[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll-arrow__mask'));
    let timeline, timer, suspended = false, dead = false;
    const restore = () => originalStyle === null ? target.removeAttribute('style') : target.setAttribute('style', originalStyle);
    function build() {
      if (dead || suspended || target.dataset.miniShowreelStatus === 'active') return;
      timeline?.scrollTrigger?.kill();timeline?.kill();restore();
      if (matchMedia('(max-width: 991px), (prefers-reduced-motion: reduce)').matches) return;
      // Measure each visit from the resting pose, never from a partially scaled player.
      const vars = Flip.fit(target, destination, {getVars:true, scale:false});
      timeline = gsap.timeline({scrollTrigger:{id:'jk-home-showreel',trigger:end,start:0,end:'bottom bottom',scrub:true}});
      timeline.to(target,{...vars,duration:1,ease:'none'},0);
      if (fade.length) timeline.fromTo(fade,{autoAlpha:1},{autoAlpha:0,duration:.4,ease:'none'},0);
      timeline.scrollTrigger.refresh();timeline.scrollTrigger.update();
    }
    const resize = () => {clearTimeout(timer);timer=setTimeout(build,120);};
    const state = {page,target,build,suspend(){suspended=true;timeline?.scrollTrigger?.disable(false);},resume(){suspended=false;build();},cleanup(){
      dead=true;clearTimeout(timer);timeline?.scrollTrigger?.kill();timeline?.kill();
      window.removeEventListener('resize',resize);restore();instances.delete(home);
    }};
    instances.set(home,state);window.addEventListener('resize',resize);build();
  }
  window.initFlipOnScroll=init;
  window.JKHomeScroll={
    suspend(root){for(const s of instances.values())if(s.target===root)s.suspend();},
    resume(root){for(const s of instances.values())if(s.target===root)s.resume();}
  };
  function boot(){
    init();
    if(window.barba){
      // The boilerplate kills outgoing ScrollTriggers in afterLeave. Create incoming ones afterwards.
      barba.hooks.afterEnter(d=>init(d.next.container));barba.hooks.afterOnce(d=>init(d.next.container));
      barba.hooks.beforeLeave(d=>{for(const s of instances.values())if(s.page===d.current.container)s.suspend();});
      barba.hooks.afterLeave(d=>{for(const s of [...instances.values()])if(s.page===d.current.container)s.cleanup();});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
