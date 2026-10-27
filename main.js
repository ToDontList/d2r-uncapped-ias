import {isWereform,wereAttacks,SHAPE_SKILLS} from './wereforms.js?v=1.8.0';
import {CLASSES,WEAPONS,ATTACKS,DUAL_SKILLS,TYPES,whirlWeaponAllowed,whirlProfile,OLD_AUTO_WSM} from './data.js?v=1.8.2';
import {calculate,getBreakpoints,nearest,buffs,dualEnabled,capEias,requiredEquipmentIAS,accuracyTag,num,barbarianSwordGrip,getMotion,isWarlockSequence,warlockSequenceFrames} from './core.js?v=1.8.2';
import {SUMMON_ATTACKS,isSummonAttack,petProfile,petFrames,petBonuses,calculatePet,petRequiredItemIAS} from './summons.js?v=1.7.2';
for(const [classId,entries] of Object.entries(SUMMON_ATTACKS)){if(ATTACKS[classId])ATTACKS[classId].push(...entries.map(([id,label])=>[id,label,'summon']));}
const $=id=>document.getElementById(id);
const defaults={char:'ama',form:'human',attack:'normal',furyLevel:4,dual:false,swordGrip:'two',weaponMain:WEAPONS.find(w=>w.name.startsWith('재벌린'))?.id||'w0',weaponOff:WEAPONS.find(w=>w.name.startsWith('시미터'))?.id||'w0',wsmMain:null,wsmOff:null,iasGear:0,iasMain:0,iasOff:0,cap:'none',overrideFrames:0,fan:0,frenzy:0,bos:0,how:0,wolf:0,maul:0,purge:0,rancor:0,lethargy:0,freeze:0,decrepify:0,other:0,slow:0,cleave:0,mirrored:0,chilled:false,metamorphosis:false,petLevel:20,petMastery:0,petEngorge:0,petFan:0,petHow:0,petRancor:0,petOther:0,petSlow:0,petItemIAS:0,petWSM:0,petVariant:'normal',petBaseFpa:0,petAiDelay:0};
let s={...defaults},activeHand='main',last=null,watchInputs=false;
const packed=()=>JSON.stringify(s);
const padSign=n=>n>0?`+${n}`:String(n);
const fstr=n=>n===null?'—':Number.isInteger(n)?String(n):n.toFixed(1);
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function restore(){let fromUrl=null;try{fromUrl=new URL(location.href).searchParams.get('s');if(fromUrl)fromUrl=JSON.parse(decodeURIComponent(escape(atob(fromUrl))));}catch(e){fromUrl=null}let stored=null;try{stored=JSON.parse(localStorage.getItem('ias_reimagined_v1')||'null')}catch(e){}s={...defaults,...(fromUrl||stored||{})};if(!['human','wolf','bear'].includes(s.form))s.form='human';if(s.form==='human'&&SHAPE_SKILLS.has(s.attack))s.form=s.attack==='maul'?'bear':'wolf';if(!CLASSES.some(c=>c[0]===s.char))s.char='ama';if(!WEAPONS.some(w=>w.id===s.weaponMain))s.weaponMain=defaults.weaponMain;if(!WEAPONS.some(w=>w.id===s.weaponOff))s.weaponOff=defaults.weaponOff;
 // v1.5 data migration: a previous default WSM saved as a number is not an intentional
 // manual override. Reset it if the canonical base changed; preserve all other overrides.
 for(const hand of ['Main','Off']){
   const id=s['weapon'+hand],key='wsm'+hand,oldBase=OLD_AUTO_WSM[id];
   if(oldBase!==undefined&&s[key]!==null&&Number(s[key])===oldBase) s[key]=null;
 }
}
function persist(){try{localStorage.setItem('ias_reimagined_v1',packed())}catch(e){}}
function weaponFor(hand){const item=WEAPONS.find(w=>w.id===s[hand==='main'?'weaponMain':'weaponOff'])||WEAPONS[0];const wsm=hand==='main'?s.wsmMain:s.wsmOff;return {...item,wsm:wsm===null?item.wsm:num(wsm,item.wsm)};}
function refreshWeapons(hand){const main=hand==='main';const search=$(main?'searchMain':'searchOff').value.trim().toLowerCase(),select=$(main?'weaponMain':'weaponOff');const current=s[main?'weaponMain':'weaponOff'];const prevSearchResult=WEAPONS.find(w=>w.id===current);
 const allowed=(w)=>isWarlockSequence(s.attack)?warlockSequenceFrames(s,w)!==null:s.attack==='whirl'?whirlWeaponAllowed(w,s):s.attack==='dthrow'?w.group==='투척 무기'||w.group==='투창':s.attack==='dragonclaw'?w.type==='claw':s.attack==='strafe'?['bow','xbow'].includes(w.type):s.attack==='lf'?['oneThrust','throwing'].includes(w.type):true;
 const items=WEAPONS.filter(w=>allowed(w)&&(!search||w.name.toLowerCase().includes(search)||w.group.includes(search)));
 const groups=[...new Set(items.map(w=>w.group))];select.innerHTML='';for(const group of groups){const gp=document.createElement('optgroup');gp.label=group;for(const w of items.filter(w=>w.group===group)){const opt=document.createElement('option');opt.value=w.id;opt.textContent=`${w.name}    (WSM ${padSign(w.wsm)})`;gp.appendChild(opt)}select.appendChild(gp)}
 if(items.some(w=>w.id===current))select.value=current;else if(items.length){select.value=items[0].id;s[main?'weaponMain':'weaponOff']=items[0].id;s[main?'wsmMain':'wsmOff']=null;}
 if(!items.length){select.innerHTML='<option value="">검색 결과가 없습니다</option>';}
 if(prevSearchResult&&!items.some(w=>w.id===current)&&search){/* Input search updates selection to first match */}
 $(main?'wsmMain':'wsmOff').value=weaponFor(hand).wsm;
}
function refreshClass(){const cls=$('class');cls.innerHTML=CLASSES.map(([id,ko,en])=>`<option value="${id}">${ko} · ${en}</option>`).join('');cls.value=s.char;}
function refreshAttacks(){const select=$('attack');const base=ATTACKS[s.char]||ATTACKS.ama;const avail=isWereform(s.form)?[...wereAttacks(s.form),...base.filter(a=>isSummonAttack(a[0]))]:base.filter(a=>!SHAPE_SKILLS.has(a[0]));if(!avail.some(a=>a[0]===s.attack))s.attack=avail[0][0];select.innerHTML=avail.map(([id,ko])=>`<option value="${id}">${ko}</option>`).join('');select.value=s.attack;}
function sync(){watchInputs=false;refreshClass();$('form').value=s.form;refreshAttacks();$('furyLevel').value=s.furyLevel;$('dual').checked=!!s.dual;$('swordGrip').value=s.swordGrip==='one'?'one':'two';$('iasGear').value=s.iasGear;$('iasMain').value=s.iasMain;$('iasOff').value=s.iasOff;$('cap').value=s.cap;$('overrideFrames').value=s.overrideFrames;$('chilled').checked=!!s.chilled;$('metamorphosis').checked=s.metamorphosis===true;document.querySelectorAll('[data-field]').forEach(el=>el.value=s[el.dataset.field]??0);document.querySelectorAll('[data-pet-field]').forEach(el=>el.value=s[el.dataset.petField]??0);refreshWeapons('main');refreshWeapons('off');watchInputs=true;render();}
function setField(field,value,updateUI=false){s[field]=value;persist();if(updateUI)sync();else render();}
function frameText(f){return f===null?'미지원':`${fstr(f)}F`}
function writePlain(el,text){$(el).textContent=text}
// Display the calculated active IAS/debuff directly beneath each skill-level input.
const petBonusKeys={petLevel:'levelBonus',petMastery:'mastery',petEngorge:'engorge',petFan:'fan',petHow:'how',petRancor:'rancor'};
function setupBuffIndicators(){
 for(const key of Object.keys(petBonusKeys)){
  const input=document.querySelector(`[data-pet-field="${key}"]`);
  const foot=document.createElement('small');foot.className='skill-ias-output';
  foot.dataset.petBonusFor=key;foot.hidden=true;input.insertAdjacentElement('afterend',foot);
 }

 document.querySelectorAll('.buff-grid input[data-field]').forEach(input=>{
   const foot=document.createElement('small');foot.className='skill-ias-output';
   foot.dataset.bonusFor=input.dataset.field;foot.hidden=true;
   input.insertAdjacentElement('afterend',foot);
 });
}
function renderBuffIndicators(b){
 $('metamorphosisBonus').hidden=!b.values.metamorphosis;
 for(const output of document.querySelectorAll('[data-bonus-for]')){
   const id=output.dataset.bonusFor,level=Math.max(0,Math.trunc(num(s[id])));
   let value=b.values[id]??0,conditional=false,conditionText='변신 시 적용';
   if(id==='wolf'&&level>0&&s.form!=='wolf'){
     value=buffs({...s,form:'wolf'}).values.wolf;conditional=true;
   }else if(id==='maul'&&level>0&&s.form!=='bear'){
     value=buffs({...s,form:'bear'}).values.maul;conditional=true;
   }
   if(isWarlockSequence(id)&&level>0&&(s.attack!==id||s.form!=='human')){
     value=buffs({...s,attack:id,form:'human'}).values[id];conditional=true;conditionText='인간형에서 해당 공격 스킬 선택 시 적용';
   }
   output.hidden=level===0||value===0;
   if(!output.hidden){
     output.textContent=`${value>0?'+':''}${value}% SKILL IAS${conditional?' · '+conditionText:''}`;
     output.classList.toggle('conditional',conditional);
     output.classList.toggle('negative',value<0);
   }
 }
}
function renderBuffDetails(){const b=buffs(s),wrap=$('buffDetails');$('buffSum').textContent=padSign(b.total);
 wrap.replaceChildren();if(!b.entries.length){wrap.textContent='적용 중인 스킬 보너스 없음';return}
 for(const [name,val] of b.entries){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong');label.textContent=name;value.textContent=padSign(val);row.append(label,value);wrap.append(row)}
}
function renderTable(result){const hand=result.dual&&activeHand==='off'?'off':'main';const primary=weaponFor('main'),weapon=hand==='main'?primary:weaponFor('off');const handE=hand==='main'?result.mainE:result.offE;
 const effective=capEias(handE.raw,result.cap);const rows=getBreakpoints(s,weapon);const trbody=$('bpRows');trbody.replaceChildren();const current=nearest(rows,effective).current;
 if(rows.length===0){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='이 스킬은 정확한 애니메이션 시퀀스 자료가 없어 프레임표를 제공하지 않습니다.';tr.appendChild(td);trbody.appendChild(tr);return}
 for(const bp of rows){const tr=document.createElement('tr');const capExceeded=result.cap!==null&&bp.eias>result.cap;const isCurrent=current===bp;
 if(capExceeded)tr.classList.add('cap-row');if(isCurrent)tr.classList.add('current-row');if(isCurrent)tr.id='tableCurrent';
 const eq=requiredEquipmentIAS(s,primary,result.dual?weaponFor('off'):null,hand,bp.eias);const cells=[bp.sequence&&s.attack==='fury'?`${bp.sequence}F (평균 ${fstr(bp.fpa)}F)`:`${fstr(bp.fpa)}F`,padSign(bp.eias),eq===null?'스킬 공속 필요':`${eq.toLocaleString('ko-KR')}%`,bp.aps.toFixed(2),isCurrent?'● 현재':capExceeded?'상한 초과':bp.eias<effective?'달성':'미달'];
 for(let i=0;i<cells.length;i++){const td=document.createElement('td');td.textContent=cells[i];if(i===4){const span=document.createElement('span');span.className='table-label';span.textContent=cells[i];td.textContent='';td.appendChild(span)}tr.appendChild(td)}trbody.appendChild(tr);
 }
 // Preserve manual scrolling after future input edits; button tabs scroll current in view.
}
function renderPet(){
 const result=calculatePet(s),p=result.profile,b=result.bonuses;
 for(const output of document.querySelectorAll('[data-pet-bonus-for]')){
  const key=output.dataset.petBonusFor,value=b[petBonusKeys[key]]??0;
  output.hidden=num(s[key])<=0;
  output.textContent=`+${value}% SKILL IAS${key==='petLevel'&&value===0?' · 직접 공속 보너스 없음':''}`;
 }

 $('petName').textContent=p.name;
 for(const key of ['petItemIAS','petWSM'])document.querySelector(`[data-pet-field="${key}"]`).closest('label').hidden=!!p.fpd;
 $('petDemonFields').hidden=p.owner!=='war';$('petCustomBox').hidden=!p.custom;
 const variants=p.variants||[['normal',p.animation]];
 if($('petVariant').dataset.petId!==s.attack){
   $('petVariant').replaceChildren();
   for(const [value,label] of variants){const opt=document.createElement('option');opt.value=value;opt.textContent=label;$('petVariant').appendChild(opt);}
   $('petVariant').dataset.petId=s.attack;
 }
 if(!variants.some(v=>v[0]===s.petVariant))s.petVariant='normal';
 $('petVariant').value=s.petVariant;
 const aiActual=num(s.petAiDelay)>0?Math.trunc(num(s.petAiDelay)):p.aiDelay;
 const bonusParts=[];
 if(b.levelBonus)bonusParts.push(`소환 레벨 ${Math.max(0,s.petLevel)}: +${b.levelBonus}%`);
 if(b.mastery)bonusParts.push(`악마 숙련: +${b.mastery}%`);
 if(b.engorge)bonusParts.push(`포식: +${b.engorge}%`);
 if(b.rancor)bonusParts.push(`인장: 울분: +${b.rancor}%`);
 $('petOwnIAS').textContent=bonusParts.length?`소환 스킬 직접 공격속도 · ${bonusParts.join(' / ')}`:'소환 스킬 자체의 직접 공속 증가: +0%';
 $('petSources').textContent=`공격 모션: ${p.fpd?`${p.animation} · 기준 FPD ${p.fpd}, 정수 애니메이션 속도 이론식`:petFrames(s).length?`${p.animation} · 기존 공개 브레이크포인트 사용`:'해당 몬스터의 표준 공속 프레임 미확인'}. ${p.note||''} AI 행동 대기: ${aiActual===null?'몬스터마다 상이':`${aiActual}F${num(s.petAiDelay)>0?' (모드 수동 입력)':' (원본 참조값)'}`}. AI 행동 간격은 공격 모션 프레임과 다르며, AI 간격 단축 모드가 적용돼도 자동으로 타격 수를 산출하지 않습니다.`;
 $('petBuffTotal').textContent=padSign(b.skillTotal);
 const breakdown=$('petBuffDetails');breakdown.replaceChildren();
 const detailed=[...b.entries,['장비 IAS 점감값',b.item],['무기 WSM 보정',-b.wsm]];
 for(const [name,v] of detailed){const row=document.createElement('div');const label=document.createElement('span'),value=document.createElement('strong');label.textContent=name;value.textContent=padSign(v);row.append(label,value);breakdown.appendChild(row)}
 const measured=p.custom&&num(s.petBaseFpa)>0;
 const sourceLimit=result.sourceMax;
 const status=result.fpa===null?'기준 프레임 필요':measured?'수동 기준 · 추정값':p.fpd?'A1/A2 · 이론 계산':result.theoretical?'상한 해제 · 이론 외삽':'공개 프레임표';
 $('accuracy').textContent=status;
 $('accuracy').className='status'+(result.fpa===null?' warn':result.theoretical?' dim':'');
 $('accuracyDetail').textContent=`소환수 ${p.name}: ${status}. ${result.fpa===null?'몬스터 공격 모션의 기준 프레임을 알 수 없어 정확한 구간을 표시하지 않습니다.':p.fpd?'정수 애니메이션 속도를 반영한 이론값이며 게임 내 실제 발사·명중 주기는 미검증입니다.':result.theoretical?'공개 구간을 넘는 극단적 공속은 이론 외삽값이며 실제 모션·히트 체크·AI와 다를 수 있습니다.':'공개 소환수 공격 애니메이션 브레이크포인트를 참조했습니다.'}`;
 $('frameLabel').textContent='소환수 공격 애니메이션';
 $('currentFrame').textContent=result.fpa===null?'—':fstr(result.fpa);
 $('aps').textContent=result.fpa===null?'기본 공격 모션 확인 필요':`모션 약 ${(25/result.fpa).toFixed(2)}회/초 상당 · AI 지연 별도`;
 $('totalEias').textContent=padSign(b.total);
 $('nextBP').textContent=result.fpa===null?'—':result.next?`${fstr(result.next.fpa)}F · ${padSign(result.next.eias)} EIAS`:'이론상 최고 구간';
 $('handResults').hidden=true;
 $('bpIASHeader').textContent=p.fpd?'추가 필요 EIAS':'필요 소환수 장비 IAS';$('bpRateHeader').textContent='초당 모션(이론)';
 $('frameLabel').title='실제 초당 명중 횟수가 아니라 공격 모션의 길이입니다.';
 const message=[];
 if(p.fpd)message.push(`현재 상한 내 최저 모션: ${result.cap===null?1:calculatePet({...s,petLevel:0,petMastery:0,petEngorge:0,petFan:0,petHow:0,petRancor:0,petOther:result.cap,petSlow:0}).fpa}F. 1F 필요 EIAS: +${p.fpd===20?900:400}. 장비 IAS와 WSM은 이 두 소환수의 계산에 적용하지 않습니다.`);
 if(result.fpa===null)message.push('애니메이션 기준 프레임이 없어 결과를 표시하지 않습니다. 해당 몬스터의 실제 EIAS 0 기준 공격 프레임을 입력하면 이론 계산을 사용할 수 있습니다.');
 if(!p.fpd&&result.theoretical&&result.fpa!==null)message.push('현재 프레임은 원본 참조표의 마지막 공속 구간을 넘어서므로 상한 해제를 가정한 이론값입니다. 실제 타격/시전 속도와 다를 수 있습니다.');
 if(result.cap!==null&&b.total>result.cap)message.push(`설정한 총 EIAS 상한 +${result.cap}을 적용했습니다. 원래 EIAS는 ${padSign(b.total)}입니다.`);
 if(sourceLimit!==null)message.push(`공개 참조표의 마지막 확인 EIAS: ${padSign(sourceLimit)}. 이 이후 구간은 추정입니다.`);
 if(p.owner==='war')message.push('리이매진드 skills.txt: 염소인간·오염된 자는 소환 스킬 레벨에 따라 최대 +25%; 악마 숙련 최대 +25%; 파멸자·속박 악마는 악마 숙련만 직접 적용됩니다.');
 message.push('소환수 공속에는 시전자의 광분·폭발적인 속도·장비 IAS를 자동 합산하지 않습니다. 오라가 실제로 닿는 경우에만 오라 레벨을 입력하세요.');
 $('resultMessage').textContent=message.join(' ');
 const table=$('bpRows');table.replaceChildren();const current=result.current;
 if(!result.rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='기본 공격 프레임 데이터가 없어 표를 제공하지 않습니다. 알려진 기준값을 입력하면 표시됩니다.';tr.appendChild(td);table.appendChild(tr);return;}
 for(const bp of result.rows){const tr=document.createElement('tr');if(current===bp){tr.classList.add('current-row');tr.id='tableCurrent';}if(result.cap!==null&&bp.eias>result.cap)tr.classList.add('cap-row');
   const req=p.fpd?Math.max(0,bp.eias-b.total):petRequiredItemIAS(s,bp.eias);
   const state=bp===current?'● 현재':result.cap!==null&&bp.eias>result.cap?'상한 초과':bp.eias<=result.eias?'달성':bp.extrapolated?'미달 · 추정':'미달';
   const values=[`${fstr(bp.fpa)}F`,padSign(bp.eias),p.fpd?(result.cap!==null&&bp.eias>result.cap?'상한 초과':req?padSign(req):'충족'):req===null?'스킬 공속 필요':`${req.toLocaleString('ko-KR')}%`,bp.aps.toFixed(2),state];
   for(let i=0;i<values.length;i++){const td=document.createElement('td');td.textContent=values[i];if(i===4){const span=document.createElement('span');span.className='table-label';span.textContent=values[i];td.textContent='';td.appendChild(span)}tr.appendChild(td)}
   table.appendChild(tr);
 }
}
function render(){const petMode=isSummonAttack(s.attack);document.body.classList.toggle('pet-mode',petMode);$('petConfig').hidden=!petMode;$('furyLevelField').hidden=petMode||s.form!=='wolf'||s.attack!=='fury';$('wereHelp').hidden=petMode;if(petMode){renderPet();return;}$('bpIASHeader').textContent='필요 장비 IAS';$('bpRateHeader').textContent=s.attack==='whirl'?'초당 판정 주기(이론)':isWarlockSequence(s.attack)?'초당 사용(이론)':'초당 타격';const main=weaponFor('main'),off=weaponFor('off');const required=DUAL_SKILLS.has(s.attack);
 const whirlOptional=['bar','ass'].includes(s.char)&&s.attack==='whirl';
 const dualAvailable=!isWereform(s.form)&&((['bar','ass'].includes(s.char)&&s.attack==='normal')||whirlOptional);
 const dual=required||(dualAvailable&&s.dual);
 $('dual').disabled=required||!dualAvailable;$('dual').checked=required||s.dual&&dualAvailable;$('dualNotice').textContent=required?'이 스킬은 쌍수 필수':whirlOptional?(s.char==='ass'?'클러 한 개 / 클러 쌍수 선택 가능':'훨윈드는 한손/쌍수 모두 가능'):dualAvailable?'일반 공격에서 쌍수를 사용한다면 켜세요':'';
 $('offHandHelper').textContent=whirlOptional?'훨윈드는 두 무기의 속도를 각각 계산하고, 쌍수 판정 간격은 평균 후 올림한 추정값으로 표시합니다.':'쌍수 스킬은 양손 IAS를 각각 반영합니다.';
 $('offBox').hidden=!dual;$('offTab').hidden=!dual;if(!dual)activeHand='main';
 $('offTab').classList.toggle('active',activeHand==='off');document.querySelector('[data-hand="main"]').classList.toggle('active',activeHand==='main');
 $('weaponGrid').classList.toggle('two-weapons',dual);
 // A two-handed sword can be equipped by a Barbarian with one hand (shield)
 // even when the dual-weapon checkbox is OFF. The selector applies to normal
 // one-hit attacks; Frenzy/Double Swing and Whirlwind keep their own rules.
 const swordGripChoice=s.char==='bar'&&main.type==='twoSword'&&!dual
   &&(isWereform(s.form)||['normal','bash','stun','concentrate','berserk'].includes(s.attack));
 $('swordGripBox').hidden=!swordGripChoice;
 $('swordGrip').value=s.swordGrip==='one'?'one':'two';
 $('swordGripNote').textContent=num(s.overrideFrames)>0
   ?'고급 설정에서 수동 FPD를 지정했으므로 해당 값이 장착 방식보다 우선합니다.'
   :'같은 양손검 WSM을 유지하고 공격 모션만 1HS(16) / 2HS(18)로 바꿉니다.';
 const result=calculate(s,main,dual?off:null);last=result;const [label,detail,kind]=accuracyTag(s.attack,s.form);
 $('accuracy').textContent=label;$('accuracy').className='status'+(kind==='unavailable'?' warn':kind==='approx'?' dim':'');$('accuracyDetail').textContent=`${label}: ${detail}`;
 $('frameLabel').textContent=isWarlockSequence(s.attack)?'스킬 1회 사용 프레임':result.were&&s.attack==='fury'?'분노 연타 평균 프레임':s.attack==='whirl'?(result.whirlDual?'쌍수 훨윈드 예상 판정 간격':'훨윈드 예상 판정 간격'):'평균 공격 프레임';
 writePlain('currentFrame',fstr(result.avg));
 writePlain('aps',isWarlockSequence(s.attack)?(result.cycleRate===null?'지원하는 무기를 선택하세요':`초당 약 ${result.cycleRate.toFixed(2)}회 사용 · 이론값`):s.attack==='whirl'?(result.cycleRate===null?'지원하는 근접 무기를 선택하세요':`초당 약 ${result.cycleRate.toFixed(2)}회 판정 주기 · 실제 명중 횟수와 다름`):result.hitRate===null?'정확한 프레임 계산 불가':`초당 약 ${result.hitRate.toFixed(2)}타 · 25FPS 기준`);
 writePlain('totalEias',result.dual?`${padSign(result.mainE.raw)} / ${padSign(result.offE.raw)}`:padSign(result.mainE.raw));
 const mainRows=getBreakpoints(s,main),next=nearest(mainRows,capEias(result.mainE.raw,result.cap)).next;
 writePlain('nextBP',next?`${fstr(next.fpa)}F · ${padSign(next.eias)} EIAS`:'최고 구간');
 $('handResults').hidden=!result.dual;if(result.dual){writePlain('mainFrame',frameText(result.mainF));writePlain('offFrame',frameText(result.offF));writePlain('mainEias',`총 EIAS ${padSign(result.mainE.raw)}`);writePlain('offEias',`총 EIAS ${padSign(result.offE.raw)}`)}
 const messages=[];
 if(s.attack==='whirl'){const p=whirlProfile(s.char,main);if(p)messages.push(`직업별 기본 타격 프레임 ${num(s.overrideFrames)>0?s.overrideFrames:p.action}, 애니메이션 속도 ${p.speed} 기준입니다. 표는 지속 훨윈드의 판정 간격이며 시작 타격 시점·실제 명중 횟수는 포함하지 않습니다. 상한 해제 구간은 게임 실측 미검증입니다.${s.char==='ass'?' 클러 쌍수는 각 손의 무기 IAS·WSM을 독립 반영합니다.':''}`);}
 if(isWarlockSequence(s.attack))messages.push('레벨 공속은 선택한 공격 스킬에만 적용됩니다. 전용 시퀀스 속도 보정 −30을 합산하며, 보너스 상세 내역에서 확인할 수 있습니다. 프레임은 스킬 사용 주기입니다. 거울상 칼날의 복제 공격 수·명중 횟수는 별도입니다.');
 if(result.were){const w=result.were;messages.push(`${s.form==='wolf'?'늑대인간':'곰인간'} ${s.attack==='fury'?'분노 연타':w.bite?'물기 (S3)':'휘두르기 (A1)'}: 인간형 기본 ${w.humanFrames} FPD, 변신 모션 ${w.length} FPD.${s.attack==='fury'?` ${w.hits}연타: ${w.parts.join(' / ')}F · 한 사이클 ${w.cycle}F · 평균 ${fstr(w.fpa)}F.`:''} 주무기를 기준으로 계산합니다. 1F 표시는 이론상 최소 구간이며 실제 명중 횟수를 보증하지 않습니다.`);}

 if(result.cap!==null&&result.mainE.raw>result.cap)messages.push(`선택한 패치의 EIAS 상한 +${result.cap}에 도달했습니다. 주무기는 원래 EIAS ${padSign(result.mainE.raw)}지만 계산에는 +${result.cap}만 적용했어요.`);
 if(result.dual&&result.cap!==null&&result.offE.raw>result.cap)messages.push('보조무기에도 같은 상한을 적용했어요.');
 if(result.cap===null)messages.push('현재 “상한 없음”은 이론 시뮬레이션입니다. 실제 사용 중인 패치가 600이라면 상한 +500 옵션을 선택해야 합니다.');
 if(kind==='approx'||kind==='theory')messages.push('표시된 프레임은 특수 시퀀스의 이론값 또는 근사값이며 실제 판정 검증 전입니다.');
 if(kind==='unavailable')messages.push('임의로 프레임을 추정하지 않고 계산을 보류했습니다.');
 if(swordGripChoice){
   const mode=isWereform(s.form)?s.swordGrip:barbarianSwordGrip(s,main);
   messages.push(`바바리안 양손검 ${mode==='one'?'한손(1HS)':'양손(2HS)'} 사용: 기본 ${getMotion({...s,form:'human',dual:false,overrideFrames:0},main)} FPD를 적용했습니다. 무기 WSM 및 IAS는 그대로입니다.${num(s.overrideFrames)>0?' 단, 현재 수동 FPD가 우선 적용됩니다.':''}`);
 }
 if(s.char==='bar'&&dual&&s.form==='human'&&(main.type==='twoSword'||off.type==='twoSword')&&s.attack!=='whirl'){
   messages.push('바바리안이 양손검을 쌍수로 장착하면 기본 공격 모션은 자동으로 1HS(16 FPD)를 사용합니다. 광분의 공격 간격은 기존 별도 시퀀스 이론표로 계산합니다.');
 }
 if(s.char==='bar'&&s.attack==='whirl'&&main.type==='twoSword')messages.push('훨윈드는 양손검을 1HS 계열로 취급하는 별도 계산이므로 일반 공격용 장착 방식 선택의 영향을 받지 않습니다.');
 if(result.whirlDual)messages.push('훨윈드 쌍수: 각 무기의 WSM 및 IAS로 손별 추정 프레임을 구한 뒤 평균·올림했습니다. 아래 프레임표는 선택한 손의 개별 추정치로, 쌍수 공용 판정 간격표가 아닙니다. 1~2F 실제 타격 검사는 패치 실측이 필요합니다.');
 else if(result.dual)messages.push('쌍수의 손별 표시값은 무기 IAS를 나눠 계산한 추정치입니다. 실제 번갈아 공격하는 타격 시점은 다를 수 있습니다.');
 $('resultMessage').textContent=messages.join(' ');
 renderBuffIndicators(buffs(s));renderBuffDetails();renderTable(result);
}
function safeNumber(v,min=-9999,max=100000){return Math.min(max,Math.max(min,num(v)));}
function updateWeapon(hand,newId){if(!WEAPONS.some(w=>w.id===newId))return;const key=hand==='main'?'weaponMain':'weaponOff',wsm=hand==='main'?'wsmMain':'wsmOff';s[key]=newId;s[wsm]=null;$(hand==='main'?'wsmMain':'wsmOff').value=weaponFor(hand).wsm;persist();render();}
function setup(){setupBuffIndicators();restore();sync();$('class').addEventListener('change',e=>{s.char=e.target.value;s.attack='normal';s.dual=false;sync();persist()});$('attack').addEventListener('change',e=>{s.attack=e.target.value;s.dual=DUAL_SKILLS.has(s.attack);s.petVariant='normal';s.petBaseFpa=0;$('searchMain').value='';$('searchOff').value='';refreshWeapons('main');refreshWeapons('off');render();persist()});$('form').addEventListener('change',e=>{s.form=e.target.value;s.dual=false;sync();persist()});$('furyLevel').addEventListener('input',e=>setField('furyLevel',Math.trunc(safeNumber(e.target.value,1,200))));$('dual').addEventListener('change',e=>setField('dual',e.target.checked,true));$('swordGrip').addEventListener('change',e=>setField('swordGrip',e.target.value));$('cap').addEventListener('change',e=>setField('cap',e.target.value));$('metamorphosis').addEventListener('change',e=>setField('metamorphosis',e.target.checked));$('chilled').addEventListener('change',e=>setField('chilled',e.target.checked));$('petVariant').addEventListener('change',e=>setField('petVariant',e.target.value));
 for(const el of document.querySelectorAll('[data-pet-field]'))el.addEventListener('input',e=>setField(el.dataset.petField,safeNumber(e.target.value,el.dataset.petField==='petOther'?-3000:el.dataset.petField==='petWSM'?-100:0,el.dataset.petField==='petWSM'?100:100000)));
 for(const id of ['iasGear','iasMain','iasOff','overrideFrames'])$(id).addEventListener('input',e=>setField(id,safeNumber(e.target.value,0)));
 for(const el of document.querySelectorAll('[data-field]'))el.addEventListener('input',e=>setField(el.dataset.field,safeNumber(e.target.value,-1000,3000)));
 for(const hand of ['main','off']){
   const name=hand==='main'?'Main':'Off';
   $('search'+name).addEventListener('input',()=>{refreshWeapons(hand);persist();render()});
   $('weapon'+name).addEventListener('change',e=>updateWeapon(hand,e.target.value));
   $('wsm'+name).addEventListener('input',e=>setField(hand==='main'?'wsmMain':'wsmOff',safeNumber(e.target.value,-100,100)));
 }
 for(const btn of document.querySelectorAll('[data-hand]'))btn.addEventListener('click',()=>{activeHand=btn.dataset.hand;render();const c=$('tableCurrent');if(c)c.scrollIntoView({block:'nearest',behavior:'smooth'})});
 $('reset').addEventListener('click',()=>{s={...defaults};$('searchMain').value='';$('searchOff').value='';activeHand='main';sync();persist();toast('모든 설정을 초기화했어요')});
 $('copyLink').addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('s',btoa(unescape(encodeURIComponent(packed()))));try{await navigator.clipboard.writeText(url.toString());toast('현재 설정 링크를 복사했어요')}catch(e){prompt('링크를 복사하세요',url.toString())}});
 $('jumpCurrent').addEventListener('click',()=>{const row=$('tableCurrent');if(row){row.scrollIntoView({block:'center',behavior:'smooth'});toast('현재 EIAS 구간을 표시했어요')}else toast('현재 구간을 표시할 수 없습니다')});
 $('exportCSV').addEventListener('click',()=>{
  if(isSummonAttack(s.attack)){const result=calculatePet(s),csv=[`프레임,필요_총_EIAS,${result.profile.fpd?'추가_필요_EIAS':'필요_소환수_장비_IAS_퍼센트'},초당_애니메이션_이론,검증_상태`];for(const bp of result.rows){const req=result.profile.fpd?Math.max(0,bp.eias-result.bonuses.total):petRequiredItemIAS(s,bp.eias);csv.push(`${bp.fpa},${bp.eias},${req===null?'스킬공속필요':req},${bp.aps.toFixed(3)},${result.profile.fpd?'A1/A2이론계산':bp.extrapolated?'이론외삽':'기존참조표'}`)}const blob=new Blob(['\ufeff'+csv.join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='D2R_Reimagined_Summon_IAS_breakpoints.csv';document.body.appendChild(a);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);a.remove();toast('소환수 공속표 CSV 저장');return;}
  const weaponMain=weaponFor('main'),weaponOff=weaponFor('off');const hands=last?.dual?['main','off']:['main'];const csv=[['손','프레임','필요 총 EIAS','필요 장비 IAS(%)',s.attack==='whirl'?'초당 판정 주기(이론)':isWarlockSequence(s.attack)?'초당 스킬 사용 횟수(이론)':'초당 공격 횟수','상한 초과','변신 연타 구간(F)','사이클(F)'].join(',')];
  for(const hand of hands){const w=hand==='main'?weaponMain:weaponOff;for(const bp of getBreakpoints(s,w)){const req=requiredEquipmentIAS(s,weaponMain,last?.dual?weaponOff:null,hand,bp.eias);csv.push([hand==='main'?'주무기':'보조무기',bp.fpa,bp.eias,req??'스킬 공속 필요',bp.aps.toFixed(3),last?.cap!==null&&bp.eias>last.cap?'Y':'N',bp.sequence??'',bp.cycle??''].join(','))}}
  const blob=new Blob(['\ufeff'+csv.join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='D2R_Reimagined_IAS_breakpoints.csv';document.body.appendChild(a);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);a.remove();toast('프레임표 CSV를 저장했어요')
 });
}
setup();




