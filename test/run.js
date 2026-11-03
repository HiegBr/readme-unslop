const fs=require('fs'),assert=require('assert'),path=require('path');
const {lint}=require(path.join(path.dirname(__dirname),'readme-unslop.js'));
const r=f=>lint(fs.readFileSync(path.join(__dirname,'fixtures',f),'utf8'));
assert(r('sloppy.md').score>30,'sloppy should fail');
assert.strictEqual(r('human.md').score,0);
assert(r('slop2.md').score>30,'slop2 should fail');
assert.strictEqual(r('human-cli.md').score,0);
console.log('ok');
{
  const md='# Tool\n\nIntro text here.\n\n- **Fast**: quick\n- **Safe**: sure\n- **Small**: tiny\n';
  const f=lint(md).findings.find(x=>x.rule==='bold-label-bullets');
  assert(f,'bold-label-bullets should fire');
  assert.strictEqual(f.line,5,'should report first matching line');
  console.log('line ok');
}
{
  const {spawnSync}=require('child_process');
  const bin=path.join(path.dirname(__dirname),'readme-unslop.js');
  const o=spawnSync('node',[bin,'--json','--max-score','30',path.join(__dirname,'fixtures','sloppy.md')],{encoding:'utf8'});
  const j=JSON.parse(o.stdout);
  assert.strictEqual(o.status,1);
  assert.strictEqual(j[0].pass,false);
  assert.strictEqual(j[0].max,30);
  console.log('json ok');
}
