const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let frame,lastBall,lastText,fonts=[],texts=[];
function el(){return {style:{},events:{},setAttribute(){},addEventListener(k,f){this.events[k]=f},append(){},after(){},focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0})};}
const ctx={clearRect(){},setTransform(){},fillRect(){},beginPath(){},arc(x,y,r){lastBall={x,y,r}},fill(){},measureText:()=>({actualBoundingBoxLeft:0,actualBoundingBoxRight:720,actualBoundingBoxAscent:300,actualBoundingBoxDescent:0,width:720}),fillText(t,x,y){lastText={t,x,y};texts.push(t);fonts.push(this.font)}};
const canvas=Object.assign(el(),{getContext:()=>ctx}),button=Object.assign(el(),{tagName:'A'}),status=el(),court=Object.assign(el(),{clientWidth:1440,clientHeight:900});
const root=Object.assign(el(),{isConnected:true,dataset:{},querySelector:s=>s==='.error-court'?court:button});
const doc={readyState:'complete',hidden:false,querySelector:()=>root,createElement:t=>t==='canvas'?canvas:status,addEventListener(){}};
vm.runInNewContext(fs.readFileSync('assets/js/features/utility-pages.js','utf8'),{document:doc,matchMedia:()=>({matches:false}),devicePixelRatio:1,ResizeObserver:class{observe(){}disconnect(){}},getComputedStyle:()=>({color:'#fff',fontFamily:'Delight'}),requestAnimationFrame:f=>frame=f,cancelAnimationFrame(){}});
frame(0);assert.equal(lastText.y,300,'Idle glyph begins at the viewport top without an 80px inset');assert.match(fonts[0],/^600 /);
button.events.click({preventDefault(){}});frame(16);frame(32);const initial=lastBall;
for(let t=48;t<=512;t+=16)frame(t);
assert.ok(lastBall.y-initial.y>300,'Opening ball speed must be immediately playable');assert.ok(lastBall.r>=10,'Ball remains visible');
for(let t=528;t<6000;t+=16){canvas.events.pointermove({clientX:lastBall.x});frame(t);}
assert.equal(root.dataset.gameState,'playing');assert.match(status.textContent,/0[3-9] returns/,'Paddle hits increase the visible score');
assert.ok(texts.every(t=>t==='404'),'The score is never drawn behind the nav');
console.log('404 edge bounds, display weight, opening speed, paddle rallies and visible score passed.');
