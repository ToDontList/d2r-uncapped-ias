import assert from 'node:assert/strict';
import {CLASSES,ATTACKS,WEAPONS,whirlProfile,whirlWeaponAllowed} from './data.js';
import {calculate,frameFromEias,getBreakpoints,requiredEquipmentIAS,dualEnabled} from './core.js';
const base={form:'human',attack:'whirl',cap:'none',iasGear:0,iasMain:0,iasOff:0,other:0};
// Independently transcribed reference action frames, 1HS/1HT/2HS/2HT/STF.
const expected={ama:[10,9,12,11,12],sor:[12,11,14,13,11],nec:[9,9,11,10,11],pal:[7,8,8,8,9],bar:[7,7,7,9,9],dru:[9,8,10,9,9],ass:[7,7,11,10,9],war:[9,8,11,11,10]};
let count=0;
for(const [char]of CLASSES){
 const s={...base,char};assert.equal(ATTACKS[char].filter(a=>a[0]==='whirl').length,1);
 for(const [i,type]of ['oneSwing','oneThrust','twoSword','twoThrust','twoOther'].entries()){
  const weapon={type,wsm:0};assert.equal(frameFromEias(s,weapon,0),expected[char][i]);
  const rows=getBreakpoints(s,weapon);assert.equal(rows.at(-1).fpa,1);
  for(const row of rows){assert.equal(frameFromEias(s,weapon,row.eias),row.fpa);if(row.eias>-85)assert.notEqual(frameFromEias(s,weapon,row.eias-1),row.fpa);count++;}
 }
 assert.equal(dualEnabled({...s,dual:true}),['ass','bar'].includes(char));
 for(const type of ['bare','bow','xbow'])assert.equal(frameFromEias(s,{type},0),null);
 if(char!=='ass')assert.equal(frameFromEias(s,{type:'claw'},0),null);
}
const s={...base,char:'ass',dual:true},a={type:'claw',wsm:-30},b={type:'claw',wsm:10};
assert.deepEqual(whirlProfile('ass',a),{action:6,speed:208});
// 1536 / floor(208*(100+EIAS)/100); integer boundary fixtures.
for(const [e,f]of [[0,7],[23,6],[24,5],[47,5],[49,4],[75,4],[85,4],[86,3],[147,2],[270,1]])assert.equal(frameFromEias(s,a,e),f,`claw EIAS ${e}`);
let r=calculate(s,a,b);assert.equal(r.mainF,5);assert.equal(r.offF,8);assert.equal(r.avg,7);assert.equal(r.hitRate,null);
let fast=calculate({...s,iasOff:120},a,b);assert.equal(fast.mainF,r.mainF);assert.equal(fast.offF,4);assert.equal(fast.avg,5);
const swapped=calculate({...s,iasMain:120},b,a);assert.equal(swapped.avg,fast.avg);
assert.equal(calculate({...s,other:1000,cap:'500'},a,b).mainF,frameFromEias(s,a,500));
assert.equal(calculate({...s,dual:false},a,b).offF,null);
assert.equal(frameFromEias(s,{type:'oneSwing'},0),null);
assert.equal(whirlWeaponAllowed({type:'twoSword'},{...s,char:'bar'}),true);
assert.equal(whirlWeaponAllowed(a,{...s,char:'bar'}),false);
for(const hand of ['main','off']){const req=requiredEquipmentIAS(s,a,b,hand,49);assert.ok(calculate({...s,iasGear:req},a,b)[hand==='main'?'mainE':'offE'].raw>=49);assert.ok(calculate({...s,iasGear:req-1},a,b)[hand==='main'?'mainE':'offE'].raw<49);}
for(const [char] of CLASSES){const knife={type:'throwing',code:'7bk',wsm:0};assert.equal(whirlProfile(char,knife).action,expected[char][1]);}
assert.equal(frameFromEias({...base,char:'ass'},a,-1000),frameFromEias({...base,char:'ass'},a,-85));
assert.equal(frameFromEias({...s,form:'wolf'},a,0),null);
assert.ok(WEAPONS.filter(w=>w.type==='claw').every(w=>whirlWeaponAllowed(w,s)));
console.log(`PASS: all 8 classes, ${count} transition boundaries, claw speed/breakpoints, asymmetric dual IAS/WSM, swap symmetry, caps, melee types and invalid combinations.`);
