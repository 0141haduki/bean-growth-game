import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVJNFfeWeBJMUSEz_-lfcXq5Bwnvy6-90",
  authDomain: "bean-growth.firebaseapp.com",
  projectId: "bean-growth",
  storageBucket: "bean-growth.firebasestorage.app",
  messagingSenderId: "631079544812",
  appId: "1:631079544812:web:2f8f6a961d89fe625702c9",
  measurementId: "G-R5L9JXL3S0"
};

const APP_VERSION = "4.79";
const LOCAL_STORAGE_KEY = "beanGrowthGame_v1";
const RESTORE_SAFETY_KEY = "beanGrowthGame_beforeCloudRestore_v1";
const AUTO_BACKUP_KEY = "beanGrowthGame_cloudAutoBackup_v1";
const LAST_SYNC_HASH_KEY = "beanGrowthGame_lastSyncHash_v1";
const PENDING_SYNC_KEY = "beanGrowthGame_pendingCloudSync_v1";
const MAX_BACKUP_BYTES = 900 * 1024;
const AUTO_BACKUP_INTERVAL_MS = 60 * 1000;
const AUTO_BACKUP_DEBOUNCE_MS = 2500;
const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const HABIT_LABELS = {
  noMasturbation: "オナ禁", noAlcohol: "禁酒", noSmoking: "禁煙", noGambling: "ギャンブル禁",
  noSNS: "SNS禁", noShortVideos: "ショート動画禁", noGaming: "ゲーム禁", noImpulseBuying: "衝動買い禁",
  noSnacking: "娯楽動画禁", noCaffeine: "カフェイン禁", noAdultContent: "成人向けコンテンツ禁", noJunkFood: "ジャンクフード禁"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const cloudBackupButton = document.getElementById("cloudBackupButton");
const cloudRestoreButton = document.getElementById("cloudRestoreButton");
const cloudUndoRestoreButton = document.getElementById("cloudUndoRestoreButton");
const cloudRefreshButton = document.getElementById("cloudRefreshButton");
const cloudDiagnosticsButton = document.getElementById("cloudDiagnosticsButton");
const cloudAutoBackupToggle = document.getElementById("cloudAutoBackupToggle");
const cloudBackupStatus = document.getElementById("cloudBackupStatus");
const cloudConnectionStatus = document.getElementById("cloudConnectionStatus");
const cloudUserId = document.getElementById("cloudUserId");
const cloudLastBackup = document.getElementById("cloudLastBackup");
const cloudSyncState = document.getElementById("cloudSyncState");
const cloudRuntimeStatus = document.getElementById("cloudRuntimeStatus");

let latestCloudBackupString = null;
let latestCloudMeta = null;
let latestSyncState = "unknown";
let lastAutoBackedUpLocalString = null;
let autoBackupTimer = null;
let autoBackupDebounceTimer = null;
let autoBackupRunning = false;

function setText(element, text) { if (element) element.textContent = text; }
function shortUid(uid) { return !uid ? "未取得" : uid.length <= 16 ? uid : `${uid.slice(0, 8)}…${uid.slice(-6)}`; }
function getLocalDataString() { return localStorage.getItem(LOCAL_STORAGE_KEY); }
function simpleHash(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text || "").length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0");
}
function parseDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d;
}
function formatDate(value) {
  const date = parseDate(value); if (!date) return "まだ保存されていません";
  return new Intl.DateTimeFormat("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" }).format(date);
}
function parseLocalData() {
  const localData = getLocalDataString();
  if (!localData) throw new Error("Bean Growth のローカルデータが見つかりません。");
  if (new Blob([localData]).size > MAX_BACKUP_BYTES) throw new Error("クラウド保存データが大きくなりすぎています。保存方式の分割が必要です。");
  try { return JSON.parse(localData); } catch { throw new Error("ローカルデータのJSON解析に失敗しました。"); }
}
function localUpdatedAt(data = null) {
  const d = data || (() => { try { return JSON.parse(getLocalDataString() || "null"); } catch { return null; } })();
  return d?.profile?.lastLocalChangeAt || d?.profile?.lastMigratedAt || d?.profile?.createdAt || null;
}
function runtimeLabel() {
  const capNative = Boolean(window.Capacitor?.isNativePlatform?.());
  if (capNative) return `Android / Capacitor (${navigator.onLine ? "オンライン" : "オフライン"})`;
  if (/Android/i.test(navigator.userAgent)) return `Android Web (${navigator.onLine ? "オンライン" : "オフライン"})`;
  return `Web (${navigator.onLine ? "オンライン" : "オフライン"})`;
}
function updateRuntimeStatus() { setText(cloudRuntimeStatus, runtimeLabel()); }
function updateUndoButtonState() { if (cloudUndoRestoreButton) cloudUndoRestoreButton.disabled = !localStorage.getItem(RESTORE_SAFETY_KEY); }
function updateNetworkState() {
  updateRuntimeStatus();
  if (!navigator.onLine) { setText(cloudConnectionStatus, "オフラインです。端末内では利用できます。再接続後に同期できます。"); return; }
  setText(cloudConnectionStatus, auth.currentUser ? "Firebase接続済み" : "Firebaseへ接続中...");
}
function setCloudButtonsDisabled(disabled) {
  [cloudBackupButton, cloudRestoreButton, cloudRefreshButton, cloudDiagnosticsButton].forEach(button => { if (button) button.disabled = disabled; });
  if (cloudUndoRestoreButton) cloudUndoRestoreButton.disabled = disabled || !localStorage.getItem(RESTORE_SAFETY_KEY);
}
function updateSyncState() {
  const localString = getLocalDataString();
  if (!localString) { latestSyncState="no-local"; setText(cloudSyncState, "端末データなし"); return latestSyncState; }
  if (latestCloudBackupString === null) { latestSyncState="no-cloud"; setText(cloudSyncState, "クラウドバックアップなし / 未確認"); return latestSyncState; }
  const localHash=simpleHash(localString), cloudHash=simpleHash(latestCloudBackupString), baseline=localStorage.getItem(LAST_SYNC_HASH_KEY);
  if (localHash===cloudHash) { latestSyncState="synced"; localStorage.setItem(LAST_SYNC_HASH_KEY,localHash); localStorage.removeItem(PENDING_SYNC_KEY); setText(cloudSyncState,"端末とクラウドは一致しています"); return latestSyncState; }
  const localChanged=Boolean(baseline&&localHash!==baseline), cloudChanged=Boolean(baseline&&cloudHash!==baseline);
  if (localChanged&&cloudChanged) { latestSyncState="conflict"; setText(cloudSyncState,"⚠ 端末とクラウドの両方に変更があります。どちらを使うか選んでください"); return latestSyncState; }
  const localTime=parseDate(localUpdatedAt()), cloudTime=parseDate(latestCloudMeta?.localUpdatedAt || latestCloudMeta?.clientBackedUpAt || latestCloudMeta?.backedUpAt);
  if (cloudTime&&(!localTime||cloudTime>localTime)) { latestSyncState="cloud-newer"; setText(cloudSyncState,"クラウドの方が新しい可能性があります"); }
  else { latestSyncState="local-newer"; setText(cloudSyncState,"端末の方が新しいため、クラウド保存できます"); }
  return latestSyncState;
}

function dateKeyFromDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateFromKey(k){const [y,m,d]=String(k).split("-").map(Number);return new Date(y,m-1,d,12)}
function blankBucket(label){return{label,eligible:0,success:0,failure:0,unrecorded:0,resets:0}}
function isResetRow(row){return Boolean(row?.resetOccurred)||(row?.type==="failure"&&Number(row?.before?.consecutiveFailures||0)>=2&&Number(row?.after?.height||0)===0)}
function aggregateHabit(habit, profileStart, today){
  const weekdays=Array.from({length:7},(_,i)=>blankBucket(WEEKDAY_NAMES[i]));
  const monthDays=Array.from({length:31},(_,i)=>blankBucket(String(i+1)));
  const rows=(habit?.history||[]).filter(x=>x?.date&&["success","failure"].includes(x.type));
  const byDate=new Map(rows.map(x=>[x.date,x]));
  for(let cur=new Date(profileStart);cur<=today;cur.setDate(cur.getDate()+1)){
    const key=dateKeyFromDate(cur), row=byDate.get(key), w=weekdays[cur.getDay()], md=monthDays[cur.getDate()-1]; w.eligible++;md.eligible++;
    for(const b of [w,md]){if(row?.type==="success")b.success++;else if(row?.type==="failure"){b.failure++;if(isResetRow(row))b.resets++}else b.unrecorded++;}
  }
  const success=rows.filter(x=>x.type==="success").length, failure=rows.filter(x=>x.type==="failure").length, resets=rows.filter(isResetRow).length;
  return{success,failure,records:success+failure,resets,weekdays,monthDays};
}
function mergeBucket(target, source){for(const k of ["eligible","success","failure","unrecorded","resets"])target[k]+=Number(source?.[k]||0)}
function buildAnalyticsContribution(data){
  const rawStart=new Date(data?.profile?.createdAt||Date.now()), start=new Date(rawStart.getFullYear(),rawStart.getMonth(),rawStart.getDate(),12), now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  const weekdays=Array.from({length:7},(_,i)=>blankBucket(WEEKDAY_NAMES[i])), monthDays=Array.from({length:31},(_,i)=>blankBucket(String(i+1))), habits={}; let records=0,resets=0;
  for(const [id,habit] of Object.entries(data?.habits||{})){
    const a=aggregateHabit(habit,start,today); records+=a.records;resets+=a.resets;
    a.weekdays.forEach((x,i)=>mergeBucket(weekdays[i],x));a.monthDays.forEach((x,i)=>mergeBucket(monthDays[i],x));
    habits[id]={name:HABIT_LABELS[id]||id,success:a.success,failure:a.failure,records:a.records,resets:a.resets,weekdays:a.weekdays,monthDays:a.monthDays};
  }
  return{schemaVersion:1,appVersion:APP_VERSION,clientUpdatedAt:new Date().toISOString(),records,resets,weekdays,monthDays,habits};
}
function finalizeBucket(b){const recorded=Number(b.success||0)+Number(b.failure||0);return{...b,recorded,recordRate:b.eligible?Math.round(recorded/b.eligible*1000)/10:0,failureRate:recorded?Math.round(b.failure/recorded*1000)/10:0,resetRate:recorded?Math.round(b.resets/recorded*1000)/10:0}}
function combineContributions(items){
  const weekdays=Array.from({length:7},(_,i)=>blankBucket(WEEKDAY_NAMES[i])),monthDays=Array.from({length:31},(_,i)=>blankBucket(String(i+1))),habits={};let records=0,resets=0;
  items.forEach(item=>{records+=Number(item.records||0);resets+=Number(item.resets||0);(item.weekdays||[]).forEach((x,i)=>mergeBucket(weekdays[i],x));(item.monthDays||[]).forEach((x,i)=>mergeBucket(monthDays[i],x));for(const [id,h] of Object.entries(item.habits||{})){if(!habits[id])habits[id]={id,name:h.name||HABIT_LABELS[id]||id,success:0,failure:0,records:0,resets:0};for(const k of ["success","failure","records","resets"])habits[id][k]+=Number(h[k]||0)}});
  const habitRows=Object.values(habits).map(h=>({...h,failureRate:h.records?Math.round(h.failure/h.records*1000)/10:0}));
  return{users:items.length,records,resets,weekdays:weekdays.map(finalizeBucket),monthDays:monthDays.map(finalizeBucket),habits:habitRows,updatedAt:new Intl.DateTimeFormat("ja-JP",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date())};
}

export const firebaseUserReady = new Promise((resolve,reject)=>{
  let unsubscribe=null;unsubscribe=onAuthStateChanged(auth,async user=>{try{if(user){console.log("[Bean Growth] Firebase login:",user.uid);setText(cloudUserId,shortUid(user.uid));setText(cloudConnectionStatus,"Firebase接続済み");if(typeof unsubscribe==="function")unsubscribe();resolve(user);return}await signInAnonymously(auth)}catch(error){console.error("[Bean Growth] Firebase login failed:",error);setText(cloudConnectionStatus,"Firebase接続に失敗しました");if(typeof unsubscribe==="function")unsubscribe();reject(error)}})
});

async function writeAnalyticsContribution(user, parsedData){
  const ref=doc(db,"analyticsContributions",user.uid); await setDoc(ref,{...buildAnalyticsContribution(parsedData),updatedAt:serverTimestamp()},{merge:false});
}
export async function backupBeanGrowthToCloud({silent=false,force=false}={}){
  if(!navigator.onLine)throw new Error("オフラインのためクラウド保存できません。再接続後に自動保存できます。");
  if(!force&&(latestSyncState==="cloud-newer"||latestSyncState==="conflict"))throw new Error("クラウド側にも変更があります。状態を再確認し、上書きする側を選んでください。");
  const user=await firebaseUserReady,localDataString=getLocalDataString(),parsedData=parseLocalData(),userDocRef=doc(db,"users",user.uid),clientBackedUpAt=new Date().toISOString(),contentHash=simpleHash(localDataString),localChange=localUpdatedAt(parsedData);
  await setDoc(userDocRef,{cloudBackup:{schemaVersion:parsedData.schemaVersion??null,appVersion:APP_VERSION,data:parsedData,contentHash,localUpdatedAt:localChange,clientBackedUpAt,backedUpAt:serverTimestamp()}},{merge:true});
  try{await writeAnalyticsContribution(user,parsedData)}catch(error){console.warn("[Bean Growth] Analytics contribution skipped:",error)}
  latestCloudBackupString=localDataString;latestCloudMeta={contentHash,localUpdatedAt:localChange,clientBackedUpAt};lastAutoBackedUpLocalString=localDataString;localStorage.setItem(LAST_SYNC_HASH_KEY,contentHash);localStorage.removeItem(PENDING_SYNC_KEY);setText(cloudLastBackup,formatDate(clientBackedUpAt));updateSyncState();
  console.log("[Bean Growth] Cloud backup complete:",user.uid);if(!silent)setText(cloudBackupStatus,"クラウド保存が完了しました。");return true;
}
export async function getCloudBackupInfo(){
  if(!navigator.onLine){updateNetworkState();return null}const user=await firebaseUserReady,snapshot=await getDoc(doc(db,"users",user.uid));
  if(!snapshot.exists()){latestCloudBackupString=null;latestCloudMeta=null;setText(cloudLastBackup,"まだ保存されていません");updateSyncState();return null}
  const backup=snapshot.data()?.cloudBackup;if(!backup?.data||typeof backup.data!=="object"){latestCloudBackupString=null;latestCloudMeta=null;setText(cloudLastBackup,"まだ保存されていません");updateSyncState();return null}
  latestCloudBackupString=JSON.stringify(backup.data);latestCloudMeta=backup;setText(cloudLastBackup,formatDate(backup.backedUpAt??backup.clientBackedUpAt));updateSyncState();return backup;
}
export async function restoreBeanGrowthFromCloud(){
  if(!navigator.onLine)throw new Error("オフラインのためクラウド復元できません。");const user=await firebaseUserReady,snapshot=await getDoc(doc(db,"users",user.uid));if(!snapshot.exists())throw new Error("クラウド上にユーザーデータが見つかりません。");const backup=snapshot.data()?.cloudBackup,cloudData=backup?.data;if(!cloudData||typeof cloudData!=="object")throw new Error("クラウドバックアップが見つかりません。");
  const currentLocalData=getLocalDataString();if(currentLocalData)localStorage.setItem(RESTORE_SAFETY_KEY,currentLocalData);const restoredString=JSON.stringify(cloudData);localStorage.setItem(LOCAL_STORAGE_KEY,restoredString);latestCloudBackupString=restoredString;latestCloudMeta=backup;lastAutoBackedUpLocalString=restoredString;localStorage.setItem(LAST_SYNC_HASH_KEY,simpleHash(restoredString));localStorage.removeItem(PENDING_SYNC_KEY);updateUndoButtonState();updateSyncState();console.log("[Bean Growth] Cloud restore complete:",user.uid);return true;
}
export function undoLastCloudRestore(){const safetyData=localStorage.getItem(RESTORE_SAFETY_KEY);if(!safetyData)throw new Error("復元前の安全用データがありません。");localStorage.setItem(LOCAL_STORAGE_KEY,safetyData);localStorage.removeItem(RESTORE_SAFETY_KEY);updateUndoButtonState();console.log("[Bean Growth] Cloud restore undo complete");return true}

async function loadGlobalAnalytics(){
  if(!navigator.onLine)throw new Error("オフラインです。");await firebaseUserReady;const snap=await getDocs(collection(db,"analyticsContributions")),items=[];snap.forEach(d=>{const x=d.data();if(x&&Number(x.schemaVersion)>=1)items.push(x)});return combineContributions(items);
}
async function publishGlobalAnalytics(){try{const payload=await loadGlobalAnalytics();window.BeanGrowthGlobalAnalytics?.render?.(payload)}catch(error){console.error("[Bean Growth] Global analytics failed:",error);window.BeanGrowthGlobalAnalytics?.error?.(error?.message||"取得に失敗しました")}}

function isAutoBackupEnabled(){return localStorage.getItem(AUTO_BACKUP_KEY)==="true"}
function setAutoBackupEnabled(enabled){localStorage.setItem(AUTO_BACKUP_KEY,enabled?"true":"false");if(cloudAutoBackupToggle)cloudAutoBackupToggle.checked=enabled;restartAutoBackupTimer()}
async function runAutoBackupCheck(){
  if(!isAutoBackupEnabled()||autoBackupRunning)return;const localString=getLocalDataString();if(!localString)return;
  if(!navigator.onLine){localStorage.setItem(PENDING_SYNC_KEY,"true");setText(cloudBackupStatus,"変更を端末に保存しました。オンライン復帰後にクラウド同期します。");return}
  if(localString===lastAutoBackedUpLocalString){updateSyncState();return}
  updateSyncState();if(latestSyncState==="cloud-newer"||latestSyncState==="conflict"){setText(cloudBackupStatus,"クラウド側にも変更があるため、自動保存を保留しました。");return}
  autoBackupRunning=true;try{setText(cloudBackupStatus,"変更を検出したため自動保存中...");await backupBeanGrowthToCloud({silent:true});setText(cloudBackupStatus,"自動クラウド保存が完了しました。")}catch(error){console.error("[Bean Growth] Auto backup failed:",error);localStorage.setItem(PENDING_SYNC_KEY,"true");setText(cloudBackupStatus,`自動保存を保留しました。 ${error?.message||""}`)}finally{autoBackupRunning=false}
}
function scheduleAutoBackup(){if(!isAutoBackupEnabled())return;if(autoBackupDebounceTimer)clearTimeout(autoBackupDebounceTimer);autoBackupDebounceTimer=setTimeout(runAutoBackupCheck,AUTO_BACKUP_DEBOUNCE_MS)}
function restartAutoBackupTimer(){if(autoBackupTimer){clearInterval(autoBackupTimer);autoBackupTimer=null}if(isAutoBackupEnabled())autoBackupTimer=setInterval(runAutoBackupCheck,AUTO_BACKUP_INTERVAL_MS)}

export async function runFirebaseDiagnostics(){
  if(!navigator.onLine)throw new Error("オフラインです。");const user=await firebaseUserReady,token=`diag-${Date.now()}`,ref=doc(db,"users",user.uid);await setDoc(ref,{diagnostics:{token,appVersion:APP_VERSION,runtime:runtimeLabel(),checkedAt:serverTimestamp()}},{merge:true});const snap=await getDoc(ref);if(snap.data()?.diagnostics?.token!==token)throw new Error("Firestoreの読み書き確認に失敗しました。");return{uid:user.uid,runtime:runtimeLabel(),firebase:true,firestore:true,online:navigator.onLine};
}

window.backupBeanGrowthToCloud=backupBeanGrowthToCloud;window.restoreBeanGrowthFromCloud=restoreBeanGrowthFromCloud;window.undoLastCloudRestore=undoLastCloudRestore;window.getCloudBackupInfo=getCloudBackupInfo;window.runFirebaseDiagnostics=runFirebaseDiagnostics;

if(cloudBackupButton)cloudBackupButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"保存中...");try{updateSyncState();let force=false;if(latestSyncState==="cloud-newer"||latestSyncState==="conflict")force=window.confirm("クラウド側にも変更があります。端末データでクラウドを上書きしますか？");if((latestSyncState==="cloud-newer"||latestSyncState==="conflict")&&!force){setText(cloudBackupStatus,"保存をキャンセルしました。");return}await backupBeanGrowthToCloud({force})}catch(error){console.error(error);setText(cloudBackupStatus,`クラウド保存に失敗しました。 ${error?.message||""}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudRestoreButton)cloudRestoreButton.addEventListener("click",async()=>{const state=updateSyncState(),warning=state==="local-newer"||state==="conflict"?"\n\n⚠ 端末側にも新しい変更があります。":"";if(!confirm(`クラウド保存時点のデータで現在のBean Growthデータを置き換えます。${warning}\n\n復元前の端末データは安全用コピーとして残します。\n\n復元しますか？`))return;setCloudButtonsDisabled(true);setText(cloudBackupStatus,"クラウドから復元中...");try{await restoreBeanGrowthFromCloud();setText(cloudBackupStatus,"復元が完了しました。画面を更新します...");setTimeout(()=>location.reload(),700)}catch(error){setText(cloudBackupStatus,`クラウド復元に失敗しました。 ${error?.message||""}`);setCloudButtonsDisabled(false)}});
if(cloudUndoRestoreButton)cloudUndoRestoreButton.addEventListener("click",()=>{if(!confirm("直前のクラウド復元を取り消し、復元前の端末データへ戻しますか？"))return;try{undoLastCloudRestore();setText(cloudBackupStatus,"復元前の端末データへ戻しました。画面を更新します...");setTimeout(()=>location.reload(),500)}catch(error){setText(cloudBackupStatus,error.message)}});
if(cloudRefreshButton)cloudRefreshButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"クラウド状態を確認中...");try{await getCloudBackupInfo();setText(cloudBackupStatus,"クラウド状態を更新しました。")}catch(error){setText(cloudBackupStatus,`確認に失敗しました。 ${error?.message||""}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudDiagnosticsButton)cloudDiagnosticsButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"Firebase診断中...");try{const r=await runFirebaseDiagnostics();setText(cloudBackupStatus,`✓ 診断成功：${r.runtime} / Authentication OK / Firestore READ・WRITE OK`)}catch(error){setText(cloudBackupStatus,`診断失敗：${error?.message||"不明なエラー"}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudAutoBackupToggle){cloudAutoBackupToggle.checked=isAutoBackupEnabled();cloudAutoBackupToggle.addEventListener("change",()=>{setAutoBackupEnabled(cloudAutoBackupToggle.checked);setText(cloudBackupStatus,cloudAutoBackupToggle.checked?"自動クラウド保存を有効にしました。":"自動クラウド保存を無効にしました。")})}

window.addEventListener("bean-growth:data-saved",()=>{localStorage.setItem(PENDING_SYNC_KEY,"true");scheduleAutoBackup();updateSyncState()});
window.addEventListener("bean-growth:request-global-analytics",publishGlobalAnalytics);
window.addEventListener("online",async()=>{updateNetworkState();try{await getCloudBackupInfo();if(localStorage.getItem(PENDING_SYNC_KEY)==="true")scheduleAutoBackup()}catch(error){console.error(error)}});
window.addEventListener("offline",()=>{updateNetworkState();if(isAutoBackupEnabled())localStorage.setItem(PENDING_SYNC_KEY,"true")});

async function initializeCloudPanel(){updateUndoButtonState();updateNetworkState();restartAutoBackupTimer();try{const user=await firebaseUserReady;setText(cloudUserId,shortUid(user.uid));await getCloudBackupInfo();lastAutoBackedUpLocalString=latestCloudBackupString;if(localStorage.getItem(PENDING_SYNC_KEY)==="true")scheduleAutoBackup()}catch(error){console.error("[Bean Growth] Cloud panel initialization failed:",error);setText(cloudSyncState,"クラウド状態を取得できませんでした")}}
initializeCloudPanel();
