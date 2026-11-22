(() => {
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const motion = matchMedia('(prefers-reduced-motion:no-preference)');
  const pages = new WeakMap();

  function compare(page) {
    const assetBase = 'https://cdn.prod.website-files.com/677ec1f8458ab71b3bab4e74/';
    const comparisons = {
      colour: {
        label: 'Compare original and graded Colour frames',
        frames: ['6aff60b62001919a558aa861_colour-before.webp','6aff60b7d43ca07d2df25668_colour-after.webp']
      },
      composite: {
        label: 'Compare the clean racecourse plate with the finished Sonic composite',
        frames: ['6aff6c697439e11a3cca1966_composite-before.webp','6aff6c6a3e55f9821757b7e8_composite-after.webp']
      }
    };
    page.querySelectorAll('.services__video-embed video[data-src]').forEach(video => {
      const service = /\/services\/(colour|composite)\.mp4(?:[?#]|$)/.exec(video.dataset.src)?.[1];
      if (!service) return;
      const comparison = comparisons[service];
      const box = video.parentElement;
      if (box.hasAttribute('data-splitter')) return;
      box.setAttribute('data-splitter','wrap');
      box.classList.add('media-comparison');
      box.setAttribute('data-splitter-initial','50');
      const control = document.createElement('div');
      control.className = 'media-comparison__surface';
      for (const [index,url] of comparison.frames.entries()) {
        const image = new Image();
        image.className = index ? 'media-comparison__frame media-comparison__frame--after' : 'media-comparison__frame';
        image.loading = 'lazy';
        image.alt = '';
        image.src = assetBase + url;
        if (index) image.setAttribute('data-splitter','after');
        control.append(image);
      }
      const input = document.createElement('input');
      input.className = 'media-comparison__control';
      input.type = 'range';
      input.value = '50';
      input.setAttribute('aria-label',comparison.label);
      input.setAttribute('data-splitter','handle');
      function move() {
        control.style.setProperty('--split', input.value + '%');
        input.setAttribute('aria-valuetext', input.value + '% original');
      }
      input.addEventListener('input',move);
      control.append(input);
      const handle = document.createElement('span');
      handle.className = 'media-comparison__divider';
      handle.setAttribute('aria-hidden','true');
      handle.innerHTML='<span class="media-comparison__grip"><svg class="media-comparison__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h18M8 7l-5 5 5 5M16 7l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      const host=video.closest('.services__video-wrap')||box;
      host.querySelector(':scope > [data-mobile-play]')?.remove();
      let pointer=null;
      function drag(e){const r=input.getBoundingClientRect();input.value=String(Math.round(100*Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))));move();}
      input.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();pointer=e.pointerId;input.setPointerCapture(pointer);drag(e);});
      input.addEventListener('pointermove',e=>{if(pointer===e.pointerId)drag(e);});
      input.addEventListener('lostpointercapture',()=>{pointer=null;});
      const grip = handle.firstElementChild;
      input.addEventListener('focus', () => grip.classList.toggle('media-comparison__grip--focused', input.matches(':focus-visible')));
      input.addEventListener('blur', () => grip.classList.remove('media-comparison__grip--focused'));
      control.append(handle);
      box.append(control);
      video.pause();
      video.remove();
      move();
    });
  }

  function list(page,signal) {
    const center=page.querySelector('[data-work-list-center]');
    if(!center)return;
    const root=center.closest('.work');
    let last,kick,zoom,previousMedia;
    function settleThumbnail(){
      zoom?.kill();
      previousMedia?.querySelector('.work-card__image')?.style.removeProperty('--list-thumb-scale');
      zoom=null;
    }
    function updateThumbnail(){
      const active=center.querySelector('[data-work-list-media][data-work-state="active"]');
      if(active===previousMedia)return;
      const changedDuringUse=active && previousMedia?.isConnected && motion.matches &&
        root.dataset.workMode==='list' && !root.hasAttribute('data-work-switching') &&
        !document.documentElement.hasAttribute('data-transitioning');
      settleThumbnail();
      previousMedia=active;
      if(!changedDuringUse)return;
      const image=active.querySelector('.work-card__image');
      if(image)zoom=gsap.fromTo(image,{'--list-thumb-scale':1.12},{'--list-thumb-scale':1,duration:1,ease:'expo.out',
        onComplete:()=>image.style.removeProperty('--list-thumb-scale')});
    }
    const thumbnailObserver=new MutationObserver(updateThumbnail);
    thumbnailObserver.observe(center,{childList:true,subtree:true,attributes:true,attributeFilter:['data-work-state']});
    updateThumbnail();
    function reset(){settleThumbnail();kick?.kill();center.style.removeProperty('--kick-x');center.style.removeProperty('--kick-y');center.style.removeProperty('--kick-angle');}
    function sync(){
      if(root.dataset.workMode!=='list' || !matchMedia("(min-width:62rem)").matches)return;
      const box=center.getBoundingClientRect();
      if(!box.height)return;
      root.querySelectorAll('.work-list__label--active').forEach(label=>{
        const row=label.closest('[data-work-row-left],[data-work-row-right]'),track=row?.parentElement;
        if(!track)return;
        const r=row.getBoundingClientRect(),dy=box.top+box.height/2-r.top-r.height/2;
        if(Math.abs(dy)>.75){const m=new DOMMatrixReadOnly(getComputedStyle(track).transform);track.style.transform='translate3d(0,'+JKProject.rem(m.m42+dy)+',0)';}
      });
    }
    const observer=new MutationObserver(sync);
    observer.observe(root,{attributeFilter:['data-work-mode']});observer.observe(center,{childList:true,subtree:true});
    sync();
    page.addEventListener('pointermove',e=>{
      const t=performance.now();if(last && t>last.t){const dt=Math.max(8,t-last.t);last={t,x:e.clientX,y:e.clientY,vx:(e.clientX-last.x)/dt,vy:(e.clientY-last.y)/dt};}else last={t,x:e.clientX,y:e.clientY,vx:0,vy:0};
    },{signal,passive:true});
    center.addEventListener('pointerenter',e=>{
      if(!fine.matches||!motion.matches||!last||performance.now()-last.t>100||root.hasAttribute('data-work-switching')||document.documentElement.hasAttribute('data-transitioning'))return;
      const bounds=center.getBoundingClientRect(),limit=gsap.utils.clamp(-1,1),vx=limit(last.vx/2),vy=limit(last.vy/2);
      const torque=limit((e.clientX-bounds.left-bounds.width/2)*2/bounds.width*vy-(e.clientY-bounds.top-bounds.height/2)*2/bounds.height*vx);
      kick?.kill();kick=gsap.timeline().to(center,{'--kick-x':vx*2.75+'rem','--kick-y':vy*2.75+'rem','--kick-angle':torque*9+'deg',duration:.22,ease:'power3.out'}).to(center,{'--kick-x':'0rem','--kick-y':'0rem','--kick-angle':'0deg',duration:.85,ease:'power3.out'});
    },{signal});
    page.addEventListener('click',reset,{signal,capture:true});
    signal.addEventListener('abort',()=>{observer.disconnect();thumbnailObserver.disconnect();reset();});
  }
  function editorial(page,signal) {
    const heading=page.querySelector('.folio-statement-heading[data-highlight-text]');
    if(!heading || !motion.matches) return;
    let cleanup;
    function connect() {
      const words=[...heading.querySelectorAll('div,span')];
      const first=words.find(el=>el.textContent==='frame' && el.childElementCount===5);
      const last=first?.nextElementSibling;
      if(!last || !/^count[.!]?$/.test(last.textContent.trim()) || first.closest('.rotating-statement')) return;
      cleanup?.();
      const range=document.createRange();
      range.setStartBefore(first);range.setEndAfter(last);
      const shell=document.createElement('span'),measure=document.createElement('span'),layer=document.createElement('span');
      measure.append(range.extractContents());range.insertNode(shell);
      shell.className='rotating-statement';measure.className='rotating-statement__measure';layer.className='rotating-statement__layer';
      layer.setAttribute('aria-hidden','true');shell.append(measure,layer);
      const original=[...first.children,...last.children];
      const phrases=['frame count.','shot count.','cut count.'];
      let index=0, sequence,visible;
      function phrase(text){
        const el=document.createElement('span');
        el.className='rotating-statement__phrase';
        const chars=[...text].map(ch=>{
          if(ch===' ')return document.createTextNode(' ');
          const char=document.createElement('span');char.textContent=ch;return char;
        });
        el.append(...chars);layer.append(el);return el;
      }

      function sync(){
        for(const copy of layer.children) {
          const letters=[...copy.children], prefix=letters.length-last.children.length;
          letters.forEach((char,i)=>{
            const source=i<prefix?original[Math.round(i*(first.children.length-1)/Math.max(1,prefix-1))]:original[first.children.length+i-prefix];
            if(source)char.style.opacity=source.style.opacity;
          });
        }
      }
      visible=phrase(phrases[index]);sync();
      const observer=new MutationObserver(sync);
      observer.observe(measure,{subtree:true,attributes:true,attributeFilter:['style']});
      const timer=setInterval(()=>{
        const rect=heading.getBoundingClientRect();
        if(document.hidden || rect.bottom<=0 || rect.top>=innerHeight || original.some(el=>Number(el.style.opacity||1)<.999))return;
        const outgoing=visible;index=(index+1)%phrases.length;visible=phrase(phrases[index]);sync();
        sequence=gsap.timeline().to(outgoing,{yPercent:-112,duration:1,ease:'expo.out'},0)
          .fromTo(visible,{yPercent:112},{yPercent:0,duration:1,ease:'expo.out'},0).call(()=>outgoing.remove());
      },3000);
      cleanup=()=>{clearInterval(timer);sequence?.kill();observer.disconnect();if(shell.isConnected)shell.replaceWith(...measure.childNodes);};
    }
    connect();
    const splits=new MutationObserver(connect);
    splits.observe(heading,{childList:true,subtree:true});
    signal.addEventListener('abort',()=>{splits.disconnect();cleanup?.();});
  }
  const gridControl='.footer-legal a[href="#layout-grid"]';
  function prepareGridControls(page){
    if(!page)return;
    for (const link of page.querySelectorAll('.footer-legal a[href="#back-to-top"]')) link.classList.add('footer__back-to-top');
    const pressed=document.querySelector('[data-animated-grid]')?.dataset.open==='true';
    for(const button of page.querySelectorAll(gridControl)){
      button.setAttribute('role','button');
      button.setAttribute('aria-label','Toggle layout grid (Shift G)');
      button.setAttribute('aria-keyshortcuts','Shift+G');
      button.setAttribute('aria-pressed',String(pressed));
      button.setAttribute('data-barba-prevent','all');
    }
  }
  function start(page){
    if(!page || pages.has(page))return;
    const controller=new AbortController();pages.set(page,controller);
    compare(page);editorial(page,controller.signal);
  }
  function boot(){
    const current=()=>document.querySelector('[data-barba="container"]');
    const listControllers=new WeakMap();
    function prepareList(page){
      if(!page?.querySelector('[data-work-list-center]')||listControllers.has(page))return;
      const controller=new AbortController();listControllers.set(page,controller);list(page,controller.signal);
    }
    prepareGridControls(document);
    barba.hooks.beforeEnter(d=>prepareGridControls(d.next.container));
    prepareList(current());
    barba.hooks.beforeEnter(d=>prepareList(d.next.container));
    barba.hooks.afterLeave(d=>listControllers.get(d.current.container)?.abort());
    barba.hooks.afterOnce(d=>start(d.next.container));
    barba.hooks.afterEnter(d=>start(d.next.container));
    barba.hooks.afterLeave(d=>pages.get(d.current.container)?.abort());
    if(document.readyState==='complete')start(current());
    let grid,open=false;
    function toggle(){
      if(!grid){
        grid=document.createElement('div');grid.className='layout-guide';grid.setAttribute('data-animated-grid','');grid.setAttribute('aria-hidden','true');
        for(let index=0;index<12;index++){
          const column=document.createElement('div');
          column.className='layout-guide__column';
          if(index>=6)column.classList.add('layout-guide__column--desktop');
          else if(index>=4)column.classList.add('layout-guide__column--tablet');
          column.setAttribute('data-animated-grid-col','');
          grid.append(column);
        }
        document.body.append(grid);
      }
      open=!open;
      grid.dataset.open=String(open);
      document.querySelectorAll(gridControl).forEach(button=>button.setAttribute('aria-pressed',String(open)));
      gsap.fromTo(grid.children,{yPercent:open?100:0},{yPercent:open?0:-100,duration:motion.matches?1:0,stagger:motion.matches?.025:0,ease:'expo.out',overwrite:true});
      try{localStorage.setItem('animatedGridState',open?'open':'closed');}catch{}
    }
    try{if(localStorage.getItem('animatedGridState')==='open')toggle();}catch{}
    document.addEventListener('click',e=>{
      if(!e.target.closest?.(gridControl))return;
      e.preventDefault();e.stopPropagation();toggle();
    },true);
    document.addEventListener('keydown',e=>{
      if(e.key!==' '||!e.target.closest?.(gridControl))return;
      e.preventDefault();if(!e.repeat)toggle();
    });
    window.addEventListener('keydown',e=>{if(!e.repeat&&e.shiftKey&&e.key.toLowerCase()==='g'&&!e.target.closest?.('input,textarea,select,[contenteditable]')){e.preventDefault();toggle();}});
  }
  if(window.barba&&window.gsap){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})();
