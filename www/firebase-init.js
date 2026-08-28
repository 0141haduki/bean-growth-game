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

const APP_VERSION = "4.89";
const LOCAL_STORAGE_KEY = "beanGrowthGame_v1";
const RESTORE_SAFETY_KEY = "beanGrowthGame_beforeCloudRestore_v1";
const AUTO_BACKUP_KEY = "beanGrowthGame_cloudAutoBackup_v1";
const LAST_SYNC_HASH_KEY = "beanGrowthGame_lastSyncHash_v1";
const PENDING_SYNC_KEY = "beanGrowthGame_pendingCloudSync_v1";
const DEVICE_ID_KEY = "beanGrowthGame_deviceId_v1";
const DEVICE_LABEL_KEY = "beanGrowthGame_deviceLabel_v1";
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
const accountLoginStatus = document.getElementById("accountLoginStatus");
const accountFirebaseUid = document.getElementById("accountFirebaseUid");
const googleLinkStatus = document.getElementById("googleLinkStatus");
const deviceList = document.getElementById("deviceList");
const refreshDevicesButton = document.getElementById("refreshDevicesButton");
const syncConflictOverlay = document.getElementById("syncConflictOverlay");
const syncLocalSummary = document.getElementById("syncLocalSummary");
const syncCloudSummary = document.getElementById("syncCloudSummary");
const useLocalDataButton = document.getElementById("useLocalDataButton");
const useCloudDataButton = document.getElementById("useCloudDataButton");
const syncConflictLaterButton = document.getElementById("syncConflictLaterButton");

let latestCloudBackupString = null;
let latestCloudMeta = null;
let latestSyncState = "unknown";
let lastAutoBackedUpLocalString = null;
let autoBackupTimer = null;
let autoBackupDebounceTimer = null;
let autoBackupRunning = false;

function setText(element, text) { if (element) element.textContent = text; }
function shortUid(uid) { return !uid ? "未取得" : uid.length <= 16 ? uid : `${uid.slice(0, 8)}…${uid.slice(-6)}`; }
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function deviceId(){
  let id=localStorage.getItem(DEVICE_ID_KEY);if(id)return id;
  const bytes=new Uint8Array(8);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);else for(let i=0;i<8;i++)bytes[i]=Math.floor(Math.random()*256);
  id="dev-"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");localStorage.setItem(DEVICE_ID_KEY,id);return id;
}
function defaultDeviceLabel(){
  if(window.Capacitor?.isNativePlatform?.())return "Androidアプリ";
  if(/Android/i.test(navigator.userAgent))return "Androidブラウザ";
  if(/Macintosh|Mac OS X/i.test(navigator.userAgent))return "Mac / Web";
  if(/Windows/i.test(navigator.userAgent))return "Windows / Web";
  return "Web端末";
}
function deviceLabel(){let v=localStorage.getItem(DEVICE_LABEL_KEY);if(!v){v=defaultDeviceLabel();localStorage.setItem(DEVICE_LABEL_KEY,v)}return v}
function authProviderLabel(user){if(!user)return "未ログイン";if(user.isAnonymous)return "ゲスト（匿名）";if(user.providerData?.some(p=>p.providerId==="google.com"))return "Google連携済み";return "ログイン済み"}
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
function summarizeGameData(data){
  const habits=Object.values(data?.habits||{}),height=habits.reduce((s,h)=>s+Number(h?.height||0),0),records=habits.reduce((s,h)=>s+(h?.history||[]).filter(x=>["success","failure"].includes(x?.type)).length,0),maxStreak=Math.max(0,...habits.map(h=>Number(h?.stats?.maxStreak||h?.currentStreak||0)));
  return{playerId:data?.profile?.playerId||"未発行",nickname:data?.profile?.nickname||"未設定",updatedAt:localUpdatedAt(data),height,records,maxStreak,schemaVersion:data?.schemaVersion??"-",appVersion:data?.version||"-"};
}
function summaryHtml(summary){
  const when=summary.updatedAt?formatDate(summary.updatedAt):"不明";
  return `<dl class="sync-summary-list"><div><dt>Player ID</dt><dd>${escapeHtml(summary.playerId)}</dd></div><div><dt>ニックネーム</dt><dd>${escapeHtml(summary.nickname)}</dd></div><div><dt>最終変更</dt><dd>${escapeHtml(when)}</dd></div><div><dt>合計の高さ</dt><dd>${Number(summary.height||0).toLocaleString("ja-JP",{maximumFractionDigits:1})}m</dd></div><div><dt>記録件数</dt><dd>${Number(summary.records||0).toLocaleString("ja-JP")}</dd></div><div><dt>最高連続</dt><dd>${Number(summary.maxStreak||0).toLocaleString("ja-JP")}日</dd></div><div><dt>データ版</dt><dd>Schema ${escapeHtml(summary.schemaVersion)} / ${escapeHtml(summary.appVersion)}</dd></div></dl>`;
}
function openConflictDialog(){
  if(!syncConflictOverlay||!latestCloudBackupString)return;
  let local=null,cloud=null;try{local=JSON.parse(getLocalDataString()||"null");cloud=JSON.parse(latestCloudBackupString||"null")}catch{}
  if(syncLocalSummary)syncLocalSummary.innerHTML=summaryHtml(summarizeGameData(local));
  if(syncCloudSummary)syncCloudSummary.innerHTML=summaryHtml(summarizeGameData(cloud));
  syncConflictOverlay.classList.remove("hidden");
}
function closeConflictDialog(){syncConflictOverlay?.classList.add("hidden")}
function maybeShowConflict(state){if(state==="conflict"||state==="cloud-newer")window.dispatchEvent(new CustomEvent("bean-growth:sync-attention",{detail:{state}}))}
async function registerCurrentDevice(user){
  if(!navigator.onLine||!user)return;
  const ref=doc(db,"users",user.uid,"devices",deviceId());
  await setDoc(ref,{deviceId:deviceId(),label:deviceLabel(),runtime:runtimeLabel(),appVersion:APP_VERSION,lastSeenAt:serverTimestamp(),clientLastSeenAt:new Date().toISOString()},{merge:true});
}
async function refreshDeviceList(){
  if(!deviceList)return;if(!navigator.onLine){deviceList.innerHTML='<p class="records-note">オフラインのため端末一覧を取得できません。</p>';return}
  const user=await firebaseUserReady;await registerCurrentDevice(user);const snap=await getDocs(collection(db,"users",user.uid,"devices")),items=[];
  snap.forEach(d=>items.push(d.data()));items.sort((a,b)=>String(b.clientLastSeenAt||"").localeCompare(String(a.clientLastSeenAt||"")));
  deviceList.innerHTML=items.length?items.slice(0,12).map(x=>`<div class="device-item"><div><strong>${escapeHtml(x.label||"端末")}</strong><span>${escapeHtml(x.runtime||"")}</span></div><small>${x.deviceId===deviceId()?"この端末 ・ ":""}最終確認 ${escapeHtml(formatDate(x.lastSeenAt??x.clientLastSeenAt))}</small></div>`).join(""):'<p class="records-note">登録済み端末はありません。</p>';
}
function updateSyncState() {
  const localString = getLocalDataString();
  if (!localString) { latestSyncState="no-local"; setText(cloudSyncState, "端末データなし"); return latestSyncState; }
  if (latestCloudBackupString === null) { latestSyncState="no-cloud"; setText(cloudSyncState, "クラウドバックアップなし / 未確認"); return latestSyncState; }
  const localHash=simpleHash(localString), cloudHash=simpleHash(latestCloudBackupString), baseline=localStorage.getItem(LAST_SYNC_HASH_KEY);
  if (localHash===cloudHash) { latestSyncState="synced"; localStorage.setItem(LAST_SYNC_HASH_KEY,localHash); localStorage.removeItem(PENDING_SYNC_KEY); setText(cloudSyncState,"端末とクラウドは一致しています"); return latestSyncState; }
  const localChanged=Boolean(baseline&&localHash!==baseline), cloudChanged=Boolean(baseline&&cloudHash!==baseline);
  if (localChanged&&cloudChanged) { latestSyncState="conflict"; setText(cloudSyncState,"⚠ 端末とクラウドの両方に変更があります。どちらを使うか選んでください"); maybeShowConflict(latestSyncState); return latestSyncState; }
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
  let unsubscribe=null;unsubscribe=onAuthStateChanged(auth,async user=>{try{if(user){console.log("[Bean Growth] Firebase login:",user.uid);setText(cloudUserId,shortUid(user.uid));setText(accountFirebaseUid,shortUid(user.uid));setText(accountLoginStatus,authProviderLabel(user));setText(cloudConnectionStatus,"Firebase接続済み");if(googleLinkStatus)googleLinkStatus.textContent=user.isAnonymous?"基盤準備済み / 現在はゲスト":"Google連携済み";registerCurrentDevice(user).catch(error=>console.warn("[Bean Growth] Device registration skipped:",error));if(typeof unsubscribe==="function")unsubscribe();resolve(user);return}await signInAnonymously(auth)}catch(error){console.error("[Bean Growth] Firebase login failed:",error);setText(cloudConnectionStatus,"Firebase接続に失敗しました");if(typeof unsubscribe==="function")unsubscribe();reject(error)}})
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

if(cloudBackupButton)cloudBackupButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"保存中...");try{updateSyncState();if(latestSyncState==="cloud-newer"||latestSyncState==="conflict"){openConflictDialog();setText(cloudBackupStatus,"端末とクラウドを比較して、使うデータを選択してください。");return}await backupBeanGrowthToCloud()}catch(error){console.error(error);setText(cloudBackupStatus,`クラウド保存に失敗しました。 ${error?.message||""}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudRestoreButton)cloudRestoreButton.addEventListener("click",async()=>{const state=updateSyncState();if(state==="local-newer"||state==="conflict"){openConflictDialog();setText(cloudBackupStatus,"端末とクラウドを比較して、使うデータを選択してください。");return}if(!confirm("クラウド保存時点のデータで現在のBean Growthデータを置き換えます。\n\n復元前の端末データは安全用コピーとして残します。\n\n復元しますか？"))return;setCloudButtonsDisabled(true);setText(cloudBackupStatus,"クラウドから復元中...");try{await restoreBeanGrowthFromCloud();setText(cloudBackupStatus,"復元が完了しました。画面を更新します...");setTimeout(()=>location.reload(),700)}catch(error){setText(cloudBackupStatus,`クラウド復元に失敗しました。 ${error?.message||""}`);setCloudButtonsDisabled(false)}});
if(cloudUndoRestoreButton)cloudUndoRestoreButton.addEventListener("click",()=>{if(!confirm("直前のクラウド復元を取り消し、復元前の端末データへ戻しますか？"))return;try{undoLastCloudRestore();setText(cloudBackupStatus,"復元前の端末データへ戻しました。画面を更新します...");setTimeout(()=>location.reload(),500)}catch(error){setText(cloudBackupStatus,error.message)}});
if(cloudRefreshButton)cloudRefreshButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"クラウド状態を確認中...");try{await getCloudBackupInfo();setText(cloudBackupStatus,"クラウド状態を更新しました。")}catch(error){setText(cloudBackupStatus,`確認に失敗しました。 ${error?.message||""}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudDiagnosticsButton)cloudDiagnosticsButton.addEventListener("click",async()=>{setCloudButtonsDisabled(true);setText(cloudBackupStatus,"Firebase診断中...");try{const r=await runFirebaseDiagnostics();setText(cloudBackupStatus,`✓ 診断成功：${r.runtime} / Authentication OK / Firestore READ・WRITE OK`)}catch(error){setText(cloudBackupStatus,`診断失敗：${error?.message||"不明なエラー"}`)}finally{setCloudButtonsDisabled(false)}});
if(cloudAutoBackupToggle){cloudAutoBackupToggle.checked=isAutoBackupEnabled();cloudAutoBackupToggle.addEventListener("change",()=>{setAutoBackupEnabled(cloudAutoBackupToggle.checked);setText(cloudBackupStatus,cloudAutoBackupToggle.checked?"自動クラウド保存を有効にしました。":"自動クラウド保存を無効にしました。")})}

window.addEventListener("bean-growth:sync-attention",()=>{if(latestSyncState==="conflict")setText(cloudBackupStatus,"同期競合を検出しました。『クラウドに保存』または『クラウドから復元』で比較できます。")});
if(refreshDevicesButton)refreshDevicesButton.addEventListener("click",async()=>{refreshDevicesButton.disabled=true;try{await refreshDeviceList()}catch(error){if(deviceList)deviceList.innerHTML=`<p class="records-note">端末一覧の取得に失敗しました。 ${escapeHtml(error?.message||"")}</p>`}finally{refreshDevicesButton.disabled=false}});
if(syncConflictLaterButton)syncConflictLaterButton.addEventListener("click",closeConflictDialog);
if(syncConflictOverlay)syncConflictOverlay.addEventListener("click",e=>{if(e.target===syncConflictOverlay)closeConflictDialog()});
if(useLocalDataButton)useLocalDataButton.addEventListener("click",async()=>{useLocalDataButton.disabled=true;useCloudDataButton&&(useCloudDataButton.disabled=true);setText(cloudBackupStatus,"この端末のデータをクラウドへ保存中...");try{await backupBeanGrowthToCloud({force:true});closeConflictDialog();setText(cloudBackupStatus,"この端末のデータを採用し、クラウドへ保存しました。")}catch(error){setText(cloudBackupStatus,`保存に失敗しました。 ${error?.message||""}`)}finally{useLocalDataButton.disabled=false;useCloudDataButton&&(useCloudDataButton.disabled=false)}});
if(useCloudDataButton)useCloudDataButton.addEventListener("click",async()=>{if(!confirm("クラウドのデータをこの端末に採用しますか？\\n復元前の端末データは安全用コピーとして残します。"))return;useCloudDataButton.disabled=true;useLocalDataButton&&(useLocalDataButton.disabled=true);setText(cloudBackupStatus,"クラウドデータをこの端末へ復元中...");try{await restoreBeanGrowthFromCloud();closeConflictDialog();setText(cloudBackupStatus,"クラウドデータを採用しました。画面を更新します...");setTimeout(()=>location.reload(),650)}catch(error){setText(cloudBackupStatus,`復元に失敗しました。 ${error?.message||""}`);useCloudDataButton.disabled=false;useLocalDataButton&&(useLocalDataButton.disabled=false)}});
window.addEventListener("bean-growth:data-saved",()=>{localStorage.setItem(PENDING_SYNC_KEY,"true");scheduleAutoBackup();updateSyncState()});
window.addEventListener("bean-growth:request-global-analytics",publishGlobalAnalytics);
window.addEventListener("online",async()=>{updateNetworkState();try{await getCloudBackupInfo();if(localStorage.getItem(PENDING_SYNC_KEY)==="true")scheduleAutoBackup()}catch(error){console.error(error)}});
window.addEventListener("offline",()=>{updateNetworkState();if(isAutoBackupEnabled())localStorage.setItem(PENDING_SYNC_KEY,"true")});

async function initializeCloudPanel(){updateUndoButtonState();updateNetworkState();restartAutoBackupTimer();try{const user=await firebaseUserReady;setText(cloudUserId,shortUid(user.uid));setText(accountFirebaseUid,shortUid(user.uid));setText(accountLoginStatus,authProviderLabel(user));await registerCurrentDevice(user);await getCloudBackupInfo();await refreshDeviceList();lastAutoBackedUpLocalString=latestCloudBackupString;if(localStorage.getItem(PENDING_SYNC_KEY)==="true")scheduleAutoBackup()}catch(error){console.error("[Bean Growth] Cloud panel initialization failed:",error);setText(cloudSyncState,"クラウド状態を取得できませんでした")}}
initializeCloudPanel();
