/* A quiet DVD idle screen becomes a small, keyboard/touch-friendly paddle rally. */
(() => {
  function init(){
    const root=document.querySelector('[data-error-game]');if(!root)return;
    const court=root.querySelector('.error-court'),start=root.querySelector('[data-game-start]');if(!court||!start)return;
    const canvas=document.createElement('canvas'),status=document.createElement('p');
    canvas.setAttribute('aria-label','Paddle rally. Move left and right with your pointer or arrow keys. Escape pauses.');
    canvas.tabIndex=0;court.append(canvas);status.className='error-game__status';status.setAttribute('role','status');status.textContent='Move / drag / ← →';court.after(status);
    const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
    let width=0,height=0,x=80,y=65,vx=75,vy=50,paddle=0,score=0,playing=false,paused=false,last=0,raf,keys={};
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    const resize=()=>{width=court.clientWidth;height=court.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);paddle=clamp(paddle||width/2,50,width-50);x=clamp(x,20,width-80);y=clamp(y,20,height-40);};
    const observer=new ResizeObserver(resize);observer.observe(court);resize();
    function begin(){playing=true;paused=false;score=0;x=width/2;y=height*.35;vx=140;vy=180;paddle=width/2;start.textContent='Pause';status.textContent='Rally 00';canvas.focus({preventScroll:true});}
    function toggle(e){e?.preventDefault();if(!playing){begin();return;}paused=!paused;start.textContent=paused?'Resume':'Pause';status.textContent=paused?'Paused':'Rally '+String(score).padStart(2,'0')+'';}
    start.addEventListener('click',toggle);start.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')toggle(e);});
    canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();paddle=clamp(e.clientX-b.left,48,width-48);});
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const b=canvas.getBoundingClientRect();paddle=clamp(e.clientX-b.left,48,width-48);if(!playing)begin();});
    canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Escape',' '].includes(e.key)){e.preventDefault();keys[e.key]=true;if(e.key==='Escape'||e.key===' ')toggle();}});
    canvas.addEventListener('keyup',e=>delete keys[e.key]);canvas.addEventListener('blur',()=>{keys={};});
    document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&playing&&!paused){paused=true;start.textContent='Resume';}});
    function paint(now){
      if(!root.isConnected){observer.disconnect();cancelAnimationFrame(raf);return;}
      const dt=last?Math.min((now-last)/1000,.032):0;last=now;
      const colour=getComputedStyle(root).color;ctx.clearRect(0,0,width,height);ctx.fillStyle=colour;ctx.strokeStyle=colour;
      if(playing){
        if(!paused&&!document.hidden){
          paddle=clamp(paddle+((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*500*dt,48,width-48);
          const oldY=y;x+=vx*dt;y+=vy*dt;
          if(x<7||x>width-7){x=clamp(x,7,width-7);vx=-vx;}
          if(y<7){y=7;vy=Math.abs(vy);}
          const floor=height-28;
          if(vy>0&&oldY<=floor-7&&y>=floor-7&&Math.abs(x-paddle)<55){y=floor-7;score++;const angle=(x-paddle)/55;vx=angle*260;vy=-Math.min(460,200+score*16);status.textContent='Rally '+String(score).padStart(2,'0')+'';}
          if(y>height+8){playing=false;start.textContent='Play again';status.textContent=(score?'Nice rally. '+score+' return'+(score===1?'':'s')+'.':'Just warming up.')+' One more?';x=width*.4;y=height*.4;vx=75;vy=50;}
        }
        ctx.globalAlpha=.25;ctx.setLineDash([4,9]);ctx.beginPath();ctx.moveTo(0,height/2);ctx.lineTo(width,height/2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
        ctx.fillRect(paddle-48,height-28,96,5);ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();
        ctx.font='500 14px '+getComputedStyle(root).fontFamily;ctx.fillText(String(score).padStart(2,'0'),20,30);
      }else{
        const font=Math.min(width*.36,height*.5);ctx.font='500 '+font+'px '+getComputedStyle(root).fontFamily;const tw=ctx.measureText('404').width;
        if(!reduced.matches&&!document.hidden){x+=vx*dt;y+=vy*dt;if(x<20||x>width-tw-20){x=clamp(x,20,width-tw-20);vx=-vx;}if(y<font+80||y>height-70){y=clamp(y,font+80,height-70);vy=-vy;}}
        ctx.fillText('404',x,y);
      }
      raf=requestAnimationFrame(paint);
    }
    raf=requestAnimationFrame(paint);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
