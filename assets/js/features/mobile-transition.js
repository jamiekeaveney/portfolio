(() => {
  if (!window.barba) return;
  const mobile = matchMedia('(max-width:61.9375rem)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const listing = path => path === '/' || path === '/projects';
  let active;
  function card(page, path) {
    const link = [...page.querySelectorAll('.home-slide a[href],.work-card__link[href]')]
      .find(el => new URL(el.href, location.href).pathname === path);
    return link?.closest('.home-slide,.work-card')?.querySelector('.home-slide-image,.work-card__thumb');
  }
  function release() {
    if (!active) return;
    active.observer?.disconnect();
    active.source?.removeAttribute('data-case-origin');
    active.target?.removeAttribute('data-case-landing');
    active = null;
  }
  function keepBlur() {
    const blur = document.querySelector('.progressive-blur');
    if (!blur) return;
    const anchor = document.createComment('');
    blur.before(anchor);
    function position() {
      blur.classList.toggle('progressive-blur--persistent', mobile.matches);
      if (mobile.matches) document.body.append(blur);
      else anchor.after(blur);
    }
    position();
    mobile.addEventListener('change',position);
  }

  barba.hooks.before(data => {
    release();
    if (!mobile.matches || reduced.matches || !data.next.container) return;
    const page = data.next.container;
    const open = page.matches('[data-case-page]') && listing(data.current.url.path);
    const returning = data.current.container.matches('[data-case-page]') && listing(data.next.url.path);
    if (!open && !returning) return;
    const source = open ? card(data.current.container,data.next.url.path) : null;
    const target = open ? page.querySelector('.case-featured .case-media') : card(page,data.current.url.path);
    if (!target) return;
    const job = active = {open,source,target,page};
    source?.setAttribute('data-case-origin','');
    if (open) target.setAttribute('data-case-landing','');
    const poster = target.querySelector('.project-preview__poster,.work-card__image');
    if (poster) poster.loading = 'eager';
    if (!returning) return;
    try {
      const origin = JSON.parse(sessionStorage.getItem('jk-project-origin'));
      job.scroll = origin?.path === data.next.url.path ? Number(origin.y) || 0 : 0;
    } catch { job.scroll = 0; }
    job.observer = new MutationObserver(() => {
      if (!document.querySelector('body > .case-return-media')) return;
      job.observer.disconnect();
      const y = Math.max(0,-(parseFloat(page.style.top) || 0));
      gsap.set(page,{clearProps:'position,top,left,right,width'});
      window.scrollTo({top:y,behavior:'instant'});
      window.JKProject?.lenis?.()?.scrollTo(y,{immediate:true,force:true});
    });
    job.observer.observe(document.body,{childList:true});
  });

  function init() {
    keepBlur();
    let pressedPoster;
    function clearPressedPoster() {
      pressedPoster?.classList.remove('project-preview__poster--touching');
      pressedPoster = null;
    }
    document.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || !mobile.matches) return;
      clearPressedPoster();
      pressedPoster = event.target.closest('.home-slide-image,.work-card__thumb')?.querySelector('.project-preview__poster');
      pressedPoster?.classList.add('project-preview__poster--touching');
    }, {passive:true});
    document.addEventListener('pointercancel', clearPressedPoster);
    document.addEventListener('pointerup', clearPressedPoster);
    window.addEventListener('blur', clearPressedPoster);
    const blur = document.querySelector('.progressive-blur');
    barba.hooks.before(() => blur?.classList.add('progressive-blur--transition'));
    barba.hooks.after(() => blur?.classList.remove('progressive-blur--transition'));
    if (!window.gsap) return;
    barba.hooks.beforeEnter(data => {
      if (!active || active.open || active.page !== data.next.container) return;
      active.page.dataset.restoreScroll = 'true';
      window.JKReveals?.restore(active.page,active.scroll);
    });
    barba.hooks.afterEnter(data => {
      if (active?.page === data.next.container && !active.open) {
        window.JKReveals?.restore(active.page,window.scrollY);
      }
    });
    barba.hooks.after(release);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
})();
