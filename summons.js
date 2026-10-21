/* D2R Reimagined summon attack-speed model, v1.7.
 * Published breakpoint anchors: The Amazon Basin (LoD / D2R pet animation references).
 * ABOVE last published breakpoint: extrapolation for custom IAS-cap removal, NOT validated.
 * AI delay is separate from attack animation FPA and must never be added as exact hit period.
 * Reimagined warlock formulas: local Reimagined skills.txt, October 2026.
 */
import {diminishing,effectiveItemIAS,num} from './core.js';
const pairs=rows=>rows.map(([e,f])=>({eias:e,fpa:f}));
export const PET_PROFILES={
  valkyrie:{name:'발키리 / Valkyrie',owner:'ama',animation:'발키리 기본 공격',aiDelay:6,frames:pairs([[0,17],[7,16],[13,15],[21,14],[29,13],[39,12],[50,11],[64,10]]),note:'발키리는 생성 시 장비에 IAS가 붙을 수 있습니다. 장착 IAS와 WSM은 직접 입력하세요.'},
  skeleton:{name:'해골 전사 / Raise Skeleton',owner:'nec',animation:'해골 근접 공격',aiDelay:15,frames:pairs([[0,18],[2,17],[8,16],[15,15],[23,14],[31,13]])},
  skelemage:{name:'해골 마법학자 / Raise Skeletal Mage',owner:'nec',animation:'마법 투사체 발사',aiDelay:15,frames:pairs([[0,18],[2,17],[8,16],[15,15],[23,14],[31,13]]),note:'해골 마법학자는 근접 공격 대신 투사체 발사 동작을 계산합니다.'},
  clay:{name:'점토 골렘 / Clay Golem',owner:'nec',animation:'골렘 근접 공격',aiDelay:15,frames:pairs([[0,17],[4,16],[11,15],[19,14],[27,13],[37,12]])},
  blood:{name:'피 골렘 / Blood Golem',owner:'nec',animation:'골렘 근접 공격',aiDelay:15,frames:pairs([[0,15],[8,14],[15,13],[24,12],[34,11]])},
  iron:{name:'강철 골렘 / Iron Golem',owner:'nec',animation:'골렘 근접 공격',aiDelay:15,frames:pairs([[-20,20],[-19,19],[-15,18],[-10,17],[-5,16],[0,15],[8,14],[15,13],[24,12],[34,11],[46,10],[61,9]]),note:'강철 골렘은 제작 재료의 무기 속도·IAS가 반영될 수 있습니다.'},
  fire:{name:'화염 골렘 / Fire Golem',owner:'nec',animation:'골렘 근접 공격',aiDelay:15,frames:pairs([[0,16],[7,15],[14,14],[22,13],[31,12]])},
  spiritwolf:{name:'영혼 늑대 / Summon Spirit Wolf',owner:'dru',animation:'늑대 물어뜯기',aiDelay:15,frames:pairs([[0,18],[6,17],[12,16],[19,15],[27,14],[36,13]])},
  direwolf:{name:'광포한 늑대 / Summon Dire Wolf',owner:'dru',animation:'늑대 물어뜯기',aiDelay:15,frames:pairs([[0,18],[6,17],[12,16],[19,15],[27,14],[36,13]])},
  grizzly:{name:'회색곰 / Summon Grizzly',owner:'dru',animation:'곰 일반 공격',aiDelay:15,frames:pairs([[0,12],[9,11],[19,10],[31,9]]),variants:[['normal','일반 공격'],['smite','곰 강타 / Bear Smite']]},
  shadowwarrior:{name:'그림자 전사 / Shadow Warrior',owner:'ass',animation:'그림자 기본 공격',aiDelay:15,frames:pairs([[0,14],[6,13],[14,12],[24,11],[35,10],[49,9],[65,8]]),variants:[['normal','기본 공격'],['combo','연타 기술 · 추정']]},
  shadowmaster:{name:'그림자 달인 / Shadow Master',owner:'ass',animation:'그림자 기본 공격',aiDelay:15,frames:pairs([[0,14],[6,13],[14,12],[24,11],[35,10],[49,9],[65,8]]),variants:[['normal','기본 공격'],['combo','연타 기술 · 추정']]},
  raven:{name:'큰까마귀 / Raven',owner:'dru',animation:'특수 AI 공격',aiDelay:null,frames:[],note:'큰까마귀는 특수 공격 AI 및 타격 시퀀스가 있어 일반 공격 모션 프레임으로 환산할 수 없습니다.'},
  vines:{name:'덩굴 소환 / Vine',owner:'dru',animation:'특수 AI 공격',aiDelay:null,frames:[],note:'덩굴의 독/흡수 동작은 일반 근접 공격 프레임과 다릅니다.'},
  revive:{name:'부활 / Revive',owner:'nec',animation:'원본 몬스터에 따라 다름',aiDelay:null,frames:[],custom:true,note:'부활한 몬스터의 종류별 공격 모션·WSM·AI가 달라서, 직접 측정한 EIAS 0 기준 프레임이 필요합니다.'},
  goatman:{name:'염소인간 / Summon Goatman',owner:'war',animation:'A1 · 일반 공격',aiDelay:5,fpd:20,frames:[],note:'A1 기본 19F의 이론 애니메이션 계산입니다. 광분·가르기 시퀀스와 실제 타격 주기는 별도입니다.'},
  tainted:{name:'오염된 자 / Summon Tainted',owner:'war',animation:'A2 · 화염구 모션',aiDelay:15,fpd:10,frames:[],note:'A2 기본 9F의 이론 애니메이션 계산입니다. 실제 화염구 발사 주기는 AI·스킬 선택·대기에 따라 달라집니다.'},
  defiler:{name:'파멸자 / Summon Defiler',owner:'war',animation:'특수 몬스터 공격',aiDelay:null,frames:[],custom:true,note:'파멸자는 특수 공격·연결 AI가 있어 모션 원본 데이터를 직접 측정해야 합니다.'},
  bind:{name:'악마 속박 / Bind Demon',owner:'war',animation:'속박 대상 몬스터 공격',aiDelay:null,frames:[],custom:true,note:'속박 악마의 베이스는 몬스터 종류마다 다릅니다. 직접 측정한 기준 프레임 및 WSM을 입력하세요.'},
};
const grizzlySmite=pairs([[0,17],[4,16],[10,15],[18,14],[26,13],[36,12]]);
const shadowCombo=pairs([[0,17],[6,16],[14,15],[22,14],[31,13],[42,12],[55,11]]);
export const SUMMON_ATTACKS={
  ama:[['pet:valkyrie','소환 · 발키리 / Valkyrie']],
  nec:[['pet:skeleton','소환 · 해골 전사 / Raise Skeleton'],['pet:skelemage','소환 · 해골 마법학자 / Skeletal Mage'],['pet:clay','소환 · 점토 골렘 / Clay Golem'],['pet:blood','소환 · 피 골렘 / Blood Golem'],['pet:iron','소환 · 강철 골렘 / Iron Golem'],['pet:fire','소환 · 화염 골렘 / Fire Golem'],['pet:revive','소환 · 부활 / Revive']],
  dru:[['pet:raven','소환 · 큰까마귀 / Raven'],['pet:spiritwolf','소환 · 영혼 늑대 / Spirit Wolf'],['pet:direwolf','소환 · 광포한 늑대 / Dire Wolf'],['pet:grizzly','소환 · 회색곰 / Grizzly'],['pet:vines','소환 · 덩굴 / Vine']],
  ass:[['pet:shadowwarrior','소환 · 그림자 전사 / Shadow Warrior'],['pet:shadowmaster','소환 · 그림자 달인 / Shadow Master']],
  war:[['pet:goatman','소환 · 염소인간 / Goatman'],['pet:tainted','소환 · 오염된 자 / Tainted'],['pet:defiler','소환 · 파멸자 / Defiler'],['pet:bind','소환 · 악마 속박 / Bind Demon']]
};
export const isSummonAttack=attack=>typeof attack==='string'&&attack.startsWith('pet:')&&Object.hasOwn(PET_PROFILES,attack.slice(4));
export const petProfile=s=>PET_PROFILES[String(s.attack).slice(4)]||null;
export function petFrames(s){
 const p=petProfile(s);if(!p)return [];
 if(p===PET_PROFILES.grizzly&&s.petVariant==='smite')return grizzlySmite;
 if((p===PET_PROFILES.shadowwarrior||p===PET_PROFILES.shadowmaster)&&s.petVariant==='combo')return shadowCombo;
 return p.frames;
}
const level=(s,k)=>Math.max(0,Math.trunc(num(s[k])));
export function petBonuses(s){
 const p=petProfile(s);if(!p)return {total:0,entries:[],item:0,levelBonus:0};
 const lev=level(s,'petLevel');
 const dem=level(s,'petMastery');
 const own=(p===PET_PROFILES.goatman||p===PET_PROFILES.tainted)&&lev>0?Math.min(10+lev-1,25):0;
 const mastery=p.owner==='war'&&dem>0?Math.min(5+dem-1,25):0;
 const engorge=p.owner==='war'&&level(s,'petEngorge')>0?Math.min(15+level(s,'petEngorge')-1,35):0;
 const fan=level(s,'petFan')>0?diminishing(level(s,'petFan'),10,40):0;
 const how=level(s,'petHow')>0?Math.min(5+level(s,'petHow'),30):0;
 const rancor=level(s,'petRancor')>0?5+level(s,'petRancor')-1:0;
 const slow=-Math.min(99,Math.max(0,num(s.petSlow)));
 const other=num(s.petOther);
 const item=p.fpd?0:effectiveItemIAS(Math.max(0,num(s.petItemIAS)));
 const wsm=p.fpd?0:num(s.petWSM);
 const entries=[['소환 스킬 자체',own],['악마 숙련 / Demonic Mastery',mastery],['포식 / Engorge',engorge],['광신 오라 / Fanaticism',fan],['울버린의 심장 / Heart of Wolverine',how],['인장: 울분 / Sigil: Rancor',rancor],['감속',slow],['기타 소환수 스킬 공속',other]];
 const total=entries.reduce((x,e)=>x+e[1],0)+item-wsm;
 return {total,item,wsm,skillTotal:total-item+wsm,levelBonus:own,mastery,engorge,fan,how,rancor,entries:entries.filter(e=>e[1]!==0)};
}
const fpaApprox=(baseline,eias)=>{
 // Base measured FPA is used only if user supplies a custom monster cycle.
 const eff=Math.max(0.15,1+eias/100);
 return Math.max(1,Math.ceil((baseline+1)/eff)-1);
};
// Exact published breakpoints up to last source anchor; beyond that,
// a clearly labeled high-speed *extrapolation* down to a theoretical 1F.
export function petFpa(s,eias){
 const p=petProfile(s);
 if(p?.fpd){
   const speed=Math.max(1,Math.floor(256*(100+Math.max(-99,num(eias)))/100));
   return Math.max(1,Math.ceil(p.fpd*256/speed)-1);
 }
 const frames=petFrames(s);
 if(frames.length===0){
   const custom=num(s.petBaseFpa);
   return custom>0?fpaApprox(custom,eias):null;
 }
 const first=frames[0],last=frames[frames.length-1];
 if(eias<first.eias){
   const baseline=first.fpa;
   return fpaApprox(baseline,eias-first.eias);
 }
 if(eias<=last.eias){let current=first.fpa;for(const f of frames){if(eias>=f.eias)current=f.fpa;else break;}return current;}
 const factor=(last.fpa+1)*(100+last.eias)/100-.0001;
 return Math.max(1,Math.ceil(factor*100/(100+eias))-1);
}
export function petBreakpoints(s,{start=-85,end=3000}={}){
 if(petFpa(s,0)===null)return [];
 const result=[];let prev=null;
 for(let e=start;e<=end;e++){
   const f=petFpa(s,e);
   if(f!==prev){result.push({eias:e,fpa:f,aps:25/f,extrapolated: !!petProfile(s)?.fpd || e>Math.max(-85,petFrames(s).at(-1)?.eias??-85)});prev=f;}
   if(f===1)break;
 }
 return result;
}
export function calculatePet(s){
 const p=petProfile(s);if(!p)return null;
 const b=petBonuses(s);
 const cap=s.cap==='none'?null:Math.max(0,num(s.cap,500));
 const eias=cap===null?b.total:Math.min(cap,b.total);
 const fpa=petFpa(s,eias),rows=petBreakpoints(s);
 const current=rows.filter(r=>r.eias<=eias).at(-1)||null;
 const next=rows.find(r=>r.eias>eias)||null;
 const sourceMax=petFrames(s).at(-1)?.eias??null;
 const theoretical=sourceMax===null||eias>sourceMax;
 return {profile:p,bonuses:b,cap,eias,fpa,rows,current,next,theoretical,sourceMax};
}
// Equipment IAS needed for a target EIAS, assuming existing skill effects and WSM.
export function petRequiredItemIAS(s,target){
 const b=petBonuses(s);
 const needed=target-(b.total-b.item);
 if(needed<=0)return 0;
 if(needed>=120)return null;
 return Math.max(0,Math.ceil(120*needed/(120-needed)));
}

