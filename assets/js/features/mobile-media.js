/* Conventional touch player. Desktop keeps the original Mini Showreel timeline. */
(() => {
  const mobile=matchMedia('(max-width:61.9375rem), (pointer:coarse)');
  let dispose=()=>{},close=()=>{};
  const root=document.documentElement;
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')root.setAttribute('data-touch-input','');
    else root.removeAttribute('data-touch-input');
  },true);
  document.addEventListener('keydown',()=>root.removeAttribute('data-touch-input'),true);
  function open(source,trigger,overrideURL) {
    if(!mobile.matches||!source)return;
    close(true);
    const url=overrideURL||source.currentSrc||source.getAttribute('data-src')||source.src;
    if(!url)return;
    const dialog=document.createElement('dialog'),video=document.createElement('video'),exit=document.createElement('button'),label=document.createElement('span');
    dialog.className='mobile_media';video.className='mobile_media_video';dialog.setAttribute('aria-label','Video player');
    exit.type='button';exit.className='lightbox_close mobile_media_close';label.textContent='Close';exit.append(label);
    const menu=document.querySelector('.nav_menu');
    if(menu){const r=menu.getBoundingClientRect();exit.style.top=r.top+'px';exit.style.right=(innerWidth-r.right)+'px';exit.style.height=r.height+'px';}
    video.controls=true;video.playsInline=true;video.poster=source.poster||'';video.preload='metadata';
    video.style.aspectRatio=(source.videoWidth||16)+' / '+(source.videoHeight||9);
    dialog.append(video,exit);document.body.append(dialog);
    let hls,closing=false,gesture=null,suppressClick=false;
    const events=new AbortController();
    if(/\.m3u8(?:[?#]|$)/i.test(url)&&!video.canPlayType('application/vnd.apple.mpegurl')&&window.Hls?.isSupported()){
      hls=new Hls({maxBufferLength:10});hls.loadSource(url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));
    }else{video.src=url;video.play().catch(()=>{});}
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const shell=source.closest?.('.showreel_card,.services_video_wrap')||source;
    const sourceRadius=()=>parseFloat(getComputedStyle(shell).borderTopLeftRadius)||parseFloat(getComputedStyle(source).borderTopLeftRadius)||12;
    const finish=()=>{events.abort();video.pause();hls?.destroy();dialog.close();dialog.remove();document.documentElement.classList.remove('is-lightbox-open');trigger?.focus({preventScroll:true});close=()=>{};};
    close=(immediate=false)=>{
      if(closing&&!immediate)return;closing=true;gsap.killTweensOf([dialog,video,label]);
      if(immediate||reduced){finish();return;}
      const dest=source.getBoundingClientRect(),base=video.getBoundingClientRect();
      const visible=dest.width>0&&dest.height>0&&dest.bottom>0&&dest.top<innerHeight;
      gsap.timeline({onComplete:finish})
        .to(video,visible?{x:dest.left+dest.width/2-(innerWidth/2),y:dest.top+dest.height/2-(innerHeight/2),borderRadius:sourceRadius()*video.offsetWidth/dest.width,scaleX:dest.width/video.offsetWidth,scaleY:dest.height/video.offsetHeight,duration:.4,ease:'power3.inOut'}:{autoAlpha:0,scale:.9,duration:.3},0)
        .to(dialog,{'--media-backdrop':0,duration:.4},0);

    };
    exit.addEventListener('click',()=>close());
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();return;}if(e.target===dialog)close();},true);
    video.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'||closing)return;
      const box=video.getBoundingClientRect();
      // Native transport/seek controls retain their normal touch behaviour.
      if(e.clientY>box.bottom-64)return;
      gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),dragging:false,dy:0};
    },{signal:events.signal});
    video.addEventListener('pointermove',e=>{
      if(!gesture||gesture.id!==e.pointerId||closing)return;
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(!gesture.dragging){
        if(dy<10||dy<Math.abs(dx)*.35)return;
        gesture.dragging=true;video.setPointerCapture(e.pointerId);gsap.killTweensOf(video);suppressClick=true;
      }
      e.preventDefault();gesture.dy=dy;
      const progress=Math.min(1,Math.max(0,dy)/(innerHeight*.5));
      gsap.set(video,{x:dx*.65,y:dy,scale:1-progress*.18});
      gsap.set(dialog,{'--media-backdrop':1-progress*.7});
    },{passive:false,signal:events.signal});
    const endGesture=e=>{
      if(!gesture||gesture.id!==e.pointerId)return;
      const g=gesture;gesture=null;if(!g.dragging)return;
      if(video.hasPointerCapture(e.pointerId))video.releasePointerCapture(e.pointerId);
      const velocity=g.dy/Math.max(1,performance.now()-g.time);
      if(e.type!=='pointercancel'&&(g.dy>Math.min(120,innerHeight*.15)||(g.dy>35&&velocity>.55)))close();
      else gsap.timeline({onComplete:()=>{suppressClick=false;}}).to(video,{x:0,y:0,scale:1,duration:.45,ease:'power3.out'},0).to(dialog,{'--media-backdrop':1,duration:.45},0);
      setTimeout(()=>{suppressClick=false;},400);
    };
    video.addEventListener('pointerup',endGesture,{signal:events.signal});
    video.addEventListener('pointercancel',endGesture,{signal:events.signal});

    document.documentElement.classList.add('is-lightbox-open');dialog.showModal();video.tabIndex=0;video.focus({preventScroll:true});
    if(!reduced){
      const styles=getComputedStyle(document.documentElement);
      const duration=parseFloat(styles.getPropertyValue('--motion-lightbox-duration'))||1;
      const ease=styles.getPropertyValue('--motion-lightbox-ease').trim()||'expo.inOut';
      const from=source.getBoundingClientRect(),to=video.getBoundingClientRect();
      const radius=sourceRadius()*to.width/Math.max(1,from.width);
      gsap.timeline().fromTo(dialog,{'--media-backdrop':0},{'--media-backdrop':1,duration:.55},0)
        .fromTo(video,{borderRadius:radius,x:from.left+from.width/2-(to.left+to.width/2),y:from.top+from.height/2-(to.top+to.height/2),scaleX:from.width/to.width,scaleY:from.height/to.height},{x:0,y:0,scaleX:1,scaleY:1,borderRadius:0,duration,ease},0);
    }

  }
  window.JKMobileMedia={open};
  function mount(page){
    dispose();const abort=new AbortController(),buttons=[];
    page.querySelectorAll('video').forEach(source=>{
      if(source.closest('a,.showreel_wrap,[data-project-lightbox],[data-follower-cursor],.portrait_flight'))return;
      const host=source.closest('.services_video_wrap')||source.parentElement;
      if(!host||host.querySelector('[data-mobile-play]'))return;
      const button=document.createElement('button');button.type='button';button.className='mobile_media_play';button.dataset.mobilePlay='';button.setAttribute('aria-label','Play video');host.append(button);buttons.push(button);
      button.addEventListener('click',()=>open(source,button),{signal:abort.signal});
    });
    dispose=()=>{close(true);abort.abort();buttons.forEach(b=>b.remove());};
  }
  function boot(){mount(document.querySelector('[data-barba="container"]')||document);if(window.barba){barba.hooks.afterEnter(d=>mount(d.next.container));barba.hooks.beforeLeave(()=>close(true));}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
