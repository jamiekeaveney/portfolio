(() => {
  if (!window.barba) return;
  const mobile = matchMedia('(max-width:61.9375rem)');
  function keepBlur() {
    const blur = document.querySelector('.progressive_blur');
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
      pressedPoster = event.target.closest('.home_slide_image,.work_card_thumb')?.querySelector('.project_preview_poster');
      pressedPoster?.classList.add('project-preview__poster--touching');
    }, {passive:true});
    document.addEventListener('pointercancel', clearPressedPoster);
    document.addEventListener('pointerup', clearPressedPoster);
    window.addEventListener('blur', clearPressedPoster);
    const blur = document.querySelector('.progressive_blur');
    barba.hooks.before(() => blur?.classList.add('progressive-blur--transition'));
    barba.hooks.after(() => blur?.classList.remove('progressive-blur--transition'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
})();
