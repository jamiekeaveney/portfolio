const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let frame,lastBall,lastText,fonts=[],texts=[];
function el(){return {style:{},events:{},setAttribute(){},addEventListener(k,f){this.events[k]=f},append(){},after(){},focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0})};}
const ctx={clearRect(){},setTransform(){},fillRect(){},beginPath(){},arc(x,y,r){lastBall={x,y,r}},fill(){},measureText:()=>({actualBoundingBoxLeft:0,actualBoundingBoxRight:720,actualBoundingBoxAscent:300,actualBoundingBoxDescent:0,width:720}),fillText(t,x,y){lastText={t,x,y};texts.push(t);fonts.push(this.font)}};
const canvas=Object.assign(el(),{getContext:()=>ctx}),button=Object.assign(el(),{tagName:'A'}),status=el(),court=Object.assign(el(),{clientWidth:1440,clientHeight:900});
court.classList={toggle(){}};
const root=Object.assign(el(),{isConnected:true,dataset:{},querySelector:s=>s==='.error-game__court'?court:button});
const rootClasses=new Set();
root.classList={
  add: name=>rootClasses.add(name),
  toggle: (name,on)=>on?rootClasses.add(name):rootClasses.delete(name)
};
const doc={readyState:'complete',hidden:false,querySelector:()=>root,createElement:t=>t==='canvas'?canvas:status,addEventListener(){}};
vm.runInNewContext(fs.readFileSync('assets/js/features/utility-pages.js','utf8'),{document:doc,matchMedia:()=>({matches:false}),devicePixelRatio:1,ResizeObserver:class{observe(){}disconnect(){}},getComputedStyle:()=>({color:'#fff',fontFamily:'Delight'}),requestAnimationFrame:f=>frame=f,cancelAnimationFrame(){}});
assert.ok(rootClasses.has('error-game--ready'),'The poster hands off after the first canvas draw');
assert.ok(!rootClasses.has('error-game--in-progress'));
frame(0);assert.equal(lastText.y,300,'Idle glyph begins at the viewport top without an 80px inset');assert.match(fonts[0],/^600 /);
button.events.click({preventDefault(){}});for(let t=16;t<=2992;t+=16)frame(t);
assert.equal(lastText.y-150,450,'Countdown ink straddles the court divider');
assert.equal(lastBall,undefined);
assert.deepEqual([...new Set(texts.filter(t=>t!=='404'))],['3','2','1']);
frame(3008);frame(3024);const initial=lastBall;
for(let t=3040;t<=3504;t+=16)frame(t);
assert.ok(lastBall.y-initial.y>300,'Opening ball speed must be immediately playable');assert.ok(lastBall.r>=10,'Ball remains visible');
for(let t=3520;t<9000;t+=16){canvas.events.pointermove({clientX:lastBall.x});frame(t);}
assert.equal(root.dataset.gameState,'playing');assert.ok(rootClasses.has('error-game--in-progress'));assert.match(status.textContent,/0[3-9] returns/,'Paddle hits increase the visible score');
assert.ok(texts.every(t=>['404','3','2','1'].includes(t)),'The score is never drawn behind the nav');
console.log('404 edge bounds, display weight, opening speed, paddle rallies and visible score passed.');
