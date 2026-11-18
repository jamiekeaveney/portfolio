/* Conventional touch player. Desktop keeps the original Mini Showreel timeline. */
(() => {
  const mobile=matchMedia('(max-width:991px), (pointer:coarse)');
  let dispose=()=>{},close=()=>{};
  function open(source,trigger,overrideURL) {
    if(!mobile.matches||!source)return;
    close(true);
    const url=overrideURL||source.currentSrc||source.getAttribute('data-src')||source.src;
    if(!url)return;
    const dialog=document.createElement('dialog'),video=document.createElement('video'),exit=document.createElement('button'),label=document.createElement('span');
    dialog.className='mobile-media-dialog';dialog.setAttribute('aria-label','Video player');
    exit.type='button';exit.className='lightbox-close';label.textContent='Close';exit.append(label);
    const menu=document.querySelector('.sitenav__menu');
    if(menu){const r=menu.getBoundingClientRect();exit.style.top=r.top+'px';exit.style.right=(innerWidth-r.right)+'px';exit.style.height=r.height+'px';}
    video.controls=true;video.playsInline=true;video.poster=source.poster||'';video.preload='metadata';
    dialog.append(video,exit);document.body.append(dialog);
    let hls,closing=false;
    if(/\.m3u8(?:[?#]|$)/i.test(url)&&!video.canPlayType('application/vnd.apple.mpegurl')&&window.Hls?.isSupported()){
      hls=new Hls({maxBufferLength:10});hls.loadSource(url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));
    }else{video.src=url;video.play().catch(()=>{});}
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const finish=()=>{video.pause();hls?.destroy();dialog.close();dialog.remove();document.documentElement.classList.remove('is-lightbox-open');trigger?.focus({preventScroll:true});close=()=>{};};
    close=(immediate=false)=>{
      if(closing&&!immediate)return;closing=true;gsap.killTweensOf([dialog,video,label]);
      if(immediate||reduced){finish();return;}
      gsap.timeline({onComplete:finish}).to(label,{yPercent:-110,autoAlpha:0,duration:.25,ease:'expo.in'},0).to(video,{autoAlpha:0,duration:.25},0).to(dialog,{opacity:0,duration:.3},.1);
    };
    exit.addEventListener('click',()=>close());
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    document.documentElement.classList.add('is-lightbox-open');dialog.showModal();exit.focus();
    if(!reduced)gsap.timeline().fromTo(dialog,{opacity:0},{opacity:1,duration:.3},0).fromTo(video,{autoAlpha:0,scale:.97},{autoAlpha:1,scale:1,duration:.5,ease:'expo.out'},.1).fromTo(label,{yPercent:110,autoAlpha:0},{yPercent:0,autoAlpha:1,duration:.5,ease:'expo.out'},.2);
  }
  window.JKMobileMedia={open};
  function mount(page){
    dispose();const abort=new AbortController(),buttons=[];
    page.querySelectorAll('video').forEach(source=>{
      if(source.closest('a,.mini-showreel,[data-project-lightbox],[data-follower-cursor],.about-portrait-flight'))return;
      const host=source.closest('.video-wrap')||source.parentElement;
      if(!host||host.querySelector('[data-mobile-play]'))return;
      const button=document.createElement('button');button.type='button';button.className='mobile-media-play';button.dataset.mobilePlay='';button.setAttribute('aria-label','Play video');host.append(button);buttons.push(button);
      button.addEventListener('click',()=>open(source,button),{signal:abort.signal});
    });
    dispose=()=>{close(true);abort.abort();buttons.forEach(b=>b.remove());};
  }
  function boot(){mount(document.querySelector('[data-barba="container"]')||document);if(window.barba){barba.hooks.afterEnter(d=>mount(d.next.container));barba.hooks.beforeLeave(()=>close(true));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
