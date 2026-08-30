"use strict";

const STORAGE_KEY="beanGrowthGame_v1",APP_VERSION="6.8",OFFICIAL_RELEASE_DATE="2026-08-31",MILESTONES=(window.BEAN_MILESTONES||[]).slice().sort((a,b)=>a.height-b.height);
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
  Object.keys(HABITS).forEach(id=>{
    const d=data.habits?.[id];if(!d)return;
    const rows=(d.history||[]).filter(x=>x&&x.date&&["success","failure"].includes(x.type)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(!d.startedAt&&rows.length)d.startedAt=rows[0].date;
    if(d.startedAt&&!SEVERITY_LEVELS.includes(d.startSeverity))d.startSeverity=severityOf(id,data);
  });
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

function habitHasStarted(id,dataRef=null){
  const data=dataRef||(typeof appData!=="undefined"?appData:null),d=data?.habits?.[id];
  return Boolean(d?.startedAt||(d?.history||[]).some(x=>x&&["success","failure"].includes(x.type)));
}
function syncHabitStartMetadata(id,dateKey=null){
  const d=appData.habits[id];if(!d)return;
  const rows=(d.history||[]).filter(x=>x&&x.date&&["success","failure"].includes(x.type)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(rows.length){
    d.startedAt=rows[0].date;
    if(!SEVERITY_LEVELS.includes(d.startSeverity))d.startSeverity=severityOf(id);
  }else{
    d.startedAt=null;d.startSeverity=null;
  }
}
function firstEverRecordDate(){
  const dates=Object.values(appData.habits||{}).flatMap(d=>(d.history||[]).filter(x=>x&&x.date&&["success","failure"].includes(x.type)).map(x=>x.date)).sort();
  return dates[0]||null;
}
function formatDateKeyJa(key){
  if(!key)return"未開始";
  const [y,m,d]=String(key).split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
let pendingSeverityStartAction=null;
function openStartSeverityModal(habitId,action){
  if(!HABITS[habitId])return;
  pendingSeverityStartAction={habitId,action};
  const h=HABITS[habitId],current=severityOf(habitId);
  $("startSeverityHabit").textContent=`${h.icon} ${h.name}`;
  $("startSeverityDescription").textContent="最初の記録をつける前に、この禁欲対象が現在の自分にとってどの程度深刻かを自己申告で選んでください。";
  $("startSeverityCurrent").textContent=`現在の選択：${current}`;
  document.querySelectorAll("[data-start-severity]").forEach(b=>b.classList.toggle("current",b.dataset.startSeverity===current));
  $("startSeverityOverlay").classList.remove("hidden");
}
function chooseStartSeverity(level){
  if(!pendingSeverityStartAction||!SEVERITY_LEVELS.includes(level))return;
  appData.settings.habitSeverity[pendingSeverityStartAction.habitId]=level;
  delete appData.settings.severityReservations[pendingSeverityStartAction.habitId];
  document.querySelectorAll("[data-start-severity]").forEach(b=>b.classList.toggle("current",b.dataset.startSeverity===level));
  $("startSeverityCurrent").textContent=`現在の選択：${level}`;
}
function confirmStartSeverity(){
  if(!pendingSeverityStartAction)return;
  const p=pendingSeverityStartAction;pendingSeverityStartAction=null;
  $("startSeverityOverlay").classList.add("hidden");
  saveData();
  if(p.action==="homeSuccess")quickHomeSuccess(p.habitId,true);
  else if(p.action==="gameSuccess"){currentHabitId=p.habitId;recordSuccess(true)}
  else if(p.action==="gameFailure"){currentHabitId=p.habitId;requestFailure(true)}
  else if(p.action?.startsWith("edit:")){
    const type=p.action.split(":")[1];applyRecordEdit(type==="none"?null:type,true);
  }
}
function cancelStartSeverity(){
  pendingSeverityStartAction=null;$("startSeverityOverlay").classList.add("hidden");
}

function reserveSeverity(id,level){
  if(!HABITS[id]||!SEVERITY_LEVELS.includes(level))return;
  if(!appData.settings.habitSeverity)appData.settings.habitSeverity={};
  if(!appData.settings.severityReservations)appData.settings.severityReservations={};
  const current=severityOf(id);
  if(!habitHasStarted(id)){
    appData.settings.habitSeverity[id]=level;
    delete appData.settings.severityReservations[id];
    saveData();renderSettings();renderHome();
    toast(`${HABITS[id].name}：記録開始前の深刻度を${level}に変更しました。`);
    return;
  }
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
function makePlayerId(){
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=new Uint8Array(8);
  if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  const chars=Array.from(bytes,b=>alphabet[b%alphabet.length]);
  return `BG-${chars.slice(0,4).join("")}-${chars.slice(4).join("")}`;
}
function validPlayerId(v){return /^BG-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(String(v||""))}
function normalizeNickname(v){return String(v??"").trim().replace(/\s+/g," ").slice(0,20)}
function validNickname(v){const s=normalizeNickname(v);return s.length>=1&&s.length<=20}
function initialHabit(){return{height:0,currentStreak:0,totalSuccess:0,consecutiveFailures:0,lastActionDate:null,lastActionType:null,history:[],startedAt:null,startSeverity:null,moonBlessing:false,moonBlessingEarned:false,unlockedMilestones:[],unlockedTitles:["seed"],selectedTitleId:"seed",stats:{maxHeight:0,maxStreak:0,weekendSuccess:0,eventApplications:{wind:0,storm:0,miracle:0}}}}
function initialData(){const habits={};const visibleHabits={},habitSeverity={},severityReservations={};Object.keys(HABITS).forEach(id=>{habits[id]=initialHabit();visibleHabits[id]=true;habitSeverity[id]="NORMAL"});return{version:APP_VERSION,schemaVersion:22,profile:{localId:makeLocalId(),playerId:makePlayerId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString(),account:{mode:"guest",googleLinked:false},publicProfile:{representativeHabitId:"noMasturbation",shareHeight:true,shareStreak:true,shareEncyclopedia:true,shareSeverity:true,goal:""},onlineFoundation:{rankingVersion:3,profileVersion:3,friendVersion:2,integrityVersion:1,googleAuthReady:true,lastRankingSubmissionAt:null,lastPublicProfileAt:null},titleInventory:{modifiers:{},nouns:{}},selectedTitle:{modifierId:null,nounId:"bean_challenger"},titleHistory:[],missionRewards:[],dataRevision:45,lastMigratedAt:new Date().toISOString()},settings:{calendarStartSunday:true,visibleHabits,habitOrder:Object.keys(HABITS),habitPaused:{},habitSeverity,severityReservations,rewardEditUnlockedDates:{}},ranking:{finalizedMonths:{},pendingSubmissions:{}},habits}}

function makeLocalId(){return "local-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
function migrateData(data){
  if(!data.profile)data.profile={localId:makeLocalId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString()};
  if(!data.profile.localId)data.profile.localId=makeLocalId();
  if(!validPlayerId(data.profile.playerId))data.profile.playerId=makePlayerId();
  if(!data.profile.account||typeof data.profile.account!=="object")data.profile.account={mode:"guest",googleLinked:false};
  if(!["guest","google"].includes(data.profile.account.mode))data.profile.account.mode="guest";
  data.profile.account.googleLinked=Boolean(data.profile.account.googleLinked);
  if(!data.profile.nickname)data.profile.nickname="BEAN-"+Math.floor(10000+Math.random()*90000);
  if(!data.profile.createdAt)data.profile.createdAt=new Date().toISOString();
  if(!data.profile.publicProfile)data.profile.publicProfile={representativeHabitId:"noMasturbation",shareHeight:true,shareStreak:true,shareEncyclopedia:true,shareSeverity:true,goal:""};
  if(!HABITS[data.profile.publicProfile.representativeHabitId])data.profile.publicProfile.representativeHabitId="noMasturbation";
  if(typeof data.profile.publicProfile.shareHeight!=="boolean")data.profile.publicProfile.shareHeight=true;
  if(typeof data.profile.publicProfile.shareStreak!=="boolean")data.profile.publicProfile.shareStreak=true;
  if(typeof data.profile.publicProfile.shareEncyclopedia!=="boolean")data.profile.publicProfile.shareEncyclopedia=true;
  if(typeof data.profile.publicProfile.shareSeverity!=="boolean")data.profile.publicProfile.shareSeverity=true;
  if(typeof data.profile.publicProfile.goal!=="string")data.profile.publicProfile.goal="";
  data.profile.publicProfile.goal=data.profile.publicProfile.goal.slice(0,80);
  if(!data.profile.onlineFoundation||typeof data.profile.onlineFoundation!=="object")data.profile.onlineFoundation={rankingVersion:2,profileVersion:2,friendVersion:1,integrityVersion:1,googleAuthReady:false,lastRankingSubmissionAt:null};
  if(!data.ranking||typeof data.ranking!=="object")data.ranking={finalizedMonths:{},pendingSubmissions:{}};
  if(!data.ranking.finalizedMonths)data.ranking.finalizedMonths={};
  if(!data.ranking.pendingSubmissions)data.ranking.pendingSubmissions={};
  data.profile.onlineFoundation.rankingVersion=Math.max(Number(data.profile.onlineFoundation.rankingVersion||1),3);
  data.profile.onlineFoundation.profileVersion=Math.max(Number(data.profile.onlineFoundation.profileVersion||1),3);
  data.profile.onlineFoundation.friendVersion=Math.max(Number(data.profile.onlineFoundation.friendVersion||0),2);
  data.profile.onlineFoundation.integrityVersion=Math.max(Number(data.profile.onlineFoundation.integrityVersion||0),1);
  data.profile.onlineFoundation.googleAuthReady=true;
  if(!data.profile.titleInventory)data.profile.titleInventory={modifiers:{},nouns:{}};
  if(!data.profile.titleInventory.modifiers)data.profile.titleInventory.modifiers={};
  if(!data.profile.titleInventory.nouns)data.profile.titleInventory.nouns={};
  if(!data.profile.selectedTitle)data.profile.selectedTitle={modifierId:null,nounId:"bean_challenger"};
  if(!Array.isArray(data.profile.titleHistory))data.profile.titleHistory=[];
  if(!Array.isArray(data.profile.missionRewards))data.profile.missionRewards=[];
  if(!data.profile.dataRevision)data.profile.dataRevision=1;data.profile.dataRevision=Math.max(Number(data.profile.dataRevision||1),45);
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
  data.schemaVersion=Math.max(Number(data.schemaVersion||0),22);
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
function saveData(){const before=pendingTitleUnlocks.length;syncGlobalTitleUnlocks();appData.version=APP_VERSION;appData.schemaVersion=Math.max(Number(appData.schemaVersion||0),22);appData.profile.lastLocalChangeAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(appData));window.dispatchEvent(new CustomEvent("bean-growth:data-saved",{detail:{updatedAt:appData.profile.lastLocalChangeAt}}));if(pendingTitleUnlocks.length>before)setTimeout(showNextTitleUnlock,120)}function clone(v){return JSON.parse(JSON.stringify(v))}function $(id){return document.getElementById(id)}
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
  if(isWeekendDate())c.classList.add("special");
  if(e.type!=="normal")c.classList.add(e.type);
  $("homeEventIcon").textContent=e.icon;
  $("homeEventTitle").textContent=isWeekendDate()?(e.type==="normal"?specialDayLabel():`${specialDayLabel()}・${e.title}`):e.title;
  $("homeEventDescription").textContent="";
  $("homeEventReward").textContent=e.type==="normal"?(isWeekendDate()?`+1m +${WEEKEND_BONUS}m`:"+1m"):(isWeekendDate()?`+1m +${WEEKEND_BONUS}m / EVENT`:"EVENT");
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
function uniqueMilestoneDetails(m){return [...(m.trivia||[]),...(m.facts||[])].filter(x=>!isBoilerplateDetail(x)).slice(0,5)}
function itemSpecificLead(m){
  const label=m.category==="世界の山"?"標高":m.category==="天体サイズ"?"サイズ":"比較値";
  const place=[m.country,m.region].filter(Boolean).join("・");
  return `${m.name}は${label}${fmtH(m.height)}の地点で解放される${m.approximate?"概算の":""}${m.category||"高さ"}比較です。${place?` ${place}に関連する対象です。`:""}`;
}
function beanJourneyComment(m){const h=Number(m.height||0),cat=m.category||"";if(cat==="生物")return h<10?"豆の木は、人間を越えて大型生物と肩を並べる段階。":"生物の身体サイズを物差しにしても巨大さを感じる段階。";if(cat==="建築"||cat==="ランドマーク")return"豆の木を一本の建造物として見ても存在感が出る地点。";if(cat==="世界の山")return"ここからは『高さ』というより地形・標高と競う領域。";if(cat==="航空"||cat==="大気")return"地上の図鑑から空の図鑑へ移っていく境界。";if(cat==="宇宙"||cat==="軌道"||cat==="天体サイズ")return"豆の木の比較対象が地球上の物体から宇宙へ切り替わっている。";return h<100?"まだ生活圏の中で高さを実感しやすい地点。":h<1000?"街のランドマークと競うほどに育った地点。":"日常感覚を越えたスケールへ入った地点。"}
function extraNonMountainDetails(m){let html="";html+=makeDetailSection("🔎 この項目の見どころ",`<p>${escapeHtml(itemSpecificLead(m))}</p>`);const comps=familiarComparisons(m);if(comps.length)html+=makeDetailSection(`📐 ${escapeHtml(fmtH(m.height))}を身近な物差しで`,`<ul class="detail-bullets">${comps.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul><p class="detail-note">身近な物差しとの比較はスケール感をつかむための概算です。</p>`);const unique=uniqueMilestoneDetails(m);if(unique.length)html+=makeDetailSection("💡 この対象ならでは",`<ul class="detail-bullets">${unique.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`);html+=makeDetailSection("🌱 豆の木の現在地",`<p>${escapeHtml(beanJourneyComment(m))}</p>`);if(m.wildlife?.length)html+=makeDetailSection("🦌 生物・自然",`<div class="detail-tags">${m.wildlife.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);if(m.risks?.length)html+=makeDetailSection("⚠️ 特徴・注意",`<div class="detail-tags">${m.risks.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);return html}

function isHabitVisible(id){return appData.settings?.visibleHabits?.[id]!==false}
function visibleHabitIds(){const order=appData.settings?.habitOrder||Object.keys(HABITS);return order.filter(id=>HABITS[id]&&isHabitVisible(id)&&!appData.settings?.habitPaused?.[id])}
function ensureValidSelectedHabits(){
  const visible=visibleHabitIds();
  const fallback=visible[0]||Object.keys(HABITS)[0];
  if(!HABITS[calendarHabitId]||!isHabitVisible(calendarHabitId))calendarHabitId=fallback;
  if(!HABITS[recordsHabitId]||!isHabitVisible(recordsHabitId))recordsHabitId=fallback;
}
function renderAccountSettings(){
  const playerId=$("playerIdDisplay"),nick=$("nicknameInput"),badge=$("accountTypeBadge");
  if(playerId)playerId.textContent=appData.profile.playerId||"未発行";
  if(nick&&document.activeElement!==nick)nick.value=appData.profile.nickname||"";
  if(badge)badge.textContent=appData.profile.account?.googleLinked?"GOOGLE":"GUEST";
}
async function copyPlayerId(){
  const id=appData.profile.playerId;
  try{await navigator.clipboard.writeText(id);toast(`Player ID ${id} をコピーしました。`)}
  catch{window.prompt("Player IDをコピーしてください",id)}
}
function saveNickname(){
  const input=$("nicknameInput"),status=$("nicknameStatus"),name=normalizeNickname(input?.value);
  if(!validNickname(name)){if(status)status.textContent="ニックネームは1〜20文字で入力してください。";return}
  if(name===appData.profile.nickname){if(status)status.textContent="変更はありません。";return}
  appData.profile.nickname=name;saveData();if(status)status.textContent=`「${name}」に変更しました。`;renderAccountSettings();renderHome();
}
function openSettings(){renderSettings();$("settingsOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function renderSettings(){renderAccountSettings();
  const list=$("habitVisibilityList");list.innerHTML="";
  const order=appData.settings.habitOrder||Object.keys(HABITS),visibleCount=order.filter(isHabitVisible).length;
  $("visibleHabitCount").textContent=`${visibleCount} / ${Object.keys(HABITS).length}`;
  order.forEach((id,index)=>{
    const h=HABITS[id];if(!h)return;
    const row=document.createElement("div");row.className="visibility-row";const checked=isHabitVisible(h.id),paused=Boolean(appData.settings.habitPaused?.[h.id]);
    row.innerHTML=`<span class="visibility-icon">${h.icon}</span><span class="visibility-copy"><strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(h.description||"")}${paused?" ・ 休止中":""}</small><em class="severity-mini">${severityLabel(h.id)}</em></span><span class="visibility-actions"><button type="button" data-up>▲</button><button type="button" data-down>▼</button><button type="button" class="pause-button ${paused?"paused":""}" data-pause>${paused?"再開":"休止"}</button><label class="switch"><input type="checkbox" data-visibility-habit="${h.id}" ${checked?"checked":""}><span class="switch-slider"></span></label></span>`;
    row.querySelector("input").onchange=e=>setHabitVisibility(h.id,e.target.checked);
    row.querySelector("[data-up]").onclick=()=>moveHabit(id,-1);row.querySelector("[data-down]").onclick=()=>moveHabit(id,1);row.querySelector("[data-pause]").onclick=()=>toggleHabitPause(id);
    list.appendChild(row);
  });
  renderSeveritySettings();
}
function renderSeveritySettings(){
  const list=$("severitySettingsList");if(!list)return;list.innerHTML="";
  (appData.settings.habitOrder||Object.keys(HABITS)).forEach(id=>{
    const h=HABITS[id];if(!h)return;
    const current=severityOf(id),reservation=severityReservation(id),started=habitHasStarted(id),d=appData.habits[id],card=document.createElement("div");
    card.className="severity-card";
    const status=started
      ? `開始時：${d.startSeverity||current} / 現在：${current}${reservation?` / 次回：${reservation.level}（${reservation.effectiveFrom}）`:""}`
      : `未開始・現在の選択：${current}（開始前はいつでも変更可）`;
    card.innerHTML=`<div class="severity-card-head"><span>${h.icon}</span><div><strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(status)}</small></div></div><div class="severity-buttons">${SEVERITY_LEVELS.map(level=>`<button type="button" data-severity="${level}" class="severity-button ${current===level?"current":""} ${reservation?.level===level?"reserved":""}">${level}</button>`).join("")}</div>`;
    card.querySelectorAll("[data-severity]").forEach(b=>b.onclick=()=>reserveSeverity(id,b.dataset.severity));
    list.appendChild(card);
  });
}
function moveHabit(id,delta){const a=appData.settings.habitOrder,i=a.indexOf(id),j=i+delta;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];saveData();renderSettings();renderHome()}
function toggleHabitPause(id){appData.settings.habitPaused[id]=!appData.settings.habitPaused[id];ensureValidSelectedHabits();saveData();renderSettings();renderHome()}
function setHabitVisibility(id,visible){
  const currentlyVisible=visibleHabitIds();
  if(!visible&&currentlyVisible.length<=1&&currentlyVisible.includes(id)){
    toast("少なくとも1種類は表示してください。");
    renderSettings();
    return;
  }
  appData.settings.visibleHabits[id]=visible;
  ensureValidSelectedHabits();
  saveData();renderSettings();renderHome();
}
function renderDeveloperHabitButtons(){
  const list=$("developerHabitSelect");if(!list)return;list.innerHTML="";
  Object.values(HABITS).forEach(h=>{
    const b=document.createElement("button");b.type="button";b.dataset.developerHabit=h.id;b.textContent=`${h.icon} ${h.name}`;
    b.onclick=()=>startDeveloper(h.id);list.appendChild(b);
  });
}

function renderHome(){
  homeEvent();
  const list=$("habitList");list.innerHTML="";let th=0,ts=0;
  (appData.settings?.habitOrder||Object.keys(HABITS)).map(id=>HABITS[id]).filter(Boolean).forEach(h=>{
    if(!isHabitVisible(h.id)||appData.settings?.habitPaused?.[h.id])return;
    const d=appData.habits[h.id];syncUnlocks(d);updateStats(d);th+=d.height;ts+=d.totalSuccess;
    let status="今日は未記録";if(d.lastActionDate===todayKey())status=d.lastActionType==="success"?"今日は成功済み":"今日は継続できず";
    const n=nextMilestone(d.height),e=eventToday(),r=successCalc(d.height,e),done=d.lastActionDate===todayKey();
    const card=document.createElement("div");card.className="habit-card";
    card.innerHTML=`<span class="habit-icon">${h.icon}</span><span class="habit-copy"><strong>${h.name}</strong><small class="habit-severity">${severityOf(h.id)}</small><small>🔥 ${d.currentStreak}日連続 ・ ${equippedTitle().icon} ${escapeHtml(equippedTitle().text)} ・ ${status}</small></span><span class="habit-height">${fmtH(d.height)}</span><span class="habit-next">${n?`次：${n.icon} ${n.name}まで ${fmtH(round1(n.height-d.height))}`:"登録済み最終地点を突破"}</span><button class="home-quick-success ${done?"done":""}" type="button">${done?"今日の記録を見る":"今日も継続できた"}<span class="quick-result">${done?fmtH(d.height):`${fmtH(d.height)} → ${fmtH(r.newHeight)}`}</span></button>`;
    card.querySelector(".habit-copy").style.cursor="pointer";
    card.querySelector(".habit-copy").onclick=()=>openHabit(h.id);
    card.querySelector(".habit-icon").style.cursor="pointer";
    card.querySelector(".habit-icon").onclick=()=>openHabit(h.id);
    card.querySelector(".habit-height").style.cursor="pointer";
    card.querySelector(".habit-height").onclick=()=>openHabit(h.id);
    card.querySelector(".habit-next").style.cursor="pointer";
    card.querySelector(".habit-next").onclick=()=>openHabit(h.id);
    card.querySelector(".home-quick-success").onclick=()=>done?openHabit(h.id):quickHomeSuccess(h.id);
    list.appendChild(card);
  });
  $("homeTotalHeight").textContent=fmtH(th);$("homeTotalSuccess").textContent=`${fmt(ts,0)}日`;
}
function quickHomeSuccess(id,bypassStartSeverity=false){
  currentHabitId=id;const d=appData.habits[id];
  if(!bypassStartSeverity&&!habitHasStarted(id)){openStartSeverityModal(id,"homeSuccess");return}if(d.lastActionDate===todayKey()){openHabit(id);return}
  const before=snap(d),e=eventToday(),r=successCalc(d.height,e),p=crossed(d.height,r.newHeight);
  d.height=r.newHeight;syncUnlocks(d);const continues=historyForDate(d,previousDateKey(todayKey()))?.type==="success";d.currentStreak=continues?d.currentStreak+1:1;d.totalSuccess++;d.consecutiveFailures=0;d.lastActionDate=todayKey();d.lastActionType="success";updateStats(d,e);
  const moon=awardMoon(d);d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"success",eventType:e.type,weekendBonus:r.weekendBonus,eventMode:r.mode,eventBonus:r.eventBonus,before,after:snap(d)});
  syncHabitStartMetadata(id);saveData();renderHome();celebrate(r,e,p,moon);
}

function openHabit(id){currentHabitId=id;$("homeScreen").classList.remove("active");$("gameScreen").classList.add("active");renderGame();window.scrollTo({top:0,behavior:"auto"})}function goHome(){if(developerMode)exitDeveloper(false);currentHabitId=null;$("gameScreen").classList.remove("active");$("homeScreen").classList.add("active");renderHome();window.scrollTo({top:0,behavior:"auto"})}function activeData(){return developerMode?developerData:appData.habits[currentHabitId]}
function renderGame(){if(!currentHabitId)return;const h=HABITS[currentHabitId],d=activeData();$("gameIcon").textContent=h.icon;$("gameEnglishName").textContent=h.englishName;$("gameTitle").textContent=h.name;const p=d.height<1000?{v:fmt(d.height),u:"m"}:{v:fmt(d.height/1000,2),u:"km"};$("currentHeight").textContent=p.v;$("currentHeightUnit").textContent=p.u;$("currentStreak").textContent=fmt(d.currentStreak,0);$("totalSuccess").textContent=fmt(d.totalSuccess,0);$("consecutiveFailures").textContent=d.consecutiveFailures;renderTree(d.height);renderEvent(d);renderMilestones(d.height);renderToday(d);renderStatus(d);renderRisk(d);renderMoon(d);renderDeveloper()}
function renderTree(h){const v=45+Math.min(58,Math.log10(h+1)*24);$("treeStem").style.height=`${v}px`;$("treeTop").style.bottom=`${Math.min(94,v+18)}px`}
function renderEvent(d){
  const e=eventToday(),c=$("eventCard");
  c.classList.remove("special","guerrilla","both","wind","storm","miracle");
  if(e.type!=="normal")c.classList.add(e.type);
  $("eventIcon").textContent=e.icon;
  $("eventTitle").textContent=isWeekendDate()?`${specialDayLabel()} ＋ ${e.title}`:e.title;
  $("eventDescription").textContent="";
  $("eventReward").textContent=`${isWeekendDate()?`特別の日 +${WEEKEND_BONUS}m ＋ `:""}${e.reward}`;
  const r=successCalc(d.height,e);$("successButtonDescription").textContent=`${fmtH(d.height)} → ${fmtH(r.newHeight)}`;
}
function renderMilestones(h){const cur=curMilestone(h),next=nextMilestone(h);$("currentMilestoneIcon").textContent=cur.icon;$("currentMilestoneName").textContent=cur.name;$("currentMilestoneHeight").textContent=fmtH(cur.height);$("currentMilestoneDescription").textContent=cur.description;$("currentMilestoneDetailButton").onclick=()=>openMilestone(cur);if(!next){$("nextMilestoneCard").classList.add("hidden");$("growthMessage").textContent="登録済みの最終地点を突破しています。"}else{$("nextMilestoneCard").classList.remove("hidden");$("nextMilestoneIcon").textContent=next.icon;$("nextMilestoneName").textContent=next.name;$("nextMilestoneHeight").textContent=fmtH(next.height);$("distanceToNext").textContent=fmtH(round1(next.height-h));const span=next.height-cur.height,p=span>0?Math.max(0,Math.min(100,(h-cur.height)/span*100)):0;$("milestoneProgressBar").style.width=`${p}%`;$("progressText").textContent=`${cur.name} → ${next.name}　${p.toFixed(1)}%`;$("nextMilestoneDetailButton").onclick=()=>openMilestone(next);$("growthMessage").textContent=h===0?"地表からスタート。最初の1mを目指そう。":`${cur.name}を突破。次は${next.name}。`}const idx=MILESTONES.findIndex(m=>m.height>h),up=idx<0?[]:MILESTONES.slice(idx,idx+5);$("upcomingList").innerHTML="";up.forEach(m=>{const row=document.createElement("div");row.className="upcoming-item";row.innerHTML=`<span class="emoji">${m.icon}</span><div><strong>${m.name}</strong><small>${fmtH(m.height)}</small></div><span class="upcoming-distance">+${fmtH(round1(m.height-h))}</span>`;$("upcomingList").appendChild(row)});$("encyclopediaProgress").textContent=`${MILESTONES.filter(m=>m.height>0&&isUnlocked(activeData(),m)).length} / ${MILESTONES.filter(m=>m.height>0).length}`}
function renderToday(d){if(developerMode){$("successButton").classList.remove("hidden");$("failButton").classList.remove("hidden");$("todayCompleted").classList.add("hidden");return}const done=d.lastActionDate===todayKey();$("successButton").classList.toggle("hidden",done);$("failButton").classList.toggle("hidden",done);$("todayCompleted").classList.toggle("hidden",!done);if(done){const s=d.lastActionType==="success";$("todayResultIcon").textContent=s?"✓":"↘";$("todayResultIcon").style.background=s?"var(--green-pale)":"var(--red-pale)";$("todayResultIcon").style.color=s?"var(--green-dark)":"var(--red)";$("todayResultTitle").textContent=s?"今日も継続成功":"継続できなかった日を記録";$("todayResultDescription").textContent=`現在の高さは${fmtH(d.height)}です。`}}
function renderStatus(d){const t=equippedTitle();$("currentTitleBadge").textContent=`${t.icon} ${t.text}`;$("achievementProgress").textContent=`${unlockedTitlePartCount()} / ${totalTitlePartCount()}パーツ`}
function renderMoon(d){if(!d.moonBlessingEarned){$("moonBlessingCard").classList.add("hidden");return}$("moonBlessingCard").classList.remove("hidden");$("moonBlessingStatus").textContent=d.moonBlessing?"所持中。次の失敗時、高さの減少だけを1回防ぎます。連続失敗回数は増えます。":"使用済み。月到達で得られる一度限りの伝説級アイテムです。"}
function renderRisk(d){const r=failureCalc(d);$("nextFailureResult").textContent=`${fmtH(d.height)} → ${fmtH(r.newHeight)}`;if(r.usesMoonBlessing)$("riskDescription").textContent="月の加護が自動発動し、高さの減少を防ぎます。ただし連続失敗は1回増えます。";else if(d.consecutiveFailures===0)$("riskDescription").textContent=`1回目の失敗。現在の高さの1/5（${fmtH(r.loss)}）を失います。`;else if(d.consecutiveFailures===1)$("riskDescription").textContent="2回連続失敗。残っている高さが半分になります。";else $("riskDescription").textContent="3回連続失敗。豆の木は0mに戻ります。";$("failButtonDescription").textContent=r.usesMoonBlessing?"月の加護が発動":d.consecutiveFailures===0?"高さの1/5を失う":d.consecutiveFailures===1?"高さが半分になる":"0mに戻る"}

function snap(d){return{height:d.height,currentStreak:d.currentStreak,totalSuccess:d.totalSuccess,consecutiveFailures:d.consecutiveFailures,lastActionDate:d.lastActionDate,lastActionType:d.lastActionType,moonBlessing:d.moonBlessing,moonBlessingEarned:d.moonBlessingEarned}}function restore(d,s){Object.assign(d,s)}
function recordSuccess(bypassStartSeverity=false){if(developerMode){devSuccess();return}const d=activeData();if(!bypassStartSeverity&&!habitHasStarted(currentHabitId)){openStartSeverityModal(currentHabitId,"gameSuccess");return}if(d.lastActionDate===todayKey()){toast("今日はすでに記録されています。");return}const before=snap(d),e=eventToday(),r=successCalc(d.height,e),passed=crossed(d.height,r.newHeight);d.height=r.newHeight;syncUnlocks(d);const continues=historyForDate(d,previousDateKey(todayKey()))?.type==="success";d.currentStreak=continues?d.currentStreak+1:1;d.totalSuccess++;d.consecutiveFailures=0;d.lastActionDate=todayKey();d.lastActionType="success";updateStats(d,e);const moon=awardMoon(d);d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"success",eventType:e.type,weekendBonus:r.weekendBonus,eventMode:r.mode,eventBonus:r.eventBonus,before,after:snap(d)});syncHabitStartMetadata(currentHabitId);saveData();renderGame();renderHome();celebrate(r,e,passed,moon)}
function requestFailure(bypassStartSeverity=false){if(developerMode){devFailure();return}const d=activeData();if(!bypassStartSeverity&&!habitHasStarted(currentHabitId)){openStartSeverityModal(currentHabitId,"gameFailure");return}if(d.lastActionDate===todayKey()){toast("今日はすでに記録されています。");return}const r=failureCalc(d);pendingAction="failure";$("confirmIcon").textContent=r.usesMoonBlessing?"🌕":"⚠️";$("confirmTitle").textContent="継続できなかった日を記録しますか？";$("confirmDescription").textContent=r.usesMoonBlessing?`月の加護が発動します。高さは${fmtH(d.height)}のままですが、連続失敗は1回増えます。`:`${fmtH(d.height)} → ${fmtH(r.newHeight)}になります。`;$("confirmOkButton").textContent="記録する";$("confirmOverlay").classList.remove("hidden")}
function recordFailure(){const d=activeData(),before=snap(d),r=failureCalc(d);d.height=r.newHeight;d.currentStreak=0;d.consecutiveFailures=r.nextFailures;d.lastActionDate=todayKey();d.lastActionType="failure";if(r.usesMoonBlessing)d.moonBlessing=false;d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"failure",usedMoonBlessing:r.usesMoonBlessing,before,after:snap(d)});syncHabitStartMetadata(currentHabitId);saveData();closeConfirm();renderGame();renderHome();toast(r.message)}
function requestUndo(){if(developerMode)return;const d=activeData(),i=todayHistoryIndex(d);if(i<0)return;pendingAction="undo";$("confirmIcon").textContent="↩";$("confirmTitle").textContent="今日の記録を取り消しますか？";$("confirmDescription").textContent="今日の操作直前の状態へ戻します。";$("confirmOkButton").textContent="取り消す";$("confirmOverlay").classList.remove("hidden")}
function undoToday(){const d=activeData(),i=todayHistoryIndex(d);if(i<0){closeConfirm();return}restore(d,d.history[i].before);d.history.splice(i,1);syncHabitStartMetadata(currentHabitId);saveData();closeConfirm();renderGame();renderHome();toast("今日の記録を取り消しました。")}function todayHistoryIndex(d){for(let i=d.history.length-1;i>=0;i--)if(d.history[i].date===todayKey())return i;return-1}
function celebrate(r,e,passed,moon){$("celebrationIcon").textContent=moon?"🌕":e.icon||"🌱";$("celebrationKicker").textContent=moon?"LEGENDARY REWARD":GUERRILLA_EVENTS[e.type]?e.title.toUpperCase():"SUCCESS";$("celebrationTitle").textContent=`+${fmtH(r.gained)}`;const parts=["通常 +1m"];if(r.weekendBonus)parts.push(`特別の日（${weekendLabel()}） +${r.weekendBonus}m`);if(GUERRILLA_EVENTS[e.type])parts.push(r.mode==="guarantee"?`${e.title} 最低保証 +${fmtH(r.eventBonus)}`:`${e.title} ×${e.multiplier}`);$("celebrationDescription").textContent=`豆の木は${fmtH(r.newHeight)}まで成長しました。${parts.join(" / ")}`;$("newMilestoneList").innerHTML="";if(passed.length){const head=document.createElement("div");head.className="new-milestone-chip";head.textContent=`📚 NEW × ${passed.length}　図鑑を新たに解放`;$("newMilestoneList").appendChild(head)}passed.slice(-5).forEach(m=>{const x=document.createElement("div");x.className="new-milestone-chip";x.textContent=`${m.icon} ${m.name} を突破！`;$("newMilestoneList").appendChild(x)});if(passed.length>5){const x=document.createElement("div");x.className="new-milestone-chip";x.textContent=`ほか ${passed.length-5} 件も図鑑に追加`;$("newMilestoneList").appendChild(x)}const d=activeData();if([3,7,14,30].includes(Number(d.currentStreak))){const x=document.createElement("div");x.className="new-milestone-chip";x.textContent=`🔥 ${d.currentStreak}日連続達成！`;$("newMilestoneList").appendChild(x)}if(moon){const x=document.createElement("div");x.className="new-milestone-chip";x.textContent="🌕 伝説級アイテム『月の加護』を獲得！";$("newMilestoneList").appendChild(x)}spawnCelebrationParticles();$("celebrationOverlay").classList.remove("hidden")}

function spawnCelebrationParticles(){document.querySelectorAll(".celebration-particle").forEach(x=>x.remove());const icons=["🌱","✨","🍃","⭐"];for(let i=0;i<22;i++){const p=document.createElement("span");p.className="celebration-particle";p.textContent=icons[i%icons.length];const a=(Math.PI*2*i/22)+(Math.random()*.3),dist=110+Math.random()*190;p.style.setProperty("--x",`${Math.cos(a)*dist}px`);p.style.setProperty("--y",`${Math.sin(a)*dist}px`);p.style.setProperty("--r",`${Math.round(Math.random()*540-270)}deg`);document.body.appendChild(p);setTimeout(()=>p.remove(),1400)}}

const ENCYCLOPEDIA_MISSIONS=[
{id:"mountain10",name:"山の入口",categories:["世界の山"],need:10,description:"世界の山を10件解放",reward:"前称号コレクションへの一歩"},
{id:"mountain20",name:"世界の山を巡る",categories:["世界の山"],need:20,description:"世界の山を20件解放",reward:"前称号「高峰を巡った」"},
{id:"mountain40",name:"高峰図鑑",categories:["世界の山"],need:40,description:"世界の山を40件解放",reward:"山岳コレクション上級"},
{id:"city10",name:"都市の観測者",categories:["建築","ランドマーク","構造物"],need:10,description:"建築・ランドマーク・構造物を10件解放",reward:"都市コレクション"},
{id:"city30",name:"巨塔の観測者",categories:["建築","ランドマーク","構造物"],need:30,description:"建築・ランドマーク・構造物を30件解放",reward:"前称号「巨塔を見届けた」"},
{id:"life15",name:"生命のスケール",categories:["生物"],need:15,description:"生物を15件解放",reward:"生物コレクション"},
{id:"nature20",name:"地球の地形",categories:["自然"],need:20,description:"自然を20件解放",reward:"自然コレクション"},
{id:"space10",name:"宇宙の入口",categories:["宇宙","軌道"],need:10,description:"宇宙・軌道を10件解放",reward:"宇宙コレクション"},
{id:"space30",name:"軌道の向こう側",categories:["宇宙","軌道"],need:30,description:"宇宙・軌道を30件解放",reward:"前称号「宇宙を知る」"},
{id:"celestial15",name:"天体サイズ研究",categories:["天体サイズ"],need:15,description:"天体サイズを15件解放",reward:"天体コレクション"},
{id:"all100",name:"百の発見",categories:null,need:100,description:"図鑑を合計100件解放",reward:"前称号「世界を知る」"},
{id:"all200",name:"二百の発見",categories:null,need:200,description:"図鑑を合計200件解放",reward:"前称号「世界を見渡す」"},
{id:"all300",name:"三百の発見",categories:null,need:300,description:"図鑑を合計300件解放",reward:"前称号「万象を集める」"}
];
function missionStatus(m){
  const unlockedIds=globalUnlockedMilestoneIds();
  const items=m.categories?MILESTONES.filter(x=>m.categories.includes(x.category)):MILESTONES.filter(x=>x.height>0);
  const count=items.filter(x=>unlockedIds.has(x.id)).length;
  return{count,total:items.length,complete:count>=m.need};
}
function missionCompletedById(id){const m=ENCYCLOPEDIA_MISSIONS.find(x=>x.id===id);return Boolean(m&&missionStatus(m).complete)}
function syncMissionRewards(){
  if(!appData.profile.missionRewards)appData.profile.missionRewards=[];
  ENCYCLOPEDIA_MISSIONS.forEach(m=>{const st=missionStatus(m);if(st.complete&&!appData.profile.missionRewards.includes(m.id))appData.profile.missionRewards.push(m.id)});
}
function openMissions(){syncMissionRewards();renderMissions();$("missionsOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function renderMissions(){const list=$("missionList");list.innerHTML="";let done=0;ENCYCLOPEDIA_MISSIONS.forEach(m=>{const st=missionStatus(m);if(st.complete)done++;const c=document.createElement("div");c.className=`mission-card ${st.complete?"complete":""}`;c.innerHTML=`<div class="mission-head"><strong>${escapeHtml(m.name)}</strong><span>${st.complete?"COMPLETE":`${Math.min(st.count,m.need)} / ${m.need}`}</span></div><p>${escapeHtml(m.description)}</p><div class="mini-progress"><span style="width:${Math.min(100,Math.round(st.count/m.need*100))}%"></span></div><div class="mission-reward">${st.complete?"✓ 達成済み":"図鑑を解放して進行"}<strong>${escapeHtml(m.reward||"")}</strong></div>`;list.appendChild(c)});$("missionProgress").textContent=`${done} / ${ENCYCLOPEDIA_MISSIONS.length}`}

function openEncyclopedia(){encyclopediaCategory="すべて";renderEncyclopedia();$("encyclopediaOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function renderEncyclopedia(){const d=activeData();syncUnlocks(d);const all=MILESTONES.filter(m=>m.height>0),u=all.filter(m=>isUnlocked(d,m)).length,t=all.length;$("encyclopediaSummary").innerHTML=`<div><strong>${u} / ${t}</strong><small>解放済み</small></div><div><strong>${Math.round(u/t*100)}%</strong><small>図鑑完成率</small></div>`;
  const categoryNames=[...new Set(all.map(m=>m.category))];
  $("categoryProgressGrid").innerHTML="";
  categoryNames.forEach(c=>{const items=all.filter(m=>m.category===c),done=items.filter(m=>isUnlocked(d,m)).length,pct=Math.round(done/items.length*100);const card=document.createElement("div");card.className="category-progress-card";card.innerHTML=`<strong>${escapeHtml(c)}　${done}/${items.length}</strong><small>${pct}% 解放</small><div class="mini-progress"><span style="width:${pct}%"></span></div>`;$("categoryProgressGrid").appendChild(card)});
  const cats=["すべて",...categoryNames];$("categoryTabs").innerHTML="";cats.forEach(c=>{const b=document.createElement("button");b.className=`category-tab ${c===encyclopediaCategory?"active":""}`;b.textContent=c;b.onclick=()=>{encyclopediaCategory=c;renderEncyclopedia()};$("categoryTabs").appendChild(b)});let rows=all.filter(m=>encyclopediaCategory==="すべて"||m.category===encyclopediaCategory);if(encyclopediaUnlockFilter==="unlocked")rows=rows.filter(m=>isUnlocked(d,m));if(encyclopediaUnlockFilter==="locked")rows=rows.filter(m=>!isUnlocked(d,m));const q=encyclopediaQuery.trim().toLowerCase();if(q)rows=rows.filter(m=>[m.name,m.category,m.country,m.region,m.description,...(m.trivia||[]),...(m.wildlife||[]),...(m.risks||[])].filter(Boolean).join(" ").toLowerCase().includes(q));rows.sort((a,b)=>encyclopediaSort==="desc"?b.height-a.height:a.height-b.height);$("encyclopediaList").innerHTML="";if(!rows.length){$("encyclopediaList").innerHTML='<div class="encyclopedia-empty">条件に一致する項目はありません。</div>';return}rows.forEach(m=>{const ok=isUnlocked(d,m),row=document.createElement("button");row.type="button";row.className=`encyclopedia-item ${ok?"":"locked"}`;row.innerHTML=`<span class="e-icon">${ok?m.icon:"❓"}</span><div><h3>${ok?m.name:"？？？"}</h3><p>${ok?m.category:"未到達"}${m.approximate&&ok?"・概算比較":""}</p>${ok&&(m.country||m.region)?`<p class="e-sub e-place">${[m.country,m.region].filter(Boolean).join(" / ")}</p>`:""}</div><span class="e-height">${fmtH(m.height)}</span>`;if(ok)row.onclick=()=>openMilestone(m);$("encyclopediaList").appendChild(row)})}

function recalcHabitStatsFromHistory(d){
  const rows=d.history||[];let maxHeight=0,maxStreak=0,weekendSuccess=0;const eventApplications={wind:0,storm:0,miracle:0};
  rows.forEach(x=>{maxHeight=Math.max(maxHeight,Number(x.before?.height||0),Number(x.after?.height||0));maxStreak=Math.max(maxStreak,Number(x.before?.currentStreak||0),Number(x.after?.currentStreak||0));if(x.type==="success"){if(isWeekendDate(x.date))weekendSuccess++;if(eventApplications[x.eventType]!==undefined)eventApplications[x.eventType]++}});
  d.stats={maxHeight:Math.max(maxHeight,Number(d.height||0)),maxStreak:Math.max(maxStreak,Number(d.currentStreak||0)),weekendSuccess,eventApplications};
}
function normalizedHistoryRows(d){
  const rows=(d.history||[]).filter(x=>x&&x.date&&["success","failure"].includes(x.type)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.editedAt||a.timestamp||"").localeCompare(String(b.editedAt||b.timestamp||"")));
  const byDate=new Map();rows.forEach(row=>byDate.set(row.date,row));return [...byDate.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function rebuildHabitFromHistory(habitId){
  const d=appData.habits[habitId];if(!d)return;
  const permanentUnlocked=new Set(Array.isArray(d.unlockedMilestones)?d.unlockedMilestones:[]);
  const rows=normalizedHistoryRows(d),state=initialHabit();let prevRecorded=null;
  rows.forEach(row=>{
    const before=snap(state);
    if(row.type==="success"){
      const e=eventForDate(row.date),r=successCalc(state.height,e,row.date);state.height=r.newHeight;
      const continuous=prevRecorded?.type==="success"&&prevRecorded.date===previousDateKey(row.date);
      state.currentStreak=continuous?Number(state.currentStreak||0)+1:1;
      state.totalSuccess=Number(state.totalSuccess||0)+1;state.consecutiveFailures=0;state.lastActionDate=row.date;state.lastActionType="success";
      syncUnlocks(state);const moonAwarded=awardMoon(state);
      Object.assign(row,{eventType:e.type,weekendBonus:r.weekendBonus,eventMode:r.mode,eventBonus:r.eventBonus,resetOccurred:false,moonAwarded:Boolean(moonAwarded),before,after:snap(state)});
    }else{
      const r=failureCalc(state),resetOccurred=Number(state.consecutiveFailures||0)>=2;
      state.height=r.newHeight;state.currentStreak=0;state.consecutiveFailures=r.nextFailures;state.lastActionDate=row.date;state.lastActionType="failure";if(r.usesMoonBlessing)state.moonBlessing=false;
      Object.assign(row,{usedMoonBlessing:r.usesMoonBlessing,resetOccurred,before,after:snap(state)});
    }
    prevRecorded=row;
  });
  d.history=rows;d.height=state.height;d.currentStreak=calendarSuccessStreak({history:rows});d.totalSuccess=state.totalSuccess;d.consecutiveFailures=state.consecutiveFailures;d.lastActionDate=state.lastActionDate;d.lastActionType=state.lastActionType;d.moonBlessing=state.moonBlessing;d.moonBlessingEarned=state.moonBlessingEarned;
  syncUnlocks(d);d.unlockedMilestones=[...new Set([...permanentUnlocked,...(d.unlockedMilestones||[])])];recalcHabitStatsFromHistory(d);
}
function rebuildHabitFromDate(habitId,startDate){rebuildHabitFromHistory(habitId)}
function calendarSuccessStreak(d){
  const rows=normalizedHistoryRows(d);if(!rows.length)return 0;
  const last=rows[rows.length-1],ago=daysAgoFromKey(last.date);if(last.type!=="success"||ago>1)return 0;
  let count=1,expected=previousDateKey(last.date);for(let i=rows.length-2;i>=0;i--){const x=rows[i];if(x.date!==expected||x.type!=="success")break;count++;expected=previousDateKey(x.date)}return count;
}
function refreshStreaksForElapsedGaps(){Object.values(appData.habits||{}).forEach(d=>{d.currentStreak=calendarSuccessStreak(d)})}
function recomputeAllHabits(){Object.keys(HABITS).forEach(rebuildHabitFromHistory)}
let recordEditContext=null;
function isRewardEditDateUnlocked(dateKey){
  return Boolean(appData.settings?.rewardEditUnlockedDates?.[dateKey]);
}
function unlockRewardEditDate(dateKey){
  if(!appData.settings.rewardEditUnlockedDates)appData.settings.rewardEditUnlockedDates={};
  appData.settings.rewardEditUnlockedDates[dateKey]={unlockedAt:new Date().toISOString(),reason:"rewarded_ad"};
  saveData();
}
function cleanupRewardEditUnlocks(){
  const map=appData.settings?.rewardEditUnlockedDates||{};
  Object.keys(map).forEach(k=>{if(daysAgoFromKey(k)>2||daysAgoFromKey(k)<0)delete map[k]});
}
async function requestRewardAdRecordEdit(dateKey){
  if(!requiresRewardAdForEdit(dateKey))return true;
  if(isRewardEditDateUnlocked(dateKey))return true;
  let granted=false;
  if(window.BeanGrowthAds&&typeof window.BeanGrowthAds.showRewardedRecordEdit==="function"){
    try{granted=Boolean(await window.BeanGrowthAds.showRewardedRecordEdit({date:dateKey,placement:"record_edit_day_minus_2"}))}catch(e){console.error(e);granted=false}
  }else{
    granted=confirm("一昨日の記録変更にはリワード広告が必要です。\n\n現在は広告SDK接続前の開発版のため、テスト解放して続けますか？\n\n一度解放すると、その日の12カテゴリすべてを編集できます。");
  }
  if(granted){unlockRewardEditDate(dateKey);toast(`${dateKey}の編集を解放しました。`)}
  return granted;
}
function openRecordEdit(habitId,dateKey){
  if(!isEditableRecordDate(dateKey)){toast("3日前以前の記録は確定済みです。");return}
  const h=HABITS[habitId],d=appData.habits[habitId],rec=historyForDate(d,dateKey),ago=daysAgoFromKey(dateKey);
  recordEditContext={habitId,dateKey};
  $("recordEditTitle").textContent=`${h.icon} ${h.name}・${dateKey}`;
  $("recordEditDescription").textContent=rec?`現在の記録：${rec.type==="success"?"成功":"継続できず"}`:"現在の記録：未記録";
  const notice=$("recordEditAdNotice"),unlocked=ago===2&&isRewardEditDateUnlocked(dateKey);notice.classList.toggle("hidden",ago!==2);notice.textContent=ago===2?(unlocked?"✅ この日は編集解放済みです。12カテゴリすべて編集できます。":"🎬 一昨日の変更はリワード広告を1回見ると、その日全体（12カテゴリ）の編集が解放されます。") : "";
  $("recordEditOverlay").classList.remove("hidden");
}
function closeRecordEdit(){$("recordEditOverlay").classList.add("hidden");recordEditContext=null}
async function applyRecordEdit(type,bypassStartSeverity=false){
  if(!recordEditContext)return;const {habitId,dateKey}=recordEditContext;
  if(type&&!bypassStartSeverity&&!habitHasStarted(habitId)){openStartSeverityModal(habitId,`edit:${type}`);return}
  if(!isEditableRecordDate(dateKey)){closeRecordEdit();toast("編集期限を過ぎています。");return}
  if(!(await requestRewardAdRecordEdit(dateKey))){toast("編集はキャンセルされました。");return}
  const d=appData.habits[habitId],existing=historyForDate(d,dateKey);
  d.history=(d.history||[]).filter(x=>x.date!==dateKey);
  if(type){d.history.push({id:existing?.id||"edit-"+Date.now().toString(36),date:dateKey,timestamp:existing?.timestamp||new Date().toISOString(),editedAt:new Date().toISOString(),editType:daysAgoFromKey(dateKey)===2?"rewarded":"standard",type})}
  rebuildHabitFromHistory(habitId);syncHabitStartMetadata(habitId);saveData();renderCalendar();renderHome();if(currentHabitId===habitId)renderGame();closeRecordEdit();toast(type?`${dateKey}を${type==="success"?"成功":"継続できず"}に更新しました。`:`${dateKey}を未記録に戻しました。`);
}
function historyForDate(d,date){return [...(d.history||[])].reverse().find(x=>x.date===date)||null}

let reportHabitId="noMasturbation";
function openReport(){ensureValidSelectedHabits();if(!isHabitVisible(reportHabitId)||appData.settings.habitPaused?.[reportHabitId])reportHabitId=visibleHabitIds()[0]||"noMasturbation";renderReport();$("reportOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function statsForRange(d,start,end){
  const rows=(d.history||[]).filter(x=>{const dt=new Date(x.date+"T00:00:00");return dt>=start&&dt<=end});
  const success=rows.filter(x=>x.type==="success").length,failure=rows.filter(x=>x.type==="failure").length;
  const gain=rows.reduce((a,x)=>a+(Number(x.after?.height||0)-Number(x.before?.height||0)),0);
  return{success,failure,gain,records:rows.length};
}
function renderReport(){
  renderHabitTabs("reportHabitTabs",reportHabitId,id=>{reportHabitId=id;renderReport()});
  const d=appData.habits[reportHabitId],now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const ws=new Date(today);ws.setDate(today.getDate()-((today.getDay()+6)%7));const we=new Date(ws);we.setDate(ws.getDate()+6);
  const ms=new Date(now.getFullYear(),now.getMonth(),1),me=new Date(now.getFullYear(),now.getMonth()+1,0);
  const w=statsForRange(d,ws,we),m=statsForRange(d,ms,me);
  $("weeklyReportCard").innerHTML=`<h3>今週</h3><div class="report-grid"><div class="report-stat"><strong>${w.success}日</strong><small>成功</small></div><div class="report-stat"><strong>${w.failure}日</strong><small>失敗</small></div><div class="report-stat"><strong>${fmtH(w.gain)}</strong><small>高さ増減</small></div><div class="report-stat"><strong>${d.currentStreak}日</strong><small>現在連続</small></div></div>`;
  const rr=recordRateForMonth(d,now),finalize=monthRankingFinalizeKey(now.getFullYear(),now.getMonth());
  $("monthlyReportCard").innerHTML=`<h3>${now.getFullYear()}年${now.getMonth()+1}月</h3><div class="report-grid"><div class="report-stat"><strong>${m.success}日</strong><small>成功</small></div><div class="report-stat"><strong>${m.failure}日</strong><small>失敗</small></div><div class="report-stat"><strong>${fmtH(m.gain)}</strong><small>高さ増減</small></div><div class="report-stat"><strong>${rr.rate}%</strong><small>記録率 ${rr.recorded}/${rr.eligible}</small></div></div><p class="records-note">月間ランキングは月末の遡り修正を待ち、翌月3日に前月分を確定・発表する予定です。</p>`;
}

function openCalendar(){
  ensureValidSelectedHabits();
  if(!calendarHabitId)calendarHabitId=currentHabitId||visibleHabitIds()[0]||"noMasturbation";
  calendarCursor=new Date();renderCalendar();$("calendarOverlay").classList.remove("hidden");window.scrollTo(0,0);
}
function renderHabitTabs(containerId,selected,onSelect){
  const c=$(containerId);c.innerHTML="";
  visibleHabitIds().map(id=>HABITS[id]).forEach(h=>{const b=document.createElement("button");b.className=`calendar-habit-tab ${h.id===selected?"active":""}`;b.textContent=`${h.icon} ${h.name}`;b.onclick=()=>onSelect(h.id);c.appendChild(b)});
}
function renderCalendar(){
  renderHabitTabs("calendarHabitTabs",calendarHabitId,id=>{calendarHabitId=id;renderCalendar()});
  const d=appData.habits[calendarHabitId],y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  $("calendarMonthLabel").textContent=`${y}年${m+1}月`;
  const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),today=new Date(),grid=$("calendarGrid");grid.innerHTML="";
  for(let i=0;i<first.getDay();i++){const x=document.createElement("div");x.className="calendar-day blank";grid.appendChild(x)}
  let sCount=0,f=0,u=0;
  for(let day=1;day<=days;day++){
    const date=new Date(y,m,day),key=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,rec=historyForDate(d,key),future=date>new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const cell=document.createElement("button");cell.type="button";let state=rec?.type==="success"?"success":rec?.type==="failure"?"failure":"unrecorded";
    if(state==="success")sCount++;else if(state==="failure")f++;else if(!future)u++;
    const editable=!future&&isEditableRecordDate(key);
    cell.className=`calendar-day ${state} ${future?"future":""} ${key===todayKey()?"today":""} ${editable?"editable":"locked"}`;
    cell.disabled=future;
    cell.innerHTML=`<strong>${day}</strong><span class="day-mark">${rec?.type==="success"?"✓":rec?.type==="failure"?"×":"·"}</span>${requiresRewardAdForEdit(key)?'<span class="edit-lock">🎬</span>':editable?'<span class="edit-lock">✎</span>':""}`;
    if(editable)cell.onclick=()=>openRecordEdit(calendarHabitId,key);
    grid.appendChild(cell);
  }
  const rr=recordRateForMonth(d,new Date(y,m,1));
  $("calendarMonthStats").innerHTML=`<div><strong>${sCount}</strong><small>成功</small></div><div><strong>${f}</strong><small>継続できず</small></div><div><strong>${u}</strong><small>未記録</small></div><div><strong>${rr.rate}%</strong><small>記録率 ${rr.recorded}/${rr.eligible}</small></div>`;
}
function allTimeMaxHeight(d){return Math.max(Number(d.stats?.maxHeight||0),Number(d.height||0),...(d.history||[]).flatMap(x=>[Number(x.before?.height||0),Number(x.after?.height||0)]))}
function allTimeMaxStreak(d){return Math.max(Number(d.stats?.maxStreak||0),Number(d.currentStreak||0),...(d.history||[]).flatMap(x=>[Number(x.before?.currentStreak||0),Number(x.after?.currentStreak||0)]))}

function recordedSuccessRate(d,days=null){
  const cutoff=days?new Date(Date.now()-(days-1)*86400000):null;
  const rows=(d.history||[]).filter(x=>!cutoff||new Date(x.date+"T00:00:00")>=new Date(cutoff.getFullYear(),cutoff.getMonth(),cutoff.getDate()));
  const success=rows.filter(x=>x.type==="success").length,fail=rows.filter(x=>x.type==="failure").length,total=success+fail;
  return total?Math.round(success/total*100):0;
}
function averageRecoveryDays(d){
  const rows=(d.history||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));let vals=[];
  for(let i=0;i<rows.length;i++)if(rows[i].type==="failure"){
    const next=rows.slice(i+1).find(x=>x.type==="success");if(next){
      const a=new Date(rows[i].date+"T00:00:00"),b=new Date(next.date+"T00:00:00"),days=Math.round((b-a)/86400000);if(days>=0)vals.push(days);
    }
  }
  return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:null;
}
function bestSimultaneousHabitCount(){
  const counts={};Object.values(appData.habits).forEach(d=>(d.history||[]).filter(x=>x.type==="success").forEach(x=>counts[x.date]=(counts[x.date]||0)+1));
  return Math.max(0,...Object.values(counts));
}

const WEEKDAY_NAMES=["日","月","火","水","木","金","土"];
function userAnalysisStartDate(){const raw=new Date(appData.profile.createdAt||Date.now());return new Date(raw.getFullYear(),raw.getMonth(),raw.getDate(),12)}
function blankAnalysisBucket(label){return{label,eligible:0,success:0,failure:0,unrecorded:0,resets:0,recorded:0,recordRate:0,failureRate:0,resetRate:0}}
function finalizeAnalysisBucket(b){b.recorded=b.success+b.failure;b.recordRate=b.eligible?Math.round(b.recorded/b.eligible*1000)/10:0;b.failureRate=b.recorded?Math.round(b.failure/b.recorded*1000)/10:0;b.resetRate=b.recorded?Math.round(b.resets/b.recorded*1000)/10:0;return b}
function isResetHistoryRow(x){return Boolean(x?.resetOccurred)||(x?.type==="failure"&&Number(x?.before?.consecutiveFailures||0)>=2&&Number(x?.after?.height||0)===0)}
function personalWeekdayStats(d){
  const start=userAnalysisStartDate(),end=dateFromKey(todayKey()),out=WEEKDAY_NAMES.map(name=>blankAnalysisBucket(name)),byDate=new Map(normalizedHistoryRows(d).map(x=>[x.date,x]));
  for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1)){const key=dateKeyFromDate(cur),x=byDate.get(key),w=out[cur.getDay()];w.eligible++;if(x?.type==="success")w.success++;else if(x?.type==="failure"){w.failure++;if(isResetHistoryRow(x))w.resets++}else w.unrecorded++}
  return out.map(finalizeAnalysisBucket);
}
function personalMonthDayStats(d){
  const start=userAnalysisStartDate(),end=dateFromKey(todayKey()),out=Array.from({length:31},(_,i)=>blankAnalysisBucket(String(i+1))),byDate=new Map(normalizedHistoryRows(d).map(x=>[x.date,x]));
  for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1)){const key=dateKeyFromDate(cur),x=byDate.get(key),b=out[cur.getDate()-1];b.eligible++;if(x?.type==="success")b.success++;else if(x?.type==="failure"){b.failure++;if(isResetHistoryRow(x))b.resets++}else b.unrecorded++}
  return out.map(finalizeAnalysisBucket).filter(x=>x.eligible>0);
}
function categoryAnalyticsRows(){
  return Object.keys(HABITS).map(id=>{const d=appData.habits[id],rows=normalizedHistoryRows(d),success=rows.filter(x=>x.type==="success").length,failure=rows.filter(x=>x.type==="failure").length,resets=rows.filter(isResetHistoryRow).length,rr=recordRateForMonth(d,new Date());const recorded=success+failure;return{id,name:HABITS[id].name,icon:HABITS[id].icon,success,failure,resets,recorded,failureRate:recorded?Math.round(failure/recorded*1000)/10:0,currentMonthRecordRate:rr.rate}}).sort((a,b)=>b.recorded-a.recorded);
}
function renderPersonalAnalytics(d){
  const rows=personalWeekdayStats(d),el=$("personalWeekdayAnalytics");if(!el)return;
  const overall=personalOverallStats(d),overallEl=$("personalOverallAnalytics");
  if(overallEl)overallEl.innerHTML=`<div><small>成功率</small><strong>${overall.successRate}%</strong><span>${overall.success}/${overall.recorded}記録</span></div><div><small>失敗率</small><strong>${overall.failureRate}%</strong><span>${overall.failure}/${overall.recorded}記録</span></div><div><small>記録率</small><strong>${overall.recordRate}%</strong><span>${overall.recorded}/${overall.eligible}日</span></div><div><small>リセット</small><strong>${overall.resets}回</strong><span>累計</span></div>`;
  el.innerHTML=rows.map(w=>`<div class="weekday-stat"><strong>${w.label}</strong><span>成功 ${w.success}</span><span>失敗 ${w.failure}</span><span>未記録 ${w.unrecorded}</span><small>失敗率 ${w.failureRate}% / 記録率 ${w.recordRate}% / リセット ${w.resets}</small></div>`).join("");
  const measured=rows.filter(x=>x.recorded>0),risk=measured.slice().sort((a,b)=>b.failureRate-a.failureRate||b.recorded-a.recorded)[0],stable=measured.slice().sort((a,b)=>a.failureRate-b.failureRate||b.recorded-a.recorded)[0],reset=rows.slice().sort((a,b)=>b.resets-a.resets||b.recorded-a.recorded)[0];
  $("personalRiskSummary").innerHTML=`<div><small>失敗率が高い曜日</small><strong>${risk?risk.label+"曜日 "+risk.failureRate+"%":"データ不足"}</strong></div><div><small>安定している曜日</small><strong>${stable?stable.label+"曜日 "+stable.failureRate+"%":"データ不足"}</strong></div><div><small>リセット最多</small><strong>${reset&&reset.resets?reset.label+"曜日 "+reset.resets+"回":"まだありません"}</strong></div>`;
  const days=personalMonthDayStats(d),dayRisk=days.filter(x=>x.recorded>=2).sort((a,b)=>b.failureRate-a.failureRate||b.recorded-a.recorded).slice(0,8);
  const dayEl=$("personalMonthDayAnalytics");if(dayEl)dayEl.innerHTML=dayRisk.length?dayRisk.map(x=>`<div class="analysis-list-row"><strong>${x.label}日</strong><span>失敗率 ${x.failureRate}%</span><small>記録 ${x.recorded}件 / リセット ${x.resets}回</small></div>`).join(""):'<div class="records-note">同じ日付の記録が2件以上たまると、月内日付の傾向を表示します。</div>';
  const catEl=$("personalCategoryAnalytics");if(catEl)catEl.innerHTML=categoryAnalyticsRows().map(x=>`<div class="analysis-list-row"><strong>${x.icon} ${escapeHtml(x.name)}</strong><span>失敗率 ${x.failureRate}%</span><small>累計記録 ${x.recorded}件 / リセット ${x.resets}回 / 今月記録率 ${x.currentMonthRecordRate}%</small></div>`).join("");
}
function renderGlobalAnalyticsPreview(){
  const el=$("globalAnalyticsPreview");if(!el)return;
  el.innerHTML='<div class="global-placeholder"><strong>🌐 グローバル統計を読み込み中...</strong><p>匿名化した集計値だけを使用します。生の成功日・失敗日は他プレイヤーへ公開しません。</p></div>';
  window.dispatchEvent(new CustomEvent("bean-growth:request-global-analytics"));
}
window.BeanGrowthGlobalAnalytics={
  render(payload){
    const el=$("globalAnalyticsPreview");if(!el)return;
    if(!payload||!payload.users){el.innerHTML='<div class="global-placeholder"><strong>🌐 まだ集計データがありません</strong><p>参加者が増えると曜日別・日付別・カテゴリ別の傾向が表示されます。</p><div class="global-sample"><span>対象 0人</span><span>記録 0件</span><span>リセット 0件</span></div></div>';return}
    const w=(payload.weekdays||[]).filter(x=>x.recorded>0),risk=w.slice().sort((a,b)=>b.failureRate-a.failureRate||b.recorded-a.recorded)[0],reset=w.slice().sort((a,b)=>b.resets-a.resets||b.recorded-a.recorded)[0],day=(payload.monthDays||[]).filter(x=>x.recorded>=2).sort((a,b)=>b.failureRate-a.failureRate||b.recorded-a.recorded)[0];
    const habit=(payload.habits||[]).filter(x=>x.recorded>0).sort((a,b)=>b.failureRate-a.failureRate||b.recorded-a.recorded)[0];
    const reference=payload.users<30?'<span class="analysis-reference">※母数が少ないため参考値</span>':'';
    el.innerHTML=`<div class="global-headline"><div><small>GLOBAL SAMPLE</small><strong>${payload.users.toLocaleString("ja-JP")}人</strong>${reference}</div><div><small>記録件数</small><strong>${payload.records.toLocaleString("ja-JP")}件</strong></div><div><small>リセット</small><strong>${payload.resets.toLocaleString("ja-JP")}件</strong></div></div><div class="analysis-summary-card"><div><small>失敗率が高い曜日</small><strong>${risk?risk.label+"曜日 "+risk.failureRate+"%":"—"}</strong></div><div><small>リセット最多曜日</small><strong>${reset&&reset.resets?reset.label+"曜日 "+reset.resets+"回":"—"}</strong></div><div><small>失敗率が高い月内日</small><strong>${day?day.label+"日 "+day.failureRate+"%":"—"}</strong></div></div><div class="global-sample"><span>${habit?`高失敗率カテゴリ：${escapeHtml(habit.name)} ${habit.failureRate}%`:'カテゴリデータ待ち'}</span><span>集計更新 ${payload.updatedAt?escapeHtml(payload.updatedAt):"—"}</span></div>`;
  },
  error(message){const el=$("globalAnalyticsPreview");if(el)el.innerHTML=`<div class="global-placeholder"><strong>🌐 グローバル統計を取得できませんでした</strong><p>${escapeHtml(message||"通信状態またはFirestoreルールを確認してください。")}</p></div>`}
};

function currentMonthKey(base=new Date()){return `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}`}
function previousMonthBase(base=new Date()){return new Date(base.getFullYear(),base.getMonth()-1,1,12)}
function rankingFinalizeInfo(base=new Date()){
  const prev=previousMonthBase(base),key=currentMonthKey(prev),finalize=new Date(base.getFullYear(),base.getMonth(),3,12);
  const finalized=base>=finalize;
  return{key,finalized,finalizeDate:dateKeyFromDate(finalize),label:`${prev.getFullYear()}年${prev.getMonth()+1}月`};
}
function monthlyRankingSnapshot(habitId,base){
  const d=appData.habits[habitId],start=new Date(base.getFullYear(),base.getMonth(),1,12),end=new Date(base.getFullYear(),base.getMonth()+1,0,12);
  const rows=normalizedHistoryRows(d).filter(x=>{const dt=dateFromKey(x.date);return dt>=start&&dt<=end});
  const success=rows.filter(x=>x.type==="success").length,failure=rows.filter(x=>x.type==="failure").length,resets=rows.filter(isResetHistoryRow).length,rr=recordRateForMonth(d,base);
  return{habitId,month:currentMonthKey(base),severity:severityOf(habitId),success,failure,resets,records:success+failure,recordRate:rr.rate,maxHeight:allTimeMaxHeight(d),maxStreak:allTimeMaxStreak(d),currentStreak:Number(d.currentStreak||0),generatedAt:new Date().toISOString()};
}
function ensureRankingFoundation(){
  if(!appData.ranking)appData.ranking={finalizedMonths:{},pendingSubmissions:{}};
  if(!appData.ranking.finalizedMonths)appData.ranking.finalizedMonths={};
  if(!appData.ranking.pendingSubmissions)appData.ranking.pendingSubmissions={};
  const info=rankingFinalizeInfo(new Date());
  if(info.finalized&&!appData.ranking.finalizedMonths[info.key]){
    const prev=previousMonthBase(new Date());
    appData.ranking.finalizedMonths[info.key]=Object.fromEntries(Object.keys(HABITS).map(id=>[id,monthlyRankingSnapshot(id,prev)]));
  }
}
function renderRankingFoundation(){
  ensureRankingFoundation();
  const el=$("rankingFoundationPreview");if(!el)return;
  const info=rankingFinalizeInfo(new Date()),stored=Boolean(appData.ranking.finalizedMonths?.[info.key]);
  el.innerHTML=`<div class="foundation-grid">
    <div><small>前月ランキング</small><strong>${escapeHtml(info.label)}</strong></div>
    <div><small>確定日</small><strong>${escapeHtml(info.finalizeDate)}</strong></div>
    <div><small>現在状態</small><strong>${info.finalized?"確定期間":"修正受付期間"}</strong></div>
    <div><small>ローカル確定スナップショット</small><strong>${stored?"READY":"WAIT"}</strong></div>
  </div><p class="records-note">v5ではこのスナップショット形式をサーバー側で検証し、全体・カテゴリ別・LIGHT/NORMAL/HEAVY別ランキングへ送信します。</p>`;
}
function encyclopediaQualityAudit(){
  const facts=MILESTONES.map(m=>({name:m.name,fact:String(m.funFact||selectedMilestoneFact(m)||"").trim()}));
  const counts={};facts.forEach(x=>{const key=x.fact.toLowerCase();counts[key]=(counts[key]||0)+1});
  const duplicate=facts.filter(x=>x.fact&&counts[x.fact.toLowerCase()]>1);
  const weak=facts.filter(x=>x.fact.length<24||/準備中|詳しくは|有名です|知られています[。]?$/u.test(x.fact));
  return{total:facts.length,duplicate:[...new Set(duplicate.map(x=>x.fact))].length,weak:weak.length};
}
function renderEncyclopediaQuality(){
  const el=$("encyclopediaQualityAudit");if(!el)return;
  const q=encyclopediaQualityAudit();
  el.innerHTML=`<div class="foundation-grid"><div><small>図鑑項目</small><strong>${q.total}</strong></div><div><small>完全重複豆知識</small><strong>${q.duplicate}</strong></div><div><small>短い/要確認候補</small><strong>${q.weak}</strong></div><div><small>表示方式</small><strong>1項目1豆知識</strong></div></div><p class="records-note">${q.duplicate===0?"完全一致の豆知識重複は検出されていません。":"重複候補があります。"} 内容の事実確認が必要な項目は、今後も個別に精査できます。</p>`;
}
function renderPublicProfileControls(){
  const pub=appData.profile.publicProfile||{},sel=$("publicRepresentativeHabit");
  if(sel){
    sel.innerHTML=Object.values(HABITS).map(h=>`<option value="${h.id}">${h.icon} ${escapeHtml(h.name)}</option>`).join("");
    sel.value=HABITS[pub.representativeHabitId]?pub.representativeHabitId:"noMasturbation";
  }
  [["sharePublicHeight","shareHeight"],["sharePublicStreak","shareStreak"],["sharePublicEncyclopedia","shareEncyclopedia"],["sharePublicSeverity","shareSeverity"]].forEach(([id,key])=>{const e=$(id);if(e)e.checked=pub[key]!==false});
}
function savePublicProfileSettings(){
  const pub=appData.profile.publicProfile||(appData.profile.publicProfile={});
  const rep=$("publicRepresentativeHabit")?.value;
  if(HABITS[rep])pub.representativeHabitId=rep;
  pub.shareHeight=$("sharePublicHeight")?.checked!==false;
  pub.shareStreak=$("sharePublicStreak")?.checked!==false;
  pub.shareEncyclopedia=$("sharePublicEncyclopedia")?.checked!==false;
  pub.shareSeverity=$("sharePublicSeverity")?.checked!==false;
  saveData();renderProfile();toast("公開プロフィール設定を保存しました。");
}
function personalOverallStats(d){
  const start=userAnalysisStartDate(),end=dateFromKey(todayKey()),rows=normalizedHistoryRows(d),success=rows.filter(x=>x.type==="success").length,failure=rows.filter(x=>x.type==="failure").length,resets=rows.filter(isResetHistoryRow).length;
  let eligible=0;for(let cur=new Date(start);cur<=end;cur.setDate(cur.getDate()+1))eligible++;
  const recorded=success+failure;
  return{success,failure,resets,recorded,eligible,successRate:recorded?Math.round(success/recorded*1000)/10:0,failureRate:recorded?Math.round(failure/recorded*1000)/10:0,recordRate:eligible?Math.round(recorded/eligible*1000)/10:0};
}



function publicProfilePayload(){
  const pub=appData.profile.publicProfile||{},repId=HABITS[pub.representativeHabitId]?pub.representativeHabitId:"noMasturbation",rep=appData.habits[repId],title=equippedTitle();
  const activeHabits=visibleHabitIds().map(id=>{const d=appData.habits[id];return{habitId:id,name:HABITS[id].name,icon:HABITS[id].icon,maxStreak:pub.shareStreak===false?null:allTimeMaxStreak(d),severity:pub.shareSeverity===false?null:severityOf(id)}});
  const payload={schemaVersion:4,playerId:appData.profile.playerId,nickname:appData.profile.nickname,goal:String(pub.goal||"").slice(0,80),firstRecordDate:firstEverRecordDate(),representativeHabitId:repId,representativeHabitName:HABITS[repId].name,title:{icon:title.icon,text:title.text},activeHabits,updatedAt:appData.profile.lastLocalChangeAt||new Date().toISOString()};
  if(pub.shareSeverity!==false)payload.severity=severityOf(repId);
  if(pub.shareHeight!==false)payload.maxHeight=allTimeMaxHeight(rep);
  if(pub.shareStreak!==false)payload.maxStreak=allTimeMaxStreak(rep);
  if(pub.shareEncyclopedia!==false)payload.encyclopediaUnlocked=globalUnlockedMilestoneCount();
  return payload;
}
function playerSearchKey(){return String(appData.profile.playerId||"").replace(/-/g,"").toUpperCase()}
function friendFoundationSummary(){
  const p=publicProfilePayload();
  return{
    playerId:p.playerId,
    searchKey:playerSearchKey(),
    publicFields:Object.keys(p).filter(k=>!["schemaVersion","updatedAt"].includes(k)),
    ready:Boolean(validPlayerId(p.playerId)&&validNickname(p.nickname)),
    googleLinked:Boolean(appData.profile.account?.googleLinked)
  };
}
function releasePeriodHabitSnapshot(habitId){
  const d=appData.habits[habitId],release=dateFromKey(OFFICIAL_RELEASE_DATE),rows=normalizedHistoryRows(d).filter(x=>dateFromKey(x.date)>=release);
  const success=rows.filter(x=>x.type==="success").length,failure=rows.filter(x=>x.type==="failure").length,resets=rows.filter(isResetHistoryRow).length;
  const baseline=Number(rows[0]?.before?.height??d.height??0),heights=rows.flatMap(x=>[Number(x.before?.height??baseline),Number(x.after?.height??baseline)]);
  const releaseGrowth=Math.max(0,(heights.length?Math.max(...heights):baseline)-baseline),eligible=Math.max(1,Math.floor((new Date()-release)/86400000)+1);
  return{habitId,severity:severityOf(habitId),success,failure,resets,records:success+failure,recordRate:Math.min(100,Math.round((success+failure)/eligible*1000)/10),maxHeight:releaseGrowth,maxStreak:allTimeMaxStreak(d),currentStreak:Number(d.currentStreak||0),releaseDate:OFFICIAL_RELEASE_DATE,generatedAt:new Date().toISOString()};
}
function allTimeRankingSnapshot(){
  const rows=Object.keys(HABITS).map(releasePeriodHabitSnapshot);
  return{month:"all-time",period:"all-time",releaseDate:OFFICIAL_RELEASE_DATE,playerId:appData.profile.playerId,totalHeight:rows.reduce((s,x)=>s+Number(x.maxHeight||0),0),records:rows.reduce((s,x)=>s+Number(x.records||0),0),success:rows.reduce((s,x)=>s+Number(x.success||0),0),failure:rows.reduce((s,x)=>s+Number(x.failure||0),0),resets:rows.reduce((s,x)=>s+Number(x.resets||0),0),habits:rows,generatedAt:new Date().toISOString()};
}

function rankingOverallSnapshot(base=new Date()){
  const rows=Object.keys(HABITS).map(id=>monthlyRankingSnapshot(id,base));
  return{
    month:currentMonthKey(base),
    playerId:appData.profile.playerId,
    totalHeight:rows.reduce((s,x)=>s+Number(x.maxHeight||0),0),
    records:rows.reduce((s,x)=>s+Number(x.records||0),0),
    success:rows.reduce((s,x)=>s+Number(x.success||0),0),
    failure:rows.reduce((s,x)=>s+Number(x.failure||0),0),
    resets:rows.reduce((s,x)=>s+Number(x.resets||0),0),
    habits:rows,
    generatedAt:new Date().toISOString()
  };
}
function rankingSubmissionPreview(){
  const now=new Date(),current=rankingOverallSnapshot(now),prevBase=previousMonthBase(now),previous=rankingOverallSnapshot(prevBase),info=rankingFinalizeInfo(now);
  return{schemaVersion:3,playerId:appData.profile.playerId,current,previous,allTime:allTimeRankingSnapshot(),previousFinalized:info.finalized,previousFinalizeDate:info.finalizeDate,releaseDate:OFFICIAL_RELEASE_DATE};
}
function integrityFingerprint(){
  const summary={
    playerId:appData.profile.playerId,
    schemaVersion:appData.schemaVersion,
    habits:Object.fromEntries(Object.keys(HABITS).map(id=>{
      const d=appData.habits[id],rows=normalizedHistoryRows(d).map(x=>[x.date,x.type,Number(x.after?.height??0),Number(x.after?.currentStreak??0),Number(x.after?.consecutiveFailures??0)]);
      return[id,{startedAt:d.startedAt,startSeverity:d.startSeverity,rows}];
    }))
  };
  return hashString(JSON.stringify(summary)).toString(16).padStart(8,"0");
}
function runRegressionSuite(){
  const tests=[];
  const add=(name,ok,detail="")=>tests.push({name,ok:Boolean(ok),detail});
  add("Schema",Number(appData.schemaVersion)>=16,`v${appData.schemaVersion}`);
  add("Player ID",validPlayerId(appData.profile.playerId),appData.profile.playerId||"missing");
  add("Nickname",validNickname(appData.profile.nickname),appData.profile.nickname||"missing");
  const structure=validateAppData(appData);add("基本データ構造",structure.ok,structure.ok?"OK":structure.errors.slice(0,2).join(" / "));
  const startMeta=Object.keys(HABITS).every(id=>{const d=appData.habits[id],rows=normalizedHistoryRows(d);return rows.length?Boolean(d.startedAt&&SEVERITY_LEVELS.includes(d.startSeverity)):!d.startedAt});
  add("開始日・開始時深刻度",startMeta,startMeta?"整合":"要確認");
  const severity=Object.keys(HABITS).every(id=>SEVERITY_LEVELS.includes(severityOf(id)));add("深刻度",severity,severity?"全12カテゴリ正常":"要確認");
  const publicPayload=publicProfilePayload(),leak=["localId","firebaseUid","email","history","devices"].some(k=>Object.prototype.hasOwnProperty.call(publicPayload,k));
  add("公開プロフィール分離",!leak,!leak?"非公開情報なし":"公開情報に不要項目あり");
  const rank=rankingSubmissionPreview();add("ランキング送信形式",Boolean(rank.current?.habits?.length===Object.keys(HABITS).length),"12カテゴリ");
  add("整合性フィンガープリント",/^[0-9a-f]{8}$/.test(integrityFingerprint()),integrityFingerprint());
  return{ok:tests.every(x=>x.ok),tests,checkedAt:new Date().toISOString()};
}
function renderProfileFoundation(){
  const el=$("profileOnlineFoundation");if(!el)return;
  const f=friendFoundationSummary(),auth=window.BeanGrowthAuthReadiness||null;
  const google=appData.profile.account?.googleLinked?"Google連携済み":auth?.googleProviderReady?"Googleログイン利用可能":"Googleログイン準備中";
  el.innerHTML=`<div class="foundation-grid">
    <div><small>Player ID検索キー</small><strong>${escapeHtml(f.searchKey)}</strong></div>
    <div><small>公開プロフィール</small><strong>${f.ready?"READY":"CHECK"}</strong></div>
    <div><small>Google連携</small><strong>${escapeHtml(google)}</strong></div>
    <div><small>複数端末</small><strong>SYNC READY</strong></div>
  </div><p class="records-note">Player ID検索・公開プロフィール・月間ランキングをv5.0でオンライン接続します。Googleアカウント情報・Firebase UID・詳細履歴は公開しません。</p>`;
}
function renderRankingSubmissionPreview(){
  const el=$("rankingSubmissionPreview");if(!el)return;
  const p=rankingSubmissionPreview(),info=rankingFinalizeInfo(new Date());
  const current=p.current;
  el.innerHTML=`<div class="foundation-grid">
    <div><small>今月</small><strong>${escapeHtml(current.month)}</strong></div>
    <div><small>記録件数</small><strong>${current.records}</strong></div>
    <div><small>成功 / 失敗</small><strong>${current.success} / ${current.failure}</strong></div>
    <div><small>前月確定</small><strong>${info.finalized?"確定済み":`${escapeHtml(info.finalizeDate)}に確定`}</strong></div>
  </div><p class="records-note">v5では端末値をそのまま信用せず、履歴をサーバー側で再検証してランキング値を確定する設計です。</p>`;
}
function renderReleaseReadiness(){
  const el=$("releaseReadiness");if(!el)return;
  const r=runRegressionSuite(),ok=r.tests.filter(x=>x.ok).length;
  el.innerHTML=`<div class="release-score ${r.ok?"ready":"check"}"><strong>${ok} / ${r.tests.length}</strong><span>${r.ok?"v5.0基盤チェック OK":"要確認項目あり"}</span></div>`+
    r.tests.map(x=>`<div class="diagnostic-row ${x.ok?"ok":"ng"}"><span>${x.ok?"✓":"!"}</span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.detail||"")}</small></div>`).join("");
}
function refreshV499Diagnostics(){renderReleaseReadiness();renderIntegrityStatus();renderRankingSubmissionPreview();toast("v4.99総合診断を更新しました。")}


function initializeRankingSelectors(){
  const y=$("rankingYearSelect"),m=$("rankingMonthSelect"),p=$("rankingPeriodSelect");if(!y||!m||!p)return;
  const now=new Date(),start=Number(OFFICIAL_RELEASE_DATE.slice(0,4));
  if(!y.options.length){for(let n=now.getFullYear();n>=start;n--){const o=document.createElement("option");o.value=String(n);o.textContent=`${n}年`;y.appendChild(o)}}
  if(!p.dataset.initialized){p.dataset.initialized="1";p.value="all-time";y.value=String(now.getFullYear());m.value=String(now.getMonth()+1)}
  const disabled=p.value==="all-time";y.disabled=disabled;m.disabled=disabled;
}
function openOnline(){
  initializeRankingSelectors();
  $("onlineOverlay").classList.remove("hidden");
  renderOnlineLocalSummary();
  window.BeanGrowthOnline?.refreshAuth?.();
  window.BeanGrowthOnline?.loadRanking?.();
  window.BeanGrowthOnline?.loadFriends?.();
  window.BeanGrowthOnline?.loadSelfRank?.();
  window.BeanGrowthOnline?.loadGlobalEvent?.();
  window.BeanGrowthOnline?.loadNotifications?.();
}
function closeOnline(){$("onlineOverlay").classList.add("hidden")}
function renderOnlineLocalSummary(){
  const el=$("onlineLocalSummary");if(!el)return;
  const p=publicProfilePayload(),r=rankingSubmissionPreview().current;
  el.innerHTML=`<div class="online-summary-grid">
    <div><small>Player ID</small><strong>${escapeHtml(p.playerId)}</strong></div>
    <div><small>ニックネーム</small><strong>${escapeHtml(p.nickname)}</strong></div>
    <div><small>今月の記録</small><strong>${r.records}件</strong></div>
    <div><small>今月の成功</small><strong>${r.success}件</strong></div>
  </div>`;
}
function normalizePlayerIdInput(value){
  const raw=String(value||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(raw.startsWith("BG")&&raw.length===10)return `BG-${raw.slice(2,6)}-${raw.slice(6,10)}`;
  return String(value||"").trim().toUpperCase();
}
function renderRemoteProfileCard(data){
  if(!data)return'<p class="records-note">公開プロフィールが見つかりません。</p>';
  const goal=data.goal||"目標は未設定です。",active=Array.isArray(data.activeHabits)?data.activeHabits:[];
  const habitHtml=active.length?active.map(h=>`<div class="player-active-habit"><span>${escapeHtml(h.icon||"🌱")} ${escapeHtml(h.name||"禁欲")}</span><strong>${h.maxStreak==null?"最長非公開":`最長 ${Number(h.maxStreak)}日`}</strong></div>`).join(""):'<p class="records-note">現在取り組んでいる禁欲は公開されていません。</p>';
  return `<article class="remote-profile-card player-detail-card"><p class="section-label">PLAYER</p><h3>${escapeHtml(data.nickname||"Bean Grower")}</h3><p class="remote-player-id">${escapeHtml(data.playerId||"")}</p><div class="remote-goal"><small>目標</small><p>${escapeHtml(goal)}</p></div><div class="player-active-habits"><small>現在取り組んでいる禁欲</small>${habitHtml}</div>${data.playerId===appData.profile.playerId?"":`<div class="remote-profile-actions"><button class="primary-button" type="button" data-friend-player="${escapeHtml(data.playerId||"")}">フレンド申請</button><button class="secondary-button" type="button" data-report-player="${escapeHtml(data.playerId||"")}">通報</button></div>`}</article>`;
}
function onlineSearchPlayer(){
  const input=$("onlinePlayerSearchInput"),id=normalizePlayerIdInput(input?.value);
  if(input)input.value=id;
  if(!validPlayerId(id)){toast("Player IDを BG-XXXX-XXXX 形式で入力してください。");return}
  $("onlinePlayerSearchResult").innerHTML='<p class="records-note">検索中...</p>';
  window.BeanGrowthOnline?.searchPlayer?.(id);
}
function publishOnlineProfile(){
  window.BeanGrowthOnline?.publishPublicProfile?.(publicProfilePayload());
}
window.BeanGrowthRankingBridge={getSubmission:()=>({preview:rankingSubmissionPreview(),fingerprint:integrityFingerprint(),publicProfile:publicProfilePayload()}),releaseDate:OFFICIAL_RELEASE_DATE};
function publishOnlineRanking(){
  window.BeanGrowthOnline?.publishRanking?.(rankingSubmissionPreview(),integrityFingerprint());
}
function rankingHabitLabel(key){if(key==="all")return"全禁欲総合";return HABITS[key]?`${HABITS[key].icon} ${HABITS[key].name}`:key}
function rankingSeverityLabel(key){if(key==="all")return"全深刻度";if(key==="LIGHT")return"LIGHT";if(key==="NORMAL")return"NORMAL";if(key==="HEAVY")return"HARD";return key}
function goldCrownSvg(){return `<svg class="rank-crown-svg" viewBox="0 0 64 48" aria-label="1位の王冠" role="img"><path d="M7 13l13 10L31 7l12 16 14-10-5 27H12L7 13z"/><rect x="12" y="39" width="40" height="6" rx="3"/></svg>`}

function renderAccountDataComparison(localSummary,cloudSummary){
  const localEl=$("accountConflictLocalSummary"),cloudEl=$("accountConflictCloudSummary"),diffEl=$("accountConflictDifferenceSummary");
  if(!localEl||!cloudEl)return;
  const row=(label,a,b,format=v=>String(v??"—"))=>{
    const av=format(a),bv=format(b),different=av!==bv;
    return `<div class="account-compare-row ${different?"is-different":""}">
      <span>${escapeHtml(label)}</span><strong>${escapeHtml(av)}</strong><strong>${escapeHtml(bv)}</strong>
    </div>`;
  };
  const fDate=v=>v?formatDate(v):"—";
  const fNum=v=>Number(v||0).toLocaleString("ja-JP");
  const local=localSummary||{},cloud=cloudSummary||{};
  const rows=[
    row("Player ID",local.playerId,cloud.playerId),
    row("ニックネーム",local.nickname,cloud.nickname),
    row("最終変更",local.updatedAt,cloud.updatedAt,fDate),
    row("合計の高さ",local.totalHeight,cloud.totalHeight,v=>`${fNum(v)}m`),
    row("記録数",local.records,cloud.records,v=>`${fNum(v)}件`),
    row("最高連続",local.maxStreak,cloud.maxStreak,v=>`${fNum(v)}日`),
    row("データ版",local.schemaVersion,cloud.schemaVersion,v=>v?`Schema ${v}`:"—")
  ].join("");
  const header=`<div class="account-compare-header"><span>項目</span><strong>📱 この端末</strong><strong>☁️ クラウド正式データ</strong></div>`;
  localEl.innerHTML=header+rows;
  cloudEl.innerHTML="";
  if(diffEl){
    const differences=[
      local.playerId!==cloud.playerId?"Player ID":"",
      Number(local.totalHeight||0)!==Number(cloud.totalHeight||0)?"高さ":"",
      Number(local.records||0)!==Number(cloud.records||0)?"記録数":"",
      local.updatedAt!==cloud.updatedAt?"最終変更時刻":""
    ].filter(Boolean);
    diffEl.textContent=differences.length
      ?`差があります：${differences.join("・")}`
      :"主要項目は一致しています。";
  }
}


function renderSyncControlStatus(info={}){
  const rev=$("canonicalRevisionDisplay"),sync=$("canonicalLastSyncDisplay"),device=$("canonicalDeviceDisplay"),state=$("canonicalStateDisplay");
  if(rev)rev.textContent=info.revision!=null?`Revision ${Number(info.revision)}`:"—";
  if(sync)sync.textContent=info.updatedAt?formatDate(info.updatedAt):"—";
  if(device)device.textContent=info.deviceLabel||info.deviceId||"—";
  if(state)state.textContent=info.state||"確認中";
}
function renderSelfRankingCard(info=null){
  const el=$("selfRankingCard");if(!el)return;
  if(!info){el.innerHTML='<p class="records-note">自分の順位を確認できませんでした。</p>';return}
  el.innerHTML=`<div><span>あなたの順位</span><strong>${info.rank?`${Number(info.rank).toLocaleString("ja-JP")}位`:"未参加"}</strong></div>
    <div><span>スコア</span><strong>${Number(info.score||0).toLocaleString("ja-JP",{maximumFractionDigits:1})}m</strong></div>
    <div><span>記録率</span><strong>${Number(info.recordRate||0).toFixed(1)}%</strong></div>`;
}
function renderNotificationBadge(count=0){
  const b=$("notificationBadge");if(!b)return;
  b.textContent=String(Math.min(99,Number(count||0)));b.classList.toggle("hidden",!count);
}
function renderGlobalEventCard(event=null,progress=null){
  const box=$("globalEventCard"),contrib=$("eventContributionStatus");if(!box)return;
  if(!event){box.innerHTML='<p class="records-note">現在開催中のオンラインイベントはありません。</p>';if(contrib)contrib.textContent="";return}
  const target=Math.max(1,Number(event.targetPoints||1)),points=Math.max(0,Number(progress?.points||0)),pct=Math.min(100,points/target*100);
  const boss=event.kind==="worldBoss";
  box.innerHTML=`<article class="global-event-card">
    <div class="global-event-head"><span>${escapeHtml(event.icon||"🌍")}</span><div><small>${boss?"WORLD BOSS":"GLOBAL EVENT"}</small><h3>${escapeHtml(event.title||"Bean Growth Event")}</h3></div></div>
    <p>${escapeHtml(event.description||"")}</p>
    <div class="event-progress-line"><span style="width:${pct.toFixed(2)}%"></span></div>
    <div class="event-progress-numbers"><strong>${points.toLocaleString("ja-JP")} / ${target.toLocaleString("ja-JP")}</strong><span>${pct.toFixed(1)}%</span></div>
    ${boss?`<p class="records-note">残りHP ${Math.max(0,target-points).toLocaleString("ja-JP")}</p>`:""}
    <small>${event.endsAtText?`終了 ${escapeHtml(event.endsAtText)}`:""}</small>
  </article>`;
  if(contrib)contrib.textContent=progress?.mine!=null?`あなたの貢献：${Number(progress.mine).toLocaleString("ja-JP")}pt`:"";
}
function renderAdminAccess(isAdmin=false){
  const btn=$("adminButton");if(btn)btn.classList.toggle("hidden",!isAdmin);
}

function renderOnlineRanking(rows=[]){
  const el=$("onlineRankingList");if(!el)return;
  const habit=$("rankingHabitSelect")?.value||"all",severity=$("rankingSeveritySelect")?.value||"all",period=$("rankingPeriodSelect")?.value||"all-time";
  const year=$("rankingYearSelect")?.value||String(new Date().getFullYear()),month=Number($("rankingMonthSelect")?.value||new Date().getMonth()+1);
  const periodText=period==="all-time"?`全期間（${OFFICIAL_RELEASE_DATE.replaceAll("-","/")}〜）`:`${year}年${month}月`;
  if($("onlineRankingTitle"))$("onlineRankingTitle").textContent=`${periodText}：${rankingHabitLabel(habit)} / ${rankingSeverityLabel(severity)}`;
  if(!rows.length){el.innerHTML='<p class="records-note">この条件にはまだランキングデータがありません。</p>';return}
  el.innerHTML=rows.map((x,i)=>{const streakName=habit==="all"&&x.streakHabitName?`${x.streakHabitName} `:"";return `<button class="online-ranking-row ${i===0?"rank-first":""}" type="button" data-player-id="${escapeHtml(x.playerId||"")}"><span class="online-rank">${i===0?goldCrownSvg():""}<b>${i+1}</b></span><span class="online-rank-name"><strong>${escapeHtml(x.nickname||x.playerId||"Player")}</strong><small>${escapeHtml(x.playerId||"")}</small><em>${escapeHtml(streakName)}${Number(x.currentStreak||0)}日間継続！</em></span><span class="online-rank-value">${Number(x.score||0).toLocaleString("ja-JP",{maximumFractionDigits:1})}m</span><span class="online-rank-records">記録率 ${Number(x.recordRate||0).toFixed(1)}% ・ ${Number(x.records||0)}記録</span></button>`}).join("");
  el.querySelectorAll("[data-player-id]").forEach(b=>b.onclick=()=>{$("onlinePlayerSearchInput").value=b.dataset.playerId||"";onlineSearchPlayer()});
}

window.renderRemoteProfileCard=renderRemoteProfileCard;
window.renderOnlineRanking=renderOnlineRanking;

function renderProfile(){
  renderAccountSettings();
  const title=equippedTitle(),pub=appData.profile.publicProfile||{},first=firstEverRecordDate();
  const created=appData.profile.createdAt?new Date(appData.profile.createdAt).toLocaleDateString("ja-JP"):"—";
  $("profileAccountCreated").textContent=created;
  $("profileFirstRecordDate").textContent=first?formatDateKeyJa(first):"まだ記録はありません";
  const goal=$("profileGoalInput");if(goal&&document.activeElement!==goal)goal.value=pub.goal||"";
  updateProfileGoalCount();
  renderPublicProfileControls();
  renderProfileFoundation();
  window.BeanGrowthOnline?.refreshAccountAlignment?.();
  window.BeanGrowthOnline?.loadBackups?.();
  window.BeanGrowthOnline?.refreshAccountControls?.();
  window.BeanGrowthOnline?.refreshSyncControlStatus?.();
  window.BeanGrowthOnline?.loadNotifications?.();
  const repId=HABITS[pub.representativeHabitId]?pub.representativeHabitId:"noMasturbation",rep=appData.habits[repId],rh=HABITS[repId];
  $("profilePublicPreview").innerHTML=`<p class="section-label">PUBLIC VIEW</p><h4>${escapeHtml(appData.profile.nickname)}　${title.icon} ${escapeHtml(title.text)}</h4>
  <p class="profile-goal-preview"><span>目標</span>${pub.goal?escapeHtml(pub.goal):"まだ目標は設定されていません。"}</p>
  <div class="public-profile-grid">
    <div><small>Player ID</small><strong>${escapeHtml(appData.profile.playerId)}</strong></div>
    <div><small>記録開始日</small><strong>${first?escapeHtml(formatDateKeyJa(first)):"未開始"}</strong></div>
    <div><small>代表禁欲</small><strong>${rh.icon} ${escapeHtml(rh.name)}</strong></div>
    <div><small>深刻度</small><strong>${pub.shareSeverity===false?"非公開":severityOf(repId)}</strong></div>
    <div><small>最高高度</small><strong>${pub.shareHeight===false?"非公開":fmtH(allTimeMaxHeight(rep))}</strong></div>
    <div><small>最高連続</small><strong>${pub.shareStreak===false?"非公開":allTimeMaxStreak(rep)+"日"}</strong></div>
    <div><small>図鑑総解放</small><strong>${pub.shareEncyclopedia===false?"非公開":globalUnlockedMilestoneCount()+"件"}</strong></div>
  </div>`;
}
function openProfile(){renderProfile();$("profileOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function updateProfileGoalCount(){
  const el=$("profileGoalCount"),input=$("profileGoalInput");if(el&&input)el.textContent=`${[...input.value].length} / 80`;
}
function saveProfileGoal(){
  const input=$("profileGoalInput"),goal=String(input?.value||"").trim();
  if([...goal].length>80){toast("目標は80文字以内で入力してください。");return}
  appData.profile.publicProfile.goal=goal;saveData();renderProfile();toast("目標を保存しました。");
}

function openRecords(){ensureValidSelectedHabits();recordsHabitId=(currentHabitId&&isHabitVisible(currentHabitId))?currentHabitId:(recordsHabitId||visibleHabitIds()[0]||"noMasturbation");renderRecords();$("recordsOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function renderRecords(){
  renderHabitTabs("recordsHabitTabs",recordsHabitId,id=>{recordsHabitId=id;renderRecords()});
  const d=appData.habits[recordsHabitId],h=HABITS[recordsHabitId];syncUnlocks(d);updateStats(d);
  const title=equippedTitle(),all=MILESTONES.filter(m=>m.height>0),unlocked=all.filter(m=>isUnlocked(d,m)).length;
  $("recordsProfileCard").innerHTML=`<p>LOCAL PLAYER</p><h3>${escapeHtml(appData.profile.nickname)}　${title.icon} ${title.text}</h3><div class="records-profile-meta"><span>記録開始 ${firstEverRecordDate()?formatDateKeyJa(firstEverRecordDate()):"未開始"}</span><span>${h.icon} ${h.name}</span><span>深刻度 ${severityLabel(h.id)}</span><span>Schema v${appData.schemaVersion}</span></div>`;
  $("recordsSummary").innerHTML=[
    ["📏","現在高度",fmtH(d.height)],["🏔️","最高高度",fmtH(allTimeMaxHeight(d))],["🔥","最高連続",`${allTimeMaxStreak(d)}日`],["🏆","累計成功",`${d.totalSuccess}日`],
    ["📚","図鑑",`${unlocked}/${all.length}`],["🎉","金土日成功",`${d.stats?.weekendSuccess||0}回`],["⚡","全イベント遭遇",`${eventEncounterCount("wind")+eventEncounterCount("storm")+eventEncounterCount("miracle")}回`],["🌕","月の加護",d.moonBlessing?"所持":d.moonBlessingEarned?"使用済":"未獲得"]
  ].map(x=>`<div class="record-stat"><span>${x[0]}</span><strong>${x[2]}</strong><small>${x[1]}</small></div>`).join("");
  const recovery=averageRecoveryDays(d),bestMulti=bestSimultaneousHabitCount();
  $("recordsAnalytics").innerHTML=[
    ["✅","記録日の成功率",`${recordedSuccessRate(d)}%`],
    ["📅","直近30日の成功率",`${recordedSuccessRate(d,30)}%`],
    ["🔄","失敗後の平均復帰",recovery===null?"—":`${recovery}日`],
    ["🤝","1日の最大同時成功",`${bestMulti}種類`]
  ].map(x=>`<div class="record-stat"><span>${x[0]}</span><strong>${x[2]}</strong><small>${x[1]}</small></div>`).join("");
  renderPersonalAnalytics(d);renderGlobalAnalyticsPreview();
  const es=eventStatsSummary();
  $("eventRecordsGrid").innerHTML=Object.values(GUERRILLA_EVENTS).map(e=>{const st=es[e.type];return `<div class="event-record-card"><span class="event-big-icon">${e.icon}</span><strong>${e.title}</strong><small>遭遇 ${st.encounters}回<br>成功適用 ${st.applications}回<br>${st.first?`初遭遇 ${escapeHtml(st.first)}`:"未遭遇"}</small></div>`}).join("");
  renderRankingFoundation();renderRankingSubmissionPreview();renderEncyclopediaQuality();renderReleaseReadiness();
  const cats=[...new Set(all.map(m=>m.category))];$("recordsCategoryProgress").innerHTML="";
  cats.forEach(c=>{const items=all.filter(m=>m.category===c),done=items.filter(m=>isUnlocked(d,m)).length,p=Math.round(done/items.length*100);$("recordsCategoryProgress").insertAdjacentHTML("beforeend",`<div class="record-category-row"><div><span>${escapeHtml(c)}</span><span>${done}/${items.length}</span></div><div class="mini-progress"><span style="width:${p}%"></span></div></div>`)});
  const hist=(appData.profile.titleHistory||[]).slice(0,8);$("recentTitleHistory").innerHTML=hist.length?hist.map(x=>`<div class="title-history-row"><span>${x.icon||"🏅"}</span><span><strong>${escapeHtml(x.text)}</strong><small>${titleRarityLabel(x.rarity)} ・ ${escapeHtml(x.sourceHabitId?HABITS[x.sourceHabitId]?.name||"": "複合・全体実績")}</small></span><time>${new Date(x.earnedAt).toLocaleDateString("ja-JP")}</time></div>`).join(""):`<div class="records-note">まだ新しい称号パーツはありません。</div>`;
  renderIntegrityStatus();$("dataSchemaInfo").textContent=`localId: ${appData.profile.localId} / schemaVersion: ${appData.schemaVersion} / appVersion: ${APP_VERSION} / public-private-ready: yes / ranking-foundation: v2 / friend-foundation: v1 / integrity: v1`;
}
function validateAppData(data){
  const errors=[];if(!data||typeof data!=="object")errors.push("データ本体がありません");if(!data?.profile?.localId)errors.push("localIdがありません");if(!data?.habits||typeof data.habits!=="object")errors.push("habitsがありません");
  for(const id of Object.keys(HABITS)){const d=data?.habits?.[id];if(!d){errors.push(`${id}がありません`);continue}if(!Number.isFinite(Number(d.height))||Number(d.height)<0)errors.push(`${id}のheightが不正`);if(!Array.isArray(d.history)){errors.push(`${id}のhistoryが不正`);continue}const dates=new Set();for(const x of d.history){if(!x?.date||!["success","failure"].includes(x.type))errors.push(`${id}に不正な履歴`);if(x?.date){if(dates.has(x.date))errors.push(`${id}の${x.date}に重複記録`);dates.add(x.date)}}}
  return{ok:errors.length===0,errors:[...new Set(errors)]};
}
function renderIntegrityStatus(){
  const v=validateAppData(appData),el=$("dataIntegrityStatus");el.classList.toggle("warning",!v.ok);el.textContent=v.ok?"✓ データ診断：基本構造は正常です":`⚠ データ診断：${v.errors.slice(0,3).join(" / ")}`;
}
function exportBackup(){
  const payload={app:"Bean Growth",appVersion:APP_VERSION,schemaVersion:appData.schemaVersion,exportedAt:new Date().toISOString(),data:appData};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`bean-growth-backup-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("JSONバックアップを書き出しました。");
}
function requestImportBackup(){$("importDataInput").value="";$("importDataInput").click()}
function importBackupFile(file){
  if(!file)return;const reader=new FileReader();
  reader.onload=()=>{try{const parsed=JSON.parse(reader.result),candidate=parsed?.data||parsed,check=validateAppData(candidate);if(!check.ok){toast("バックアップ形式を確認できません。");return}if(!confirm("現在の端末内データを、このバックアップで置き換えますか？"))return;appData=migrateData(mergeData(candidate));migrateLegacyTitleSelection();syncGlobalTitleUnlocks();syncMissionRewards();pendingTitleUnlocks=[];saveData();ensureValidSelectedHabits();renderHome();renderRecords();renderIntegrityStatus();toast("バックアップを復元しました。")}catch(e){console.error(e);toast("JSONを読み込めませんでした。")}};
  reader.readAsText(file);
}

let titlePartTab="modifier",nounSourceFilter="all",titleSearchQuery="",titleRarityFilter="all";
function openTitleSelector(){syncGlobalTitleUnlocks();renderTitleSelector();$("titleSelectorOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function setTitlePartTab(tab){titlePartTab=tab;$("modifierTabButton").classList.toggle("active",tab==="modifier");$("nounTabButton").classList.toggle("active",tab==="noun");$("modifierPartSection").classList.toggle("hidden",tab!=="modifier");$("nounPartSection").classList.toggle("hidden",tab!=="noun")}
function titleMatches(part){
  const q=titleSearchQuery.trim().toLowerCase(),rarityOk=titleRarityFilter==="all"||part.rarity===titleRarityFilter;
  return rarityOk&&(!q||`${part.text} ${part.condition||""}`.toLowerCase().includes(q));
}
function renderTitleCollectionSummary(){
  const inv=appData.profile.titleInventory,all=[...TITLE_MODIFIERS,...TITLE_NOUNS],unlockedIds=new Set([...Object.keys(inv.modifiers),...Object.keys(inv.nouns),"bean_challenger"]);
  const rarities=["common","rare","epic","legendary"];
  $("titleCollectionSummary").innerHTML=rarities.map(r=>{
    const total=all.filter(x=>x.rarity===r).length+(r==="common"?1:0);
    const got=all.filter(x=>x.rarity===r&&unlockedIds.has(x.id)).length+(r==="common"?1:0);
    return `<div class="title-summary-cell"><strong>${got}/${total}</strong><small>${titleRarityLabel(r)}</small></div>`;
  }).join("");
}
function renderTitleSelector(){
  syncGlobalTitleUnlocks();const current=equippedTitle(),sel=appData.profile.selectedTitle,inv=appData.profile.titleInventory;
  $("selectedTitleCard").innerHTML=`<div class="compound-title-preview"><span class="selected-title-icon">${current.icon}</span><div class="compound-title-copy"><p>EQUIPPED TITLE</p><h3>${escapeHtml(current.text)}</h3><div class="part-chip-row"><span class="part-chip">前称号：${escapeHtml(current.modifier?.text||"なし")}</span><span class="part-chip">後称号：${escapeHtml(current.noun.text)}</span></div></div></div>`;
  $("unlockedModifierCount").textContent=`${Object.keys(inv.modifiers).length} / ${TITLE_MODIFIERS.length}`;
  $("unlockedNounCount").textContent=`${Object.keys(inv.nouns).length+1} / ${TITLE_NOUNS.length+1}`;
  renderTitleCollectionSummary();
  const ml=$("modifierSelectionList");ml.innerHTML="";
  if(titleRarityFilter==="all"||titleRarityFilter==="common"){
    const none=document.createElement("button");none.type="button";none.className=`title-option ${!sel.modifierId?"selected":""}`;none.innerHTML=`<span class="title-option-icon">➖</span><span><strong>前称号なし</strong><small>後称号だけで称号を表示</small><span class="title-rarity">FREE</span></span><span class="title-state">${!sel.modifierId?"使用中":"選択"}</span>`;none.onclick=()=>selectModifier(null);ml.appendChild(none);
  }
  TITLE_MODIFIERS.filter(titleMatches).forEach(p=>{const info=inv.modifiers[p.id],unlocked=Boolean(info),selected=sel.modifierId===p.id,b=document.createElement("button");b.type="button";b.className=`title-option ${unlocked?"":"locked"} ${selected?"selected":""}`;b.innerHTML=`<span class="title-option-icon">${unlocked?p.icon:"🔒"}</span><span><strong>${escapeHtml(p.text)}</strong><small>${escapeHtml(p.condition)}</small><span class="title-rarity">${titleRarityLabel(p.rarity)}</span>${unlocked?`<span class="title-origin">獲得元：${escapeHtml(titleOriginLabel(info))}</span>`:""}</span><span class="title-state">${selected?"使用中":unlocked?"選択":"未獲得"}</span>`;if(unlocked)b.onclick=()=>selectModifier(p.id);ml.appendChild(b)});
  renderNounFilters();renderNounList();setTitlePartTab(titlePartTab);
}
function renderNounFilters(){const c=$("nounSourceFilters");c.innerHTML="";[{id:"all",name:"すべて",icon:"🧩"},{id:"multi",name:"複合禁欲",icon:"🤝"},...Object.values(HABITS)].forEach(h=>{const b=document.createElement("button");b.type="button";b.className=`title-source-filter ${nounSourceFilter===h.id?"active":""}`;b.textContent=`${h.icon} ${h.name}`;b.onclick=()=>{nounSourceFilter=h.id;renderNounFilters();renderNounList()};c.appendChild(b)})}
function renderNounList(){const sel=appData.profile.selectedTitle,inv=appData.profile.titleInventory,list=$("nounSelectionList");list.innerHTML="";
  if(nounSourceFilter==="all"&&(titleRarityFilter==="all"||titleRarityFilter==="common")&&(!titleSearchQuery||`${DEFAULT_TITLE_NOUN.text} ${DEFAULT_TITLE_NOUN.condition}`.includes(titleSearchQuery))){
    const d=DEFAULT_TITLE_NOUN,b=document.createElement("button");b.type="button";b.className=`title-option ${sel.nounId===d.id?"selected":""}`;b.innerHTML=`<span class="title-option-icon">${d.icon}</span><span><strong>${d.text}</strong><small>${d.condition}</small><span class="title-rarity">COMMON</span><span class="title-origin">獲得元：初期所持</span></span><span class="title-state">${sel.nounId===d.id?"使用中":"選択"}</span>`;b.onclick=()=>selectNoun(d.id);list.appendChild(b)}
  TITLE_NOUNS.filter(p=>(nounSourceFilter==="all"||(nounSourceFilter==="multi"&&p.group==="multi")||p.habitId===nounSourceFilter)&&titleMatches(p)).forEach(p=>{const info=inv.nouns[p.id],unlocked=Boolean(info),selected=sel.nounId===p.id,h=p.habitId?HABITS[p.habitId]:null,b=document.createElement("button");b.type="button";b.className=`title-option ${unlocked?"":"locked"} ${selected?"selected":""}`;b.innerHTML=`<span class="title-option-icon">${unlocked?p.icon:"🔒"}</span><span><strong>${escapeHtml(p.text)}</strong><small>${escapeHtml(p.condition)}</small><span class="title-rarity">${titleRarityLabel(p.rarity)}</span>${unlocked?`<span class="title-origin">獲得元：${h?`${h.icon} ${escapeHtml(h.name)}`:"🤝 複合禁欲"}</span>`:""}</span><span class="title-state">${selected?"使用中":unlocked?"選択":"未獲得"}</span>`;if(unlocked)b.onclick=()=>selectNoun(p.id);list.appendChild(b)})}
function selectModifier(id){if(id&&!isModifierUnlocked(id)){toast("まだ獲得していない前称号です。");return}appData.profile.selectedTitle.modifierId=id;saveData();renderTitleSelector();if(currentHabitId&&!developerMode)renderStatus(appData.habits[currentHabitId]);renderHome();toast(`前称号を「${id?modifierById(id).text:"なし"}」に変更しました。`)}
function selectNoun(id){if(!isNounUnlocked(id)){toast("まだ獲得していない後称号です。");return}appData.profile.selectedTitle.nounId=id;saveData();renderTitleSelector();if(currentHabitId&&!developerMode)renderStatus(appData.habits[currentHabitId]);renderHome();toast(`後称号を「${nounById(id).text}」に変更しました。`)}

function openAchievements(){const d=activeData(),t=equippedTitle();$("achievementTitleIcon").textContent=t.icon;$("achievementTitleName").textContent=t.text;$("achievementsList").innerHTML="";ACHIEVEMENTS.forEach(a=>{const ok=a.test(d),r=document.createElement("div");r.className=`achievement-row ${ok?"":"locked"}`;r.innerHTML=`<span class="a-icon">${ok?a.icon:"🔒"}</span><div><h3>${a.name}</h3><p>${a.description}</p></div><span class="achievement-state">${ok?"達成":"未達成"}</span>`;$("achievementsList").appendChild(r)});$("achievementsOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function selectedMilestoneFact(m){
  if(m?.funFact)return String(m.funFact);
  const pool=[...(m?.trivia||[]),...(m?.facts||[]),...(m?.wildlife||[]),...(m?.risks||[])].filter(Boolean);
  return pool[0]||m?.description||"この項目についての豆知識を準備中です。";
}
function shortMilestoneLead(m){
  const label=m.category==="世界の山"?"標高":m.category==="天体サイズ"?"サイズ":"高さ";
  return `${label}${fmtH(m.height)}。${m.description||""}`.trim();
}
function beanJourneyCommentV479(m){
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
  $("milestoneExtraDetails").innerHTML=
    `<section class="detail-section fun-fact-card">`+
    `<p class="fun-fact-kicker">💡 知ってた？</p>`+
    `<p class="fun-fact-text">${escapeHtml(fact)}</p>`+
    `</section>`+
    `<section class="detail-section bean-journey-mini">`+
    `<p class="fun-fact-kicker">🌱 BEAN GROWTH</p>`+
    `<p>${escapeHtml(beanJourneyCommentV479(m))}</p>`+
    `</section>`;
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
function developerTitleTestParts(){
  if(!developerMode||!developerData||!currentHabitId)return[];
  return TITLE_NOUNS
    .filter(p=>p.habitId===currentHabitId&&!p.globalTest&&p.test(developerData))
    .map(p=>p);
}
function renderDeveloperTitleTest(){
  const el=$("developerTitleTestResult");
  if(!el)return;
  const parts=developerTitleTestParts();
  const black=parts.filter(p=>p.rarity==="black_history");
  if(black.length){
    el.innerHTML=`<strong>☠️ BLACK HISTORY テスト解放</strong><span>${black.map(p=>escapeHtml(p.text)).join(" / ")}</span><small>開発者モード内だけのテスト表示。本番の称号所持には追加されません。</small>`;
    el.classList.add("unlocked");
    return;
  }
  el.innerHTML=`<strong>称号テスト</strong><span>${parts.length?parts.map(p=>escapeHtml(p.text)).join(" / "):"まだ条件未達成"}</span><small>3連続失敗するとBLACK HISTORY称号もここで確認できます。</small>`;
  el.classList.remove("unlocked");
}
function renderDeveloper(){
  $("developerPanel").classList.toggle("hidden",!developerMode);
  $("developerIndicator").classList.toggle("hidden",!developerMode);
  renderDeveloperTitleTest();
}
function devAdd(n){
  developerData.height=round1(developerData.height+n);
  syncUnlocks(developerData);awardMoon(developerData);renderGame();renderDeveloperTitleTest();
}
function devSet(){
  const n=Number($("developerHeightInput").value);
  if(!Number.isFinite(n)||n<0){toast("0以上の高さを入力してください。");return}
  developerData.height=round1(n);syncUnlocks(developerData);awardMoon(developerData);renderGame();renderDeveloperTitleTest();
}
function devSuccess(){
  const e=eventToday(),r=successCalc(developerData.height,e),p=crossed(developerData.height,r.newHeight),before=snap(developerData);
  developerData.height=r.newHeight;syncUnlocks(developerData);
  developerData.currentStreak++;developerData.totalSuccess++;developerData.consecutiveFailures=0;updateStats(developerData,e);
  if(!Array.isArray(developerData.history))developerData.history=[];
  developerData.history.push({
    id:"dev-success-"+Date.now().toString(36),
    date:"DEV-S-"+Date.now(),
    timestamp:new Date().toISOString(),
    type:"success",
    before,
    after:snap(developerData)
  });
  const moon=awardMoon(developerData);renderGame();renderDeveloperTitleTest();celebrate(r,e,p,moon);
}
function devFailure(){
  const before=snap(developerData),r=failureCalc(developerData);
  developerData.height=r.newHeight;developerData.currentStreak=0;developerData.consecutiveFailures=r.nextFailures;
  if(r.usesMoonBlessing)developerData.moonBlessing=false;
  if(!Array.isArray(developerData.history))developerData.history=[];
  developerData.history.push({
    id:"dev-failure-"+Date.now().toString(36),
    date:"DEV-F-"+Date.now(),
    timestamp:new Date().toISOString(),
    type:"failure",
    usedMoonBlessing:r.usesMoonBlessing,
    before,
    after:snap(developerData)
  });
  renderGame();renderDeveloperTitleTest();
  const black=developerTitleTestParts().find(p=>p.rarity==="black_history");
  toast(black?`☠️ テスト称号「${black.text}」を解放`:`🧪 ${r.message}`);
}
function devReset(){
  developerData=clone(developerOriginalData);developerForcedEvent="auto";
  $("developerEventSelect").value="auto";$("developerHeightInput").value="";
  renderGame();renderDeveloperTitleTest();toast("テストデータを元に戻しました。");
}
function toast(m){$("toast").textContent=m;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400)}function closeConfirm(){$("confirmOverlay").classList.add("hidden");pendingAction=null}

$("backButton").onclick=goHome;$("successButton").onclick=recordSuccess;$("failButton").onclick=requestFailure;$("undoButton").onclick=requestUndo;$("confirmCancelButton").onclick=closeConfirm;$("confirmOkButton").onclick=()=>pendingAction==="failure"?recordFailure():pendingAction==="undo"?undoToday():null;$("confirmOverlay").onclick=e=>{if(e.target===$("confirmOverlay"))closeConfirm()};$("celebrationCloseButton").onclick=()=>$("celebrationOverlay").classList.add("hidden");$("celebrationOverlay").onclick=e=>{if(e.target===$("celebrationOverlay"))$("celebrationOverlay").classList.add("hidden")};$("milestoneModalClose").onclick=()=>$("milestoneModalOverlay").classList.add("hidden");$("milestoneModalOverlay").onclick=e=>{if(e.target===$("milestoneModalOverlay"))$("milestoneModalOverlay").classList.add("hidden")};$("openEncyclopediaButton").onclick=openEncyclopedia;$("openEncyclopediaButton2").onclick=openEncyclopedia;$("encyclopediaCloseButton").onclick=()=>$("encyclopediaOverlay").classList.add("hidden");$("changeTitleButton").onclick=openTitleSelector;$("titleSelectorCloseButton").onclick=()=>$("titleSelectorOverlay").classList.add("hidden");$("modifierTabButton").onclick=()=>setTitlePartTab("modifier");$("nounTabButton").onclick=()=>setTitlePartTab("noun");$("titleSearchInput").oninput=e=>{titleSearchQuery=e.target.value;renderTitleSelector()};$("titleRarityFilter").onchange=e=>{titleRarityFilter=e.target.value;renderTitleSelector()};$("openAchievementsButton").onclick=openAchievements;$("achievementsCloseButton").onclick=()=>$("achievementsOverlay").classList.add("hidden");$("settingsButton").onclick=openSettings;$("settingsCloseButton").onclick=()=>$("settingsOverlay").classList.add("hidden");$("developerButton").onclick=openDeveloper;$("developerModalClose").onclick=()=>$("developerModalOverlay").classList.add("hidden");document.querySelectorAll("[data-add-height]").forEach(b=>b.onclick=()=>devAdd(Number(b.dataset.addHeight)));document.querySelectorAll("[data-failure-count]").forEach(b=>b.onclick=()=>{developerData.consecutiveFailures=Number(b.dataset.failureCount);if(developerData.consecutiveFailures>0)developerData.currentStreak=0;renderGame();renderDeveloperTitleTest()});$("developerSetHeightButton").onclick=devSet;$("developerEventSelect").onchange=e=>{developerForcedEvent=e.target.value;renderGame()};$("runSimulationButton").onclick=runBalanceSimulation;$("developerSuccessButton").onclick=devSuccess;$("developerFailureButton").onclick=devFailure;$("developerResetButton").onclick=devReset;$("developerExitButton").onclick=()=>exitDeveloper(true);$("encyclopediaSearch").oninput=e=>{encyclopediaQuery=e.target.value;renderEncyclopedia()};$("encyclopediaUnlockFilter").onchange=e=>{encyclopediaUnlockFilter=e.target.value;renderEncyclopedia()};$("encyclopediaSort").onchange=e=>{encyclopediaSort=e.target.value;renderEncyclopedia()};

$("savePublicProfileButton").onclick=savePublicProfileSettings;
$("openProfileButton").onclick=openProfile;$("profileCloseButton").onclick=()=>$("profileOverlay").classList.add("hidden");
$("profileGoalInput").oninput=updateProfileGoalCount;$("saveProfileGoalButton").onclick=saveProfileGoal;
document.querySelectorAll("[data-start-severity]").forEach(b=>b.onclick=()=>chooseStartSeverity(b.dataset.startSeverity));
$("startSeverityConfirmButton").onclick=confirmStartSeverity;$("startSeverityCancelButton").onclick=cancelStartSeverity;
$("startSeverityOverlay").onclick=e=>{if(e.target===$("startSeverityOverlay"))cancelStartSeverity()};
$("copyPlayerIdButton").onclick=copyPlayerId;$("saveNicknameButton").onclick=saveNickname;$("nicknameInput").onkeydown=e=>{if(e.key==="Enter")saveNickname()};
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
$("runV499DiagnosticsButton").onclick=refreshV499Diagnostics;
$("openOnlineButton").onclick=openOnline;$("onlineCloseButton").onclick=closeOnline;
$("onlineSearchPlayerButton").onclick=onlineSearchPlayer;
$("onlinePlayerSearchInput").onkeydown=e=>{if(e.key==="Enter")onlineSearchPlayer()};
$("publishOnlineProfileButton").onclick=publishOnlineProfile;
$("publishOnlineRankingButton").onclick=publishOnlineRanking;
$("refreshOnlineRankingButton").onclick=()=>window.BeanGrowthOnline?.loadRanking?.();
$("rankingHabitSelect").onchange=()=>{window.BeanGrowthOnline?.loadRanking?.();window.BeanGrowthOnline?.loadSelfRank?.()};
$("rankingSeveritySelect").onchange=()=>{window.BeanGrowthOnline?.loadRanking?.();window.BeanGrowthOnline?.loadSelfRank?.()};
$("refreshFriendsButton").onclick=()=>window.BeanGrowthOnline?.loadFriends?.();
$("googleUnlinkButton").onclick=()=>window.BeanGrowthOnline?.unlinkGoogleSafely?.();
$("compareDataButton").onclick=()=>window.BeanGrowthOnline?.openManualDataComparison?.();
$("syncRetryButton").onclick=()=>window.BeanGrowthOnline?.retrySync?.();
$("rankingPeriodSelect").onchange=()=>{initializeRankingSelectors();window.BeanGrowthOnline?.loadRanking?.();window.BeanGrowthOnline?.loadSelfRank?.()};
$("rankingYearSelect").onchange=()=>{window.BeanGrowthOnline?.loadRanking?.();window.BeanGrowthOnline?.loadSelfRank?.()};
$("rankingMonthSelect").onchange=()=>{window.BeanGrowthOnline?.loadRanking?.();window.BeanGrowthOnline?.loadSelfRank?.()};
$("refreshSelfRankButton").onclick=()=>window.BeanGrowthOnline?.loadSelfRank?.();
$("submitEventContributionButton").onclick=()=>window.BeanGrowthOnline?.submitEventContribution?.();
$("notificationButton").onclick=()=>{window.BeanGrowthOnline?.loadNotifications?.();$("notificationOverlay").classList.remove("hidden")};
$("notificationCloseButton").onclick=()=>$("notificationOverlay").classList.add("hidden");
$("notificationOverlay").onclick=e=>{if(e.target===$("notificationOverlay"))$("notificationOverlay").classList.add("hidden")};
$("requestNotificationPermissionButton").onclick=()=>window.BeanGrowthOnline?.requestNotificationPermission?.();
$("markNotificationsReadButton").onclick=()=>window.BeanGrowthOnline?.markNotificationsRead?.();
$("adminButton").onclick=()=>{window.BeanGrowthOnline?.loadAdminDashboard?.();$("adminOverlay").classList.remove("hidden")};
$("adminCloseButton").onclick=()=>$("adminOverlay").classList.add("hidden");
$("adminOverlay").onclick=e=>{if(e.target===$("adminOverlay"))$("adminOverlay").classList.add("hidden")};
$("adminRefreshButton").onclick=()=>window.BeanGrowthOnline?.loadAdminDashboard?.();
$("adminSaveEventButton").onclick=()=>window.BeanGrowthOnline?.adminSaveEvent?.();

$("googleConnectButton").onclick=()=>window.BeanGrowthOnline?.connectGoogle?.();$("exportDataButton").onclick=exportBackup;$("importDataButton").onclick=requestImportBackup;$("importDataInput").onchange=e=>importBackupFile(e.target.files?.[0]);

migrateLegacyTitleSelection();
cleanupRewardEditUnlocks();
refreshStreaksForElapsedGaps();
syncGlobalTitleUnlocks();
syncMissionRewards();
pendingTitleUnlocks=[];
ensureValidSelectedHabits();
enrichAllUnlocks();
renderHome();
