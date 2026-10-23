import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES,WEAPONS} from './data.js';
import {wereTiming,wereAttacks,wereProfile} from './wereforms.js';
import {calculate,frameFromEias,getBreakpoints,requiredEquipmentIAS} from './core.js';
// Numeric oracle fixtures from ChthonVII's independent animation-loop simulation.
// For skills (not normal attack), start=0 follows current Warren's getStartingFrame.
const cases=JSON.parse(readFileSync(new URL('./wereform_reference_cases.json',import.meta.url)));
for(const c of cases)assert.deepEqual(wereTiming({...c,furyLevel:4,swordGrip:'two'},{type:c.type,wsm:0},c.e).parts,c.parts);
const weapon={type:'oneSwing',wsm:0};
const base={char:'dru',form:'wolf',attack:'normal',cap:'none',furyLevel:4,swordGrip:'two'};
assert.equal(frameFromEias(base,weapon,0),19);
assert.equal(frameFromEias({...base,attack:'rabies'},weapon,0),14);
assert.equal(wereTiming({...base,attack:'fury'},weapon,0).hits,5);
assert.deepEqual(wereTiming({...base,attack:'fury',furyLevel:1},weapon,0).parts,[11,16]);
assert.equal(wereProfile({...base,char:'bar',swordGrip:'one'},{type:'twoSword'}).humanFrames,16);
assert.equal(wereProfile({...base,char:'bar',swordGrip:'two'},{type:'twoSword'}).humanFrames,18);
assert.equal(wereProfile({...base,char:'ass'},{type:'claw'}).speed,208);
assert.equal(wereProfile(base,WEAPONS.find(w=>w.code==='7bk')).humanFrames,19);
assert.equal(wereProfile({...base,char:'ama'},WEAPONS.find(w=>w.code==='7bk')).humanFrames,15);
assert.equal(wereProfile({...base,char:'ama'},WEAPONS.find(w=>w.code==='7ta')).humanFrames,16);
let tables=0;
for(const [char]of CLASSES)for(const form of ['wolf','bear'])for(const [attack]of wereAttacks(form)){
 const s={...base,char,form,attack,iasGear:0,iasMain:0};
 const rows=getBreakpoints(s,weapon);assert.ok(rows.length>1);assert.equal(rows.at(-1).fpa,1);
 for(const row of rows){
  assert.equal(frameFromEias(s,weapon,row.eias),row.fpa);
  if(row.eias>-85){const prev=wereTiming(s,weapon,row.eias-1);assert.notEqual(prev.parts.join('/'),row.sequence);}
 }
 const off=calculate({...s,other:500,cap:'150',dual:true,iasOff:99999},weapon,{type:'twoOther',wsm:-99});
 assert.equal(off.dual,false);assert.equal(off.mainF,frameFromEias(s,weapon,150));
 const req=requiredEquipmentIAS(s,weapon,null,'main',50);
 assert.ok(calculate({...s,iasGear:req},weapon,null).mainE.raw>=50);
 tables++;
}
assert.equal(frameFromEias({...base,form:'human',attack:'fury'},weapon,0),null);
assert.equal(frameFromEias({...base,form:'bear',attack:'fury'},weapon,0),null);
console.log(`PASS: ${cases.length} independent reference cases; ${tables} class/form/skill tables to 1F; Fury levels, grips, claws, throwing melee, caps and off-hand isolation.`);
