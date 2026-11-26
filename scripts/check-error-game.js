const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nameContext = {};
vm.runInNewContext(fs.readFileSync('assets/js/features/error-leaderboard.js', 'utf8'), nameContext);
for (const name of ['李小龍', 'عبد الرحمن', 'Scunthorpe', 'Lunar Fox']) {
  assert.equal(nameContext.pongPlayerName(name), name);
}
assert.equal(nameContext.pongPlayerName(' Ma\u0301ire   O’Rourke '), 'Máire O’Rourke');
for (const name of ['', 'x'.repeat(25), 'a\u202eb', 'name@example.com', 'f u c k']) {
  assert.equal(nameContext.pongPlayerName(name), '');
}
let frame,lastBall,lastText,fonts=[],texts=[];
function el(){return {style:{},events:{},setAttribute(){},addEventListener(k,f){this.events[k]=f},append(){},after(){},focus(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0})};}
const ctx={clearRect(){},setTransform(){},fillRect(){},beginPath(){},arc(x,y,r){lastBall={x,y,r}},fill(){},measureText:()=>({actualBoundingBoxLeft:0,actualBoundingBoxRight:720,actualBoundingBoxAscent:300,actualBoundingBoxDescent:0,width:720}),fillText(t,x,y){lastText={t,x,y};texts.push(t);fonts.push(this.font)}};
const canvas=Object.assign(el(),{getContext:()=>ctx}),button=Object.assign(el(),{tagName:'A'}),status=el(),court=Object.assign(el(),{clientWidth:1440,clientHeight:900});
court.classList={toggle(){}};
const root=Object.assign(el(),{isConnected:true,dataset:{},querySelector:s=>s==='.error_game_court'?court:button});
const rootClasses=new Set();
root.classList={
  add: name=>rootClasses.add(name),
  toggle: (name,on)=>on?rootClasses.add(name):rootClasses.delete(name)
};
const doc={readyState:'complete',hidden:false,querySelector:()=>root,createElement:t=>t==='canvas'?canvas:status,addEventListener(){}};
vm.runInNewContext(fs.readFileSync('assets/js/features/utility-pages.js','utf8'),{createPongLeaderboard:()=>({startRound(){},finishRound(){}}),setPongActionLabel:(control,label)=>{control.textContent=label;},document:doc,matchMedia:()=>({matches:false}),devicePixelRatio:1,ResizeObserver:class{observe(){}disconnect(){}},getComputedStyle:()=>({color:'#fff',fontFamily:'Delight'}),requestAnimationFrame:f=>frame=f,cancelAnimationFrame(){}});
assert.ok(rootClasses.has('error_game_ready'),'The poster hands off after the first canvas draw');
assert.ok(!rootClasses.has('error_game_in_progress'));
frame(0);assert.equal(lastText.y,300,'Idle glyph begins at the viewport top without an 80px inset');assert.match(fonts[0],/^600 /);
button.events.click({preventDefault(){}});for(let t=16;t<=2992;t+=16)frame(t);
assert.equal(lastText.y-150,450,'Countdown ink straddles the court divider');
assert.equal(lastBall,undefined);
assert.deepEqual([...new Set(texts.filter(t=>t!=='404'))],['3','2','1']);
frame(3008);frame(3024);const initial=lastBall;
for(let t=3040;t<=3504;t+=16)frame(t);
assert.ok(lastBall.y-initial.y>300,'Opening ball speed must be immediately playable');assert.ok(lastBall.r>=10,'Ball remains visible');
for(let t=3520;t<9000;t+=16){canvas.events.pointermove({clientX:lastBall.x});frame(t);}
assert.equal(root.dataset.gameState,'playing');assert.ok(rootClasses.has('error_game_in_progress'));assert.match(status.textContent,/0[3-9] returns/,'Paddle hits increase the visible score');
// Measure the actual outgoing ball after long rallies, beyond the previous
// return-11 speed ceiling. Track the ball with the mouse to sustain each rally.
const rallySpeeds = new Map();
let lastScore = Number.parseInt(status.textContent, 10);
let sampleAfterReturn = false;
for (let t = 9008; t < 130000 && !rallySpeeds.has(50); t += 16) {
  const previous = lastBall;
  canvas.events.pointermove({clientX: previous.x});
  frame(t);
  const currentScore = Number.parseInt(status.textContent, 10);
  if (sampleAfterReturn) {
    rallySpeeds.set(lastScore, Math.hypot(lastBall.x - previous.x, lastBall.y - previous.y) / .016);
  }
  sampleAfterReturn = currentScore > lastScore;
  lastScore = currentScore;
}
assert.ok(rallySpeeds.get(22) > rallySpeeds.get(12), 'Longer rounds should keep accelerating');
assert.ok(rallySpeeds.get(50) > rallySpeeds.get(22), 'High scores should keep getting harder');
assert.ok(rallySpeeds.get(50) < 900 * .73 * 2.75, 'Maximum pace must remain playable');
assert.ok(texts.every(t=>['404','3','2','1'].includes(t)),'The score is never drawn behind the nav');
console.log('404 edge bounds, display weight, opening speed, paddle rallies and visible score passed.');
