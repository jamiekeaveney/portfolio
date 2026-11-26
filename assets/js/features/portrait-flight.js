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
      const slot = origin.closest('.editorial_media_slot');
      if (!slot) return;
      const flight = document.createElement('div'), face = image.cloneNode(true);
      flight.className = 'portrait_flight';
      flight.setAttribute('aria-hidden','true');
      face.className = 'portrait_flight_image';
      face.removeAttribute('style'); face.alt = '';
      flight.append(face); page.append(flight);
      let track, frame, tilt = 0;
      function paint(trigger) {
        if (frozen || !trigger) return;
        const p = trigger.progress;
        const inFlight = p>0 && p<1;
        const remaining = Math.max(0, 1 - p / .65);
        const slotScale = remaining * motion.edgeRamp(remaining, .15);
        slot.style.width = p>0 ? ((origin.getBoundingClientRect().width + (parseFloat(getComputedStyle(origin).marginRight) || 0)) * slotScale) + 'px' : '';
        image.style.visibility = p>0 ? 'hidden' : '';
        destination.style.visibility = p<1 ? 'hidden' : '';
        flight.hidden = !inFlight;
        flight.style.visibility = inFlight ? 'visible' : 'hidden';
        if (!inFlight) return;
        const from = origin.getBoundingClientRect(), to = target.getBoundingClientRect();
        const root = (flight.offsetParent || page).getBoundingClientRect();
        const style = getComputedStyle(origin);
        motion.place(flight, from, to, root, p);
        flight.style.opacity = String(motion.mix(Number(style.opacity), 1, p));
        flight.style.borderRadius = motion.mix(parseFloat(style.borderTopLeftRadius) || 0,
          parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0, p) + 'px';
      }
      function afterLayout() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => paint(track));
      }
      track = ScrollTrigger.create({trigger:slot,start:'center center',endTrigger:target,end:'center center',
        onUpdate:paint,onRefresh:afterLayout});
      function momentum(_,dt) {
        if (frozen) return;
        tilt=motion.updateTilt(face,tilt,track.getVelocity(),dt,track.progress);
      }
      const size = new ResizeObserver(afterLayout);
      size.observe(origin);size.observe(target);
      size.observe(origin.closest('.section_wrap') || slot);
      size.observe(target.parentElement);
      window.addEventListener('resize', afterLayout);
      gsap.ticker.add(momentum);paint(track);
      release=()=>{
        size.disconnect();window.removeEventListener('resize', afterLayout);cancelAnimationFrame(frame);
        gsap.ticker.remove(momentum);track.kill();flight.remove();
        slot.style.removeProperty('width');image.style.removeProperty('visibility');destination.style.removeProperty('visibility');
      };
    }
    function attach() { if(!release)mount(); }
    const observer = new MutationObserver(()=>{
      if (!origin.closest('.editorial_media_slot')) return;
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
