/* Native related projects: hover playback, scroll progress and image handoff. */
JKProject.register(s=>{
/* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
const SETTINGS = {
  "messageDuration": 1,
  "ease": "expo.out",
  "inactiveCardOpacity": 0.25,
  "idleDelayMs": 450,
  "returnTopDuration": 1,
  "previewFadeIn": 0.3,
  "previewFadeOut": 0.3,
  "previewPreloadMargin": "400px",
  "minimumAutoNextWidth": 992,
  "navFadeDuration": 0.3,
  "navHideStart": "top 85%",
  "progressLabel": "Scroll to next project · "
};

const wrap=s.page.querySelector('[data-scroll-next-wrap]'),source=s.page.querySelector('[data-case-next-source]');
if(!wrap||!source||!s.next)return;
const grid=source.querySelector('.case-index__grid'),items=[...grid.children],preferred=new URL(s.next.link.href).pathname,current=new URL(s.page.baseURI).pathname;
const rank=item=>{const path=new URL(item.querySelector('a').href).pathname;return path===preferred?0:path===current?2:1;};
const ordered=[...items].sort((a,b)=>rank(a)-rank(b));ordered.forEach(item=>grid.append(item));
let cards=ordered.map(item=>item.querySelector('.case-index__card')).filter(Boolean);
// Touch layouts use ordinary named links. No scroll progress, dimming or auto-navigation.
if(innerWidth<992||matchMedia('(pointer:coarse)').matches){
 cards.forEach(card=>{card.dataset.caseTransition='continuation';card.querySelector('.case-index__media').dataset.nextMedia='';card.querySelector('.case-index__title').dataset.nextTitle='';gsap.set(card,{clearProps:'opacity'});});
 s.cleanups.push(()=>{items.forEach(item=>grid.append(item));});return;
}

const fill=wrap.querySelector('.case-index__fill'),hint=wrap.querySelector('.case-index__hint'),nav=s.page.querySelector('[data-case-nav]');
let fired=false,armed=false,progress=0,idleTimer,messageActive=false,messageWanted=false,messageBusy=false,messageTween;const hovered=new Set(),cache=JKProject.previewCache||(JKProject.previewCache=new Map());
const opacity=()=>1;
const idle=wrap.querySelector('.case-index__meta');
const status=idle.closest('.case-index__status'),statusParent=status.parentNode,statusSibling=status.nextSibling,idleText=idle.textContent;
function label(el,prompt,value){
 el.replaceChildren();const lead=document.createElement('span'),detail=document.createElement('span');
 lead.className='case-index__prompt';lead.textContent=prompt;
 detail.className='case-index__value';detail.textContent=value;el.append(lead,detail);return detail;
}
label(idle,'Up next',cards[0].querySelector('.case-index__title').textContent.trim());
const percent=label(hint,'Scroll to next project','(0%)');
cards[0].append(status);
gsap.set(hint,{yPercent:100,autoAlpha:1});gsap.set(idle,{yPercent:0,autoAlpha:1});
function message(active){
 if(messageActive===active)return;messageActive=active;
 messageTween?.kill();
 messageTween=gsap.timeline({defaults:{duration:SETTINGS.messageDuration,ease:SETTINGS.ease,overwrite:'auto'}})
 .to(idle,{yPercent:active?-100:0},0)
 .to(hint,{yPercent:active?0:100},0)
 .to(cards.slice(1),{opacity:active?SETTINGS.inactiveCardOpacity:1,duration:SETTINGS.previewFadeIn},0);
}
function scrolling(){if(progress<=0||fired)return;message(true);clearTimeout(idleTimer);idleTimer=setTimeout(()=>message(false),SETTINGS.idleDelayMs);}
// Allow a short grace period after input and smooth-scroll momentum settle.
window.addEventListener('scroll',scrolling,{passive:true,signal:s.abort.signal});
window.addEventListener('wheel',scrolling,{passive:true,signal:s.abort.signal});
window.addEventListener('touchmove',scrolling,{passive:true,signal:s.abort.signal});
window.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key))scrolling();},{signal:s.abort.signal});

const paint=()=>{};
function go(card,e){
if(e&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button>0))return;e?.preventDefault();
if(fired||document.documentElement.hasAttribute('data-transitioning'))return;
if(new URL(card.href).pathname===location.pathname){JKProject.lenis()?.scrollTo(0,{duration:SETTINGS.returnTopDuration});if(!JKProject.lenis())window.scrollTo({top:0,behavior:'smooth'});return;}
fired=true;s.handoffCard=card;barba.go(card.href,card,e);
}
function preview(card){
if(card.querySelector('video'))return Promise.resolve(card.querySelector('video'));
if(!cache.has(card.href))cache.set(card.href,fetch(card.href).then(r=>{if(!r.ok)throw Error(r.status);return r.text();}).then(html=>{
const doc=new DOMParser().parseFromString(html,'text/html'),v=doc.querySelector('.case-featured video')||doc.querySelector('.case-media video');
return v?{src:v.getAttribute('data-src')||v.getAttribute('src'),poster:v.getAttribute('poster')}:null;
}).catch(()=>null));
return cache.get(card.href).then(data=>{
if(!data?.src||s.abort.signal.aborted)return null;
let video=card.querySelector('video');if(video)return video;
video=document.createElement('video');video.className='case-index__video';video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.src=data.src;if(data.poster)video.poster=data.poster;
card.querySelector('.case-index__media').prepend(video);return video;
});
}
cards.forEach((card,i)=>{
card.dataset.caseTransition='continuation';if(!i)card.dataset.caseSuggested='';
card.querySelector('.case-index__media').dataset.nextMedia='';
card.querySelector('.case-index__title').dataset.nextTitle='';
card.addEventListener('click',e=>go(card,e),{signal:s.abort.signal});
const image=card.querySelector('img');
const enter=async()=>{
hovered.add(card);
if(JKProject.reduced())return;
const video=await preview(card);if(!video||!hovered.has(card))return;
try{await video.play();if(hovered.has(card)&&!s.abort.signal.aborted)gsap.to(image,{opacity:0,duration:SETTINGS.previewFadeIn,ease:SETTINGS.ease,overwrite:true});}catch{}
};
const leave=()=>{
hovered.delete(card);
gsap.to(image,{opacity:1,duration:SETTINGS.previewFadeOut,ease:SETTINGS.ease,overwrite:true,onComplete:()=>{if(!hovered.has(card)){const video=card.querySelector('video');video?.pause();}}});
};
card.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')enter();},{signal:s.abort.signal});
card.addEventListener('pointerleave',leave,{signal:s.abort.signal});card.addEventListener('focus',enter,{signal:s.abort.signal});card.addEventListener('blur',leave,{signal:s.abort.signal});
});
const near=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){cards.forEach(preview);near.disconnect();}},{rootMargin:SETTINGS.previewPreloadMargin});near.observe(wrap);
const st=ScrollTrigger.create({trigger:wrap,start:'top top',end:()=>Math.max(wrap.getBoundingClientRect().top+scrollY+1,Math.min(wrap.getBoundingClientRect().bottom+scrollY-innerHeight,ScrollTrigger.maxScroll(window))-2),onUpdate(self){
progress=self.progress;if(progress>0&&progress<.98)armed=true;
gsap.set(fill,{scaleX:progress,transformOrigin:'0 50%'});paint();percent.textContent='('+Math.round(progress*100)+'%)';
if(innerWidth>=SETTINGS.minimumAutoNextWidth&&!JKProject.reduced()&&armed&&progress>=.999)go(cards[0]);
}});
const navST=nav&&ScrollTrigger.create({trigger:wrap,start:SETTINGS.navHideStart,end:'bottom top',onToggle:self=>{gsap.to(nav,{autoAlpha:self.isActive?0:1,duration:SETTINGS.navFadeDuration,ease:SETTINGS.ease,overwrite:true});nav.inert=self.isActive;}});
const bottom=()=>{if(innerWidth>=SETTINGS.minimumAutoNextWidth&&!JKProject.reduced()&&!fired&&st.progress>.98&&scrollY>=ScrollTrigger.maxScroll(window)-2)go(cards[0]);};
window.addEventListener('scroll',bottom,{passive:true,signal:s.abort.signal});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cards.forEach(card=>card.querySelector('video')?.pause());},{signal:s.abort.signal});
s.cleanups.push(()=>{statusParent.insertBefore(status,statusSibling?.parentNode===statusParent?statusSibling:null);idle.textContent=idleText;clearTimeout(idleTimer);messageTween?.kill();st.kill();navST?.kill();near.disconnect();items.forEach(item=>grid.append(item));cards.forEach(card=>{card.querySelector('video')?.remove();delete card.dataset.caseSuggested;gsap.set(card,{clearProps:'opacity'});gsap.set(card.querySelector('img'),{clearProps:'opacity'});});if(nav){nav.inert=false;gsap.set(nav,{clearProps:'opacity,visibility'});}});
});
