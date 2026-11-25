/* Full-viewport DVD typography and a quick, progressively harder paddle rally. */
(() => {
  function init(){
    const root=document.querySelector('[data-error-game]');if(!root)return;
    const court=root.querySelector('.error_game_court'),start=root.querySelector('[data-game-start]');if(!court||!start)return;
    const canvas=document.createElement('canvas'),status=document.createElement('p');
    const ctx=canvas.getContext('2d');
    if (!ctx) return;
    canvas.setAttribute('aria-label','Pong. Move or drag your paddle, or use the left and right arrow keys. Escape pauses.');
    canvas.className='error_game_canvas';canvas.tabIndex=0;court.append(canvas);status.className='error_game_status';status.setAttribute('role','status');court.after(status);
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    let countdown=0;
    let width=0,height=0,x=0,y=0,vx=170,vy=115,paddle=0,score=0,playing=false,paused=false,last=0,raf,keys={};
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    const radius=()=>clamp(width*.007,10,16),paddleWidth=()=>clamp(width*.085,104,172);
    const baseSpeed=()=>clamp(height*.73,455,780);
    const label=document.createElement('span'),replacement=document.createElement('span');
    label.className='btn_text error_game_control_label';
    replacement.className='btn_text error_game_control_label error_control_label_duplicate';
    replacement.setAttribute('aria-hidden','true');
    start.textContent='';
    start.append(label,replacement);
    function setLabel(value){label.textContent=replacement.textContent=value;}
    function showState(){
      root.classList.toggle('error_game_in_progress',playing);
      court.classList.toggle('error_game_court_playing',playing);
      root.dataset.gameState=playing?(paused?'paused':'playing'):'idle';
      setLabel(playing?(paused?'Resume Pong':'Pause Pong'):(score?'Play again':'Play Pong'));
      status.textContent=playing?((paused?'Paused · ':'')+String(score).padStart(2,'0')+' returns'):'';
    }
    const resize=()=>{
      width=court.clientWidth;height=court.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
      paddle=clamp(paddle||width/2,paddleWidth()/2,width-paddleWidth()/2);x=clamp(x,0,width);y=clamp(y,0,height);
    };
    const observer=new ResizeObserver(resize);observer.observe(court);resize();showState();
    function begin(){countdown=3;playing=true;paused=false;score=0;x=width/2;y=height*.28;vx=baseSpeed()*.32;vy=baseSpeed();paddle=width/2;last=0;showState();canvas.focus({preventScroll:true});}
    function toggle(e){e?.preventDefault();if(!playing){begin();return;}paused=!paused;showState();if(!paused)canvas.focus({preventScroll:true});}
    start.addEventListener('click',toggle);
    start.addEventListener('keydown',e=>{if(e.key===' '&&start.tagName!=='BUTTON')toggle(e);});
    const move=e=>{const b=canvas.getBoundingClientRect();paddle=clamp(e.clientX-b.left,paddleWidth()/2,width-paddleWidth()/2);};
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);if(!playing)begin();move(e);});
    canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Escape',' '].includes(e.key)){e.preventDefault();keys[e.key]=true;if(!e.repeat&&(e.key==='Escape'||e.key===' '))toggle();}});
    canvas.addEventListener('keyup',e=>delete keys[e.key]);canvas.addEventListener('blur',()=>{keys={};});
    document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&playing&&!paused){paused=true;showState();}});
    function paint(now){
      if(!root.isConnected){observer.disconnect();cancelAnimationFrame(raf);return;}
      const dt=last?Math.min((now-last)/1000,.032):0;last=now;
      const style=getComputedStyle(root);ctx.clearRect(0,0,width,height);ctx.fillStyle=style.color;
      if(playing){
        const r=radius(),pw=paddleWidth(),floor=height-18;
        if(countdown>0){
          if(!paused&&!document.hidden)countdown=Math.max(0,countdown-dt);
          if(countdown>0){
            ctx.font='600 '+Math.min(width*.16,height*.22)+'px '+style.fontFamily;
            const digit=String(Math.ceil(countdown));
            const ink=ctx.measureText(digit);
            ctx.fillText(digit,(width+ink.actualBoundingBoxLeft-ink.actualBoundingBoxRight)/2,
              (height+ink.actualBoundingBoxAscent-ink.actualBoundingBoxDescent)/2);
            ctx.fillRect(paddle-pw/2,floor,pw,10);
            raf=requestAnimationFrame(paint);return;
          }
        }
        if(!paused&&!document.hidden){
          paddle=clamp(paddle+((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*width*1.1*dt,pw/2,width-pw/2);
          const oldX=x,oldY=y;x+=vx*dt;y+=vy*dt;
          if(x<r||x>width-r){x=clamp(x,r,width-r);vx=-vx;}
          if(y<r){y=r;vy=Math.abs(vy);}
          // Interpolate the crossing point so fast balls cannot tunnel through the paddle.
          if(vy>0&&oldY<=floor-r&&y>=floor-r){
            const hitX=oldX+(x-oldX)*(floor-r-oldY)/(y-oldY);
            if(Math.abs(hitX-paddle)<=pw/2+r){
              x=clamp(hitX,r,width-r);y=floor-r;score++;
              const angle=clamp((hitX-paddle)/(pw/2),-.95,.95)*1.05;
              const speed=Math.min(baseSpeed()*1.9,baseSpeed()*(1+.085*score));
              vx=Math.sin(angle)*speed;vy=-Math.cos(angle)*speed;showState();
            }
          }
          if(y>height+r){
            playing=false;showState();status.textContent=String(score).padStart(2,'0')+' returns · One more?';setLabel('Play again');
            x=width*.12;y=height*.3;vx=170;vy=115;
          }
        }
        if(playing){ctx.fillRect(paddle-pw/2,floor,pw,10);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
      }
      if(!playing){
        const font=Math.min(width*.36,height*.58);ctx.font='600 '+font+'px '+style.fontFamily;
        ctx.letterSpacing=style.letterSpacing||'0px';
        const m=ctx.measureText('404'),left=m.actualBoundingBoxLeft||0,ascent=m.actualBoundingBoxAscent||font*.75,descent=m.actualBoundingBoxDescent||0;
        const glyphW=(m.actualBoundingBoxRight||m.width)+left,glyphH=ascent+descent;
        const maxX=Math.max(0,width-glyphW),maxY=Math.max(0,height-glyphH);
        if(!reduced.matches&&!document.hidden){x+=vx*dt;y+=vy*dt;if(x<0||x>maxX){x=clamp(x,0,maxX);vx=-vx;}if(y<0||y>maxY){y=clamp(y,0,maxY);vy=-vy;}}
        else{x=clamp(x,0,maxX);y=clamp(y,0,maxY);}
        ctx.fillText('404',x+left,y+ascent);
      }
      raf=requestAnimationFrame(paint);
    }
    paint(0);
    root.classList.add('error_game_ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
