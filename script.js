"use strict";

/* =========================================================
   Bean Growth Version 3.1
========================================================= */

const STORAGE_KEY = "beanGrowthGame_v1";
const SPECIAL_DAYS_OF_MONTH = [1, 15];
const GUERRILLA_RATE = 0.08;

const HABITS = {
  noMasturbation: { id:"noMasturbation", name:"オナ禁", englishName:"NO MASTURBATION", icon:"🌱" },
  noAlcohol: { id:"noAlcohol", name:"禁酒", englishName:"NO ALCOHOL", icon:"🍺" },
  noSmoking: { id:"noSmoking", name:"禁煙", englishName:"NO SMOKING", icon:"🚭" }
};

function createInitialHabitData() {
  return { height:0, currentStreak:0, totalSuccess:0, consecutiveFailures:0, lastActionDate:null, lastActionType:null, history:[] };
}

function createInitialData() {
  return {
    version:"3.1",
    habits:{
      noMasturbation:createInitialHabitData(),
      noAlcohol:createInitialHabitData(),
      noSmoking:createInitialHabitData()
    }
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialData();
  try { return mergeWithInitialData(JSON.parse(saved)); }
  catch (error) { console.error("保存データの読み込み失敗", error); return createInitialData(); }
}

function mergeWithInitialData(saved) {
  const initial = createInitialData();
  const merged = { ...initial, ...saved, version:"3.1", habits:{...initial.habits} };
  Object.keys(HABITS).forEach(id => {
    merged.habits[id] = { ...initial.habits[id], ...(saved.habits?.[id] || {}) };
  });
  return merged;
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getTodayDisplay() {
  return new Intl.DateTimeFormat("ja-JP", {year:"numeric", month:"long", day:"numeric", weekday:"short"}).format(new Date());
}

let appData = loadData();
let currentHabitId = null;
let pendingAction = null;
let developerMode = false;
let developerData = null;
let developerOriginalData = null;
let developerForcedEvent = "auto";

const $ = id => document.getElementById(id);

function renderHome() {
  const list = $("habitList");
  list.innerHTML = "";
  Object.values(HABITS).forEach(habit => {
    const data = appData.habits[habit.id];
    let status = "今日は未記録";
    if (data.lastActionDate === getTodayKey()) status = data.lastActionType === "success" ? "今日は成功済み" : "今日は失敗を記録";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "habit-card";
    button.innerHTML = `
      <span class="habit-icon">${habit.icon}</span>
      <span class="habit-content"><span class="habit-name">${habit.name}</span><span class="habit-meta">連続 ${data.currentStreak}日 ・ ${status}</span></span>
      <span class="habit-height">${formatHeight(data.height)}</span><span class="habit-arrow">›</span>`;
    button.addEventListener("click", () => openHabit(habit.id));
    list.appendChild(button);
  });
}

function openHabit(id) {
  currentHabitId = id;
  $("homeScreen").classList.remove("active");
  $("gameScreen").classList.add("active");
  renderGame();
  window.scrollTo(0,0);
}

function goHome() {
  if (developerMode) exitDeveloperMode();
  currentHabitId = null;
  $("gameScreen").classList.remove("active");
  $("homeScreen").classList.add("active");
  renderHome();
  window.scrollTo(0,0);
}

function getActiveData() { return developerMode ? developerData : appData.habits[currentHabitId]; }

function renderGame() {
  if (!currentHabitId) return;
  const habit = HABITS[currentHabitId];
  const data = getActiveData();

  $("gameIcon").textContent = habit.icon;
  $("gameEnglishName").textContent = habit.englishName;
  $("gameTitle").textContent = habit.name;
  $("todayDate").textContent = getTodayDisplay();
  $("currentHeight").textContent = formatNumber(data.height);
  $("heightHeadline").textContent = formatHeight(data.height);
  $("journeyCurrentHeight").textContent = formatHeight(data.height);
  $("currentStreak").textContent = formatNumber(data.currentStreak);
  $("totalSuccess").textContent = formatNumber(data.totalSuccess);
  $("consecutiveFailures").textContent = data.consecutiveFailures;

  renderDeveloperState();
  renderTree(data.height);
  renderGrowthMessage(data.height);
  renderEvent(data);
  renderMilestones(data.height);
  renderTodayStatus(data);
  renderFailureRisk(data);
}

function renderTree(height) {
  const visual = 28 + Math.min(28, Math.log10(height + 1) * 12);
  $("treeStem").style.height = `${visual}px`;
}

function renderGrowthMessage(height) {
  const current = findCurrentMilestone(height);
  const next = findNextMilestone(height);
  if (!next) { $("growthMessage").textContent = "月まで到達。次はさらに先の宇宙へ。"; return; }
  if (height === 0) { $("growthMessage").textContent = "地表からスタート。最初の1mを目指そう。"; return; }
  $("growthMessage").textContent = `${current.n}を突破。次は${next.n}まであと${formatHeight(roundToOneDecimal(next.h-height))}。`;
}

function eventFromType(type) {
  if (type === "special") return {type, icon:"✨", title:"特別成長日", reward:"+10m", description:"今日の成功は10m成長", special:true, guerrilla:false};
  if (type === "guerrilla") return {type, icon:"⚡", title:"ゲリラ成長日", reward:"×1.1", description:"今日の成功で現在高が1.1倍", special:false, guerrilla:true};
  if (type === "both") return {type, icon:"🔥", title:"超成長日", reward:"+10m → ×1.1", description:"10m成長後、さらに1.1倍", special:true, guerrilla:true};
  return {type:"normal", icon:"🌱", title:"通常成長日", reward:"+1m", description:"今日の成功で1m成長", special:false, guerrilla:false};
}

function getEventForToday() {
  if (developerMode && developerForcedEvent !== "auto") return eventFromType(developerForcedEvent);
  const day = new Date().getDate();
  if (SPECIAL_DAYS_OF_MONTH.includes(day)) return eventFromType("special");
  const value = seededRandom(hashString(getTodayKey()));
  return value < GUERRILLA_RATE ? eventFromType("guerrilla") : eventFromType("normal");
}

function hashString(text) {
  let hash = 2166136261;
  for (let i=0;i<text.length;i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash,16777619); }
  return hash >>> 0;
}

function seededRandom(seed) {
  let x = seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

function renderEvent(data) {
  const event = getEventForToday();
  const badge = $("eventBadge");
  badge.className = `event-badge ${event.type}`;
  $("eventIcon").textContent = event.icon;
  $("eventTitle").textContent = event.title;
  $("eventDescription").textContent = event.description;
  $("eventReward").textContent = event.reward;
  const result = calculateSuccessResult(data.height,event);
  $("successButtonDescription").textContent = `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}`;
}

function calculateSuccessResult(height,event) {
  let newHeight = height;
  if (!event.special && !event.guerrilla) newHeight = height + 1;
  if (event.special && !event.guerrilla) newHeight = height + 10;
  if (!event.special && event.guerrilla) newHeight = height === 0 ? 1 : height * 1.1;
  if (event.special && event.guerrilla) newHeight = (height + 10) * 1.1;
  newHeight = roundToOneDecimal(newHeight);
  return {newHeight, gained:roundToOneDecimal(newHeight-height)};
}

function recordSuccess() {
  if (developerMode) { simulateDeveloperSuccess(); return; }
  const data = getActiveData();
  if (data.lastActionDate === getTodayKey()) { showToast("今日はすでに記録されています。"); return; }
  const beforeHeight = data.height;
  const before = createSnapshot(data);
  const event = getEventForToday();
  const result = calculateSuccessResult(data.height,event);
  data.height = result.newHeight;
  data.currentStreak += 1;
  data.totalSuccess += 1;
  data.consecutiveFailures = 0;
  data.lastActionDate = getTodayKey();
  data.lastActionType = "success";
  data.history.push({date:getTodayKey(),type:"success",eventType:event.type,before,after:createSnapshot(data)});
  saveData(); renderGame(); renderHome();
  const crossed = MILESTONES.filter(m => m.h > beforeHeight && m.h <= data.height);
  showToast(crossed.length ? `🎉 ${crossed[crossed.length-1].n}を突破！` : `🌱 ${formatHeight(result.gained)}成長しました。`);
}

function requestFailure() {
  if (developerMode) { simulateDeveloperFailure(); return; }
  const data = getActiveData();
  if (data.lastActionDate === getTodayKey()) { showToast("今日はすでに記録されています。"); return; }
  const result = calculateFailureResult(data.height,data.consecutiveFailures);
  pendingAction = "failure";
  $("modalIcon").textContent = "⚠️";
  $("modalTitle").textContent = "継続できなかった記録を残しますか？";
  $("modalDescription").textContent = `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}になります。`;
  $("modalConfirmButton").textContent = "記録する";
  openModal();
}

function recordFailure() {
  const data = getActiveData();
  const before = createSnapshot(data);
  const result = calculateFailureResult(data.height,data.consecutiveFailures);
  data.height = result.newHeight;
  data.currentStreak = 0;
  data.consecutiveFailures = Math.min(3,data.consecutiveFailures+1);
  data.lastActionDate = getTodayKey();
  data.lastActionType = "failure";
  data.history.push({date:getTodayKey(),type:"failure",before,after:createSnapshot(data)});
  saveData(); closeModal(); renderGame(); renderHome(); showToast(result.message);
}

function calculateFailureResult(height,failures) {
  const number = failures + 1;
  if (number === 1) {
    const loss = Math.floor(height/5);
    return {newHeight:roundToOneDecimal(Math.max(0,height-loss)),loss,message:`1回目。${formatHeight(loss)}失いました。`};
  }
  if (number === 2) {
    const newHeight = floorToOneDecimal(height/2);
    return {newHeight,loss:roundToOneDecimal(height-newHeight),message:"2回連続。高さが半分になりました。"};
  }
  return {newHeight:0,loss:height,message:"3回連続。豆の木は0mに戻りました。"};
}

function renderFailureRisk(data) {
  const result = calculateFailureResult(data.height,data.consecutiveFailures);
  $("nextFailureResult").textContent = `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}`;
  const next = data.consecutiveFailures + 1;
  if (next === 1) $("riskDescription").textContent = `現在の高さの1/5を計算し、端数切り捨てで${formatHeight(result.loss)}減少します。`;
  else if (next === 2) $("riskDescription").textContent = "連続2回目となり、残っている高さが半分になります。";
  else $("riskDescription").textContent = "連続3回目となり、豆の木は0mまで戻ります。";
  updateFailureButton(data);
}

function updateFailureButton(data) {
  const next = data.consecutiveFailures + 1;
  if (next === 1) $("failButtonDescription").textContent = "次は現在高の1/5を失う";
  else if (next === 2) $("failButtonDescription").textContent = "次は現在高が半分になる";
  else $("failButtonDescription").textContent = "次は0mに戻る";
}

function renderTodayStatus(data) {
  if (developerMode) { $("todayPending").classList.remove("hidden"); $("todayCompleted").classList.add("hidden"); return; }
  if (data.lastActionDate !== getTodayKey()) { $("todayPending").classList.remove("hidden"); $("todayCompleted").classList.add("hidden"); return; }
  $("todayPending").classList.add("hidden"); $("todayCompleted").classList.remove("hidden");
  const success = data.lastActionType === "success";
  $("todayResultIcon").textContent = success ? "✓" : "↘";
  $("todayResultIcon").style.background = success ? "var(--green-pale)" : "var(--red-light)";
  $("todayResultIcon").style.color = success ? "var(--green-dark)" : "var(--red)";
  $("todayResultTitle").textContent = success ? "今日も継続成功" : "今日の記録を保存しました";
  $("todayResultDescription").textContent = `現在の高さは${formatHeight(data.height)}です。`;
}

function requestUndo() {
  if (developerMode) return;
  const data = getActiveData();
  const index = findTodayHistoryIndex(data);
  if (index === -1) return;
  pendingAction = "undo";
  $("modalIcon").textContent = "↩";
  $("modalTitle").textContent = "今日の記録を取り消しますか？";
  $("modalDescription").textContent = "今日の操作直前の状態へ戻します。";
  $("modalConfirmButton").textContent = "取り消す";
  openModal();
}

function undoTodayAction() {
  const data = getActiveData();
  const index = findTodayHistoryIndex(data);
  if (index === -1) { closeModal(); return; }
  restoreSnapshot(data,data.history[index].before);
  data.history.splice(index,1);
  saveData(); closeModal(); renderGame(); renderHome(); showToast("今日の記録を取り消しました。");
}

function findTodayHistoryIndex(data) {
  for (let i=data.history.length-1;i>=0;i--) if (data.history[i].date === getTodayKey()) return i;
  return -1;
}

function findCurrentMilestone(height) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) { if (height >= m.h) current = m; else break; }
  return current;
}

function findNextMilestone(height) { return MILESTONES.find(m => m.h > height) || null; }

function renderMilestones(height) {
  const current = findCurrentMilestone(height);
  const next = findNextMilestone(height);

  $("currentMilestoneIcon").textContent = current.i;
  $("currentMilestoneName").textContent = current.n;
  $("currentMilestoneHeight").textContent = formatHeight(current.h);
  $("currentMilestoneDescription").textContent = current.d;
  $("currentMilestoneDetailButton").onclick = () => openMilestoneModal(current);

  $("prevMilestoneMini").innerHTML = `<strong>${current.i} ${current.n}</strong><small>${formatHeight(current.h)}</small>`;

  if (!next) {
    $("nextMilestoneCard").classList.add("hidden");
    $("nextMilestoneMini").innerHTML = `<strong>🌌 次の宇宙へ</strong><small>月を突破</small>`;
  } else {
    $("nextMilestoneCard").classList.remove("hidden");
    $("nextMilestoneIcon").textContent = next.i;
    $("nextMilestoneName").textContent = next.n;
    $("nextMilestoneHeight").textContent = formatHeight(next.h);
    $("nextMilestoneDescription").textContent = next.d;
    $("distanceToNext").textContent = formatHeight(roundToOneDecimal(next.h-height));
    const interval = next.h-current.h;
    let progress = interval > 0 ? ((height-current.h)/interval)*100 : 0;
    progress = Math.max(0,Math.min(100,progress));
    $("milestoneProgressBar").style.width = `${progress}%`;
    $("progressText").textContent = `${current.n} → ${next.n}　${progress.toFixed(1)}%`;
    $("nextMilestoneDetailButton").onclick = () => openMilestoneModal(next);
    $("nextMilestoneMini").innerHTML = `<strong>${next.i} ${next.n}</strong><small>あと${formatHeight(roundToOneDecimal(next.h-height))}</small>`;
  }

  renderUpcoming(height);
  renderAchievements(height);
}

function renderUpcoming(height) {
  const upcoming = MILESTONES.filter(m => m.h > height).slice(0,5);
  const box = $("upcomingList"); box.innerHTML = "";
  upcoming.forEach(m => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "upcoming-item";
    button.innerHTML = `<span>${m.i}</span><div><strong>${m.n}</strong><small>${formatHeight(m.h)}</small></div><small>あと${formatHeight(roundToOneDecimal(m.h-height))}</small>`;
    button.addEventListener("click",()=>openMilestoneModal(m));
    box.appendChild(button);
  });
}

function renderAchievements(height) {
  const reached = MILESTONES.filter(m => m.h > 0 && m.h <= height);
  $("achievementCount").textContent = reached.length;
  const list = $("achievementList"); list.innerHTML = "";
  if (!reached.length) {
    const item = document.createElement("div"); item.className = "achievement-item";
    item.innerHTML = `<span class="achievement-icon">🌱</span><span class="achievement-name">まだ未到達</span><span class="achievement-height">最初の1mへ</span>`;
    list.appendChild(item); return;
  }
  reached.slice().reverse().forEach(m => {
    const button = document.createElement("button"); button.type="button"; button.className="achievement-item";
    button.innerHTML = `<span class="achievement-icon">${m.i}</span><span class="achievement-name">${m.n}</span><span class="achievement-height">${formatHeight(m.h)}</span>`;
    button.addEventListener("click",()=>openMilestoneModal(m)); list.appendChild(button);
  });
}

function openMilestoneModal(m) {
  $("milestoneModalIcon").textContent = m.i;
  $("milestoneModalCategory").textContent = m.c;
  $("milestoneModalName").textContent = m.n;
  $("milestoneModalHeight").textContent = formatHeight(m.h);
  $("milestoneModalDescription").textContent = m.x;
  $("milestoneModalNote").textContent = `比較メモ：${m.note}`;
  $("milestoneModalOverlay").classList.remove("hidden");
}

function closeMilestoneModal() { $("milestoneModalOverlay").classList.add("hidden"); }

function openDeveloperSelector() { $("developerModalOverlay").classList.remove("hidden"); }
function closeDeveloperSelector() { $("developerModalOverlay").classList.add("hidden"); }

function startDeveloperMode(id) {
  currentHabitId = id; developerMode = true;
  developerOriginalData = deepClone(appData.habits[id]);
  developerData = deepClone(developerOriginalData);
  developerForcedEvent = "auto";
  $("developerEventSelect").value = "auto";
  closeDeveloperSelector();
  $("homeScreen").classList.remove("active"); $("gameScreen").classList.add("active");
  renderGame(); window.scrollTo(0,0);
}

function exitDeveloperMode() {
  developerMode = false; developerData = null; developerOriginalData = null; developerForcedEvent = "auto";
  $("developerPanel").classList.add("hidden"); $("developerIndicator").classList.add("hidden");
  if (currentHabitId) renderGame();
}

function renderDeveloperState() {
  $("developerIndicator").classList.toggle("hidden",!developerMode);
  $("developerPanel").classList.toggle("hidden",!developerMode);
}

function developerAddHeight(amount) { if (!developerMode) return; developerData.height = roundToOneDecimal(developerData.height+amount); renderGame(); }
function developerSetHeight() {
  if (!developerMode) return;
  const input = Number($("developerHeightInput").value);
  if (!Number.isFinite(input) || input < 0) { showToast("0以上の高さを入力してください。"); return; }
  developerData.height = roundToOneDecimal(input); renderGame(); showToast(`テスト高度を${formatHeight(input)}に設定しました。`);
}
function developerSetFailureCount(count) { if (!developerMode) return; developerData.consecutiveFailures=count; if (count>0) developerData.currentStreak=0; renderGame(); }
function simulateDeveloperSuccess() {
  const event = getEventForToday(); const result = calculateSuccessResult(developerData.height,event);
  developerData.height=result.newHeight; developerData.currentStreak+=1; developerData.totalSuccess+=1; developerData.consecutiveFailures=0;
  renderGame(); showToast(`🧪 成功テスト：${formatHeight(result.gained)}成長`);
}
function simulateDeveloperFailure() {
  const result = calculateFailureResult(developerData.height,developerData.consecutiveFailures);
  developerData.height=result.newHeight; developerData.currentStreak=0; developerData.consecutiveFailures=Math.min(3,developerData.consecutiveFailures+1);
  renderGame(); showToast(`🧪 ${result.message}`);
}
function resetDeveloperData() {
  if (!developerMode) return;
  developerData=deepClone(developerOriginalData); developerForcedEvent="auto"; $("developerEventSelect").value="auto"; $("developerHeightInput").value="";
  renderGame(); showToast("テストデータを元に戻しました。");
}

function createSnapshot(data) { return {height:data.height,currentStreak:data.currentStreak,totalSuccess:data.totalSuccess,consecutiveFailures:data.consecutiveFailures,lastActionDate:data.lastActionDate,lastActionType:data.lastActionType}; }
function restoreSnapshot(data,s) { data.height=s.height; data.currentStreak=s.currentStreak; data.totalSuccess=s.totalSuccess; data.consecutiveFailures=s.consecutiveFailures; data.lastActionDate=s.lastActionDate; data.lastActionType=s.lastActionType; }
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function roundToOneDecimal(v) { return Math.round(v*10)/10; }
function floorToOneDecimal(v) { return Math.floor(v*10)/10; }
function formatNumber(n) { return Number(n).toLocaleString("ja-JP",{maximumFractionDigits:1}); }
function formatHeight(m) {
  const v=Number(m);
  if (v<1000) return `${formatNumber(v)}m`;
  return `${formatNumber(v/1000)}km`;
}

let toastTimer=null;
function showToast(message) {
  $("toast").textContent=message; $("toast").classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400);
}
function openModal() { $("modalOverlay").classList.remove("hidden"); }
function closeModal() { $("modalOverlay").classList.add("hidden"); pendingAction=null; }

$("backButton").addEventListener("click",goHome);
$("successButton").addEventListener("click",recordSuccess);
$("failButton").addEventListener("click",requestFailure);
$("undoButton").addEventListener("click",requestUndo);
$("modalCancelButton").addEventListener("click",closeModal);
$("modalConfirmButton").addEventListener("click",()=>{ if (pendingAction==="failure") recordFailure(); else if (pendingAction==="undo") undoTodayAction(); });
$("modalOverlay").addEventListener("click",e=>{ if (e.target===$("modalOverlay")) closeModal(); });
$("milestoneModalClose").addEventListener("click",closeMilestoneModal);
$("milestoneModalOverlay").addEventListener("click",e=>{ if (e.target===$("milestoneModalOverlay")) closeMilestoneModal(); });
$("developerButton").addEventListener("click",openDeveloperSelector);
$("developerModalClose").addEventListener("click",closeDeveloperSelector);
document.querySelectorAll(".developer-habit-button").forEach(b=>b.addEventListener("click",()=>startDeveloperMode(b.dataset.developerHabit)));
document.querySelectorAll("[data-add-height]").forEach(b=>b.addEventListener("click",()=>developerAddHeight(Number(b.dataset.addHeight))));
$("developerSetHeightButton").addEventListener("click",developerSetHeight);
$("developerEventSelect").addEventListener("change",e=>{ developerForcedEvent=e.target.value; renderGame(); });
document.querySelectorAll(".dev-failure-button").forEach(b=>b.addEventListener("click",()=>developerSetFailureCount(Number(b.dataset.failureCount))));
$("developerSuccessButton").addEventListener("click",simulateDeveloperSuccess);
$("developerFailureButton").addEventListener("click",simulateDeveloperFailure);
$("developerResetButton").addEventListener("click",resetDeveloperData);
$("developerExitButton").addEventListener("click",()=>{ exitDeveloperMode(); showToast("開発者モードを終了しました。"); });

renderHome();
