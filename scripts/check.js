const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
assert.equal(new Set(manifest.js).size,manifest.js.length,'A script must only be loaded once');
for(const file of [...manifest.js,...manifest.css])assert.ok(fs.readFileSync(file,'utf8').trim(),file+' is empty');
new vm.Script(manifest.js.map(p=>fs.readFileSync(p,'utf8')).join('\n;\n'));
const css=manifest.css.map(p=>fs.readFileSync(p,'utf8')).join('\n');
assert.ok(!css.includes('min-height:100dvh;padding-bottom'),'Menu must use content height');
assert.ok(!css.includes('.lightbox-backdrop{'),'Removed grey overlay must stay removed');
console.log('Source syntax, unique ownership and migration checks passed.');
