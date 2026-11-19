/* One shared velocity sample; translations retain the site's .35s Expo cursor response. */
(() => {
  const fine=matchMedia('(min-width:992px) and (hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const motion=window.JKPointerMotion={x:0,y:0,known:false,velocity:0,angle:0};
  let lastX=0,lastTime=0,target=0;
  document.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    const now=performance.now(),dt=now-lastTime;
    target=motion.known&&dt>0&&dt<150?Math.max(-4,Math.min(4,(e.clientX-lastX)/dt*1.8)):0;
    motion.x=e.clientX;motion.y=e.clientY;motion.known=true;lastX=e.clientX;lastTime=now;
  },{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget){motion.known=false;target=0;}},{passive:true});
  function boot(){
    if(!window.gsap)return;
    const dot=document.createElement('div');dot.className='site-cursor-dot';dot.setAttribute('aria-hidden','true');document.body.append(dot);
    const duration=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-cursor-duration'))||.35;
    gsap.set(dot,{xPercent:-50,yPercent:-50});
    const xTo=gsap.quickTo(dot,'x',{duration,ease:'expo.out'}),yTo=gsap.quickTo(dot,'y',{duration,ease:'expo.out'});
    let placed=false,lastKind='',labels=[];
    const refresh=()=>{const diameter=[...document.querySelectorAll('.btn-toggle__toggle-dot')].find(el=>el.offsetWidth)?.offsetWidth||16;dot.style.setProperty('--cursor-hover-scale',diameter/(dot.offsetWidth||10.4));labels=[...document.querySelectorAll('.jk-close-cursor,.case-cursor,[data-cursor-marquee]')];};
    refresh();window.addEventListener('resize',refresh,{passive:true});if(window.barba)barba.hooks.after(refresh);
    gsap.ticker.add((time,dt=16.667)=>{
      const step=Math.min(dt,50)/1000;
      target*=Math.exp(-9*step);motion.angle+=(target-motion.angle)*(1-Math.exp(-12*step));
      if(!fine.matches||reduced.matches)motion.angle=0;
      const enabled=fine.matches&&motion.known&&!document.hidden&&!document.documentElement.hasAttribute('data-transitioning')&&document.documentElement.style.overflow!=='hidden';
      let kind='hidden';
      if(enabled){
        if(!placed){gsap.set(dot,{x:motion.x,y:motion.y});placed=true;}else{xTo(motion.x);yTo(motion.y);}
        const hit=document.elementFromPoint(motion.x,motion.y);
        const text=labels.some(e=>e.isConnected&&getComputedStyle(e).visibility!=='hidden'&&parseFloat(getComputedStyle(e).opacity)>.05);
        kind=text?'text':hit?.closest('a,button,[role="button"],[data-cursor],[data-work-view]')?'interactive':'idle';
      }else placed=false;
      if(kind!==lastKind){dot.dataset.cursorState=kind;lastKind=kind;}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
