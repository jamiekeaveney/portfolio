// Exercise the actual playback owner through idle, hover, scroll and hidden-tab states.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/features/projects.js','utf8');
const code=source.slice(source.indexOf('    function previewMedia('),source.indexOf('    var lDrag ='));
let hovered=false,plays=0,pauses=0,now=200;
const el={style:{},_previewPlaying:false,removeAttribute(){},setAttribute(){},isConnected:true};
const video={pause(){pauses++},getAttribute:()=>'/media.mp4',play(){plays++;return Promise.resolve()},dataset:{}};
const context={L:{rowH:52,tgt:0},lDrag:false,settledSince:0,lastPreviewValue:0,performance:{now:()=>now},listVideos:[{el,video}],listCenter:{matches:s=>s===':hover'&&hovered},activeIdx:0,document:{hidden:false},reducedMotion:{matches:false},fading:false,dead:false};
vm.createContext(context);vm.runInContext(code,context);
context.previewMedia(0);assert.equal(plays,0,'Resting on an item must not autoplay');
hovered=true;context.previewMedia(0);assert.equal(plays,1);
hovered=false;context.previewMedia(0);assert.equal(pauses,1);
hovered=true;context.lDrag=true;context.previewMedia(0);assert.equal(plays,1);
context.lDrag=false;now=500;context.previewMedia(0);assert.equal(plays,2);
context.document.hidden=true;context.previewMedia(0);assert.equal(pauses,2);
console.log('List hover-only playback, drag suppression and hidden-tab pause passed.');
