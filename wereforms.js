import {MOTION} from './data.js?v=1.8.0';

// Independent implementation of the D2R 2.4+ integer animation model.
// Research: ChthonVII/d2r_24ptr2_wereform_calculator (animation loop),
// Warren1001/IAS_Calculator (human weapon/class timing).
// Reimagined skills.txt: A1 paw / S3 bite, Fury rollback 70%, hits min(level+1,5).
// Above vanilla speeds the one-tick floor is an extrapolation, NOT a hit guarantee.
export const WERE_ATTACKS={
 wolf:[['normal','일반 공격 · 휘두르기'],['feral','야성의 분노 / Feral Rage · 휘두르기'],['fireclaws','화염 발톱 / Fire Claws · 휘두르기'],['rabies','광견병 / Rabies · 물기'],['hunger','굶주림 / Hunger · 물기'],['fury','분노 / Fury · 연속 공격']],
 bear:[['normal','일반 공격 · 휘두르기'],['maul','후려치기 / Maul · 휘두르기'],['fireclaws','화염 발톱 / Fire Claws · 휘두르기'],['hunger','굶주림 / Hunger · 물기']]
};
export const SHAPE_SKILLS=new Set(['feral','fireclaws','rabies','hunger','fury','maul']);
export const isWereform=form=>form==='wolf'||form==='bear';
export function wereAttacks(form){return WERE_ATTACKS[form]||[];}
export function wereProfile(s,weapon){
 if(!wereAttacks(s.form).some(([id])=>id===s.attack))return null;
 let type=weapon.type;
 // Throwing knives use 1HT in melee, throwing axes use 1HS (not the throw sequence).
 if(type==='throwing')type=['tkf','bkf','9tk','9bk','7tk','7bk'].includes(weapon.code)?'oneThrust':'oneSwing';
 if(s.char==='bar'&&type==='twoSword'&&s.swordGrip==='one')type='oneSwing';
 if(type==='claw'&&s.char!=='ass')return null; // No verified non-Assassin claw animation.
 const humanFrames=Number(s.overrideFrames)>0?Number(s.overrideFrames):MOTION[s.char]?.[type];
 if(!humanFrames)return null;
 const speed=type==='claw'?208:256;
 // Starting-frame skips apply to standard attacks, not the shape skill animations.
 const start=s.attack==='normal'&&['ama','sor'].includes(s.char)
   ?type==='bare'?1:['oneSwing','oneThrust','twoSword','twoThrust','twoOther'].includes(type)?2:0:0;
 const paw=s.form==='wolf'?13:12;
 const bite=['rabies','hunger'].includes(s.attack);
 return {humanFrames,speed,start,paw,length:bite?10:paw,action:bite?6:7,bite,
   hits:s.attack==='fury'?Math.min(5,Math.max(2,Math.trunc(Number(s.furyLevel)||4)+1)):1};
}
export function wereTiming(s,weapon,eias){
 const p=wereProfile(s,weapon);if(!p)return null;
 const e=Math.max(-85,Number(eias)||0);
 const increment=Math.max(1,Math.trunc((p.speed+Math.trunc(p.speed*e/100))*p.paw/p.humanFrames));
 const duration=from=>Math.max(1,Math.ceil((p.length-from)*256/increment)-1);
 let start=p.start;const parts=[];
 // Stop each early Fury segment at its action frame, then roll back the integer
 // animation frame by 70%. The last segment completes the animation.
 for(let hit=1;hit<p.hits;hit++){
   const ticks=Math.max(1,Math.ceil((p.action-start)*256/increment));
   parts.push(ticks);
   const reached=Math.trunc((start*256+ticks*increment)/256);
   start=Math.trunc(reached*30/100);
   // Custom uncapped speeds can overshoot the animation entirely. Saturate to
   // a 1-tick theoretical interval; UI labels this region as game-unverified.
   start=Math.min(start,p.action-1);
 }
 parts.push(duration(start));
 const cycle=parts.reduce((a,b)=>a+b,0);
 return {...p,increment,parts,cycle,fpa:cycle/p.hits,
   actionTick:Math.max(1,Math.ceil((p.action-p.start)*256/increment)),
   extrapolated:e>150};
}
