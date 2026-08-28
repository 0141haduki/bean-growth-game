"use strict";

const STORAGE_KEY="beanGrowthGame_v1",APP_VERSION="4.79",MILESTONES=(window.BEAN_MILESTONES||[]).slice().sort((a,b)=>a.height-b.height);
const HABITS={
noMasturbation:{id:"noMasturbation",name:"オナ禁",englishName:"NO MASTURBATION",icon:"🌱",description:"自慰をしない"},
noAlcohol:{id:"noAlcohol",name:"禁酒",englishName:"NO ALCOHOL",icon:"🍺",description:"飲酒をしない"},
noSmoking:{id:"noSmoking",name:"禁煙",englishName:"NO SMOKING",icon:"🚭",description:"喫煙をしない"},
noGambling:{id:"noGambling",name:"ギャンブル禁",englishName:"NO GAMBLING",icon:"🎰",description:"賭け事をしない"},
noSNS:{id:"noSNS",name:"SNS禁",englishName:"NO SNS",icon:"💬",description:"SNSを使わない・決めた制限を守る"},
noShortVideos:{id:"noShortVideos",name:"ショート動画禁",englishName:"NO SHORT VIDEOS",icon:"🎞️",description:"Shorts・TikTok・Reels等を見ない"},
noGaming:{id:"noGaming",name:"ゲーム禁",englishName:"NO GAMING",icon:"🎮",description:"娯楽目的のゲームをしない"},
noImpulseBuying:{id:"noImpulseBuying",name:"衝動買い禁",englishName:"NO IMPULSE BUYING",icon:"🛒",description:"予定外・衝動的な買い物をしない"},
noSnacking:{id:"noSnacking",name:"娯楽動画禁",englishName:"NO ENTERTAINMENT VIDEOS",icon:"📺",description:"娯楽目的の長尺動画・配信・動画サイト視聴をしない"},
noCaffeine:{id:"noCaffeine",name:"カフェイン禁",englishName:"NO CAFFEINE",icon:"☕",description:"カフェイン飲料・食品を摂らない"},
noAdultContent:{id:"noAdultContent",name:"成人向けコンテンツ禁",englishName:"NO ADULT CONTENT",icon:"🔞",description:"成人向けの画像・動画・サイトを意図的に見ない"},
noJunkFood:{id:"noJunkFood",name:"ジャンクフード禁",englishName:"NO JUNK FOOD",icon:"🍔",description:"自分で決めたジャンクフードを食べない"}
};
const MOON_HEIGHT=384400000,WEEKEND_BONUS=5,GUERRILLA_SWITCH_HEIGHT=400;

const SEVERITY_LEVELS=["LIGHT","NORMAL","HEAVY"];

function nextMonthStartKey(baseDate=new Date()){
  const d=new Date(baseDate.getFullYear(),baseDate.getMonth()+1,1,12,0,0);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
}
function severityOf(id,dataRef=null){
  const data=dataRef||(typeof appData!=="undefined"?appData:null);
  const level=data?.settings?.habitSeverity?.[id];
  return SEVERITY_LEVELS.includes(level)?level:"NORMAL";
}
function severityLabel(id,dataRef=null){return severityOf(id,dataRef)}
function severityReservation(id,dataRef=null){
  const data=dataRef||(typeof appData!=="undefined"?appData:null);
  const r=data?.settings?.severityReservations?.[id];
  return r&&SEVERITY_LEVELS.includes(r.level)&&r.effectiveFrom?r:null;
}
function applyDueSeverityReservations(data){
  if(!data?.settings)return;
  if(!data.settings.habitSeverity)data.settings.habitSeverity={};
  if(!data.settings.severityReservations)data.settings.severityReservations={};
  if(!data.settings.rewardEditUnlockedDates||typeof data.settings.rewardEditUnlockedDates!=="object")data.settings.rewardEditUnlockedDates={};
  const today=todayKey();
  Object.keys(HABITS).forEach(id=>{
    const r=severityReservation(id,data);
    if(r&&r.effectiveFrom<=today){
      data.settings.habitSeverity[id]=r.level;
      delete data.settings.severityReservations[id];
    }
    if(!SEVERITY_LEVELS.includes(data.settings.habitSeverity[id]))data.settings.habitSeverity[id]="NORMAL";
  });
}
function reserveSeverity(id,level){
  if(!HABITS[id]||!SEVERITY_LEVELS.includes(level))return;
  if(!appData.settings.habitSeverity)appData.settings.habitSeverity={};
  if(!appData.settings.severityReservations)appData.settings.severityReservations={};
  const current=severityOf(id);
  if(level===current){
    if(appData.settings.severityReservations[id]){
      delete appData.settings.severityReservations[id];
      saveData();renderSettings();toast(`${HABITS[id].name}の深刻度変更予約を取り消しました。`);
    }else{
      toast(`${HABITS[id].name}は現在${current}です。`);
    }
    return;
  }
  const effectiveFrom=nextMonthStartKey();
  appData.settings.severityReservations[id]={level,effectiveFrom};
  saveData();renderSettings();
  const [y,m,d]=effectiveFrom.split("-");
  toast(`${HABITS[id].name}：${level}への変更を${Number(m)}月${Number(d)}日から予約しました。`);
}
const GUERRILLA_EVENTS={
wind:{type:"wind",icon:"🌿",title:"成長の風",multiplier:1.1,rate:.20,guarantee:10,rarity:"common",rateLabel:"20%"},
storm:{type:"storm",icon:"⚡",title:"成長の嵐",multiplier:1.15,rate:.048,guarantee:20,rarity:"rare",rateLabel:"SECRET"},
miracle:{type:"miracle",icon:"🌠",title:"天豆の奇跡",multiplier:1.3,rate:.002,guarantee:120,rarity:"legendary",rateLabel:"SECRET"}
};
const TITLE_RARITY={common:"COMMON",rare:"RARE",epic:"EPIC",legendary:"LEGENDARY"};
const TITLE_MODIFIERS=[
{id:"beginning",text:"はじまりの",icon:"🌱",rarity:"common",condition:"いずれかの禁欲で初成功",test:d=>d.totalSuccess>=1},
{id:"three_days",text:"三日を越えた",icon:"🌿",rarity:"common",condition:"いずれかの禁欲で最高3日連続",test:d=>maxStreakValue(d)>=3},
{id:"five_days",text:"五日を守った",icon:"🌿",rarity:"common",condition:"いずれかの禁欲で最高5日連続",test:d=>maxStreakValue(d)>=5},
{id:"willful",text:"意志ある",icon:"🔥",rarity:"rare",condition:"いずれかの禁欲で最高7日連続",test:d=>maxStreakValue(d)>=7},
{id:"two_weeks",text:"二週を貫いた",icon:"🗓️",rarity:"rare",condition:"いずれかの禁欲で最高14日連続",test:d=>maxStreakValue(d)>=14},
{id:"three_weeks",text:"三週を耐えた",icon:"🗓️",rarity:"rare",condition:"いずれかの禁欲で最高21日連続",test:d=>maxStreakValue(d)>=21},
{id:"strong_willed",text:"意志が強い",icon:"🛡️",rarity:"rare",condition:"いずれかの禁欲で最高30日連続",test:d=>maxStreakValue(d)>=30},
{id:"sixty_days",text:"六十日を積んだ",icon:"🛡️",rarity:"epic",condition:"いずれかの禁欲で最高60日連続",test:d=>maxStreakValue(d)>=60},
{id:"unyielding",text:"不屈の",icon:"⚔️",rarity:"epic",condition:"いずれかの禁欲で最高100日連続",test:d=>maxStreakValue(d)>=100},
{id:"half_year",text:"半年を越えた",icon:"🏅",rarity:"legendary",condition:"いずれかの禁欲で最高180日連続",test:d=>maxStreakValue(d)>=180},
{id:"year_streak",text:"一年を貫いた",icon:"👑",rarity:"legendary",condition:"いずれかの禁欲で最高365日連続",test:d=>maxStreakValue(d)>=365},
{id:"fifty_days",text:"五十の成功を刻んだ",icon:"🏅",rarity:"rare",condition:"いずれかの禁欲で累計成功50日",test:d=>d.totalSuccess>=50},
{id:"hundred_days",text:"百日を積み重ねた",icon:"💯",rarity:"epic",condition:"いずれかの禁欲で累計成功100日",test:d=>d.totalSuccess>=100},
{id:"two_hundred_days",text:"二百日を積んだ",icon:"💯",rarity:"epic",condition:"いずれかの禁欲で累計成功200日",test:d=>d.totalSuccess>=200},
{id:"iron_will",text:"鉄の意志を持つ",icon:"🧱",rarity:"legendary",condition:"いずれかの禁欲で累計成功365日",test:d=>d.totalSuccess>=365},
{id:"tower_breaker",text:"塔を越えた",icon:"🗼",rarity:"rare",condition:"いずれかの禁欲で最高高度333m",test:d=>maxHeightValue(d)>=333},
{id:"skytree_breaker",text:"天空塔を越えた",icon:"📡",rarity:"rare",condition:"いずれかの禁欲で最高高度634m",test:d=>maxHeightValue(d)>=634},
{id:"sky_chaser",text:"天空へ挑む",icon:"☁️",rarity:"rare",condition:"いずれかの禁欲で最高高度1km",test:d=>maxHeightValue(d)>=1000},
{id:"mountain_breaker",text:"山を越えた",icon:"🗻",rarity:"epic",condition:"いずれかの禁欲で最高高度3,776m",test:d=>maxHeightValue(d)>=3776},
{id:"summit_breaker",text:"地球最高峰を越えた",icon:"🏔️",rarity:"epic",condition:"いずれかの禁欲で最高高度8,849m",test:d=>maxHeightValue(d)>=8849},
{id:"stratosphere",text:"成層圏へ迫る",icon:"🌤️",rarity:"epic",condition:"いずれかの禁欲で最高高度20km",test:d=>maxHeightValue(d)>=20000},
{id:"space_reacher",text:"宇宙へ伸びる",icon:"🚀",rarity:"legendary",condition:"いずれかの禁欲で最高高度100km",test:d=>maxHeightValue(d)>=100000},
{id:"orbit_piercer",text:"軌道を貫く",icon:"🛰️",rarity:"legendary",condition:"いずれかの禁欲で最高高度400km",test:d=>maxHeightValue(d)>=400000},
{id:"moon_chosen",text:"月に選ばれし",icon:"🌕",rarity:"legendary",condition:"いずれかの禁欲で月へ到達",test:d=>maxHeightValue(d)>=MOON_HEIGHT},
{id:"wind_1",text:"風に触れた",icon:"🌿",rarity:"common",condition:"成長の風に1回遭遇",globalTest:()=>eventEncounterCount("wind")>=1},
{id:"wind_10",text:"風を知る",icon:"🌿",rarity:"rare",condition:"成長の風に10回遭遇",globalTest:()=>eventEncounterCount("wind")>=10},
{id:"wind_30",text:"風と歩む",icon:"🍃",rarity:"rare",condition:"成長の風に30回遭遇",globalTest:()=>eventEncounterCount("wind")>=30},
{id:"wind_100",text:"風を味方につける",icon:"🍃",rarity:"epic",condition:"成長の風に100回遭遇",globalTest:()=>eventEncounterCount("wind")>=100},
{id:"wind_300",text:"風を従える",icon:"🌪️",rarity:"legendary",condition:"成長の風に300回遭遇",globalTest:()=>eventEncounterCount("wind")>=300},
{id:"storm_1",text:"嵐に遭った",icon:"⚡",rarity:"common",condition:"成長の嵐に1回遭遇",globalTest:()=>eventEncounterCount("storm")>=1},
{id:"storm_5",text:"嵐を越えた",icon:"⚡",rarity:"rare",condition:"成長の嵐に5回遭遇",globalTest:()=>eventEncounterCount("storm")>=5},
{id:"storm_20",text:"嵐と歩む",icon:"⛈️",rarity:"rare",condition:"成長の嵐に20回遭遇",globalTest:()=>eventEncounterCount("storm")>=20},
{id:"storm_50",text:"嵐を味方につける",icon:"⛈️",rarity:"epic",condition:"成長の嵐に50回遭遇",globalTest:()=>eventEncounterCount("storm")>=50},
{id:"storm_100",text:"嵐を従える",icon:"🌩️",rarity:"legendary",condition:"成長の嵐に100回遭遇",globalTest:()=>eventEncounterCount("storm")>=100},
{id:"miracle_1",text:"奇跡を目撃した",icon:"🌠",rarity:"rare",condition:"天豆の奇跡に1回遭遇",globalTest:()=>eventEncounterCount("miracle")>=1},
{id:"miracle_3",text:"奇跡に愛された",icon:"🌠",rarity:"epic",condition:"天豆の奇跡に3回遭遇",globalTest:()=>eventEncounterCount("miracle")>=3},
{id:"miracle_5",text:"星運を宿す",icon:"✨",rarity:"legendary",condition:"天豆の奇跡に5回遭遇",globalTest:()=>eventEncounterCount("miracle")>=5},
{id:"miracle_10",text:"奇跡を従える",icon:"🌌",rarity:"legendary",condition:"天豆の奇跡に10回遭遇",globalTest:()=>eventEncounterCount("miracle")>=10},
{id:"reborn",text:"再び立ち上がった",icon:"🔄",rarity:"rare",condition:"3連続失敗で0mになった後に再び成功",test:d=>hasRecoveryAfterReset(d)},
{id:"many_paths3",text:"三つの道を歩む",icon:"🔱",rarity:"rare",condition:"3種類以上の禁欲で初成功",globalTest:all=>Object.values(all).filter(d=>d.totalSuccess>=1).length>=3},
{id:"many_paths",text:"多くの欲を越える",icon:"🧭",rarity:"epic",condition:"5種類以上の禁欲で初成功",globalTest:all=>Object.values(all).filter(d=>d.totalSuccess>=1).length>=5},
{id:"eight_paths",text:"八つの道を歩む",icon:"🧭",rarity:"epic",condition:"8種類以上の禁欲で初成功",globalTest:all=>Object.values(all).filter(d=>d.totalSuccess>=1).length>=8},
{id:"ten_paths",text:"十の道を歩む",icon:"🔟",rarity:"legendary",condition:"10種類以上の禁欲で初成功",globalTest:all=>Object.values(all).filter(d=>d.totalSuccess>=1).length>=10},
{id:"twelve_paths",text:"十二の道を歩む",icon:"🌐",rarity:"legendary",condition:"12種類すべての禁欲で初成功",globalTest:all=>Object.values(all).filter(d=>d.totalSuccess>=1).length>=12},
{id:"triple_week",text:"三欲を同時に退ける",icon:"🤝",rarity:"epic",condition:"同じ3種類以上の禁欲を7日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,3)>=7},
{id:"five_week",text:"五欲を同時に退ける",icon:"🤝",rarity:"legendary",condition:"同じ5種類以上の禁欲を7日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,5)>=7},
{id:"encyclopedia50",text:"世界を読み始めた",icon:"📚",rarity:"common",condition:"図鑑を50件以上解放",globalTest:()=>globalUnlockedMilestoneCount()>=50},
{id:"encyclopedia100",text:"世界を知る",icon:"📚",rarity:"rare",condition:"図鑑を100件以上解放",globalTest:()=>globalUnlockedMilestoneCount()>=100},
{id:"encyclopedia200",text:"世界を見渡す",icon:"🌍",rarity:"epic",condition:"図鑑を200件以上解放",globalTest:()=>globalUnlockedMilestoneCount()>=200},
{id:"encyclopedia300",text:"万象を集める",icon:"🌐",rarity:"legendary",condition:"図鑑を300件以上解放",globalTest:()=>globalUnlockedMilestoneCount()>=300},
{id:"mission_mountain",text:"高峰を巡った",icon:"⛰️",rarity:"epic",condition:"図鑑ミッション「世界の山20件」を達成",globalTest:()=>missionCompletedById("mountain20")},
{id:"mission_city",text:"巨塔を見届けた",icon:"🏙️",rarity:"epic",condition:"図鑑ミッション「建築・ランドマーク30件」を達成",globalTest:()=>missionCompletedById("city30")},
{id:"mission_space",text:"宇宙を知る",icon:"🌌",rarity:"legendary",condition:"図鑑ミッション「宇宙・軌道30件」を達成",globalTest:()=>missionCompletedById("space30")}
];
const NOUN_LEVELS=[
{level:1,rarity:"common",conditionSuffix:"で初成功",test:d=>d.totalSuccess>=1},
{level:2,rarity:"common",conditionSuffix:"で最高3日連続",test:d=>maxStreakValue(d)>=3},
{level:3,rarity:"rare",conditionSuffix:"で最高7日連続",test:d=>maxStreakValue(d)>=7},
{level:4,rarity:"rare",conditionSuffix:"で最高14日連続",test:d=>maxStreakValue(d)>=14},
{level:5,rarity:"epic",conditionSuffix:"で最高30日連続",test:d=>maxStreakValue(d)>=30},
{level:6,rarity:"epic",conditionSuffix:"で最高60日連続",test:d=>maxStreakValue(d)>=60},
{level:7,rarity:"legendary",conditionSuffix:"で最高100日連続",test:d=>maxStreakValue(d)>=100},
{level:8,rarity:"legendary",conditionSuffix:"で累計成功365日",test:d=>d.totalSuccess>=365}
];
const NOUN_TEXTS={
noMasturbation:["オナ禁挑戦者","欲を見張る者","オナ禁戦士","自制の番人","欲望の番人","欲を制する騎士","自制の達人","欲望を統べる者"],
noAlcohol:["酒断ちの挑戦者","杯を置く者","素面の戦士","酒宴を退ける者","節酒の番人","素面の守護者","酒断ちの達人","杯を超越する者"],
noSmoking:["禁煙挑戦者","煙を避ける者","無煙の戦士","煙を断つ者","清気の番人","無煙の守護者","禁煙の達人","煙を超越する者"],
noGambling:["ギャンブル断ちの挑戦者","賭けなき旅人","賭けなき戦士","勝負を退ける者","確率に抗う者","胴元を遠ざける者","賭けを制する達人","運命に賭けぬ者"],
noSNS:["SNS断ちの挑戦者","通知を閉じる者","通知を退ける者","静寂を選ぶ者","静寂の守り手","接続を制する者","SNS断ちの達人","通知を超越する者"],
noShortVideos:["短尺断ちの挑戦者","指を止める者","スクロールを止める者","短尺を退ける者","短尺を断つ者","無限送りの番人","短尺断ちの達人","無限スクロールの破壊者"],
noGaming:["ゲーム断ちの挑戦者","電源を切る者","コントローラーを置く者","遊戯を退ける者","遊戯を制する者","現実へ戻る者","ゲーム断ちの達人","仮想世界の帰還者"],
noImpulseBuying:["衝動買い断ちの挑戦者","買う前に止まる者","財布の守り手","衝動を退ける者","消費を見張る者","財布を守護する者","衝動買い断ちの達人","消費を制する者"],
noSnacking:["動画断ちの挑戦者","再生を止める者","画面から離れし者","おすすめを退ける者","娯楽視聴の番人","再生を制する者","動画断ちの達人","娯楽視聴を制する者"],
noCaffeine:["カフェイン断ちの挑戦者","一杯を控える者","刺激を退ける者","覚醒を遠ざける者","一杯を断つ者","刺激を制する者","カフェイン断ちの達人","覚醒を制する者"],
noAdultContent:["刺激に抗う者","誘惑の番人","刺激を断つ者","誘惑を制する者"],
noJunkFood:["誘惑に抗う者","食欲の番人","美食を律する者","食欲を制する者"]
};

const NEGATIVE_NOUN_TEXTS={
noMasturbation:"欲望の敗残兵",
noAlcohol:"杯に敗れし者",
noSmoking:"煙に巻かれし者",
noGambling:"胴元の養分",
noSNS:"通知の奴隷",
noShortVideos:"無限スクロールの民",
noGaming:"ログアウトできぬ者",
noImpulseBuying:"財布の破壊者",
noSnacking:"おすすめ欄の住人",
noCaffeine:"一杯に屈した者",
noAdultContent:"刺激の虜",
noJunkFood:"揚げ物の虜"
};
const NEGATIVE_TITLE_NOUNS=Object.values(HABITS).map(h=>({id:`${h.id}_negative`,habitId:h.id,text:NEGATIVE_NOUN_TEXTS[h.id],icon:"☠️",rarity:"black_history",condition:`${h.name}で3連続失敗`,test:d=>(d.history||[]).some(x=>x.type==="failure"&&Number(x.after?.consecutiveFailures||0)>=3)}));

const FOUR_LEVEL_NOUNS=[
{days:3,rarity:"common"},{days:7,rarity:"rare"},{days:30,rarity:"epic"},{days:100,rarity:"legendary"}
];
const FOUR_LEVEL_HABITS=new Set(["noAdultContent","noJunkFood"]);
const TITLE_NOUNS=Object.values(HABITS).flatMap(h=>{
  if(FOUR_LEVEL_HABITS.has(h.id)){
    return FOUR_LEVEL_NOUNS.map((lv,i)=>({id:`${h.id}_noun_${lv.days}`,habitId:h.id,text:NOUN_TEXTS[h.id][i],icon:h.icon,rarity:lv.rarity,condition:`${h.name}で最高${lv.days}日連続`,test:d=>maxStreakValue(d)>=lv.days}));
  }
  return NOUN_LEVELS.map((lv,i)=>({id:`${h.id}_noun_${lv.level}`,habitId:h.id,text:NOUN_TEXTS[h.id][i],icon:h.icon,rarity:lv.rarity,condition:`${h.name}${lv.conditionSuffix}`,test:lv.test}));
});
TITLE_NOUNS.push(...NEGATIVE_TITLE_NOUNS);

function successfulDateSet(d){return new Set((d.history||[]).filter(x=>x.type==="success"&&x.date).map(x=>x.date))}
function dateNext(dateStr){const d=new Date(dateStr+"T00:00:00");d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function combinations(arr,k){const out=[];function rec(start,pick){if(pick.length===k){out.push(pick.slice());return}for(let i=start;i<=arr.length-(k-pick.length);i++){pick.push(arr[i]);rec(i+1,pick);pick.pop()}}rec(0,[]);return out}
function longestSharedSuccessStreak(all,minHabits){
  const ids=Object.keys(HABITS),sets=Object.fromEntries(ids.map(id=>[id,successfulDateSet(all[id]||{})]));
  let best=0;
  for(const combo of combinations(ids,minHabits)){
    const common=[...sets[combo[0]]].filter(date=>combo.every(id=>sets[id].has(date))).sort();
    let run=0,prev=null;
    for(const date of common){if(prev&&date===dateNext(prev))run++;else run=1;if(run>best)best=run;prev=date}
  }
  return best;
}
const MULTI_TITLE_NOUNS=[
{id:"multi3_3",group:"multi",minHabits:3,text:"三道の挑戦者",icon:"🔱",rarity:"common",condition:"同じ3種類以上の禁欲を3日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,3)>=3},
{id:"multi3_7",group:"multi",minHabits:3,text:"三道の守り手",icon:"🔱",rarity:"rare",condition:"同じ3種類以上の禁欲を7日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,3)>=7},
{id:"multi3_30",group:"multi",minHabits:3,text:"三欲を制する者",icon:"🔱",rarity:"epic",condition:"同じ3種類以上の禁欲を30日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,3)>=30},
{id:"multi3_100",group:"multi",minHabits:3,text:"三道の覇者",icon:"🔱",rarity:"legendary",condition:"同じ3種類以上の禁欲を100日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,3)>=100},
{id:"multi5_3",group:"multi",minHabits:5,text:"五道の挑戦者",icon:"✋",rarity:"common",condition:"同じ5種類以上の禁欲を3日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,5)>=3},
{id:"multi5_7",group:"multi",minHabits:5,text:"五道の守り手",icon:"✋",rarity:"rare",condition:"同じ5種類以上の禁欲を7日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,5)>=7},
{id:"multi5_30",group:"multi",minHabits:5,text:"五欲を制する者",icon:"✋",rarity:"epic",condition:"同じ5種類以上の禁欲を30日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,5)>=30},
{id:"multi5_100",group:"multi",minHabits:5,text:"五道の覇者",icon:"✋",rarity:"legendary",condition:"同じ5種類以上の禁欲を100日連続で成功",globalTest:all=>longestSharedSuccessStreak(all,5)>=100}
];
TITLE_NOUNS.push(...MULTI_TITLE_NOUNS);
const DEFAULT_TITLE_NOUN={id:"bean_challenger",habitId:null,text:"豆の挑戦者",icon:"🫘",rarity:"common",condition:"最初から使用可能",test:()=>true};
const ACHIEVEMENTS=[
{id:"first_success",icon:"🌱",name:"最初の一歩",description:"初めて成功を記録する",test:d=>d.totalSuccess>=1},
{id:"streak3",icon:"🔥",name:"三日連続",description:"3日連続成功",test:d=>d.currentStreak>=3},
{id:"streak7",icon:"🔥",name:"一週間",description:"7日連続成功",test:d=>d.currentStreak>=7},
{id:"streak30",icon:"🏆",name:"30日の継続",description:"30日連続成功",test:d=>d.currentStreak>=30},
{id:"success50",icon:"🏅",name:"50回成功",description:"累計成功50日",test:d=>d.totalSuccess>=50},
{id:"success100",icon:"💯",name:"100回成功",description:"累計成功100日",test:d=>d.totalSuccess>=100},
{id:"height10",icon:"⚡",name:"10m突破",description:"高さ10mに到達",test:d=>d.height>=10},
{id:"height100",icon:"🌳",name:"100m突破",description:"高さ100mに到達",test:d=>d.height>=100},
{id:"tokyoTower",icon:"🗼",name:"東京タワー突破",description:"333mに到達",test:d=>d.height>=333},
{id:"skytree",icon:"📡",name:"スカイツリー突破",description:"634mに到達",test:d=>d.height>=634},
{id:"oneKm",icon:"☁️",name:"1km突破",description:"1,000mに到達",test:d=>d.height>=1000},
{id:"fuji",icon:"🗻",name:"富士山突破",description:"3,776mに到達",test:d=>d.height>=3776},
{id:"everest",icon:"🏔️",name:"地球最高峰",description:"8,849mに到達",test:d=>d.height>=8849},
{id:"space",icon:"🚀",name:"宇宙到達",description:"100kmに到達",test:d=>d.height>=100000},
{id:"iss",icon:"🛰️",name:"ISS級",description:"400kmに到達",test:d=>d.height>=400000},
{id:"moon",icon:"🌕",name:"月到達",description:"384,400kmに到達",test:d=>d.height>=MOON_HEIGHT}
];
function initialHabit(){return{height:0,currentStreak:0,totalSuccess:0,consecutiveFailures:0,lastActionDate:null,lastActionType:null,history:[],moonBlessing:false,moonBlessingEarned:false,unlockedMilestones:[],unlockedTitles:["seed"],selectedTitleId:"seed",stats:{maxHeight:0,maxStreak:0,weekendSuccess:0,eventApplications:{wind:0,storm:0,miracle:0}}}}
function initialData(){const habits={};const visibleHabits={},habitSeverity={},severityReservations={};Object.keys(HABITS).forEach(id=>{habits[id]=initialHabit();visibleHabits[id]=true;habitSeverity[id]="NORMAL"});return{version:APP_VERSION,schemaVersion:12,profile:{localId:makeLocalId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString(),publicProfile:{representativeHabitId:"noMasturbation",shareHeight:true,shareStreak:true},titleInventory:{modifiers:{},nouns:{}},selectedTitle:{modifierId:null,nounId:"bean_challenger"},titleHistory:[],missionRewards:[],dataRevision:7,lastMigratedAt:new Date().toISOString()},settings:{calendarStartSunday:true,visibleHabits,habitOrder:Object.keys(HABITS),habitPaused:{},habitSeverity,severityReservations,rewardEditUnlockedDates:{}},habits}}

function makeLocalId(){return "local-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
function migrateData(data){
  if(!data.profile)data.profile={localId:makeLocalId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString()};
  if(!data.profile.localId)data.profile.localId=makeLocalId();
  if(!data.profile.nickname)data.profile.nickname="BEAN-"+Math.floor(10000+Math.random()*90000);
  if(!data.profile.createdAt)data.profile.createdAt=new Date().toISOString();
  if(!data.profile.publicProfile)data.profile.publicProfile={representativeHabitId:"noMasturbation",shareHeight:true,shareStreak:true};
  if(!HABITS[data.profile.publicProfile.representativeHabitId])data.profile.publicProfile.representativeHabitId="noMasturbation";
  if(!data.profile.titleInventory)data.profile.titleInventory={modifiers:{},nouns:{}};
  if(!data.profile.titleInventory.modifiers)data.profile.titleInventory.modifiers={};
  if(!data.profile.titleInventory.nouns)data.profile.titleInventory.nouns={};
  if(!data.profile.selectedTitle)data.profile.selectedTitle={modifierId:null,nounId:"bean_challenger"};
  if(!Array.isArray(data.profile.titleHistory))data.profile.titleHistory=[];
  if(!Array.isArray(data.profile.missionRewards))data.profile.missionRewards=[];
  if(!data.profile.dataRevision)data.profile.dataRevision=1;data.profile.dataRevision=Math.max(Number(data.profile.dataRevision||1),6);
  if(!data.profile.lastMigratedAt)data.profile.lastMigratedAt=new Date().toISOString();
  if(!data.settings)data.settings={};
  if(!Array.isArray(data.settings.habitOrder))data.settings.habitOrder=Object.keys(HABITS);
  else Object.keys(HABITS).forEach(id=>{if(!data.settings.habitOrder.includes(id))data.settings.habitOrder.push(id)});
  if(!data.settings.habitPaused)data.settings.habitPaused={};
  if(!data.settings.visibleHabits)data.settings.visibleHabits={};
  if(!data.settings.habitSeverity)data.settings.habitSeverity={};
  if(!data.settings.severityReservations)data.settings.severityReservations={};
  if(!data.settings.rewardEditUnlockedDates||typeof data.settings.rewardEditUnlockedDates!=="object")data.settings.rewardEditUnlockedDates={};
  if(!data.habits)data.habits={};
  data.schemaVersion=11;
  Object.keys(HABITS).forEach(id=>{
    if(!data.habits[id])data.habits[id]=initialHabit();
    if(typeof data.settings.visibleHabits[id]!=="boolean")data.settings.visibleHabits[id]=true;
    if(!["LIGHT","NORMAL","HEAVY"].includes(data.settings.habitSeverity[id]))data.settings.habitSeverity[id]="NORMAL";
    const d=data.habits[id];
    if(!d.stats)d.stats={maxHeight:d.height||0,maxStreak:d.currentStreak||0,weekendSuccess:0,eventApplications:{wind:0,storm:0,miracle:0}};
    if(!d.stats.eventApplications)d.stats.eventApplications={wind:0,storm:0,miracle:0};
    if(!Number.isFinite(Number(d.stats.weekendSuccess)))d.stats.weekendSuccess=0;
    (d.history||[]).forEach(x=>{if(x.eventType==="guerrilla")x.eventType="wind"});
    d.stats.maxHeight=Math.max(Number(d.stats.maxHeight||0),Number(d.height||0));
    d.stats.maxStreak=Math.max(Number(d.stats.maxStreak||0),Number(d.currentStreak||0));
  });
  applyDueSeverityReservations(data);
  return data;
}
function loadData(){const r=localStorage.getItem(STORAGE_KEY);if(!r)return initialData();try{return migrateData(mergeData(JSON.parse(r)))}catch(e){console.error(e);return initialData()}}
function mergeData(s){const i=initialData(),m={...i,...s,version:APP_VERSION,settings:{...i.settings,...(s.settings||{}),visibleHabits:{...i.settings.visibleHabits,...(s.settings?.visibleHabits||{})},habitPaused:{...i.settings.habitPaused,...(s.settings?.habitPaused||{})},habitSeverity:{...i.settings.habitSeverity,...(s.settings?.habitSeverity||{})},severityReservations:{...i.settings.severityReservations,...(s.settings?.severityReservations||{})},rewardEditUnlockedDates:{...i.settings.rewardEditUnlockedDates,...(s.settings?.rewardEditUnlockedDates||{})}},habits:{...i.habits}};Object.keys(HABITS).forEach(id=>m.habits[id]={...i.habits[id],...(s.habits?.[id]||{})});return m}
function updateStats(d,event=null,dateKey=todayKey()){if(!d.stats)d.stats={maxHeight:0,maxStreak:0,weekendSuccess:0,eventApplications:{wind:0,storm:0,miracle:0}};if(!d.stats.eventApplications)d.stats.eventApplications={wind:0,storm:0,miracle:0};d.stats.maxHeight=Math.max(Number(d.stats.maxHeight||0),Number(d.height||0));d.stats.maxStreak=Math.max(Number(d.stats.maxStreak||0),Number(d.currentStreak||0));if(event&&GUERRILLA_EVENTS[event.type])d.stats.eventApplications[event.type]=Number(d.stats.eventApplications[event.type]||0)+1;if(isWeekendDate(dateKey))d.stats.weekendSuccess=Number(d.stats.weekendSuccess||0)+1;}
function saveData(){const before=pendingTitleUnlocks.length;syncGlobalTitleUnlocks();appData.version=APP_VERSION;appData.schemaVersion=Math.max(Number(appData.schemaVersion||0),12);appData.profile.lastLocalChangeAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(appData));window.dispatchEvent(new CustomEvent("bean-growth:data-saved",{detail:{updatedAt:appData.profile.lastLocalChangeAt}}));if(pendingTitleUnlocks.length>before)setTimeout(showNextTitleUnlock,120)}function clone(v){return JSON.parse(JSON.stringify(v))}function $(id){return document.getElementById(id)}
function todayKey(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${day}`}
function fmt(v,max=1){return Number(v).toLocaleString("ja-JP",{maximumFractionDigits:max})}function fmtH(m){m=Number(m);return m<1000?`${fmt(m)}m`:m<1000000?`${fmt(m/1000,2)}km`:`${fmt(m/1000,1)}km`}function round1(v){return Math.round(v*10)/10}function floor1(v){return Math.floor(v*10)/10}
let appData=loadData(),currentHabitId=null,pendingAction=null,developerMode=false,developerData=null,developerOriginalData=null,developerForcedEvent="auto",encyclopediaCategory="すべて",encyclopediaQuery="",encyclopediaUnlockFilter="all",encyclopediaSort="asc",toastTimer=null,calendarHabitId="noMasturbation",calendarCursor=new Date(),recordsHabitId="noMasturbation";

function hashString(t){let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}function seededRandom(s){let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}
function dateFromKey(k){const [y,m,d]=String(k).split("-").map(Number);return new Date(y,m-1,d,12,0,0)}
function dateKeyFromDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function daysAgoFromKey(k){const a=dateFromKey(todayKey()),b=dateFromKey(k);return Math.round((a-b)/86400000)}
function isEditableRecordDate(k){const n=daysAgoFromKey(k);return n>=0&&n<=2}
function requiresRewardAdForEdit(k){return daysAgoFromKey(k)===2}
function previousDateKey(k){const d=dateFromKey(k);d.setDate(d.getDate()-1);return dateKeyFromDate(d)}
function monthRankingFinalizeKey(y,mZero){const d=new Date(y,mZero+1,3,12,0,0);return dateKeyFromDate(d)}
function recordRateForMonth(d,base=new Date()){
  const y=base.getFullYear(),m=base.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),today=dateFromKey(todayKey());
  const end=(y===today.getFullYear()&&m===today.getMonth())?today:last;
  const profileStart=new Date(appData.profile.createdAt||first);const start=profileStart>first?new Date(profileStart.getFullYear(),profileStart.getMonth(),profileStart.getDate(),12):first;
  if(start>end)return{recorded:0,eligible:0,rate:0};
  const eligible=Math.floor((end-start)/86400000)+1;
  const prefix=`${y}-${String(m+1).padStart(2,"0")}`;
  const recorded=new Set((d.history||[]).filter(x=>String(x.date||"").startsWith(prefix)&&dateFromKey(x.date)>=start&&dateFromKey(x.date)<=end).map(x=>x.date)).size;
  return{recorded,eligible,rate:eligible?Math.round(recorded/eligible*100):0};
}
function isWeekendDate(k=todayKey()){const day=dateFromKey(k).getDay();return day===5||day===6||day===0}
function weekendLabel(k=todayKey()){const day=dateFromKey(k).getDay();return day===5?"金曜日":day===6?"土曜日":day===0?"日曜日":""}
function specialDayLabel(k=todayKey()){return isWeekendDate(k)?`🎉 特別の日・${weekendLabel(k)}`:""}
function eventFromType(t){
  if(GUERRILLA_EVENTS[t]){
    const e=GUERRILLA_EVENTS[t];
    const mult=String(e.multiplier);
    const rate=e.rateLabel==="SECRET"?"発生率 SECRET":`発生率 ${e.rateLabel}`;
    return{
      ...e,
      reward:`×${mult} / ${rate}`,
      description:`${e.title}。${rate}。最低保証は+${e.guarantee}m。最低保証を超える場合は高さを×${mult}。`
    };
  }
  return{type:"normal",icon:"🌱",title:"通常成長日",reward:"+1m",description:"今日成功すると通常成長+1m。"};
}
function eventForDate(k=todayKey()){const r=seededRandom(hashString("bean-event-v439|"+k));if(r<GUERRILLA_EVENTS.miracle.rate)return eventFromType("miracle");if(r<GUERRILLA_EVENTS.miracle.rate+GUERRILLA_EVENTS.storm.rate)return eventFromType("storm");if(r<GUERRILLA_EVENTS.miracle.rate+GUERRILLA_EVENTS.storm.rate+GUERRILLA_EVENTS.wind.rate)return eventFromType("wind");return eventFromType("normal")}
function eventToday(){if(developerMode&&developerForcedEvent!=="auto")return eventFromType(developerForcedEvent);return eventForDate(todayKey())}
function successCalc(h,e,k=todayKey()){
  const weekend=isWeekendDate(k),weekendBonus=weekend?WEEKEND_BONUS:0,base=round1(Number(h)+1+weekendBonus);
  let n=base,mode="normal",eventBonus=0;
  if(GUERRILLA_EVENTS[e.type]){
    const multiplierGain=round1(base*(e.multiplier-1));
    if(multiplierGain<e.guarantee){
      eventBonus=e.guarantee;n=round1(base+eventBonus);mode="guarantee";
    }else{
      n=round1(base*e.multiplier);eventBonus=round1(n-base);mode="multiplier";
    }
  }
  return{newHeight:n,gained:round1(n-h),normalBonus:1,weekendBonus,eventBonus,mode};
}
function failureCalc(d){const h=d.height,n=d.consecutiveFailures+1;if(d.moonBlessing)return{newHeight:h,loss:0,usesMoonBlessing:true,nextFailures:Math.min(3,n),message:"🌕 月の加護が発動。高さの減少を防ぎました。"};if(n===1){const loss=Math.floor(h/5);return{newHeight:Math.max(0,round1(h-loss)),loss,usesMoonBlessing:false,nextFailures:1,message:`1回目の失敗。${fmtH(loss)}失いました。`}}if(n===2){const nh=floor1(h/2);return{newHeight:nh,loss:round1(h-nh),usesMoonBlessing:false,nextFailures:2,message:"2回連続失敗。高さが半分になりました。"}}return{newHeight:0,loss:h,usesMoonBlessing:false,nextFailures:3,message:"3回連続失敗。豆の木は0mに戻りました。"}}
function curMilestone(h){let r=MILESTONES[0];for(const m of MILESTONES){if(h>=m.height)r=m;else break}return r}function nextMilestone(h){return MILESTONES.find(m=>m.height>h)||null}function crossed(a,b){return MILESTONES.filter(m=>m.height>a&&m.height<=b)}
function showNextTitleUnlock(){
  if(!pendingTitleUnlocks.length)return;
  const x=pendingTitleUnlocks.shift(),h=x.sourceHabitId?HABITS[x.sourceHabitId]:null;
  $("titleUnlockIcon").textContent=x.icon||"🏅";$("titleUnlockName").textContent=x.text;
  $("titleUnlockMeta").textContent=`${titleRarityLabel(x.rarity)} ・ ${h?h.name:"全体実績"} ・ ${x.condition}`;
  $("titleUnlockOverlay").classList.remove("hidden");
}
function closeTitleUnlock(){
  $("titleUnlockOverlay").classList.add("hidden");
  if(pendingTitleUnlocks.length)setTimeout(showNextTitleUnlock,150);
}


function hasRecoveryAfterReset(d){
  const h=d.history||[];
  for(let i=0;i<h.length;i++){
    if(h[i].type==="failure"&&Number(h[i].after?.consecutiveFailures||0)>=3&&Number(h[i].after?.height||0)===0){
      if(h.slice(i+1).some(x=>x.type==="success"))return true;
    }
  }
  return false;
}
function globalUnlockedMilestoneIds(){
  return new Set(Object.values(appData?.habits||{}).flatMap(d=>d.unlockedMilestones||[]));
}
function globalUnlockedMilestoneCount(){return globalUnlockedMilestoneIds().size}
function allSuccessHistory(){const rows=[];for(const [habitId,d] of Object.entries(appData?.habits||{}))(d.history||[]).forEach(x=>{if(x.type==="success")rows.push({...x,habitId})});return rows}
function normalizedEventType(t){return t==="guerrilla"?"wind":t}
function eventEncounterDates(type){return new Set(allSuccessHistory().filter(x=>normalizedEventType(x.eventType)===type&&x.date).map(x=>x.date))}
function eventEncounterCount(type){return eventEncounterDates(type).size}
function eventApplicationCount(type){return allSuccessHistory().filter(x=>normalizedEventType(x.eventType)===type).length}
function firstEventEncounterDate(type){return [...eventEncounterDates(type)].sort()[0]||null}
function eventStatsSummary(){return Object.fromEntries(Object.keys(GUERRILLA_EVENTS).map(t=>[t,{encounters:eventEncounterCount(t),applications:eventApplicationCount(t),first:firstEventEncounterDate(t)}]))}

function maxHeightValue(d){return Math.max(Number(d.height||0),Number(d.stats?.maxHeight||0))}
function maxStreakValue(d){return Math.max(Number(d.currentStreak||0),Number(d.stats?.maxStreak||0))}
function titleOriginLabel(entry){if(!entry)return "";const h=HABITS[entry.sourceHabitId];return h?`${h.icon} ${h.name}`:"全体実績"}
function titleRarityLabel(r){if(r==="black_history")return "BLACK HISTORY";return TITLE_RARITY[r]||String(r||"").toUpperCase()}
let pendingTitleUnlocks=[];
function pushTitleHistory(kind,part,sourceHabitId){
  if(!appData.profile.titleHistory)appData.profile.titleHistory=[];
  if(appData.profile.titleHistory.some(x=>x.kind===kind&&x.id===part.id))return;
  const row={kind,id:part.id,text:part.text,icon:part.icon,rarity:part.rarity,sourceHabitId,earnedAt:new Date().toISOString(),condition:part.condition};
  appData.profile.titleHistory.unshift(row);pendingTitleUnlocks.push(row);
}
function syncGlobalTitleUnlocks(){
  if(!appData?.profile)return;
  const inv=appData.profile.titleInventory||(appData.profile.titleInventory={modifiers:{},nouns:{}}),all=appData.habits;
  TITLE_MODIFIERS.forEach(part=>{
    if(inv.modifiers[part.id])return;
    let sourceHabitId=null,ok=false;
    if(part.globalTest){ok=part.globalTest(all)}
    else{for(const h of Object.values(HABITS)){const d=all[h.id];if(d&&part.test(d,all)){ok=true;sourceHabitId=h.id;break}}}
    if(ok){inv.modifiers[part.id]={sourceHabitId,earnedAt:new Date().toISOString(),condition:part.condition};pushTitleHistory("modifier",part,sourceHabitId)}
  });
  TITLE_NOUNS.forEach(part=>{
    if(inv.nouns[part.id])return;
    if(part.globalTest){
      if(part.globalTest(all)){inv.nouns[part.id]={sourceHabitId:null,sourceGroup:"multi",earnedAt:new Date().toISOString(),condition:part.condition};pushTitleHistory("noun",part,null)}
      return;
    }
    const d=all[part.habitId];
    if(d&&part.test(d)){inv.nouns[part.id]={sourceHabitId:part.habitId,earnedAt:new Date().toISOString(),condition:part.condition};pushTitleHistory("noun",part,part.habitId)}
  });
}
function migrateLegacyTitleSelection(){
  const sel=appData.profile.selectedTitle||(appData.profile.selectedTitle={modifierId:null,nounId:"bean_challenger"});
  if(sel.nounId)return;
  const legacyMap={seed:[null,"bean_challenger"],sprout:["beginning","bean_challenger"],streak3:["three_days","bean_challenger"],week:["willful","bean_challenger"],month:["strong_willed","bean_challenger"],tree:["hundred_days","bean_challenger"],tower:["tower_breaker","bean_challenger"],skytree:["sky_chaser","bean_challenger"],sky:["sky_chaser","bean_challenger"],mountain:["mountain_breaker","bean_challenger"],everest:["summit_breaker","bean_challenger"],space:["space_reacher","bean_challenger"],orbital:["orbit_piercer","bean_challenger"],success100:["hundred_days","bean_challenger"],moon:["moon_chosen","bean_challenger"]};
  for(const h of Object.values(HABITS)){const d=appData.habits[h.id];if(d?.selectedTitleId&&legacyMap[d.selectedTitleId]){sel.modifierId=legacyMap[d.selectedTitleId][0];sel.nounId=legacyMap[d.selectedTitleId][1];break}}
  if(!sel.nounId)sel.nounId="bean_challenger";
}
function modifierById(id){return TITLE_MODIFIERS.find(x=>x.id===id)||null}
function nounById(id){if(id===DEFAULT_TITLE_NOUN.id)return DEFAULT_TITLE_NOUN;return TITLE_NOUNS.find(x=>x.id===id)||DEFAULT_TITLE_NOUN}
function isModifierUnlocked(id){return !id||Boolean(appData.profile.titleInventory?.modifiers?.[id])}
function isNounUnlocked(id){return id===DEFAULT_TITLE_NOUN.id||Boolean(appData.profile.titleInventory?.nouns?.[id])}
function equippedTitle(){
  syncGlobalTitleUnlocks();const sel=appData.profile.selectedTitle||{};
  const modifier=isModifierUnlocked(sel.modifierId)?modifierById(sel.modifierId):null,noun=isNounUnlocked(sel.nounId)?nounById(sel.nounId):DEFAULT_TITLE_NOUN;
  return{modifier,noun,text:`${modifier?modifier.text+" ":""}${noun.text}`,icon:modifier?.icon||noun.icon};
}
function unlockedTitlePartCount(){syncGlobalTitleUnlocks();return Object.keys(appData.profile.titleInventory.modifiers).length+Object.keys(appData.profile.titleInventory.nouns).length+1}
function totalTitlePartCount(){return TITLE_MODIFIERS.length+TITLE_NOUNS.length+1}
function unlockedA(d){return ACHIEVEMENTS.filter(a=>a.test(d))}
function awardMoon(d){if(d.height>=MOON_HEIGHT&&!d.moonBlessingEarned){d.moonBlessing=true;d.moonBlessingEarned=true;return true}return false}function milestoneKey(m){return m.id||`${m.height}|${m.name}`}
function syncUnlocks(d){if(!Array.isArray(d.unlockedMilestones))d.unlockedMilestones=[];for(const m of MILESTONES){if(m.height>0&&m.height<=d.height&&!d.unlockedMilestones.includes(milestoneKey(m)))d.unlockedMilestones.push(milestoneKey(m))}}
function isUnlocked(d,m){syncUnlocks(d);return m.height===0||d.unlockedMilestones.includes(milestoneKey(m))}
function enrichAllUnlocks(){Object.values(appData.habits).forEach(syncUnlocks);saveData()}
function homeEvent(){
  const e=eventToday(),c=$("homeEventCard");
  c.classList.remove("special","guerrilla","both","wind","storm","miracle");
  if(e.type!=="normal")c.classList.add(e.type);
  $("homeEventIcon").textContent=e.icon;
  $("homeEventTitle").textContent=isWeekendDate()?`${specialDayLabel()} ＋ ${e.title}`:e.title;
  $("homeEventDescription").textContent=e.description+(isWeekendDate()?` 金・土・日は「特別の日」。成功ごとに+${WEEKEND_BONUS}m。`:"");
  $("homeEventReward").textContent=`${isWeekendDate()?`特別の日 +${WEEKEND_BONUS}m ＋ `:""}${e.reward}`;
}
function escapeHtml(s){return String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]))}
function makeDetailSection(title,html){return `<section class="detail-section"><h4>${title}</h4>${html}</section>`}
function categoryContext(m){
  const h=fmtH(m.height);
  const c=m.category;
  const approx=m.approximate?"この値は厳密な高さではなく、スケール感をつかむための概算比較です。":"";
  const common=`Bean Growthでは ${h} の地点でこの項目を解放します。${approx}`;
  const map={
    "建築":"建物の高さは階高、屋根、アンテナなどを含めるかで変わります。ここでは豆の木の高さと直感的に比べられる代表的なスケールとして扱います。",
    "構造物":"構造物は用途によって形が大きく違います。同じ高さでも、細い塔・橋・風車・観覧車では見え方や必要な構造強度がまったく異なります。",
    "ランドマーク":"実在するランドマークは、その土地の歴史や技術を象徴する存在です。高さだけでなく、建設目的や構造にも注目すると比較がより面白くなります。",
    "生物":"生物では『高さ』『肩高』『全長』が混在します。全長を使う項目は、その長さを縦に置いたときの概念比較です。",
    "自然":"自然物の大きさは個体差や測り方で変わります。この項目は日常的な物差しから巨大な自然へスケールが移る目印です。",
    "大気":"高度が上がるにつれて気圧・気温・空気密度は大きく変化します。境界は固定された壁ではなく、緯度や季節などでも変わる連続的な領域です。",
    "航空":"航空機の飛行高度は機種、重量、天候、航路で変わります。ここでは代表的な運用高度のスケールとして比較します。",
    "宇宙":"宇宙には『ここから完全に真空』という一本の境界線はありません。高度が増すにつれて大気が徐々に薄くなり、軌道力学が支配的になります。",
    "軌道":"人工衛星の軌道は高度だけでなく速度と地球の重力の組み合わせで成立します。高いほど単純に『浮いている』わけではありません。",
    "天体サイズ":"これは地表からの高度ではなく、天体の直径・半径などを縦に置いたスケール比較です。距離と大きさを混同しないための図鑑項目です。",
    "概念":"実在物そのものの高さではなく、長さや距離を縦に置いて直感的にイメージするための比較です。",
    "スポーツ":"競技設備の寸法はルールで定められているものが多く、日常的な長さを実感しやすい比較対象です。",
    "基準":"高さの桁が変わる地点を示す基準マーカーです。次の世界へスケールが切り替わる節目として配置しています。"
  };
  return `${common} ${map[c]||"この項目は高さのスケールを直感的に理解するための比較対象です。"}`;
}
function scaleExplanation(m){
  const meters=Number(m.height);
  let text="";
  if(meters<10) text="人間の身体や住宅内部と直接比べられる、日常生活のスケールです。";
  else if(meters<100) text="建物・樹木・大型動物など、地上で見上げる対象のスケールです。";
  else if(meters<1000) text="高層建築や巨大構造物の領域です。地上から全体を一望しにくい高さになってきます。";
  else if(meters<10000) text="km単位の世界です。山岳の標高や地形のスケールと比較しやすくなります。";
  else if(meters<100000) text="旅客機の巡航高度を越え、大気上層へ進む領域です。";
  else if(meters<2000000) text="宇宙飛行・地球低軌道のスケールです。地球の曲率を強く意識する距離になります。";
  else if(meters<50000000) text="地球半径や人工衛星の中高軌道と比べる天体規模のスケールです。";
  else if(meters<MOON_HEIGHT) text="地球と月の間を進む巨大な距離スケールです。";
  else text="月を越え、惑星間空間や太陽系のスケールへ入っています。";
  return text;
}
function categorySpecificDetails(m){
  const rows=[];
  if(m.category==="生物"){rows.push(["比較方法",m.description?.includes("全長")?"全長を縦に比較":"代表的な体長・全高"],["個体差","年齢・性別・個体で変動"])}
  if(["建築","ランドマーク","構造物"].includes(m.category)){rows.push(["比較値",fmtH(m.height)],["所在地",[m.country,m.region].filter(Boolean).join(" / ")||"概念比較"],["高さの注意","尖塔・アンテナを含む定義が異なる場合あり"])}
  if(m.category==="天体サイズ"){rows.push(["比較の意味","直径・長軸などを縦に配置"],["注意","地表からの高度ではない"],["形状","完全な球でない天体も多い"])}
  if(m.category==="宇宙"||m.category==="軌道"){rows.push(["距離基準","地表からの高度・代表距離"],["変動","軌道や天体位置で値は変化"],["スケール","地上の高さとは桁が大きく異なる"])}
  if(m.category==="大気"||m.category==="航空"){rows.push(["高度",fmtH(m.height)],["変動","気象・機種・緯度などで変わる"],["環境","高度上昇とともに気圧・密度が低下"])}
  if(m.category==="自然"){rows.push(["比較値",fmtH(m.height)],["対象","落差・深さ・樹高など"],["注意","測定地点や定義により数値が変わる"])}
  if(m.category==="基準"){rows.push(["種類","ゲーム内比較目盛り"],["目的","次の実在対象までの距離感を細かく把握"],["実在物","いいえ"])}
  if(!rows.length)return "";
  return makeDetailSection("🧭 読み方",`<div class="data-grid">${rows.map(r=>`<div class="detail-data-cell"><small>${escapeHtml(r[0])}</small><strong>${escapeHtml(r[1])}</strong></div>`).join("")}</div>`);
}
function scaleAnalogy(m){const h=Number(m.height||0);if(h<2)return"人の身長と直接比べられる、ごく身近なスケール。";if(h<5)return"背の高い部屋や大型家具を縦にした程度。視線を上げれば全体を捉えられる。";if(h<10)return"住宅の2階前後に届く大きさ。地上から見上げる感覚がはっきりしてくる。";if(h<30)return"数階建ての建物に相当するスケール。人間の身体比較から建築物比較へ移る帯域。";if(h<100)return"中層建築物級。地上から頂部を見るにはかなり見上げる高さ。";if(h<300)return"高層建築物級。街の中でも明確なランドマークになる高さ。";if(h<1000)return"超高層建築・巨大構造物級。地上の対象としては非常に大きい。";if(h<10000)return"山岳スケール。日常の建物比較では捉えにくく、地形として考える段階。";if(h<100000)return"航空・大気のスケール。地上の景観から離れ、空そのものを進む距離。";if(h<1000000)return"宇宙空間の近地球スケール。人工衛星の軌道と比較できる。";return"天体間距離・惑星規模の領域。地上の物差しでは実感しにくい桁に入っている。"}
function familiarComparisons(m){
  const h=Number(m.height||0);if(!(h>0))return[];
  const refs=[
    {name:"成人の身長",value:1.7,unit:"人分"},{name:"一般的なドア",value:2,unit:"枚分"},{name:"バスケットゴール",value:3.05,unit:"基分"},
    {name:"乗用車の全長",value:4.5,unit:"台分"},{name:"大型路線バスの全長",value:12,unit:"台分"},{name:"25mプール",value:25,unit:"本分"},
    {name:"東京タワー",value:333,unit:"塔分"},{name:"東京スカイツリー",value:634,unit:"塔分"},{name:"富士山の標高",value:3776,unit:"山分"}
  ];
  const scored=refs.map(r=>({...r,score:Math.abs(Math.log(h/r.value))})).sort((a,b)=>a.score-b.score).slice(0,h<20?2:1);
  return scored.map(r=>{const ratio=h/r.value;return`${r.name}（約${fmt(r.value,2)}m）の${ratio>=1?`約${fmt(ratio,1)}${r.unit}`:`約${fmt(ratio*100,0)}%`}`});
}
function isBoilerplateDetail(text){
  return ["生物は個体差が大きいため、代表的な大きさを概算で比較。","ここでは体長・全長などを縦方向に置いている。","高さの桁や世界観が切り替わる節目として設定。"].includes(String(text||"").trim());
}
function selectedMilestoneFact(m){
  if(m?.funFact)return String(m.funFact);
  const pool=[...(m?.trivia||[]),...(m?.facts||[]),...(m?.wildlife||[]),...(m?.risks||[])].filter(Boolean);
  return pool[0]||m?.description||"この項目についての豆知識を準備中です。";
}
function shortMilestoneLead(m){
  const label=m.category==="世界の山"?"標高":m.category==="天体サイズ"?"サイズ":"高さ";
  return `${label}${fmtH(m.height)}。${m.description||""}`.trim();
}
function beanJourneyComment(m){
  const h=Number(m.height||0),cat=m.category||"";
  if(cat==="生物")return h<10?"豆の木は、人間を越えて大型生物と肩を並べる段階。":"生物の身体サイズを物差しにしても巨大さを感じる段階。";
  if(cat==="建築"||cat==="ランドマーク"||cat==="構造物")return"豆の木を一本の建造物として見ても存在感が出る地点。";
  if(cat==="世界の山")return"ここからは建物ではなく、地形そのものと競う領域。";
  if(cat==="航空"||cat==="大気")return"地上の図鑑から空の図鑑へ移っていく領域。";
  if(cat==="宇宙"||cat==="軌道"||cat==="天体サイズ")return"比較対象が地球上の物体から宇宙へ切り替わっている。";
  return h<100?"まだ生活圏の中で高さを実感しやすい地点。":h<1000?"街のランドマークと競うほどに育った地点。":"日常感覚を越えたスケールへ入った地点。";
}
function openMilestone(m){
  $("milestoneModalIcon").textContent=m.icon;
  $("milestoneModalCategory").textContent=`${m.category}${m.approximate?"・概算比較":""}`;
  $("milestoneModalName").textContent=m.name;
  $("milestoneModalHeight").textContent=fmtH(m.height);
  $("milestoneModalLocation").textContent=[m.country,m.region].filter(Boolean).join(" / ");
  $("milestoneModalDescription").textContent=shortMilestoneLead(m);
  const fact=selectedMilestoneFact(m);
  const html=`<section class="detail-section fun-fact-card"><p class="fun-fact-kicker">💡 知ってた？</p><p class="fun-fact-text">${escapeHtml(fact)}</p></section><section class="detail-section bean-journey-mini"><p class="fun-fact-kicker">🌱 BEAN GROWTH</p><p>${escapeHtml(beanJourneyComment(m))}</p></section>`;
  $("milestoneExtraDetails").innerHTML=html;
  $("milestoneModalOverlay").classList.remove("hidden");
}

function simulationSuccessStep(height,dateKey){return successCalc(height,eventForDate(dateKey),dateKey).newHeight}
function simulationFailureStep(state){const r=failureCalc({height:state.height,consecutiveFailures:state.failures,moonBlessing:false});return{height:r.newHeight,failures:r.nextFailures}}
function addDaysKey(startKey,days){const d=dateFromKey(startKey);d.setDate(d.getDate()+days);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function runBalanceSimulation(){const rate=Math.max(.01,Math.min(1,Number($("simSuccessRate").value||70)/100)),years=Number($("simYears").value||10),days=Math.max(1,Math.round(years*365.25)),runs=100,finals=[],goal=MILESTONES[MILESTONES.length-1]?.height||Infinity;let completed=0;for(let r=0;r<runs;r++){let state={height:0,failures:0};for(let i=0;i<days;i++){const k=addDaysKey("2027-01-01",i);if(Math.random()<rate){state.height=simulationSuccessStep(state.height,k);state.failures=0}else state=simulationFailureStep(state)}finals.push(state.height);if(state.height>=goal)completed++}finals.sort((a,b)=>a-b);const q=p=>finals[Math.min(finals.length-1,Math.floor((finals.length-1)*p))];$("simulationResult").innerHTML=`<strong>${days.toLocaleString("ja-JP")}日 × 100回</strong><br>成功率 ${Math.round(rate*100)}%（非成功日は失敗扱い）<br>中央値 ${fmtH(q(.5))}<br>10–90%範囲 ${fmtH(q(.1))} ～ ${fmtH(q(.9))}<br>図鑑最終地点到達 ${completed}/100回`;}
function openDeveloper(){
  renderDeveloperHabitButtons();
  $("developerModalOverlay").classList.remove("hidden");
}
function startDeveloper(id){
  if(!HABITS[id])return;
  currentHabitId=id;
  developerMode=true;
  developerOriginalData=clone(appData.habits[id]);
  developerData=clone(developerOriginalData);
  developerForcedEvent="auto";
  $("developerEventSelect").value="auto";
  $("developerModalOverlay").classList.add("hidden");
  $("homeScreen").classList.remove("active");
  $("gameScreen").classList.add("active");
  renderGame();
  window.scrollTo({top:0,behavior:"auto"});
}

function exitDeveloper(show=true){developerMode=false;developerData=null;developerOriginalData=null;developerForcedEvent="auto";$("developerPanel").classList.add("hidden");$("developerIndicator").classList.add("hidden");if(currentHabitId)renderGame();if(show)toast("開発者モードを終了しました。")}
function developerTitleTestParts(){if(!developerMode||!developerData||!currentHabitId)return[];return TITLE_NOUNS.filter(p=>p.habitId===currentHabitId&&!p.globalTest&&p.test(developerData)).map(p=>p)}
function renderDeveloperTitleTest(){const el=$("developerTitleTestResult");if(!el)return;const parts=developerTitleTestParts(),black=parts.filter(p=>p.rarity==="black_history");if(black.length){el.innerHTML=`<strong>☠️ BLACK HISTORY テスト解放</strong><span>${black.map(p=>escapeHtml(p.text)).join(" / ")}</span><small>開発者モード内だけのテスト表示。本番の称号所持には追加されません。</small>`;el.classList.add("unlocked");return}el.innerHTML=`<strong>称号テスト</strong><span>${parts.length?parts.map(p=>escapeHtml(p.text)).join(" / "):"まだ条件未達成"}</span><small>3連続失敗するとBLACK HISTORY称号もここで確認できます。</small>`;el.classList.remove("unlocked")}
function renderDeveloper(){$("developerPanel").classList.toggle("hidden",!developerMode);$("developerIndicator").classList.toggle("hidden",!developerMode);renderDeveloperTitleTest()}function devAdd(n){developerData.height=round1(developerData.height+n);syncUnlocks(developerData);awardMoon(developerData);renderGame();renderDeveloperTitleTest()}function devSet(){const n=Number($("developerHeightInput").value);if(!Number.isFinite(n)||n<0){toast("0以上の高さを入力してください。");return}developerData.height=round1(n);syncUnlocks(developerData);awardMoon(developerData);renderGame();renderDeveloperTitleTest()}function devSuccess(){const e=eventToday(),r=successCalc(developerData.height,e),p=crossed(developerData.height,r.newHeight),before=snap(developerData);developerData.height=r.newHeight;syncUnlocks(developerData);developerData.currentStreak++;developerData.totalSuccess++;developerData.consecutiveFailures=0;updateStats(developerData,e);if(!Array.isArray(developerData.history))developerData.history=[];developerData.history.push({id:"dev-success-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"success",before,after:snap(developerData)});const moon=awardMoon(developerData);renderGame();renderDeveloperTitleTest();celebrate(r,e,p,moon)}function devFailure(){const before=snap(developerData),r=failureCalc(developerData);developerData.height=r.newHeight;developerData.currentStreak=0;developerData.consecutiveFailures=r.nextFailures;if(r.usesMoonBlessing)developerData.moonBlessing=false;if(!Array.isArray(developerData.history))developerData.history=[];developerData.history.push({id:"dev-failure-"+Date.now().toString(36),date:`DEV-${Date.now()}`,timestamp:new Date().toISOString(),type:"failure",usedMoonBlessing:r.usesMoonBlessing,before,after:snap(developerData)});renderGame();renderDeveloperTitleTest();const black=developerTitleTestParts().find(p=>p.rarity==="black_history");toast(black?`☠️ テスト称号「${black.text}」を解放`:`🧪 ${r.message}`)}function devReset(){developerData=clone(developerOriginalData);developerForcedEvent="auto";$("developerEventSelect").value="auto";$("developerHeightInput").value="";renderGame();renderDeveloperTitleTest();toast("テストデータを元に戻しました。")}
function toast(m){$("toast").textContent=m;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400)}function closeConfirm(){$("confirmOverlay").classList.add("hidden");pendingAction=null}

$("backButton").onclick=goHome;$("successButton").onclick=recordSuccess;$("failButton").onclick=requestFailure;$("undoButton").onclick=requestUndo;$("confirmCancelButton").onclick=closeConfirm;$("confirmOkButton").onclick=()=>pendingAction==="failure"?recordFailure():pendingAction==="undo"?undoToday():null;$("confirmOverlay").onclick=e=>{if(e.target===$("confirmOverlay"))closeConfirm()};$("celebrationCloseButton").onclick=()=>$("celebrationOverlay").classList.add("hidden");$("celebrationOverlay").onclick=e=>{if(e.target===$("celebrationOverlay"))$("celebrationOverlay").classList.add("hidden")};$("milestoneModalClose").onclick=()=>$("milestoneModalOverlay").classList.add("hidden");$("milestoneModalOverlay").onclick=e=>{if(e.target===$("milestoneModalOverlay"))$("milestoneModalOverlay").classList.add("hidden")};$("openEncyclopediaButton").onclick=openEncyclopedia;$("openEncyclopediaButton2").onclick=openEncyclopedia;$("encyclopediaCloseButton").onclick=()=>$("encyclopediaOverlay").classList.add("hidden");$("changeTitleButton").onclick=openTitleSelector;$("titleSelectorCloseButton").onclick=()=>$("titleSelectorOverlay").classList.add("hidden");$("modifierTabButton").onclick=()=>setTitlePartTab("modifier");$("nounTabButton").onclick=()=>setTitlePartTab("noun");$("titleSearchInput").oninput=e=>{titleSearchQuery=e.target.value;renderTitleSelector()};$("titleRarityFilter").onchange=e=>{titleRarityFilter=e.target.value;renderTitleSelector()};$("openAchievementsButton").onclick=openAchievements;$("achievementsCloseButton").onclick=()=>$("achievementsOverlay").classList.add("hidden");$("settingsButton").onclick=openSettings;$("settingsCloseButton").onclick=()=>$("settingsOverlay").classList.add("hidden");$("developerButton").onclick=openDeveloper;$("developerModalClose").onclick=()=>$("developerModalOverlay").classList.add("hidden");document.querySelectorAll("[data-add-height]").forEach(b=>b.onclick=()=>devAdd(Number(b.dataset.addHeight)));document.querySelectorAll("[data-failure-count]").forEach(b=>b.onclick=()=>{developerData.consecutiveFailures=Number(b.dataset.failureCount);if(developerData.consecutiveFailures>0)developerData.currentStreak=0;renderGame()});$("developerSetHeightButton").onclick=devSet;$("developerEventSelect").onchange=e=>{developerForcedEvent=e.target.value;renderGame()};$("runSimulationButton").onclick=runBalanceSimulation;$("developerSuccessButton").onclick=devSuccess;$("developerFailureButton").onclick=devFailure;$("developerResetButton").onclick=devReset;$("developerExitButton").onclick=()=>exitDeveloper(true);$("encyclopediaSearch").oninput=e=>{encyclopediaQuery=e.target.value;renderEncyclopedia()};$("encyclopediaUnlockFilter").onchange=e=>{encyclopediaUnlockFilter=e.target.value;renderEncyclopedia()};$("encyclopediaSort").onchange=e=>{encyclopediaSort=e.target.value;renderEncyclopedia()};

$("recordEditCloseButton").onclick=closeRecordEdit;$("recordEditSuccessButton").onclick=()=>applyRecordEdit("success");$("recordEditFailureButton").onclick=()=>applyRecordEdit("failure");$("recordEditUnrecordedButton").onclick=()=>applyRecordEdit(null);$("recordEditOverlay").onclick=e=>{if(e.target===$("recordEditOverlay"))closeRecordEdit()};
$("openReportButton").onclick=openReport;$("reportCloseButton").onclick=()=>$("reportOverlay").classList.add("hidden");
$("openMissionsButton").onclick=openMissions;$("missionsCloseButton").onclick=()=>$("missionsOverlay").classList.add("hidden");
$("recordsChangeTitleButton").onclick=openTitleSelector;$("titleUnlockCloseButton").onclick=closeTitleUnlock;
$("openCalendarButton").onclick=openCalendar;$("openCalendarButton2").onclick=openCalendar;
$("calendarCloseButton").onclick=()=>$("calendarOverlay").classList.add("hidden");
$("calendarPrevButton").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
$("calendarNextButton").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};
$("openRecordsButton").onclick=openRecords;$("openRecordsButton2").onclick=openRecords;
$("recordsCloseButton").onclick=()=>$("recordsOverlay").classList.add("hidden");
$("exportDataButton").onclick=exportBackup;$("importDataButton").onclick=requestImportBackup;$("importDataInput").onchange=e=>importBackupFile(e.target.files?.[0]);

migrateLegacyTitleSelection();
cleanupRewardEditUnlocks();
refreshStreaksForElapsedGaps();
syncGlobalTitleUnlocks();
syncMissionRewards();
pendingTitleUnlocks=[];
ensureValidSelectedHabits();
enrichAllUnlocks();
renderHome();
