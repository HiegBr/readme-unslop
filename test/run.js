const fs=require('fs'),assert=require('assert'),{lint}=require('../readme-unslop.js');
const r=f=>lint(fs.readFileSync(__dirname+'/fixtures/'+f,'utf8'));
assert(r('sloppy.md').score>30,'sloppy should fail');
assert.strictEqual(r('human.md').score,0);
console.log('ok');
