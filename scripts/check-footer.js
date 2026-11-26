// Exercise actual footer controller with changing flow geometry and navigation freeze.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function style(){const values={};return {values,setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]};}
let revealing=false,pageY=0;
let panelTop=1000,stageTop=2200,paint,cleanup;
const inner={style:style(),querySelector:()=>null},tint={style:{}},name={offsetHeight:400,style:style()};
const stage={getBoundingClientRect:()=>({top:stageTop}),querySelector:()=>name};
const wrap={style:style(),querySelector:()=>stage,getAttribute:()=> 'base'};
const panel={closest:()=>wrap,getBoundingClientRect:()=>({top:panelTop}),querySelector:s=>s==='.footer_editorial_wrap'?inner:s.includes('tint')?tint:null};
const page={hasAttribute:()=>revealing,querySelectorAll:()=>[panel],contains:e=>e===panel};
const context={innerHeight:800,document:{...page,readyState:'complete',addEventListener(){},querySelector:()=>null},window:{gsap:true,ScrollTrigger:true},ResizeObserver:class{observe(){}disconnect(){}},gsap:{getProperty:()=>pageY,ticker:{add:f=>paint=f,remove:()=>{}},matchMedia:()=>({add:(q,f)=>cleanup=f(),revert:()=>cleanup()})}};
vm.runInNewContext(fs.readFileSync('assets/js/features/footer-parallax.js','utf8'),context);
assert.equal(inner.style.values['--footer-entry-y'],undefined);
panelTop=400;stageTop=1600;paint();assert.equal(inner.style.values['--footer-entry-y'],undefined);
panelTop=0;stageTop=800;paint();assert.equal(inner.style.values['--footer-entry-y'],undefined);assert.equal(name.style.values['--footer-reveal-y'],'-240px');assert.equal(name.style.values['--footer-reveal-shade'],'0.5');
stageTop=600;paint();assert.equal(name.style.values['--footer-reveal-y'],'-120px');
revealing=true;pageY=96;stageTop=696;paint();assert.equal(name.style.values['--footer-reveal-y'],'-120px','Loader pull must not advance footer parallax');revealing=false;pageY=0;
stageTop=400;paint();assert.equal(name.style.values['--footer-reveal-y'],'0px');assert.equal(name.style.values['--footer-reveal-shade'],'0');
name.offsetHeight=600;context.innerHeight=900;stageTop=300;paint();assert.equal(name.style.values['--footer-reveal-y'],'0px');
context.window.JKFooter.freeze(page);panelTop=900;stageTop=1800;paint();assert.equal(name.style.values['--footer-reveal-y'],'0px');assert.equal(inner.style.values['--footer-entry-y'],undefined);
// The case-study footer is hidden at desktop widths and needs no parallax observer or ticker.
wrap.getAttribute=()=> 'project-mobile';
context.ResizeObserver=class { constructor(){assert.fail('Mobile-only footer created a parallax observer');} };
context.gsap.ticker.add=()=>assert.fail('Mobile-only footer registered a parallax ticker');
vm.runInNewContext(fs.readFileSync('assets/js/features/footer-parallax.js','utf8'),context);
console.log('Footer normal flow, glyph overlap, resize endpoint and navigation freeze passed.');
