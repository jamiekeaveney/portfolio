(() => {
  const media = matchMedia('(min-width:62rem) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  const controllers = new WeakMap();
  const motion = window.JKScrollMediaMotion;

  function prepare(page, active=true) {
    const origin = page?.querySelector('[data-portrait-source]');
    const target = page?.querySelector('[data-portrait-destination]');
    if (!origin || !target || controllers.has(page)) return;

    const image = origin.querySelector('img'), destination = target.querySelector('img');
    if (!image || !destination) return;
    image.loading = 'eager';
    let release, frozen = false;

    function mount() {
      release?.(); release = null;
      if (!active || !media.matches || frozen || !page.isConnected || !window.ScrollTrigger) return;
      const slot = origin.closest('.editorial-media-slot');
      if (!slot) return;
      const flight = document.createElement('div'), face = image.cloneNode(true);
      flight.className = 'portrait-flight';
      flight.setAttribute('aria-hidden','true');
      face.className = 'portrait-flight__image';
      face.removeAttribute('style'); face.alt = '';
      flight.append(face); page.append(flight);
      const coordinateRoot = flight.offsetParent || page;
      const progress = {value:0};
      let tween, tilt = 0;
      const mix = (a,b,t) => a + (b-a)*t;
      function paint() {
        if (frozen) return;
        const p = progress.value;
        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const rem = value => (value / remSize) + 'rem';
        const inFlight = p>0 && p<1;
        const from = origin.getBoundingClientRect();
        slot.style.width = p>0 ? rem((from.width + parseFloat(getComputedStyle(origin).marginRight || 0)) * (1-Math.min(1,p/.65))) : '';
        image.style.visibility = p>0 ? 'hidden' : '';
        destination.style.visibility = p<1 ? 'hidden' : '';
        flight.hidden = !inFlight;
        flight.style.visibility = inFlight ? 'visible' : 'hidden';
        if (!inFlight) return;
        const to = target.getBoundingClientRect(), root = coordinateRoot.getBoundingClientRect();
        const style = getComputedStyle(origin);
        Object.assign(flight.style,{
          left:rem(mix(from.left,to.left,p)-root.left),top:rem(mix(from.top,to.top,p)-root.top),
          width:rem(mix(from.width,to.width,p)),height:rem(mix(from.height,to.height,p)),
          opacity:String(mix(Number(style.opacity),1,p)),
          borderRadius:rem(mix(parseFloat(style.borderTopLeftRadius)||0,parseFloat(getComputedStyle(target).borderTopLeftRadius)||0,p))
        });
      }
      tween=gsap.to(progress,{value:1,ease:'sine.inOut',onUpdate:paint,scrollTrigger:{
        trigger:slot,start:'center center',endTrigger:target,end:'center center',scrub:motion.settings.scrub,
        onRefresh:paint,invalidateOnRefresh:true
      }});
      function momentum(_,dt) {
        if (frozen) return;
        tilt=motion.updateTilt(face,tilt,tween.scrollTrigger.getVelocity(),dt,progress.value);
      }
      const size = new ResizeObserver(paint);
      size.observe(origin);size.observe(target);
      gsap.ticker.add(momentum);paint();
      release=()=>{
        size.disconnect();gsap.ticker.remove(momentum);tween.scrollTrigger?.kill();tween.kill();flight.remove();
        slot.style.removeProperty('width');image.style.removeProperty('visibility');destination.style.removeProperty('visibility');
      };
    }
    function attach() { if(!release)mount(); }
    const observer = new MutationObserver(()=>{
      if (!origin.closest('.editorial-media-slot')) return;
      observer.disconnect();attach();
    });
    observer.observe(origin.parentElement,{childList:true,subtree:true});
    media.addEventListener('change',mount);
    controllers.set(page,{attach,activate(){active=true;attach();},freeze(){frozen=true;},destroy(){
      observer.disconnect();media.removeEventListener('change',mount);release?.();
      controllers.delete(page);
    }});
    attach();
  }

  prepare(document.querySelector('[data-barba="container"]'));
  window.barba?.hooks.before(d=>controllers.get(d.current.container)?.freeze());
  window.barba?.hooks.afterLeave(d=>controllers.get(d.current.container)?.destroy());
  window.barba?.hooks.beforeEnter(d=>prepare(d.next.container,false));
  window.barba?.hooks.afterEnter(d=>controllers.get(d.next.container)?.activate());
  document.addEventListener('jk:loader-prepare',e=>controllers.get(e.detail.page)?.attach());
})();
