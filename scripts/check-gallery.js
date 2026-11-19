// Exercise the real infinite track renderer in both directions and across set boundaries.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/features/projects.js','utf8');
const code=source.slice(source.indexOf('    function renderSlide()'),source.indexOf('    function snapSlideStep'));
let selected;
const state={S:{pitch:360,cur:0,wrap:x=>((x+4320)%1080+1080)%1080-4320},N:3,track:{style:{}},activeIdx:0,markCurrentSlide:n=>selected=n};
vm.createContext(state);vm.runInContext(code,state);
for(const x of [0,-360,-720,-1080,-1440,360,720,1080,1440]){state.S.cur=x;vm.runInContext('renderSlide()',state);assert.ok(selected>=0&&selected<3);assert.match(state.track.style.transform,/translate3d\(/);}
for(const x of [-1400,-500,100,1700]){state.S.cur=x;vm.runInContext('renderSlide()',state);const a=state.track.style.transform;state.S.cur=x+1080;vm.runInContext('renderSlide()',state);assert.equal(state.track.style.transform,a,'Equivalent repeated sets land at identical positions');}
assert.ok(!source.includes('paintInertia'),'Per-card velocity spacing is removed');
console.log('Gallery loop continuity and uniform track motion passed.');
