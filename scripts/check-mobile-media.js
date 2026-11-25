const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// Exercise the production pointer handlers: controls, cancelled gestures and dismissal.
let now=0,dialogs=[],animations=[];
class Element {
  constructor(tag){this.tagName=tag;this.style={};this.events={};this.children=[];this.attrs={};this.offsetWidth=390;this.offsetHeight=219.375;this.classList={add(){},remove(){}};}
  setAttribute(k,v){this.attrs[k]=v;}
  getAttribute(k){return this.attrs[k];}
  hasAttribute(k){return k in this.attrs;}
  append(...els){this.children.push(...els);if(this.tagName==='body')dialogs.push(...els);}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  fire(k,data={}){for(const fn of this.events[k]||[])fn({type:k,pointerType:'touch',pointerId:1,clientX:195,clientY:400,preventDefault(){},stopPropagation(){},...data});}
  querySelector(){return null;}
  querySelectorAll(){return [];}
  getBoundingClientRect(){return {left:0,top:312.3125,bottom:531.6875,width:this.offsetWidth,height:this.offsetHeight};}
  setPointerCapture(){this.captured=true;}
  hasPointerCapture(){return !!this.captured;}
  releasePointerCapture(){this.captured=false;}
  showModal(){this.open=true;}
  close(){this.open=false;}
  remove(){dialogs=dialogs.filter(e=>e!==this);}
  focus(){} pause(){} play(){return Promise.resolve();}
}
const document={readyState:'complete',body:new Element('body'),documentElement:new Element('html'),createElement:t=>new Element(t),querySelector:()=>null,querySelectorAll:()=>[]};
const gsap={killTweensOf(){},set(el,p){Object.assign(el.style,p);},timeline(options={}){const record={options,steps:[]};animations.push(record);return {to(el,p){record.steps.push({el,p});return this;},fromTo(el,from,to){record.steps.push({el,p:to});return this;}};}};
const window={};
document.addEventListener=()=>{};
vm.runInNewContext(['assets/js/core/video-playback.js','assets/js/features/mobile-media.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n'),{getComputedStyle:()=>({getPropertyValue:()=>""}),document,window,gsap,AbortController,performance:{now:()=>now},matchMedia:q=>({matches:!q.includes('reduced-motion')}),innerWidth:390,innerHeight:844,setTimeout(){}});
const source=new Element('video');source.currentSrc='https://example.test/video.mp4';source.videoWidth=1920;source.videoHeight=1080;source.getBoundingClientRect=()=>({left:24,top:200,bottom:392,width:342,height:192});
function open(){window.JKMobileMedia.open(source,new Element('button'));const dialog=dialogs.at(-1);return {dialog,video:dialog.children[0]};}
let {dialog,video}=open();
let count=animations.length;
video.fire('pointerdown',{clientY:515});video.fire('pointermove',{clientY:700});video.fire('pointerup',{clientY:700});
assert.equal(animations.length,count,'Native controls must not start a dismiss drag');
video.fire('pointerdown');now+=100;video.fire('pointermove',{clientY:425});now+=100;video.fire('pointerup',{clientY:425});
assert.equal(animations.at(-1).steps[0].p.scale,1,'A short drag must return to full size');
assert.equal(animations.at(-1).steps[0].p.y,0,'A short drag must return to centre');
assert.equal(dialogs.length,1,'A short drag must leave the player open');
animations.at(-1).options.onComplete();
video.fire('pointerdown');now+=100;video.fire('pointermove',{clientX:285,clientY:550});video.fire('pointerup',{clientX:285,clientY:550});
assert.equal(animations.at(-1).steps[1].p['--media-backdrop'],0,'A committed diagonal swipe must dismiss the backdrop');
animations.at(-1).options.onComplete();assert.equal(dialogs.length,0,'Dismissal must remove the player');
({dialog,video}=open());video.fire('pointerdown');now+=100;video.fire('pointermove',{clientY:550});video.fire('pointercancel',{clientY:550});
assert.equal(animations.at(-1).steps[0].p.scale,1,'Cancelled touches must restore the player');
assert.equal(dialogs.length,1);
window.JKMobileMedia.open(source,new Element('button'));assert.equal(dialogs.length,1,'Reopening must dispose the previous player');
console.log('Touch-player controls, short drag, diagonal dismissal, cancellation and reopening passed.');
