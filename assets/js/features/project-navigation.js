(function() {
  const chevron = direction => '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + (direction === "prev" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5") + '" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  let projectOrder;
  function order() {
    return projectOrder || (projectOrder = fetch("/projects").then((r => r.text())).then((html => {
      const d = (new DOMParser).parseFromString(html, "text/html");
      return [ ...new Set([ ...d.querySelectorAll("[data-work-item] a[href]") ].map((a => a.getAttribute("href")))) ];
    })).catch((() => [])));
  }
  const flights=new WeakMap();
  function bindTitle(page,title,slash){
    const hero=page.querySelector('.project-hero__title');
    if(!hero)return;
    const desktop=matchMedia('(min-width:992px)');
    let compact=document.querySelector('.nav-root')?.dataset.navCompact==='true',flight;
    function settle(){
      hero.style.opacity=desktop.matches&&compact?'0':'';
      title.style.opacity=slash.style.opacity=desktop.matches&&!compact?'0':'';
    }
    function change({detail}){
      const previous=flight?.nodes.map(n=>n.getBoundingClientRect());
      flight?.stop();
      compact=detail.compact;
      if(!desktop.matches||!detail.duration){settle();return;}
      const lines=[...hero.querySelectorAll('.reveal-line')];
      if(!lines.length)lines.push(hero);
      const words=lines.map(l=>l.textContent.trim());
      const full=title.textContent,small=document.createRange(),large=document.createRange();
      let offset=0;
      const nodes=[],starts=[],ends=[];
      for(const [i,line] of lines.entries()){
        const start=full.indexOf(words[i],offset);
        if(!words[i]||start<0||!title.firstChild){settle();nodes.forEach(n=>n.remove());return;}
        offset=start+words[i].length;
        small.setStart(title.firstChild,start);small.setEnd(title.firstChild,offset);
        large.selectNodeContents(line);
        const a=large.getBoundingClientRect(),b=small.getBoundingClientRect();
        const n=document.createElement('span'),style=getComputedStyle(hero);
        n.textContent=words[i];n.setAttribute('aria-hidden','true');
        Object.assign(n.style,{position:'fixed',left:'0',top:'0',zIndex:'99',pointerEvents:'none',color:'white',mixBlendMode:'difference',whiteSpace:'pre',fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontSize:style.fontSize,letterSpacing:style.letterSpacing,lineHeight:'1',transformOrigin:'0 0'});
        document.body.append(n);nodes.push(n);
        starts.push(previous?.[i]||(compact?a:b));ends.push(compact?b:a);
      }
      hero.style.opacity=title.style.opacity='0';slash.style.opacity=compact?'1':'0';
      const tl=gsap.timeline({onComplete(){nodes.forEach(n=>n.remove());flight=null;settle();}});
      nodes.forEach((n,i)=>{
        const r=n.getBoundingClientRect(),a=starts[i],b=ends[i];
        const box=q=>({x:q.left,y:q.top,scaleX:q.width/r.width,scaleY:q.height/r.height});
        tl.fromTo(n,box(a),{...box(b),duration:detail.duration,ease:detail.ease},0);
      });
      flight={nodes,stop(){tl.kill();nodes.forEach(n=>n.remove());flight=null;}};
    }
    function resize(){flight?.stop();settle();}
    settle();window.addEventListener('resize',resize);document.addEventListener('jk:nav-layout',change);
    flights.set(page,()=>{flight?.stop();window.removeEventListener('resize',resize);document.removeEventListener('jk:nav-layout',change);});
  }
  function mount(page = document.querySelector('[data-barba="container"]')) {
    if (!page) return;
    const nav = page.querySelector("[data-case-nav]");
    if (nav && !nav.hasAttribute("data-jk-nav")) {
      nav.dataset.jkNav = "";
      const row = nav.querySelector(".case-nav__row"), prev = row.querySelector('[data-case-direction="prev"]'), next = row.querySelector('[data-case-direction="next"]');
      const context = document.createElement("div");
      context.className = "case-nav__context";
      const back = document.createElement("a");
      let origin;
      try {
        origin = JSON.parse(sessionStorage.getItem("jk-project-origin"));
      } catch (_) {}
      const labels = {
        "/": "Home",
        "/about": "About",
        "/approach": "Approach",
        "/projects": "All projects"
      };
      const path = Object.hasOwn(labels, origin?.path) ? origin.path : "/projects";
      back.href = path;
      back.className = "case-nav__back";
      back.innerHTML = chevron("prev") + "<span>" + labels[path] + "</span>";
      const slash = document.createElement("span");
      slash.textContent = "/";
      slash.className = "case-nav__separator";
      const title = document.createElement("span");
      title.className = "case-nav__current";
      title.textContent = page.querySelector("h1")?.textContent || "";
      context.append(back, slash, title);
      const controls = document.createElement("div");
      controls.className = "case-nav__controls";
      const count = document.createElement("span");
      count.className = "case-nav__count";
      prev.innerHTML = chevron("prev");
      next.innerHTML = chevron("next");
      controls.append(count, prev, next);
      row.append(context, controls);
      bindTitle(page,title,slash);
      order().then((paths => {
        const idx = paths.indexOf(location.pathname);
        if (idx >= 0) count.textContent = String(idx + 1).padStart(2, "0") + " / " + String(paths.length).padStart(2, "0");
      }));
    }
  }
  function boot() {
    mount();
    if (window.barba) {
      barba.hooks.beforeLeave(d=>flights.get(d.current.container)?.());
      barba.hooks.beforeEnter((d => mount(d.next.container)));
      barba.hooks.afterEnter((d => mount(d.next.container)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();
