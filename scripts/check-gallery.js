const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/features/projects.js','utf8');
const paint=source.slice(source.indexOf('    function paintInertia(dt)'),source.indexOf('    function markCurrentSlide'));
const cards=Array.from({length:12},(_,i)=>({offsetLeft:i*360,offsetWidth:320,style:{}}));
const state={S:{cur:-1080,wrap:x=>x},previousSlide:-1080,spacingExpansion:0,reducedMotion:{matches:false},kineticCards:cards,innerWidth:1440};vm.createContext(state);vm.runInContext(paint,state);
for(const direction of [-1,1]){
 for(let i=0;i<90;i++){
  state.S.cur+=direction*(i<40?75:0);vm.runInContext('paintInertia(16.667)',state);
  for(let n=1;n<cards.length;n++){
   const gap=cards[n].offsetLeft+parseFloat(cards[n].style.translate)-cards[n-1].offsetLeft-parseFloat(cards[n-1].style.translate)-320;
   assert.ok(gap>=39.99,'Inertia may expand gaps, never collapse them');
  }
 }
}
state.spacingExpansion=.4;state.S.cur=state.previousSlide=-1080;vm.runInContext('paintInertia(0)',state);const before=parseFloat(cards[4].style.translate);
state.S.cur=state.previousSlide=-2160;vm.runInContext('paintInertia(0)',state);assert.equal(parseFloat(cards[7].style.translate),before,'Equivalent cloned cards have the same viewport offset');
state.reducedMotion.matches=true;for(let i=0;i<180;i++)vm.runInContext('paintInertia(16.667)',state);assert.equal(state.spacingExpansion,0);
console.log('Gallery forward/reverse spacing, loop continuity and reduced-motion settling passed.');
