"use strict";

const STORAGE_KEY="beanGrowthGame_v1",APP_VERSION="4.11",MILESTONES=(window.BEAN_MILESTONES||[]).slice().sort((a,b)=>a.height-b.height);
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
noCaffeine:{id:"noCaffeine",name:"カフェイン禁",englishName:"NO CAFFEINE",icon:"☕",description:"カフェイン飲料・食品を摂らない"}
};
const SPECIAL_DAYS_OF_MONTH=[1,15],GUERRILLA_RATE=.08,MOON_HEIGHT=384400000;
const TITLES=[
{id:"seed",name:"種からの挑戦者",icon:"🫘",description:"すべては0mから始まる",condition:"最初から使用可能",test:d=>true},
{id:"sprout",name:"発芽した者",icon:"🌱",description:"最初の成功を刻んだ者",condition:"累計成功1日",test:d=>d.totalSuccess>=1||d.height>=1},
{id:"streak3",name:"三日の芽吹き",icon:"🌿",description:"三日続けて守り抜いた者",condition:"3日連続成功",test:d=>d.currentStreak>=3||Number(d.stats?.maxStreak||0)>=3},
{id:"week",name:"七日の守り手",icon:"🔥",description:"一週間の連続成功を達成",condition:"7日連続成功",test:d=>d.currentStreak>=7||Number(d.stats?.maxStreak||0)>=7},
{id:"month",name:"三十日の継承者",icon:"🏅",description:"30日の連続成功を達成",condition:"30日連続成功",test:d=>d.currentStreak>=30||Number(d.stats?.maxStreak||0)>=30},
{id:"tree",name:"巨木の育成者",icon:"🌳",description:"豆の木を100mまで育てた",condition:"最高高度100m",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=100},
{id:"tower",name:"塔を越える者",icon:"🗼",description:"東京タワー級を突破した",condition:"最高高度333m",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=333},
{id:"skytree",name:"天空塔の征服者",icon:"📡",description:"634mの領域を突破した",condition:"最高高度634m",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=634},
{id:"sky",name:"天空への挑戦者",icon:"☁️",description:"高さ1kmを突破した",condition:"最高高度1km",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=1000},
{id:"mountain",name:"山を越える者",icon:"🗻",description:"富士山の標高を突破した",condition:"最高高度3,776m",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=3776},
{id:"everest",name:"地球最高峰を越えし者",icon:"🏔️",description:"エベレスト級を突破した",condition:"最高高度8,849m",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=8849},
{id:"space",name:"宇宙へ伸びる者",icon:"🚀",description:"カーマン・ラインへ到達",condition:"最高高度100km",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=100000},
{id:"orbital",name:"軌道を貫く者",icon:"🛰️",description:"ISS級の高度へ到達",condition:"最高高度400km",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=400000},
{id:"success100",name:"百日の証明者",icon:"💯",description:"累計100日の成功を積み重ねた",condition:"累計成功100日",test:d=>d.totalSuccess>=100},
{id:"moon",name:"月へ届く豆",icon:"🌕",description:"伝説級到達点・月へ到達",condition:"最高高度384,400km",test:d=>Math.max(d.height,Number(d.stats?.maxHeight||0))>=MOON_HEIGHT}
];
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
function initialHabit(){return{height:0,currentStreak:0,totalSuccess:0,consecutiveFailures:0,lastActionDate:null,lastActionType:null,history:[],moonBlessing:false,moonBlessingEarned:false,unlockedMilestones:[],unlockedTitles:["seed"],selectedTitleId:"seed",stats:{maxHeight:0,maxStreak:0,specialSuccess:0,guerrillaSuccess:0}}}
function initialData(){const habits={};const visibleHabits={};Object.keys(HABITS).forEach(id=>{habits[id]=initialHabit();visibleHabits[id]=true});return{version:APP_VERSION,schemaVersion:3,profile:{localId:makeLocalId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString()},settings:{calendarStartSunday:true,visibleHabits},habits}}

function makeLocalId(){return "local-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9)}
function migrateData(data){
  if(!data.profile)data.profile={localId:makeLocalId(),nickname:"BEAN-"+Math.floor(10000+Math.random()*90000),createdAt:new Date().toISOString()};
  if(!data.profile.localId)data.profile.localId=makeLocalId();
  if(!data.profile.nickname)data.profile.nickname="BEAN-"+Math.floor(10000+Math.random()*90000);
  if(!data.profile.createdAt)data.profile.createdAt=new Date().toISOString();
  if(!data.settings)data.settings={};
  if(!data.settings.visibleHabits)data.settings.visibleHabits={};
  if(!data.habits)data.habits={};
  data.schemaVersion=3;
  Object.keys(HABITS).forEach(id=>{
    if(!data.habits[id])data.habits[id]=initialHabit();
    if(typeof data.settings.visibleHabits[id]!=="boolean")data.settings.visibleHabits[id]=true;
    const d=data.habits[id];
    if(!d.stats)d.stats={maxHeight:d.height||0,maxStreak:d.currentStreak||0,specialSuccess:0,guerrillaSuccess:0};
    d.stats.maxHeight=Math.max(Number(d.stats.maxHeight||0),Number(d.height||0));
    d.stats.maxStreak=Math.max(Number(d.stats.maxStreak||0),Number(d.currentStreak||0));syncTitleUnlocks(d);if(!d.unlockedTitles.includes(d.selectedTitleId))d.selectedTitleId="seed";
  });
  return data;
}
function loadData(){const r=localStorage.getItem(STORAGE_KEY);if(!r)return initialData();try{return migrateData(mergeData(JSON.parse(r)))}catch(e){console.error(e);return initialData()}}
function mergeData(s){const i=initialData(),m={...i,...s,version:APP_VERSION,settings:{...i.settings,...(s.settings||{}),visibleHabits:{...i.settings.visibleHabits,...(s.settings?.visibleHabits||{})}},habits:{...i.habits}};Object.keys(HABITS).forEach(id=>m.habits[id]={...i.habits[id],...(s.habits?.[id]||{})});return m}
function updateStats(d,eventType=null){if(!d.stats)d.stats={maxHeight:0,maxStreak:0,specialSuccess:0,guerrillaSuccess:0};d.stats.maxHeight=Math.max(Number(d.stats.maxHeight||0),Number(d.height||0));d.stats.maxStreak=Math.max(Number(d.stats.maxStreak||0),Number(d.currentStreak||0));syncTitleUnlocks(d);if(!d.unlockedTitles.includes(d.selectedTitleId))d.selectedTitleId="seed";if(eventType==="special")d.stats.specialSuccess++;if(eventType==="guerrilla")d.stats.guerrillaSuccess++;if(eventType==="both"){d.stats.specialSuccess++;d.stats.guerrillaSuccess++;}syncTitleUnlocks(d);}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(appData))}function clone(v){return JSON.parse(JSON.stringify(v))}function $(id){return document.getElementById(id)}
function todayKey(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return`${y}-${m}-${day}`}
function fmt(v,max=1){return Number(v).toLocaleString("ja-JP",{maximumFractionDigits:max})}function fmtH(m){m=Number(m);return m<1000?`${fmt(m)}m`:m<1000000?`${fmt(m/1000,2)}km`:`${fmt(m/1000,1)}km`}function round1(v){return Math.round(v*10)/10}function floor1(v){return Math.floor(v*10)/10}
let appData=loadData(),currentHabitId=null,pendingAction=null,developerMode=false,developerData=null,developerOriginalData=null,developerForcedEvent="auto",encyclopediaCategory="すべて",encyclopediaQuery="",encyclopediaUnlockFilter="all",encyclopediaSort="asc",toastTimer=null,calendarHabitId="noMasturbation",calendarCursor=new Date(),recordsHabitId="noMasturbation";

function hashString(t){let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}function seededRandom(s){let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}
function eventFromType(t){if(t==="special")return{type:t,icon:"✨",title:"特別成長日",reward:"+10m",description:"今日成功すると一気に10m成長。"};if(t==="guerrilla")return{type:t,icon:"⚡",title:"ゲリラ成長日",reward:"×1.1",description:"今日成功すると現在の高さが1.1倍。"};if(t==="both")return{type:t,icon:"🔥",title:"超成長日",reward:"+10m → ×1.1",description:"10m成長したあと、さらに1.1倍。"};return{type:"normal",icon:"🌱",title:"通常成長日",reward:"+1m",description:"今日成功すると1m成長。"}}
function eventToday(){if(developerMode&&developerForcedEvent!=="auto")return eventFromType(developerForcedEvent);if(SPECIAL_DAYS_OF_MONTH.includes(new Date().getDate()))return eventFromType("special");if(seededRandom(hashString(todayKey()))<GUERRILLA_RATE)return eventFromType("guerrilla");return eventFromType("normal")}
function successCalc(h,e){let n=h;if(e.type==="normal")n=h+1;else if(e.type==="special")n=h+10;else if(e.type==="guerrilla")n=h===0?1:h*1.1;else n=(h+10)*1.1;n=round1(n);return{newHeight:n,gained:round1(n-h)}}
function failureCalc(d){const h=d.height,n=d.consecutiveFailures+1;if(d.moonBlessing)return{newHeight:h,loss:0,usesMoonBlessing:true,nextFailures:Math.min(3,n),message:"🌕 月の加護が発動。高さの減少を防ぎました。"};if(n===1){const loss=Math.floor(h/5);return{newHeight:Math.max(0,round1(h-loss)),loss,usesMoonBlessing:false,nextFailures:1,message:`1回目の失敗。${fmtH(loss)}失いました。`}}if(n===2){const nh=floor1(h/2);return{newHeight:nh,loss:round1(h-nh),usesMoonBlessing:false,nextFailures:2,message:"2回連続失敗。高さが半分になりました。"}}return{newHeight:0,loss:h,usesMoonBlessing:false,nextFailures:3,message:"3回連続失敗。豆の木は0mに戻りました。"}}
function curMilestone(h){let r=MILESTONES[0];for(const m of MILESTONES){if(h>=m.height)r=m;else break}return r}function nextMilestone(h){return MILESTONES.find(m=>m.height>h)||null}function crossed(a,b){return MILESTONES.filter(m=>m.height>a&&m.height<=b)}function syncTitleUnlocks(d){if(!Array.isArray(d.unlockedTitles))d.unlockedTitles=["seed"];if(!d.unlockedTitles.includes("seed"))d.unlockedTitles.push("seed");for(const t of TITLES)if(t.test(d)&&!d.unlockedTitles.includes(t.id))d.unlockedTitles.push(t.id);if(!d.selectedTitleId)d.selectedTitleId="seed"}
function titleById(id){return TITLES.find(t=>t.id===id)||TITLES[0]}
function titleFor(d){syncTitleUnlocks(d);return d.unlockedTitles.includes(d.selectedTitleId)?titleById(d.selectedTitleId):titleById("seed")}function unlockedA(d){return ACHIEVEMENTS.filter(a=>a.test(d))}
function awardMoon(d){if(d.height>=MOON_HEIGHT&&!d.moonBlessingEarned){d.moonBlessing=true;d.moonBlessingEarned=true;return true}return false}function milestoneKey(m){return m.id||`${m.height}|${m.name}`}
function syncUnlocks(d){if(!Array.isArray(d.unlockedMilestones))d.unlockedMilestones=[];for(const m of MILESTONES){if(m.height>0&&m.height<=d.height&&!d.unlockedMilestones.includes(milestoneKey(m)))d.unlockedMilestones.push(milestoneKey(m))}}
function isUnlocked(d,m){syncUnlocks(d);return m.height===0||d.unlockedMilestones.includes(milestoneKey(m))}
function enrichAllUnlocks(){Object.values(appData.habits).forEach(syncUnlocks);saveData()}
function homeEvent(){const e=eventToday(),c=$("homeEventCard");c.classList.remove("special","guerrilla","both");if(e.type!=="normal")c.classList.add(e.type);$("homeEventIcon").textContent=e.icon;$("homeEventTitle").textContent=e.title;$("homeEventDescription").textContent=e.description;$("homeEventReward").textContent=e.reward}
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
  if(m.category==="生物"){rows.push(["比較方法",m.description?.includes("全長")?"全長を縦に比較":"高さ・体長の代表値"],["個体差","大きい"])}
  if(m.category==="建築"||m.category==="ランドマーク"||m.category==="構造物"){rows.push(["比較値",fmtH(m.height)],["所在地", [m.country,m.region].filter(Boolean).join(" / ")||"概念比較"])}
  if(m.category==="天体サイズ"){rows.push(["比較の意味","直径・長軸などを縦に配置"],["注意","地表からの高度ではない"])}
  if(m.category==="宇宙"||m.category==="軌道"){rows.push(["距離基準","地表からの高度を中心に比較"],["環境","地上とは大きく異なる"])}
  if(m.category==="大気"||m.category==="航空"){rows.push(["高度",fmtH(m.height)],["変動","気象・機種・緯度などで変わる"])}
  if(!rows.length)return "";
  return makeDetailSection("🧭 読み方",`<div class="data-grid">${rows.map(r=>`<div class="detail-data-cell"><small>${escapeHtml(r[0])}</small><strong>${escapeHtml(r[1])}</strong></div>`).join("")}</div>`);
}
function extraNonMountainDetails(m){
  let html=categorySpecificDetails(m)+makeDetailSection("🔎 これは何？",`<p>${escapeHtml(categoryContext(m))}</p>`);
  html+=makeDetailSection("📏 この高さのスケール",`<p>${escapeHtml(scaleExplanation(m))}</p>`);
  if(m.country||m.region) html+=makeDetailSection("📍 場所・背景",`<p>${escapeHtml([m.country,m.region].filter(Boolean).join(" / "))}</p>`);
  if(m.facts?.length) html+=makeDetailSection("📌 基本情報",`<ul class="detail-bullets">${m.facts.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  if(m.wildlife?.length) html+=makeDetailSection("🦌 生物・自然",`<div class="detail-tags">${m.wildlife.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);
  if(m.risks?.length) html+=makeDetailSection("⚠️ 注意・特徴",`<div class="detail-tags">${m.risks.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);
  if(m.trivia?.length) html+=makeDetailSection("💡 豆知識",`<ul class="detail-bullets">${m.trivia.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  return html;
}



function isHabitVisible(id){return appData.settings?.visibleHabits?.[id]!==false}
function visibleHabitIds(){return Object.keys(HABITS).filter(isHabitVisible)}
function ensureValidSelectedHabits(){
  const visible=visibleHabitIds();
  const fallback=visible[0]||Object.keys(HABITS)[0];
  if(!HABITS[calendarHabitId]||!isHabitVisible(calendarHabitId))calendarHabitId=fallback;
  if(!HABITS[recordsHabitId]||!isHabitVisible(recordsHabitId))recordsHabitId=fallback;
}
function openSettings(){renderSettings();$("settingsOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"})}
function renderSettings(){
  const list=$("habitVisibilityList");list.innerHTML="";
  const visibleCount=visibleHabitIds().length;
  $("visibleHabitCount").textContent=`${visibleCount} / ${Object.keys(HABITS).length}`;
  Object.values(HABITS).forEach(h=>{
    const row=document.createElement("div");row.className="visibility-row";
    const checked=isHabitVisible(h.id);
    row.innerHTML=`<span class="visibility-icon">${h.icon}</span><span class="visibility-copy"><strong>${escapeHtml(h.name)}</strong><small>${escapeHtml(h.description||"")}</small></span><label class="switch"><input type="checkbox" data-visibility-habit="${h.id}" ${checked?"checked":""}><span class="switch-slider"></span></label>`;
    row.querySelector("input").onchange=e=>setHabitVisibility(h.id,e.target.checked);
    list.appendChild(row);
  });
}
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
  Object.values(HABITS).forEach(h=>{
    if(!isHabitVisible(h.id))return;
    const d=appData.habits[h.id];syncUnlocks(d);updateStats(d);th+=d.height;ts+=d.totalSuccess;
    let status="今日は未記録";if(d.lastActionDate===todayKey())status=d.lastActionType==="success"?"今日は成功済み":"今日は継続できず";
    const n=nextMilestone(d.height),e=eventToday(),r=successCalc(d.height,e),done=d.lastActionDate===todayKey();
    const card=document.createElement("div");card.className="habit-card";
    card.innerHTML=`<span class="habit-icon">${h.icon}</span><span class="habit-copy"><strong>${h.name}</strong><small>🔥 ${d.currentStreak}日連続 ・ ${titleFor(d).icon} ${escapeHtml(titleFor(d).name)} ・ ${status}</small></span><span class="habit-height">${fmtH(d.height)}</span><span class="habit-next">${n?`次：${n.icon} ${n.name}まで ${fmtH(round1(n.height-d.height))}`:"登録済み最終地点を突破"}</span><button class="home-quick-success ${done?"done":""}" type="button">${done?"今日の記録を見る":"今日も継続できた"}<span class="quick-result">${done?fmtH(d.height):`${fmtH(d.height)} → ${fmtH(r.newHeight)}`}</span></button>`;
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
function quickHomeSuccess(id){
  currentHabitId=id;const d=appData.habits[id];if(d.lastActionDate===todayKey()){openHabit(id);return}
  const before=snap(d),e=eventToday(),r=successCalc(d.height,e),p=crossed(d.height,r.newHeight);
  d.height=r.newHeight;syncUnlocks(d);d.currentStreak++;d.totalSuccess++;d.consecutiveFailures=0;d.lastActionDate=todayKey();d.lastActionType="success";updateStats(d,e.type);
  const moon=awardMoon(d);d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"success",eventType:e.type,before,after:snap(d)});
  saveData();renderHome();celebrate(r,e,p,moon);
}

function openHabit(id){currentHabitId=id;$("homeScreen").classList.remove("active");$("gameScreen").classList.add("active");renderGame();window.scrollTo({top:0,behavior:"auto"})}function goHome(){if(developerMode)exitDeveloper(false);currentHabitId=null;$("gameScreen").classList.remove("active");$("homeScreen").classList.add("active");renderHome();window.scrollTo({top:0,behavior:"auto"})}function activeData(){return developerMode?developerData:appData.habits[currentHabitId]}
function renderGame(){if(!currentHabitId)return;const h=HABITS[currentHabitId],d=activeData();$("gameIcon").textContent=h.icon;$("gameEnglishName").textContent=h.englishName;$("gameTitle").textContent=h.name;const p=d.height<1000?{v:fmt(d.height),u:"m"}:{v:fmt(d.height/1000,2),u:"km"};$("currentHeight").textContent=p.v;$("currentHeightUnit").textContent=p.u;$("currentStreak").textContent=fmt(d.currentStreak,0);$("totalSuccess").textContent=fmt(d.totalSuccess,0);$("consecutiveFailures").textContent=d.consecutiveFailures;renderTree(d.height);renderEvent(d);renderMilestones(d.height);renderToday(d);renderStatus(d);renderRisk(d);renderMoon(d);renderDeveloper()}
function renderTree(h){const v=45+Math.min(58,Math.log10(h+1)*24);$("treeStem").style.height=`${v}px`;$("treeTop").style.bottom=`${Math.min(94,v+18)}px`}
function renderEvent(d){const e=eventToday(),c=$("eventCard");c.classList.remove("special","guerrilla","both");if(e.type!=="normal")c.classList.add(e.type);$("eventIcon").textContent=e.icon;$("eventTitle").textContent=e.title;$("eventDescription").textContent=e.description;$("eventReward").textContent=e.reward;const r=successCalc(d.height,e);$("successButtonDescription").textContent=`${fmtH(d.height)} → ${fmtH(r.newHeight)}`}
function renderMilestones(h){const cur=curMilestone(h),next=nextMilestone(h);$("currentMilestoneIcon").textContent=cur.icon;$("currentMilestoneName").textContent=cur.name;$("currentMilestoneHeight").textContent=fmtH(cur.height);$("currentMilestoneDescription").textContent=cur.description;$("currentMilestoneDetailButton").onclick=()=>openMilestone(cur);if(!next){$("nextMilestoneCard").classList.add("hidden");$("growthMessage").textContent="登録済みの最終地点を突破しています。"}else{$("nextMilestoneCard").classList.remove("hidden");$("nextMilestoneIcon").textContent=next.icon;$("nextMilestoneName").textContent=next.name;$("nextMilestoneHeight").textContent=fmtH(next.height);$("distanceToNext").textContent=fmtH(round1(next.height-h));const span=next.height-cur.height,p=span>0?Math.max(0,Math.min(100,(h-cur.height)/span*100)):0;$("milestoneProgressBar").style.width=`${p}%`;$("progressText").textContent=`${cur.name} → ${next.name}　${p.toFixed(1)}%`;$("nextMilestoneDetailButton").onclick=()=>openMilestone(next);$("growthMessage").textContent=h===0?"地表からスタート。最初の1mを目指そう。":`${cur.name}を突破。次は${next.name}。`}const idx=MILESTONES.findIndex(m=>m.height>h),up=idx<0?[]:MILESTONES.slice(idx,idx+5);$("upcomingList").innerHTML="";up.forEach(m=>{const row=document.createElement("div");row.className="upcoming-item";row.innerHTML=`<span class="emoji">${m.icon}</span><div><strong>${m.name}</strong><small>${fmtH(m.height)}</small></div><span class="upcoming-distance">+${fmtH(round1(m.height-h))}</span>`;$("upcomingList").appendChild(row)});$("encyclopediaProgress").textContent=`${MILESTONES.filter(m=>m.height>0&&isUnlocked(activeData(),m)).length} / ${MILESTONES.filter(m=>m.height>0).length}`}
function renderToday(d){if(developerMode){$("successButton").classList.remove("hidden");$("failButton").classList.remove("hidden");$("todayCompleted").classList.add("hidden");return}const done=d.lastActionDate===todayKey();$("successButton").classList.toggle("hidden",done);$("failButton").classList.toggle("hidden",done);$("todayCompleted").classList.toggle("hidden",!done);if(done){const s=d.lastActionType==="success";$("todayResultIcon").textContent=s?"✓":"↘";$("todayResultIcon").style.background=s?"var(--green-pale)":"var(--red-pale)";$("todayResultIcon").style.color=s?"var(--green-dark)":"var(--red)";$("todayResultTitle").textContent=s?"今日も継続成功":"継続できなかった日を記録";$("todayResultDescription").textContent=`現在の高さは${fmtH(d.height)}です。`}}
function renderStatus(d){const t=titleFor(d);$("currentTitleBadge").textContent=`${t.icon} ${t.name}`;$("achievementProgress").textContent=`${unlockedA(d).length} / ${ACHIEVEMENTS.length}`}
function renderMoon(d){if(!d.moonBlessingEarned){$("moonBlessingCard").classList.add("hidden");return}$("moonBlessingCard").classList.remove("hidden");$("moonBlessingStatus").textContent=d.moonBlessing?"所持中。次の失敗時、高さの減少だけを1回防ぎます。連続失敗回数は増えます。":"使用済み。月到達で得られる一度限りの伝説級アイテムです。"}
function renderRisk(d){const r=failureCalc(d);$("nextFailureResult").textContent=`${fmtH(d.height)} → ${fmtH(r.newHeight)}`;if(r.usesMoonBlessing)$("riskDescription").textContent="月の加護が自動発動し、高さの減少を防ぎます。ただし連続失敗は1回増えます。";else if(d.consecutiveFailures===0)$("riskDescription").textContent=`1回目の失敗。現在の高さの1/5（${fmtH(r.loss)}）を失います。`;else if(d.consecutiveFailures===1)$("riskDescription").textContent="2回連続失敗。残っている高さが半分になります。";else $("riskDescription").textContent="3回連続失敗。豆の木は0mに戻ります。";$("failButtonDescription").textContent=r.usesMoonBlessing?"月の加護が発動":d.consecutiveFailures===0?"高さの1/5を失う":d.consecutiveFailures===1?"高さが半分になる":"0mに戻る"}

function snap(d){return{height:d.height,currentStreak:d.currentStreak,totalSuccess:d.totalSuccess,consecutiveFailures:d.consecutiveFailures,lastActionDate:d.lastActionDate,lastActionType:d.lastActionType,moonBlessing:d.moonBlessing,moonBlessingEarned:d.moonBlessingEarned}}function restore(d,s){Object.assign(d,s)}
function recordSuccess(){if(developerMode){devSuccess();return}const d=activeData();if(d.lastActionDate===todayKey()){toast("今日はすでに記録されています。");return}const before=snap(d),e=eventToday(),r=successCalc(d.height,e),passed=crossed(d.height,r.newHeight);d.height=r.newHeight;syncUnlocks(d);d.currentStreak++;d.totalSuccess++;d.consecutiveFailures=0;d.lastActionDate=todayKey();d.lastActionType="success";updateStats(d,e.type);const moon=awardMoon(d);d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"success",eventType:e.type,before,after:snap(d)});saveData();renderGame();renderHome();celebrate(r,e,passed,moon)}
function requestFailure(){if(developerMode){devFailure();return}const d=activeData();if(d.lastActionDate===todayKey()){toast("今日はすでに記録されています。");return}const r=failureCalc(d);pendingAction="failure";$("confirmIcon").textContent=r.usesMoonBlessing?"🌕":"⚠️";$("confirmTitle").textContent="継続できなかった日を記録しますか？";$("confirmDescription").textContent=r.usesMoonBlessing?`月の加護が発動します。高さは${fmtH(d.height)}のままですが、連続失敗は1回増えます。`:`${fmtH(d.height)} → ${fmtH(r.newHeight)}になります。`;$("confirmOkButton").textContent="記録する";$("confirmOverlay").classList.remove("hidden")}
function recordFailure(){const d=activeData(),before=snap(d),r=failureCalc(d);d.height=r.newHeight;d.currentStreak=0;d.consecutiveFailures=r.nextFailures;d.lastActionDate=todayKey();d.lastActionType="failure";if(r.usesMoonBlessing)d.moonBlessing=false;d.history.push({id:"act-"+Date.now().toString(36),date:todayKey(),timestamp:new Date().toISOString(),type:"failure",usedMoonBlessing:r.usesMoonBlessing,before,after:snap(d)});saveData();closeConfirm();renderGame();renderHome();toast(r.message)}
function requestUndo(){if(developerMode)return;const d=activeData(),i=todayHistoryIndex(d);if(i<0)return;pendingAction="undo";$("confirmIcon").textContent="↩";$("confirmTitle").textContent="今日の記録を取り消しますか？";$("confirmDescription").textContent="今日の操作直前の状態へ戻します。";$("confirmOkButton").textContent="取り消す";$("confirmOverlay").classList.remove("hidden")}
function undoToday(){const d=activeData(),i=todayHistoryIndex(d);if(i<0){closeConfirm();return}restore(d,d.history[i].before);d.history.splice(i,1);saveData();closeConfirm();renderGame();renderHome();toast("今日の記録を取り消しました。")}function todayHistoryIndex(d){for(let i=d.history.length-1;i>=0;i--)if(d.history[i].date===todayKey())return i;return-1}
function celebrate(r,e,passed,moon){$("celebrationIcon").textContent=moon?"🌕":e.type==="guerrilla"?"⚡":e.type==="special"?"✨":"🌱";$("celebrationKicker").textContent=moon?"LEGENDARY REWARD":"SUCCESS";$("celebrationTitle").textContent=`+${fmtH(r.gained)}`;$("celebrationDescription").textContent=`豆の木は${fmtH(r.newHeight)}まで成長しました。`;$("newMilestoneList").innerHTML="";passed.slice(-6).forEach(m=>{const x=document.createElement("div");x.className="new-milestone-chip";x.textContent=`${m.icon} ${m.name} を突破！`;$("newMilestoneList").appendChild(x)});if(passed.length>6){const x=document.createElement("div");x.className="new-milestone-chip";x.textContent=`ほか ${passed.length-6} 個の目標も突破`;$("newMilestoneList").appendChild(x)}if(moon){const x=document.createElement("div");x.className="new-milestone-chip";x.textContent="🌕 伝説級アイテム『月の加護』を獲得！";$("newMilestoneList").appendChild(x)}spawnCelebrationParticles();$("celebrationOverlay").classList.remove("hidden")}

function spawnCelebrationParticles(){document.querySelectorAll(".celebration-particle").forEach(x=>x.remove());const icons=["🌱","✨","🍃","⭐"];for(let i=0;i<22;i++){const p=document.createElement("span");p.className="celebration-particle";p.textContent=icons[i%icons.length];const a=(Math.PI*2*i/22)+(Math.random()*.3),dist=110+Math.random()*190;p.style.setProperty("--x",`${Math.cos(a)*dist}px`);p.style.setProperty("--y",`${Math.sin(a)*dist}px`);p.style.setProperty("--r",`${Math.round(Math.random()*540-270)}deg`);document.body.appendChild(p);setTimeout(()=>p.remove(),1400)}}
function openEncyclopedia(){encyclopediaCategory="すべて";renderEncyclopedia();$("encyclopediaOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function renderEncyclopedia(){const d=activeData();syncUnlocks(d);const all=MILESTONES.filter(m=>m.height>0),u=all.filter(m=>isUnlocked(d,m)).length,t=all.length;$("encyclopediaSummary").innerHTML=`<div><strong>${u} / ${t}</strong><small>解放済み</small></div><div><strong>${Math.round(u/t*100)}%</strong><small>図鑑完成率</small></div>`;
  const categoryNames=[...new Set(all.map(m=>m.category))];
  $("categoryProgressGrid").innerHTML="";
  categoryNames.forEach(c=>{const items=all.filter(m=>m.category===c),done=items.filter(m=>isUnlocked(d,m)).length,pct=Math.round(done/items.length*100);const card=document.createElement("div");card.className="category-progress-card";card.innerHTML=`<strong>${escapeHtml(c)}　${done}/${items.length}</strong><small>${pct}% 解放</small><div class="mini-progress"><span style="width:${pct}%"></span></div>`;$("categoryProgressGrid").appendChild(card)});
  const cats=["すべて",...categoryNames];$("categoryTabs").innerHTML="";cats.forEach(c=>{const b=document.createElement("button");b.className=`category-tab ${c===encyclopediaCategory?"active":""}`;b.textContent=c;b.onclick=()=>{encyclopediaCategory=c;renderEncyclopedia()};$("categoryTabs").appendChild(b)});let rows=all.filter(m=>encyclopediaCategory==="すべて"||m.category===encyclopediaCategory);if(encyclopediaUnlockFilter==="unlocked")rows=rows.filter(m=>isUnlocked(d,m));if(encyclopediaUnlockFilter==="locked")rows=rows.filter(m=>!isUnlocked(d,m));const q=encyclopediaQuery.trim().toLowerCase();if(q)rows=rows.filter(m=>[m.name,m.category,m.country,m.region,m.description,...(m.trivia||[]),...(m.wildlife||[]),...(m.risks||[])].filter(Boolean).join(" ").toLowerCase().includes(q));rows.sort((a,b)=>encyclopediaSort==="desc"?b.height-a.height:a.height-b.height);$("encyclopediaList").innerHTML="";if(!rows.length){$("encyclopediaList").innerHTML='<div class="encyclopedia-empty">条件に一致する項目はありません。</div>';return}rows.forEach(m=>{const ok=isUnlocked(d,m),row=document.createElement("button");row.type="button";row.className=`encyclopedia-item ${ok?"":"locked"}`;row.innerHTML=`<span class="e-icon">${ok?m.icon:"❓"}</span><div><h3>${ok?m.name:"？？？"}</h3><p>${ok?m.category:"未到達"}${m.approximate&&ok?"・概算比較":""}</p>${ok&&(m.country||m.region)?`<p class="e-sub e-place">${[m.country,m.region].filter(Boolean).join(" / ")}</p>`:""}</div><span class="e-height">${fmtH(m.height)}</span>`;if(ok)row.onclick=()=>openMilestone(m);$("encyclopediaList").appendChild(row)})}

function historyForDate(d,date){return [...(d.history||[])].reverse().find(x=>x.date===date)||null}
function openCalendar(){
  ensureValidSelectedHabits();
  if(!calendarHabitId)calendarHabitId=currentHabitId||visibleHabitIds()[0]||"noMasturbation";
  calendarCursor=new Date();renderCalendar();$("calendarOverlay").classList.remove("hidden");window.scrollTo(0,0);
}
function renderHabitTabs(containerId,selected,onSelect){
  const c=$(containerId);c.innerHTML="";
  Object.values(HABITS).filter(h=>isHabitVisible(h.id)).forEach(h=>{const b=document.createElement("button");b.className=`calendar-habit-tab ${h.id===selected?"active":""}`;b.textContent=`${h.icon} ${h.name}`;b.onclick=()=>onSelect(h.id);c.appendChild(b)});
}
function renderCalendar(){
  renderHabitTabs("calendarHabitTabs",calendarHabitId,id=>{calendarHabitId=id;renderCalendar()});
  const d=appData.habits[calendarHabitId],y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  $("calendarMonthLabel").textContent=`${y}年${m+1}月`;
  const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),today=new Date(),grid=$("calendarGrid");grid.innerHTML="";
  for(let i=0;i<first.getDay();i++){const x=document.createElement("div");x.className="calendar-day blank";grid.appendChild(x)}
  let s=0,f=0,u=0;
  for(let day=1;day<=days;day++){
    const date=new Date(y,m,day),key=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,rec=historyForDate(d,key),future=date>new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const cell=document.createElement("div");let state=rec?.type==="success"?"success":rec?.type==="failure"?"failure":"unrecorded";
    if(state==="success")s++;else if(state==="failure")f++;else if(!future)u++;
    cell.className=`calendar-day ${state} ${future?"future":""} ${key===todayKey()?"today":""}`;
    cell.innerHTML=`<strong>${day}</strong><span class="day-mark">${rec?.type==="success"?"✓":rec?.type==="failure"?"×":"·"}</span>`;
    grid.appendChild(cell);
  }
  $("calendarMonthStats").innerHTML=`<div><strong>${s}</strong><small>成功</small></div><div><strong>${f}</strong><small>継続できず</small></div><div><strong>${u}</strong><small>未記録</small></div>`;
}
function allTimeMaxHeight(d){return Math.max(Number(d.stats?.maxHeight||0),Number(d.height||0),...(d.history||[]).flatMap(x=>[Number(x.before?.height||0),Number(x.after?.height||0)]))}
function allTimeMaxStreak(d){return Math.max(Number(d.stats?.maxStreak||0),Number(d.currentStreak||0),...(d.history||[]).flatMap(x=>[Number(x.before?.currentStreak||0),Number(x.after?.currentStreak||0)]))}
function openRecords(){ensureValidSelectedHabits();recordsHabitId=(currentHabitId&&isHabitVisible(currentHabitId))?currentHabitId:(recordsHabitId||visibleHabitIds()[0]||"noMasturbation");renderRecords();$("recordsOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function renderRecords(){
  renderHabitTabs("recordsHabitTabs",recordsHabitId,id=>{recordsHabitId=id;renderRecords()});
  const d=appData.habits[recordsHabitId],h=HABITS[recordsHabitId];syncUnlocks(d);updateStats(d);
  const title=titleFor(d),all=MILESTONES.filter(m=>m.height>0),unlocked=all.filter(m=>isUnlocked(d,m)).length;
  $("recordsProfileCard").innerHTML=`<p>LOCAL PLAYER</p><h3>${escapeHtml(appData.profile.nickname)}　${title.icon} ${title.name}</h3><div class="records-profile-meta"><span>開始 ${new Date(appData.profile.createdAt).toLocaleDateString("ja-JP")}</span><span>${h.icon} ${h.name}</span><span>Schema v${appData.schemaVersion}</span></div>`;
  $("recordsSummary").innerHTML=[
    ["📏","現在高度",fmtH(d.height)],["🏔️","最高高度",fmtH(allTimeMaxHeight(d))],["🔥","最高連続",`${allTimeMaxStreak(d)}日`],["🏆","累計成功",`${d.totalSuccess}日`],
    ["📚","図鑑",`${unlocked}/${all.length}`],["✨","特別日成功",`${d.stats?.specialSuccess||0}回`],["⚡","ゲリラ成功",`${d.stats?.guerrillaSuccess||0}回`],["🌕","月の加護",d.moonBlessing?"所持":d.moonBlessingEarned?"使用済":"未獲得"]
  ].map(x=>`<div class="record-stat"><span>${x[0]}</span><strong>${x[2]}</strong><small>${x[1]}</small></div>`).join("");
  const cats=[...new Set(all.map(m=>m.category))];$("recordsCategoryProgress").innerHTML="";
  cats.forEach(c=>{const items=all.filter(m=>m.category===c),done=items.filter(m=>isUnlocked(d,m)).length,p=Math.round(done/items.length*100);$("recordsCategoryProgress").insertAdjacentHTML("beforeend",`<div class="record-category-row"><div><span>${escapeHtml(c)}</span><span>${done}/${items.length}</span></div><div class="mini-progress"><span style="width:${p}%"></span></div></div>`)});
  $("dataSchemaInfo").textContent=`localId: ${appData.profile.localId} / schemaVersion: ${appData.schemaVersion} / appVersion: ${APP_VERSION}`;
}
function exportBackup(){
  const payload={app:"Bean Growth",appVersion:APP_VERSION,schemaVersion:appData.schemaVersion,exportedAt:new Date().toISOString(),data:appData};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`bean-growth-backup-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("JSONバックアップを書き出しました。");
}

function openTitleSelector(){
  if(!currentHabitId){toast("先に禁欲カテゴリを開いてください。");return}
  renderTitleSelector();$("titleSelectorOverlay").classList.remove("hidden");window.scrollTo({top:0,behavior:"auto"});
}
function renderTitleSelector(){
  const d=activeData();syncTitleUnlocks(d);const current=titleFor(d);
  $("selectedTitleCard").innerHTML=`<span class="selected-title-icon">${current.icon}</span><div><p>SELECTED TITLE</p><h3>${escapeHtml(current.name)}</h3><small>${escapeHtml(current.description||"")}</small></div>`;
  $("unlockedTitleCount").textContent=`${d.unlockedTitles.length} / ${TITLES.length}`;
  const list=$("titleSelectionList");list.innerHTML="";
  TITLES.forEach(t=>{
    const unlocked=d.unlockedTitles.includes(t.id),selected=d.selectedTitleId===t.id,b=document.createElement("button");
    b.type="button";b.className=`title-option ${unlocked?"":"locked"} ${selected?"selected":""}`;
    b.innerHTML=`<span class="title-option-icon">${unlocked?t.icon:"🔒"}</span><span><strong>${escapeHtml(t.name)}</strong><small>${escapeHtml(unlocked?(t.description||""):(t.condition||"条件未達成"))}</small></span><span class="title-state">${selected?"使用中":unlocked?"選択":"未獲得"}</span>`;
    if(unlocked)b.onclick=()=>selectTitle(t.id);list.appendChild(b);
  });
}
function selectTitle(id){
  const d=activeData();syncTitleUnlocks(d);if(!d.unlockedTitles.includes(id)){toast("まだ獲得していない称号です。");return}
  d.selectedTitleId=id;if(!developerMode)saveData();renderTitleSelector();renderStatus(d);if(!developerMode)renderHome();toast(`称号を「${titleById(id).name}」に変更しました。`);
}

function openAchievements(){const d=activeData(),t=titleFor(d);$("achievementTitleIcon").textContent=t.icon;$("achievementTitleName").textContent=t.name;$("achievementsList").innerHTML="";ACHIEVEMENTS.forEach(a=>{const ok=a.test(d),r=document.createElement("div");r.className=`achievement-row ${ok?"":"locked"}`;r.innerHTML=`<span class="a-icon">${ok?a.icon:"🔒"}</span><div><h3>${a.name}</h3><p>${a.description}</p></div><span class="achievement-state">${ok?"達成":"未達成"}</span>`;$("achievementsList").appendChild(r)});$("achievementsOverlay").classList.remove("hidden");window.scrollTo(0,0)}
function openMilestone(m){
  $("milestoneModalIcon").textContent=m.icon;
  $("milestoneModalCategory").textContent=`${m.category}${m.approximate?"・概算比較":""}`;
  $("milestoneModalName").textContent=m.name;
  $("milestoneModalHeight").textContent=fmtH(m.height);
  $("milestoneModalLocation").textContent=[m.country,m.region].filter(Boolean).join(" / ");
  $("milestoneModalDescription").textContent=m.description||"";
  let html="";
  if(m.category==="世界の山"){
    if(m.dangerLevel){
      html+=makeDetailSection("⛰️ 登山上の危険度（ゲーム内目安）",`<p class="danger-stars">${"★".repeat(m.dangerLevel)}${"☆".repeat(5-m.dangerLevel)}</p><p class="detail-note">危険度は山同士の特徴を比較しやすくするためのゲーム内目安です。季節・ルート・天候・経験で実際の危険性は大きく変わります。</p>`);
    }
    if(m.risks?.length)html+=makeDetailSection("⚠️ 主な危険",`<div class="detail-tags">${m.risks.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);
    if(m.wildlife?.length)html+=makeDetailSection("🦌 動植物・生態",`<div class="detail-tags">${m.wildlife.map(x=>`<span class="detail-tag">${escapeHtml(x)}</span>`).join("")}</div>`);
    html+=makeDetailSection("📏 この標高の意味",`<p>${escapeHtml(scaleExplanation(m))}</p>`);
    if(m.facts?.length)html+=makeDetailSection("📌 基本情報",`<ul class="detail-bullets">${m.facts.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
    if(m.trivia?.length)html+=makeDetailSection("💡 豆知識",`<ul class="detail-bullets">${m.trivia.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }else{
    html=extraNonMountainDetails(m);
  }
  $("milestoneExtraDetails").innerHTML=html;
  $("milestoneModalOverlay").classList.remove("hidden");
}

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
function renderDeveloper(){$("developerPanel").classList.toggle("hidden",!developerMode);$("developerIndicator").classList.toggle("hidden",!developerMode)}function devAdd(n){developerData.height=round1(developerData.height+n);syncUnlocks(developerData);awardMoon(developerData);renderGame()}function devSet(){const n=Number($("developerHeightInput").value);if(!Number.isFinite(n)||n<0){toast("0以上の高さを入力してください。");return}developerData.height=round1(n);syncUnlocks(developerData);awardMoon(developerData);renderGame()}function devSuccess(){const e=eventToday(),r=successCalc(developerData.height,e),p=crossed(developerData.height,r.newHeight);developerData.height=r.newHeight;syncUnlocks(developerData);developerData.currentStreak++;developerData.totalSuccess++;developerData.consecutiveFailures=0;updateStats(developerData,e.type);const moon=awardMoon(developerData);renderGame();celebrate(r,e,p,moon)}function devFailure(){const r=failureCalc(developerData);developerData.height=r.newHeight;developerData.currentStreak=0;developerData.consecutiveFailures=r.nextFailures;if(r.usesMoonBlessing)developerData.moonBlessing=false;renderGame();toast(`🧪 ${r.message}`)}function devReset(){developerData=clone(developerOriginalData);developerForcedEvent="auto";$("developerEventSelect").value="auto";$("developerHeightInput").value="";renderGame();toast("テストデータを元に戻しました。")}
function toast(m){$("toast").textContent=m;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400)}function closeConfirm(){$("confirmOverlay").classList.add("hidden");pendingAction=null}

$("backButton").onclick=goHome;$("successButton").onclick=recordSuccess;$("failButton").onclick=requestFailure;$("undoButton").onclick=requestUndo;$("confirmCancelButton").onclick=closeConfirm;$("confirmOkButton").onclick=()=>pendingAction==="failure"?recordFailure():pendingAction==="undo"?undoToday():null;$("confirmOverlay").onclick=e=>{if(e.target===$("confirmOverlay"))closeConfirm()};$("celebrationCloseButton").onclick=()=>$("celebrationOverlay").classList.add("hidden");$("celebrationOverlay").onclick=e=>{if(e.target===$("celebrationOverlay"))$("celebrationOverlay").classList.add("hidden")};$("milestoneModalClose").onclick=()=>$("milestoneModalOverlay").classList.add("hidden");$("milestoneModalOverlay").onclick=e=>{if(e.target===$("milestoneModalOverlay"))$("milestoneModalOverlay").classList.add("hidden")};$("openEncyclopediaButton").onclick=openEncyclopedia;$("openEncyclopediaButton2").onclick=openEncyclopedia;$("encyclopediaCloseButton").onclick=()=>$("encyclopediaOverlay").classList.add("hidden");$("changeTitleButton").onclick=openTitleSelector;$("titleSelectorCloseButton").onclick=()=>$("titleSelectorOverlay").classList.add("hidden");$("openAchievementsButton").onclick=openAchievements;$("achievementsCloseButton").onclick=()=>$("achievementsOverlay").classList.add("hidden");$("settingsButton").onclick=openSettings;$("settingsCloseButton").onclick=()=>$("settingsOverlay").classList.add("hidden");$("developerButton").onclick=openDeveloper;$("developerModalClose").onclick=()=>$("developerModalOverlay").classList.add("hidden");document.querySelectorAll("[data-add-height]").forEach(b=>b.onclick=()=>devAdd(Number(b.dataset.addHeight)));document.querySelectorAll("[data-failure-count]").forEach(b=>b.onclick=()=>{developerData.consecutiveFailures=Number(b.dataset.failureCount);if(developerData.consecutiveFailures>0)developerData.currentStreak=0;renderGame()});$("developerSetHeightButton").onclick=devSet;$("developerEventSelect").onchange=e=>{developerForcedEvent=e.target.value;renderGame()};$("developerSuccessButton").onclick=devSuccess;$("developerFailureButton").onclick=devFailure;$("developerResetButton").onclick=devReset;$("developerExitButton").onclick=()=>exitDeveloper(true);$("encyclopediaSearch").oninput=e=>{encyclopediaQuery=e.target.value;renderEncyclopedia()};$("encyclopediaUnlockFilter").onchange=e=>{encyclopediaUnlockFilter=e.target.value;renderEncyclopedia()};$("encyclopediaSort").onchange=e=>{encyclopediaSort=e.target.value;renderEncyclopedia()};

$("openCalendarButton").onclick=openCalendar;$("openCalendarButton2").onclick=openCalendar;
$("calendarCloseButton").onclick=()=>$("calendarOverlay").classList.add("hidden");
$("calendarPrevButton").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
$("calendarNextButton").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};
$("openRecordsButton").onclick=openRecords;$("openRecordsButton2").onclick=openRecords;
$("recordsCloseButton").onclick=()=>$("recordsOverlay").classList.add("hidden");
$("exportDataButton").onclick=exportBackup;

ensureValidSelectedHabits();enrichAllUnlocks();renderHome();
