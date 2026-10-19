import {MOTION,DUAL_SKILLS,CONSTRAINED_SKILLS} from './data.js';

export const FRENZY_BPS=[
 [-85,100],[0,12.5],[2,12],[5,11.5],[8,11],[12,10.5],[16,10],[20,9.5],[25,9],
 [30,8.5],[37,8],[44,7.5],[52,7],[61,6.5],[72,6],[85,5.5],
 [101,5],[120,4.5],[143,4],[173,3.5],[214,3],[271,2.5],[355,2],[497,1.5],[780,1]
];
export const TICK_RATE=25;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const num=(n,defaultValue=0)=>Number.isFinite(Number(n))?Number(n):defaultValue;
export const effectiveItemIAS=x=>Math.floor(120*Math.max(0,x)/(120+Math.max(0,x)));
// For dmAB: parA + trunc((parB-parA) * trunc(110*level/(level+6))/100)
export function diminishing(lvl,low,high,min=0,max=Infinity){
  if(lvl<=0)return 0;
  const interpolated=low+Math.trunc((high-low)*Math.trunc(110*lvl/(lvl+6))/100);
  return clamp(interpolated,min,max);
}
export function buffs(s){
  const level=id=>Math.max(0,Math.trunc(num(s[id])));
  const fan=diminishing(level('fan'),10,40);
  const frenzy=diminishing(level('frenzy'),0,50);
  const bos=diminishing(level('bos'),15,60);
  const wolf=s.form==='wolf'?diminishing(level('wolf'),10,80):0;
  const maul=s.form==='bear'&&level('maul')>0?3*(Math.trunc(level('maul')/2)+3):0;
  // Derived from Reimagined 'Wolverine Aura': min(par9 + hard points - 1, 30), par9=6.
  const how=level('how')?Math.min(5+level('how'),30):0;
  const purge=level('purge')?-Math.min(10+level('purge')-1,30):0;
  const lethargy=level('lethargy')?-25:0; // Reimagined ln78 -> par7=-25, par8=0
  const rancor=level('rancor')?5+level('rancor')-1:0;
  const freeze=level('freeze')?-Math.min(50,diminishing(level('freeze'),25,60)):0;
  const decrepify=level('decrepify')?-50:0;
  const chill=s.chilled?-50:0;
  const slow=-clamp(num(s.slow),0,99);
  const own=num(s.other);
  const cleave=s.attack==='cleave'?diminishing(level('cleave'),10,30):0;
  const mirrored=s.attack==='mirrored'?diminishing(level('mirrored'),10,30):0;
  const entries=[['광신',fan],['광분 최대 중첩',frenzy],['폭발적인 속도',bos],['늑대인간',wolf],['후려치기',maul],['울버린의 심장 (직접 투자)',how],['정화의 저주',purge],['나태의 인장',lethargy],['원한의 인장',rancor],['신성한 빙결',freeze],['노화',decrepify],['냉기',chill],['기타 감속',slow],['기타 스킬 공속',own],['가르기',cleave],['거울 칼날',mirrored]];
  return {total:entries.reduce((x,[_k,v])=>x+v,0),entries:entries.filter(([_k,v])=>v!==0),how,fan,frenzy,bos};
}
export function dualEnabled(s){return DUAL_SKILLS.has(s.attack)||(s.dual&&['bar','ass'].includes(s.char)&&s.attack==='normal');}
export function getMotion(s,weapon){
  if(num(s.overrideFrames)>0)return num(s.overrideFrames);
  return MOTION[s.char]?.[weapon.type]||16;
}
function singleFPS(fpd,eias,form,skill){
  const accel=Math.max(1,Math.floor(256*(100+eias)/100));
  let frames=fpd;
  if(form==='wolf') frames=Math.ceil(fpd*0.9); // approximate; wereforms use distinct timing tables
  if(form==='bear') frames=Math.ceil(fpd*1.1);
  let f=Math.ceil(frames*256/accel)-1;
  if(skill==='throw')f+=1;
  if(skill==='jab')f=Math.ceil(f*0.82);
  if(skill==='strafe')f=Math.ceil(f*0.65);
  if(skill==='zeal')f=Math.ceil(f*0.75);
  if(skill==='fury')f=Math.ceil(f*0.7);
  if(skill==='fend')f=Math.ceil(f*0.7);
  if(skill==='dragontalon')f=Math.ceil(f*0.66);
  return Math.max(1,f);
}
export function frameFromEias(s,weapon,eias){
  if(CONSTRAINED_SKILLS.has(s.attack))return null;
  // Frenzy 17-frame two-hit sequence, 70 base animation rate: preserved theoretical table.
  if(s.attack==='frenzy'){
    let f=FRENZY_BPS[0][1];for(const [threshold,next] of FRENZY_BPS){if(eias>=threshold)f=next;else break;}return f;
  }
  if(s.attack==='whirl'){
    const base=weapon.type==='twoOther'||weapon.type==='twoThrust'?9:7;
    return Math.max(1,Math.floor(256*base/Math.max(1,Math.floor(256*(100+eias)/100))));
  }
  if(s.attack==='double'||s.attack==='dthrow'||s.attack==='dragonclaw'){
    return Math.max(1,Math.ceil(singleFPS(getMotion(s,weapon),eias,s.form,s.attack)*0.62*2)/2);
  }
  return singleFPS(getMotion(s,weapon),eias,s.form,s.attack);
}
export function handEias(s,main,off,hand){
  const dual=dualEnabled(s)&&!!off;
  const wsm=dual?Math.trunc((main.wsm+off.wsm)/2):(hand==='off'&&off?off.wsm:main.wsm);
  const primaryIAS=hand==='off'?num(s.iasOff):num(s.iasMain);
  const item=effectiveItemIAS(num(s.iasGear)+primaryIAS);
  const skill=buffs(s).total;
  return {item,skill,wsm,raw:skill+item-wsm};
}
export function capEias(e,cap){return cap===null?e:Math.min(e,cap);}
export function calculate(s,main,off){
  const cap=s.cap==='none'?null:Math.max(0,num(s.cap,500));
  const mainE=handEias(s,main,off,'main');
  const mainShown=capEias(mainE.raw,cap);
  const mainF=frameFromEias(s,main,mainShown);
  const dual=dualEnabled(s)&&!!off;
  let offE=null,offF=null;
  if(dual){offE=handEias(s,main,off,'off');offF=frameFromEias(s,off,capEias(offE.raw,cap));}
  const avg=mainF===null?null:dual?((mainF+offF)/2):mainF;
  return {cap,dual,mainE,offE,mainF,offF,avg,hitRate:avg?25/avg:null,mainUncapped:frameFromEias(s,main,mainE.raw),offUncapped:dual?frameFromEias(s,off,offE.raw):null};
}
// Every transition in theoretical total EIAS from -85..1300, including 1F.
export function getBreakpoints(s,weapon,{start=-85,end=3000}={}){
  if(CONSTRAINED_SKILLS.has(s.attack))return [];
  const rows=[];let prev=Infinity;
  for(let e=start;e<=end;e++){
    const f=frameFromEias(s,weapon,e);
    if(f!==prev){rows.push({eias:e,fpa:f,aps:25/f});prev=f;}
    if(f===1)break;
  }
  return rows;
}
export function nearest(rows,eias){
  let current=null,next=null;
  for(let i=0;i<rows.length;i++){
    if(rows[i].eias<=eias)current=rows[i];
    else if(!next){next=rows[i];break;}
  }
  return {current,next};
}
// Required *equipment* IAS with the current weapon-IAS retained for one hand.
export function requiredEquipmentIAS(s,main,off,hand,targetEias){
  const offhand=hand==='off';const weapon=offhand?off:main;
  const wsm=dualEnabled(s)&&off?Math.trunc((main.wsm+off.wsm)/2):weapon.wsm;
  const base=buffs(s).total-wsm;
  const req=Math.max(0,Math.ceil(targetEias-base));
  if(req>=120)return null;
  const total=req<=0?0:Math.ceil(120*req/(120-req));
  const weaponIAS=offhand?num(s.iasOff):num(s.iasMain);
  return Math.max(0,total-weaponIAS);
}
export const ACCURACY={
  reliable:new Set(['normal','throw','multi','guided','charged','lf','lightningstrike','enchant','poison','sacrifice','vengeance','conversion','bash','stun','concentrate','berserk','tiger','cobra','phoenix','feral','fireclaws','rabies','hunger']),
  theoretical:new Set(['frenzy','whirl']),
  estimated:new Set(['jab','fend','strafe','zeal','smite','fury','maul','dragontalon','double','dthrow','dragonclaw','fists','thunder','ice'])
};
export function accuracyTag(attack,form){
  if(CONSTRAINED_SKILLS.has(attack))return ['계산 미지원','고유 시퀀스 자료가 필요하므로 임의의 프레임을 표시하지 않음','unavailable'];
  if(form!=='human')return ['근사 계산','변신 애니메이션 및 롤백 처리는 후속 검증 필요','approx'];
  if(ACCURACY.theoretical.has(attack))return ['상한 해제 이론표','과거 대화에서 정리한 1F 확장 이론값이며 실제 타격 판정 미검증','theory'];
  if(ACCURACY.estimated.has(attack))return ['근사 계산','복합 스킬 시퀀스/롤백의 실제 판정 프레임과 다를 수 있음','approx'];
  return ['기본 모션 계산','클래스별 일반 모션을 기반으로 계산. 리이매진드 애니메이션 플러그인 사용 시 차이 가능','base'];
}
