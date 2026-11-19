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
    gsap.ticker.add((time,dt=16.667)=>{
      const step=Math.min(dt,50)/1000;
      target*=Math.exp(-9*step);motion.angle+=(target-motion.angle)*(1-Math.exp(-12*step));
      if(!fine.matches||reduced.matches)motion.angle=0;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
