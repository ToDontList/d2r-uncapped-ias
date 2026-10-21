import assert from 'node:assert/strict';
import {petFpa,petBreakpoints,calculatePet,petBonuses} from './summons.js';
const expected={goatman:[[19,0],[18,6],[17,12],[16,18],[15,25],[14,34],[13,43],[12,54],[11,67],[10,83],[9,100],[8,123],[7,150],[6,186],[5,234],[4,300],[3,400],[2,567],[1,900]],tainted:[[9,0],[8,12],[7,25],[6,43],[5,67],[4,100],[3,150],[2,234],[1,400]]};
for(const [id,table] of Object.entries(expected)){
 const s={attack:'pet:'+id,cap:'500',petOther:1000};
 for(const [f,e] of table){assert.equal(petFpa(s,e),f,`${id} ${f}F`);if(e>0)assert.ok(petFpa(s,e-1)>f);}
 const rows=petBreakpoints(s).filter(r=>r.eias>=0);
 assert.deepEqual(rows.map(r=>[r.fpa,r.eias]),table);
 assert.equal(calculatePet(s).fpa,id==='goatman'?3:1);
 assert.equal(calculatePet({...s,cap:'none'}).fpa,1);
 assert.equal(calculatePet({...s,cap:'924'}).fpa,1);
 assert.equal(petBonuses({...s,petOther:0,petItemIAS:3000,petWSM:-50}).total,0);
 assert.equal(calculatePet({...s,petOther:0,petLevel:20,petMastery:20}).fpa,id==='goatman'?13:6);
 assert.equal(petBonuses({...s,petOther:0,petLevel:20,petMastery:20,petEngorge:20}).total,83);
 assert.equal(calculatePet({...s,petAiDelay:1}).fpa,calculatePet({...s,petAiDelay:15}).fpa);
 assert.ok(calculatePet(s).theoretical);
}
assert.equal(petFpa({attack:'pet:skeleton'},31),13);
assert.equal(petFpa({attack:'pet:defiler'},0),null);
assert.equal(petFpa({attack:'pet:defiler',petBaseFpa:10},0),10);
console.log('PASS: 28 breakpoint thresholds and preceding EIAS; caps; bonuses; no equipment inheritance; independent AI delay; existing pets.');

for(const id of ['goatman','tainted','skeleton']){
 const s={attack:'pet:'+id};
 for(const [lv,expected] of [[0,0],[1,5],[20,24],[200,204]]){
  assert.equal(petBonuses({...s,petRancor:lv}).total,expected);
 }
 assert.equal(petBonuses({...s,rancor:20}).total,0);
}
assert.equal(calculatePet({attack:'pet:tainted',petOther:376,petRancor:20,cap:'500'}).fpa,1);
assert.equal(calculatePet({attack:'pet:tainted',petOther:376,cap:'500'}).fpa,2);
console.log('PASS summon Rancor levels, no player inheritance, 400 EIAS breakpoint.');
