/* D2R Reimagined uncapped IAS calculator — curated weapon/animation dataset.
   Skill IAS params checked against Reimagined skills.txt (October 2026).
   The attack-animation table follows public D2R/Warren motion references; accuracy varies
   by mod/plugin and hardcoded skill sequences. See README for scope. */
export const CLASSES = [
  ['ama','아마존','Amazon'],['sor','원소술사','Sorceress'],['nec','강령술사','Necromancer'],
  ['pal','성기사','Paladin'],['bar','야만용사','Barbarian'],['dru','드루이드','Druid'],
  ['ass','암살자','Assassin'],['war','악마술사','Warlock']
];
// Animation frames per direction for common attacks; not a replacement for all sequence data.
export const MOTION = {
  ama:{bare:13,oneSwing:16,oneThrust:15,twoSword:20,twoThrust:18,twoOther:20,bow:14,xbow:20,throwing:16,claw:16},
  sor:{bare:16,oneSwing:20,oneThrust:19,twoSword:24,twoThrust:23,twoOther:18,bow:17,xbow:20,throwing:20,claw:20},
  nec:{bare:15,oneSwing:19,oneThrust:19,twoSword:23,twoThrust:24,twoOther:20,bow:18,xbow:20,throwing:20,claw:19},
  pal:{bare:14,oneSwing:15,oneThrust:17,twoSword:18,twoThrust:20,twoOther:18,bow:16,xbow:20,throwing:16,claw:15},
  bar:{bare:12,oneSwing:16,oneThrust:16,twoSword:18,twoThrust:19,twoOther:19,bow:15,xbow:20,throwing:16,claw:16},
  dru:{bare:16,oneSwing:19,oneThrust:19,twoSword:21,twoThrust:23,twoOther:17,bow:16,xbow:20,throwing:18,claw:19},
  ass:{bare:11,oneSwing:15,oneThrust:15,twoSword:23,twoThrust:23,twoOther:19,bow:16,xbow:21,throwing:16,claw:11},
  war:{bare:16,oneSwing:16,oneThrust:16,twoSword:19,twoThrust:21,twoOther:17,bow:17,xbow:18,throwing:20,claw:16}
};
export const TYPES = {bare:'맨손',oneSwing:'한손 휘두르기',oneThrust:'한손 찌르기',twoSword:'양손 검',twoThrust:'양손 창',twoOther:'양손 기타',bow:'활',xbow:'쇠뇌',throwing:'투척',claw:'클러'};
// [name, WSM, motion, category]. Standard base entries, with mod-specific custom WSM override.
const base = [
['맨손',0,'bare','기타'],
['시미터 / Scimitar',-20,'oneSwing','검'],['세이버 / Sabre',-10,'oneSwing','검'],['펄션 / Falchion',20,'oneSwing','검'],['크리스탈 소드',0,'oneSwing','검'],['브로드 소드',0,'oneSwing','검'],['롱 소드',-10,'oneSwing','검'],['워 소드',0,'oneSwing','검'],['플람베르주',-10,'twoSword','검'],['투핸디드 소드',0,'twoSword','검'],['그레이트 소드',10,'twoSword','검'],['즈바이핸더',-10,'twoSword','검'],['콜로서스 블레이드',5,'twoSword','검'],['발록 블레이드',0,'twoSword','검'],['챔피언 소드',-10,'twoSword','검'],['콜로서스 소드',10,'twoSword','검'],['페이즈 블레이드',-30,'oneSwing','검'],['디멘셔널 블레이드',0,'oneSwing','검'],['배틀 소드',0,'oneSwing','검'],['룬 소드',-10,'oneSwing','검'],['컨퀘스트 소드',0,'oneSwing','검'],['크립틱 소드',-10,'oneSwing','검'],['미시컬 소드',0,'oneSwing','검'],['엘리건트 블레이드',-10,'twoSword','검'],['하이랜드 블레이드',-5,'twoSword','검'],['레전드 소드',-15,'twoSword','검'],
['핸드 액스',0,'oneSwing','도끼'],['액스',10,'oneSwing','도끼'],['더블 액스',10,'oneSwing','도끼'],['밀리터리 픽',-10,'oneSwing','도끼'],['워 액스',0,'oneSwing','도끼'],['나가',0,'oneSwing','도끼'],['버서커 액스',0,'oneSwing','도끼'],['에틴 액스',10,'oneSwing','도끼'],['스몰 크레센트',10,'oneSwing','도끼'],['토마호크',0,'oneSwing','도끼'],['클리버',10,'oneSwing','도끼'],['배틀 액스',10,'twoOther','도끼'],['그레이트 액스',-10,'twoOther','도끼'],['자이언트 액스',10,'twoOther','도끼'],['디캐피테이터',10,'twoOther','도끼'],['글로리어스 액스',10,'twoOther','도끼'],['페럴 액스',-15,'twoOther','도끼'],['챔피언 액스',-10,'twoOther','도끼'],
['대거',-20,'oneThrust','단검'],['더크',0,'oneThrust','단검'],['크리스',-20,'oneThrust','단검'],['블레이드',-10,'oneThrust','단검'],['본 나이프',-20,'oneThrust','단검'],['팽드 나이프',-20,'oneThrust','단검'],
['클럽',-10,'oneSwing','둔기'],['스파이크 클럽',0,'oneSwing','둔기'],['메이스',0,'oneSwing','둔기'],['모닝 스타',10,'oneSwing','둔기'],['프레일',-10,'oneSwing','둔기'],['나우트',-10,'oneSwing','둔기'],['스커지',-10,'oneSwing','둔기'],['워 해머',20,'oneSwing','둔기'],['레전더리 말렛',20,'oneSwing','둔기'],['셉터',0,'oneSwing','둔기'],['카두세우스',-10,'oneSwing','둔기'],
['스태프',0,'twoOther','지팡이'],['롱 스태프',0,'twoOther','지팡이'],['배틀 스태프',0,'twoOther','지팡이'],['워 스태프',20,'twoOther','지팡이'],['아콘 스태프',10,'twoOther','지팡이'],['쿼터스태프',0,'twoOther','지팡이'],
['숏 스피어',10,'oneThrust','투창'],['재벌린',-10,'oneThrust','투창'],['필럼',20,'oneThrust','투창'],['글레이브',20,'oneThrust','투창'],['워 재벌린',-10,'oneThrust','투창'],['메이트리어컬 재벌린',-10,'oneThrust','투창'],['세레모니얼 재벌린',-10,'oneThrust','투창'],['발록 스피어',10,'oneThrust','투창'],
['스피어',-10,'twoThrust','창'],['트라이던트',0,'twoThrust','창'],['브랜디스탁',-20,'twoThrust','창'],['스페텀',0,'twoThrust','창'],['파이크',20,'twoThrust','창'],['워 스피어',-10,'twoThrust','창'],['맨캐처',-20,'twoThrust','창'],['고스트 스피어',0,'twoThrust','창'],['워 파이크',20,'twoThrust','창'],
['바디쉬',10,'twoOther','미늘창'],['불즈',10,'twoOther','미늘창'],['폴액스',10,'twoOther','미늘창'],['핼버드',0,'twoOther','미늘창'],['워 사이드',-10,'twoOther','미늘창'],['쓰레셔',-10,'twoOther','미늘창'],['자이언트 쓰레셔',-10,'twoOther','미늘창'],['그레이트 폴액스',0,'twoOther','미늘창'],['크립틱 액스',10,'twoOther','미늘창'],['콜로서스 불즈',10,'twoOther','미늘창'],
['숏 보우',5,'bow','활'],['헌터 보우',-10,'bow','활'],['롱 보우',0,'bow','활'],['컴포지트 보우',-10,'bow','활'],['숏 배틀 보우',0,'bow','활'],['롱 배틀 보우',10,'bow','활'],['숏 워 보우',0,'bow','활'],['롱 워 보우',10,'bow','활'],['블레이드 보우',-10,'bow','활'],['그레이트 보우',-10,'bow','활'],['쉐도우 보우',0,'bow','활'],['다이아몬드 보우',0,'bow','활'],['워드 보우',0,'bow','활'],['하이드라 보우',10,'bow','활'],['메이트리어컬 보우',-10,'bow','활'],['그랜드 메이트런 보우',10,'bow','활'],
['라이트 크로스보우',-10,'xbow','쇠뇌'],['크로스보우',0,'xbow','쇠뇌'],['헤비 크로스보우',10,'xbow','쇠뇌'],['리피팅 크로스보우',-40,'xbow','쇠뇌'],['초코누',-60,'xbow','쇠뇌'],['데몬 크로스보우',-60,'xbow','쇠뇌'],['발리스타',10,'xbow','쇠뇌'],['콜로서스 크로스보우',10,'xbow','쇠뇌'],
['클러',-10,'claw','클러'],['카타르',-10,'claw','클러'],['리스트 블레이드',0,'claw','클러'],['해칫 핸즈',10,'claw','클러'],['세스터스',0,'claw','클러'],['수웨이야',0,'claw','클러'],['루닉 탈론',-30,'claw','클러'],['페럴 클러',-20,'claw','클러'],['그레이터 탈론',-30,'claw','클러'],['배틀 세스터스',-10,'claw','클러'],
['밸런스드 나이프',-20,'throwing','투척 무기'],['밸런스드 액스',-10,'throwing','투척 무기'],['워 다트',0,'throwing','투척 무기'],['플라잉 액스',10,'throwing','투척 무기'],['윙드 나이프',-20,'throwing','투척 무기'],['고스트 글레이브',20,'throwing','투척 무기']
];
export const WEAPONS=base.map(([name,wsm,type,group],i)=>({id:`w${i}`,name,wsm,type,group}));
export const ATTACKS={
  ama:[['normal','일반 공격','normal'],['throw','투척','throw'],['jab','잽 / Jab','jab'],['impale','꿰뚫기 / Impale','special'],['fend','난격 / Fend','rollback'],['strafe','속사 / Strafe','rollback'],['multi','다발 사격 / Multiple Shot','normal'],['guided','유도 화살 / Guided Arrow','normal'],['charged','전류의 일격 / Charged Strike','normal'],['lf','번개의 격노 / Lightning Fury','throw'],['lightningstrike','번개의 일격 / Lightning Strike','normal']],
  sor:[['normal','일반 공격','normal'],['enchant','마법부여 적용 기본 공격','normal']],
  nec:[['normal','일반 공격','normal'],['poison','맹독 단검 / Poison Dagger','normal']],
  pal:[['normal','일반 공격','normal'],['zeal','열의 / Zeal','rollback'],['smite','강타 / Smite','normal'],['sacrifice','희생 / Sacrifice','normal'],['vengeance','복수 / Vengeance','normal'],['conversion','전향 / Conversion','normal'],['charge','돌진 / Charge','special']],
  bar:[['normal','일반 공격','normal'],['frenzy','광분 / Frenzy','frenzy'],['double','이중 타격 / Double Swing','frenzy'],['dthrow','이중 투척 / Double Throw','frenzy'],['whirl','훨윈드 / Whirlwind','whirl'],['bash','강격 / Bash','normal'],['stun','기절 / Stun','normal'],['concentrate','집중 / Concentrate','normal'],['berserk','광폭화 / Berserk','normal']],
  dru:[['normal','일반 공격','normal'],['fury','분노 / Fury','rollback'],['feral','야성의 분노 / Feral Rage','normal'],['fireclaws','화염 발톱 / Fire Claws','normal'],['rabies','광견병 / Rabies','normal'],['hunger','굶주림 / Hunger','normal'],['maul','후려치기 / Maul','normal']],
  ass:[['normal','일반 공격','normal'],['dragonclaw','용의 손톱 / Dragon Claw','frenzy'],['dragontalon','용의 발톱 / Dragon Talon','rollback'],['tiger','호랑이 일격 / Tiger Strike','normal'],['cobra','코브라 일격 / Cobra Strike','normal'],['phoenix','불사조 일격 / Phoenix Strike','normal'],['fists','화염의 주먹 / Fists of Fire','frenzy'],['thunder','천둥의 손톱 / Claws of Thunder','frenzy'],['ice','얼음의 칼날 / Blades of Ice','frenzy'],['traps','덫 설치 / Laying Traps','special']],
  war:[['normal','일반 공격','normal'],['cleave','가르기 / Cleave','special'],['mirrored','거울 칼날 / Mirrored Blades','special']]
};
export const DUAL_SKILLS=new Set(['frenzy','double','dthrow','dragonclaw']);
// Whirlwind: optional dual wield, unlike forced two-weapon Frenzy.
// Includes two-handed swords that the Barbarian can equip one per hand.
export const WHIRL_DUAL_TYPES=new Set(['oneSwing','oneThrust','twoSword','throwing']);
export const whirlDualWeaponAllowed=weapon=>WHIRL_DUAL_TYPES.has(weapon.type);
export const CONSTRAINED_SKILLS=new Set(['impale','charge','cleave','mirrored','traps']);
