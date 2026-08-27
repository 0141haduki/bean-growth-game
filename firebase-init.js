import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
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


const APP_VERSION = "4.49";
const LOCAL_STORAGE_KEY = "beanGrowthGame_v1";
const RESTORE_SAFETY_KEY = "beanGrowthGame_beforeCloudRestore_v1";
const AUTO_BACKUP_KEY = "beanGrowthGame_cloudAutoBackup_v1";
const MAX_BACKUP_BYTES = 900 * 1024;
const AUTO_BACKUP_INTERVAL_MS = 30 * 1000;


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


const cloudBackupButton = document.getElementById("cloudBackupButton");
const cloudRestoreButton = document.getElementById("cloudRestoreButton");
const cloudUndoRestoreButton = document.getElementById("cloudUndoRestoreButton");
const cloudRefreshButton = document.getElementById("cloudRefreshButton");
const cloudAutoBackupToggle = document.getElementById("cloudAutoBackupToggle");
const cloudBackupStatus = document.getElementById("cloudBackupStatus");
const cloudConnectionStatus = document.getElementById("cloudConnectionStatus");
const cloudUserId = document.getElementById("cloudUserId");
const cloudLastBackup = document.getElementById("cloudLastBackup");
const cloudSyncState = document.getElementById("cloudSyncState");

let latestCloudBackupString = null;
let lastAutoBackedUpLocalString = null;
let autoBackupTimer = null;
let autoBackupRunning = false;


function setText(element, text) {
  if (element) element.textContent = text;
}


function shortUid(uid) {
  if (!uid) return "未取得";
  if (uid.length <= 16) return uid;
  return `${uid.slice(0, 8)}…${uid.slice(-6)}`;
}


function formatDate(value) {
  if (!value) return "まだ保存されていません";

  let date = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  }

  if (!date || Number.isNaN(date.getTime())) {
    return "日時を取得できません";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}


function getLocalDataString() {
  return localStorage.getItem(LOCAL_STORAGE_KEY);
}


function parseLocalData() {
  const localData = getLocalDataString();

  if (!localData) {
    throw new Error("Bean Growth のローカルデータが見つかりません。");
  }

  if (new Blob([localData]).size > MAX_BACKUP_BYTES) {
    throw new Error("クラウド保存データが大きくなりすぎています。保存方式の分割が必要です。");
  }

  try {
    return JSON.parse(localData);
  } catch (error) {
    throw new Error("ローカルデータのJSON解析に失敗しました。");
  }
}


function updateUndoButtonState() {
  if (!cloudUndoRestoreButton) return;
  cloudUndoRestoreButton.disabled = !localStorage.getItem(RESTORE_SAFETY_KEY);
}


function updateNetworkState() {
  if (!navigator.onLine) {
    setText(cloudConnectionStatus, "オフラインです。端末内では利用できますが、クラウド保存・復元はできません。");
    return;
  }

  if (auth.currentUser) {
    setText(cloudConnectionStatus, "Firebase接続済み");
  } else {
    setText(cloudConnectionStatus, "Firebaseへ接続中...");
  }
}


function updateSyncState() {
  const localString = getLocalDataString();

  if (!localString) {
    setText(cloudSyncState, "端末データなし");
    return;
  }

  if (latestCloudBackupString === null) {
    setText(cloudSyncState, "クラウド状態を確認してください");
    return;
  }

  if (localString === latestCloudBackupString) {
    setText(cloudSyncState, "端末とクラウドは一致しています");
  } else {
    setText(cloudSyncState, "端末とクラウドに差分があります");
  }
}


function setCloudButtonsDisabled(disabled) {
  [cloudBackupButton, cloudRestoreButton, cloudRefreshButton].forEach((button) => {
    if (button) button.disabled = disabled;
  });

  if (cloudUndoRestoreButton) {
    cloudUndoRestoreButton.disabled = disabled || !localStorage.getItem(RESTORE_SAFETY_KEY);
  }
}


export const firebaseUserReady = new Promise((resolve, reject) => {
  let unsubscribe = null;

  unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      try {
        if (user) {
          console.log("[Bean Growth] Firebase login:", user.uid);
          setText(cloudUserId, shortUid(user.uid));
          setText(cloudConnectionStatus, "Firebase接続済み");

          if (typeof unsubscribe === "function") unsubscribe();
          resolve(user);
          return;
        }

        await signInAnonymously(auth);
      } catch (error) {
        console.error("[Bean Growth] Firebase login failed:", error);
        setText(cloudConnectionStatus, "Firebase接続に失敗しました");

        if (typeof unsubscribe === "function") unsubscribe();
        reject(error);
      }
    }
  );
});


export async function backupBeanGrowthToCloud({ silent = false } = {}) {
  if (!navigator.onLine) {
    throw new Error("オフラインのためクラウド保存できません。");
  }

  const user = await firebaseUserReady;
  const localDataString = getLocalDataString();
  const parsedData = parseLocalData();
  const userDocRef = doc(db, "users", user.uid);
  const clientBackedUpAt = new Date().toISOString();

  await setDoc(
    userDocRef,
    {
      cloudBackup: {
        schemaVersion: parsedData.schemaVersion ?? null,
        appVersion: APP_VERSION,
        data: parsedData,
        clientBackedUpAt,
        backedUpAt: serverTimestamp()
      }
    },
    { merge: true }
  );

  latestCloudBackupString = localDataString;
  lastAutoBackedUpLocalString = localDataString;
  setText(cloudLastBackup, formatDate(clientBackedUpAt));
  updateSyncState();

  console.log("[Bean Growth] Cloud backup complete:", user.uid);

  if (!silent) {
    setText(cloudBackupStatus, "クラウド保存が完了しました。");
  }

  return true;
}


export async function getCloudBackupInfo() {
  if (!navigator.onLine) {
    updateNetworkState();
    return null;
  }

  const user = await firebaseUserReady;
  const userDocRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    latestCloudBackupString = null;
    setText(cloudLastBackup, "まだ保存されていません");
    setText(cloudSyncState, "クラウドバックアップなし");
    return null;
  }

  const userData = snapshot.data();
  const backup = userData?.cloudBackup;

  if (!backup?.data || typeof backup.data !== "object") {
    latestCloudBackupString = null;
    setText(cloudLastBackup, "まだ保存されていません");
    setText(cloudSyncState, "クラウドバックアップなし");
    return null;
  }

  latestCloudBackupString = JSON.stringify(backup.data);
  setText(
    cloudLastBackup,
    formatDate(backup.backedUpAt ?? backup.clientBackedUpAt)
  );
  updateSyncState();

  return backup;
}


export async function restoreBeanGrowthFromCloud() {
  if (!navigator.onLine) {
    throw new Error("オフラインのためクラウド復元できません。");
  }

  const user = await firebaseUserReady;
  const userDocRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    throw new Error("クラウド上にユーザーデータが見つかりません。");
  }

  const userData = snapshot.data();
  const cloudData = userData?.cloudBackup?.data;

  if (!cloudData || typeof cloudData !== "object") {
    throw new Error("クラウドバックアップが見つかりません。");
  }

  const currentLocalData = getLocalDataString();

  if (currentLocalData) {
    localStorage.setItem(RESTORE_SAFETY_KEY, currentLocalData);
  }

  const restoredString = JSON.stringify(cloudData);
  localStorage.setItem(LOCAL_STORAGE_KEY, restoredString);
  latestCloudBackupString = restoredString;
  lastAutoBackedUpLocalString = restoredString;
  updateUndoButtonState();

  console.log("[Bean Growth] Cloud restore complete:", user.uid);
  return true;
}


export function undoLastCloudRestore() {
  const safetyData = localStorage.getItem(RESTORE_SAFETY_KEY);

  if (!safetyData) {
    throw new Error("復元前の安全用データがありません。");
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, safetyData);
  localStorage.removeItem(RESTORE_SAFETY_KEY);
  updateUndoButtonState();
  console.log("[Bean Growth] Cloud restore undo complete");
  return true;
}


function isAutoBackupEnabled() {
  return localStorage.getItem(AUTO_BACKUP_KEY) === "true";
}


function setAutoBackupEnabled(enabled) {
  localStorage.setItem(AUTO_BACKUP_KEY, enabled ? "true" : "false");
  if (cloudAutoBackupToggle) cloudAutoBackupToggle.checked = enabled;
  restartAutoBackupTimer();
}


async function runAutoBackupCheck() {
  if (!isAutoBackupEnabled() || autoBackupRunning || !navigator.onLine) return;

  const localString = getLocalDataString();
  if (!localString) return;

  if (lastAutoBackedUpLocalString === null) {
    lastAutoBackedUpLocalString = latestCloudBackupString;
  }

  if (localString === lastAutoBackedUpLocalString) {
    updateSyncState();
    return;
  }

  autoBackupRunning = true;

  try {
    setText(cloudBackupStatus, "変更を検出したため自動保存中...");
    await backupBeanGrowthToCloud({ silent: true });
    setText(cloudBackupStatus, "自動クラウド保存が完了しました。");
  } catch (error) {
    console.error("[Bean Growth] Auto backup failed:", error);
    setText(cloudBackupStatus, `自動保存に失敗しました。${error?.message ? ` ${error.message}` : ""}`);
  } finally {
    autoBackupRunning = false;
  }
}


function restartAutoBackupTimer() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }

  if (isAutoBackupEnabled()) {
    autoBackupTimer = window.setInterval(
      runAutoBackupCheck,
      AUTO_BACKUP_INTERVAL_MS
    );
  }
}


window.backupBeanGrowthToCloud = backupBeanGrowthToCloud;
window.restoreBeanGrowthFromCloud = restoreBeanGrowthFromCloud;
window.undoLastCloudRestore = undoLastCloudRestore;
window.getCloudBackupInfo = getCloudBackupInfo;


if (cloudBackupButton) {
  cloudBackupButton.addEventListener("click", async () => {
    setCloudButtonsDisabled(true);
    setText(cloudBackupStatus, "保存中...");

    try {
      await backupBeanGrowthToCloud();
    } catch (error) {
      console.error("[Bean Growth] Cloud backup failed:", error);
      setText(cloudBackupStatus, `クラウド保存に失敗しました。${error?.message ? ` ${error.message}` : ""}`);
    } finally {
      setCloudButtonsDisabled(false);
    }
  });
}


if (cloudRestoreButton) {
  cloudRestoreButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "クラウド保存時点のデータで現在のBean Growthデータを置き換えます。\n\n復元前の端末データは安全用コピーとして端末内に残します。\n\n復元しますか？"
    );

    if (!confirmed) return;

    setCloudButtonsDisabled(true);
    setText(cloudBackupStatus, "クラウドから復元中...");

    try {
      await restoreBeanGrowthFromCloud();
      setText(cloudBackupStatus, "復元が完了しました。画面を更新します...");

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      console.error("[Bean Growth] Cloud restore failed:", error);
      setText(cloudBackupStatus, `クラウド復元に失敗しました。${error?.message ? ` ${error.message}` : ""}`);
      setCloudButtonsDisabled(false);
    }
  });
}


if (cloudUndoRestoreButton) {
  cloudUndoRestoreButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "直前のクラウド復元を取り消し、復元前の端末データへ戻しますか？"
    );

    if (!confirmed) return;

    try {
      undoLastCloudRestore();
      setText(cloudBackupStatus, "復元前の端末データへ戻しました。画面を更新します...");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setText(cloudBackupStatus, error.message);
    }
  });
}


if (cloudRefreshButton) {
  cloudRefreshButton.addEventListener("click", async () => {
    setCloudButtonsDisabled(true);
    setText(cloudBackupStatus, "クラウド状態を確認中...");

    try {
      await getCloudBackupInfo();
      setText(cloudBackupStatus, "クラウド状態を更新しました。");
    } catch (error) {
      console.error("[Bean Growth] Cloud status refresh failed:", error);
      setText(cloudBackupStatus, `確認に失敗しました。${error?.message ? ` ${error.message}` : ""}`);
    } finally {
      setCloudButtonsDisabled(false);
    }
  });
}


if (cloudAutoBackupToggle) {
  cloudAutoBackupToggle.checked = isAutoBackupEnabled();
  cloudAutoBackupToggle.addEventListener("change", () => {
    setAutoBackupEnabled(cloudAutoBackupToggle.checked);
    setText(
      cloudBackupStatus,
      cloudAutoBackupToggle.checked
        ? "自動クラウド保存を有効にしました。"
        : "自動クラウド保存を無効にしました。"
    );
  });
}


window.addEventListener("online", async () => {
  updateNetworkState();
  try {
    await getCloudBackupInfo();
  } catch (error) {
    console.error(error);
  }
});

window.addEventListener("offline", updateNetworkState);


async function initializeCloudPanel() {
  updateUndoButtonState();
  updateNetworkState();
  restartAutoBackupTimer();

  try {
    const user = await firebaseUserReady;
    setText(cloudUserId, shortUid(user.uid));
    updateNetworkState();
    await getCloudBackupInfo();
    lastAutoBackedUpLocalString = latestCloudBackupString;
  } catch (error) {
    console.error("[Bean Growth] Cloud panel initialization failed:", error);
    setText(cloudSyncState, "クラウド状態を取得できませんでした");
  }
}

initializeCloudPanel();
