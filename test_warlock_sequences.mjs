import assert from 'node:assert/strict';
import {buffs,calculate,frameFromEias,getBreakpoints,requiredEquipmentIAS,warlockSequenceFrames} from './core.js';
const base={char:'war',form:'human',cap:'none',iasGear:0,iasMain:0};
const lengths={cleave:{oneSwing:16,oneThrust:16,twoSword:18,twoThrust:20,twoOther:22},mirrored:{oneSwing:16,oneThrust:16,twoSword:19,twoThrust:21,twoOther:17,bow:18,xbow:18}};
for(const [attack,types]of Object.entries(lengths)){
 for(const [level,bonus]of [[0,0],[1,13],[5,20],[10,23],[20,26],[40,29]]){
  const s={...base,attack,[attack]:level};assert.equal(buffs(s).values[attack],bonus);assert.equal(buffs(s).total,bonus-30);
  const inactive={...s,attack:'normal'};assert.equal(buffs(inactive).total,0);
 }
 for(const [type,fpd]of Object.entries(types)){
  const weapon={type,wsm:0},s={...base,attack,[attack]:20};
  assert.equal(warlockSequenceFrames(s,weapon),fpd);
  // Sequence length includes tick zero. Oracle cases at rates 256, 448 and 512.
  for(const [e,rate]of [[0,256],[75,448],[100,512]])assert.equal(frameFromEias(s,weapon,e),Math.ceil(256*fpd/rate));
  assert.ok(calculate({...s,[attack]:20},weapon).mainF<calculate({...s,[attack]:1},weapon).mainF);
  assert.equal(calculate(s,weapon).hitRate,null);assert.ok(calculate(s,weapon).cycleRate>0);
  const rows=getBreakpoints(s,weapon);assert.equal(rows.at(-1).fpa,1);
  for(const row of rows){
   assert.equal(frameFromEias(s,weapon,row.eias),row.fpa);
   if(row.eias>-85)assert.notEqual(frameFromEias(s,weapon,row.eias-1),row.fpa);
  }
  const req=requiredEquipmentIAS(s,weapon,null,'main',50);
  assert.ok(calculate({...s,iasGear:req},weapon).mainE.raw>=50);
  assert.ok(calculate({...s,iasGear:req-1},weapon).mainE.raw<50);
 }
 assert.equal(frameFromEias({...base,attack},{type:'bare'},0),null);
 assert.equal(frameFromEias({...base,attack},{type:'claw'},0),null);
}
assert.equal(frameFromEias({...base,attack:'cleave'},{type:'bow'},0),null);
assert.equal(buffs({...base,attack:'cleave',cleave:20,mirrored:20}).total,-4);
assert.equal(calculate({...base,attack:'mirrored',mirrored:20,other:1000,cap:'500'},{type:'twoSword',wsm:0}).mainF,frameFromEias({...base,attack:'mirrored'},{type:'twoSword',wsm:0},500));
console.log('PASS: both skill level bonuses, 12 weapon sequences, -30 correction, all thresholds to 1F, required IAS, caps, isolation and unsupported weapons.');
