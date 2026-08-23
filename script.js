"use strict";


/* =========================================================
   Bean Growth Game
   Version 1.0
========================================================= */


const STORAGE_KEY = "beanGrowthGame_v1";


/* =========================================================
   習慣の基本設定
========================================================= */

const HABITS = {

  noMasturbation: {
    id: "noMasturbation",
    name: "オナ禁",
    englishName: "NO MASTURBATION",
    icon: "🌱"
  },

  noAlcohol: {
    id: "noAlcohol",
    name: "禁酒",
    englishName: "NO ALCOHOL",
    icon: "🍺"
  },

  noSmoking: {
    id: "noSmoking",
    name: "禁煙",
    englishName: "NO SMOKING",
    icon: "🚭"
  }

};


/* =========================================================
   初期データ
========================================================= */

function createInitialHabitData() {

  return {
    height: 0,

    currentStreak: 0,

    totalSuccess: 0,

    consecutiveFailures: 0,

    lastActionDate: null,

    lastActionType: null,

    history: []
  };

}


function createInitialData() {

  return {

    version: "1.0",

    habits: {

      noMasturbation: createInitialHabitData(),

      noAlcohol: createInitialHabitData(),

      noSmoking: createInitialHabitData()

    }

  };

}


/* =========================================================
   データ読み込み
========================================================= */

function loadData() {

  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return createInitialData();
  }


  try {

    const parsed = JSON.parse(savedData);

    return mergeWithInitialData(parsed);

  } catch (error) {

    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );

    return createInitialData();
  }

}


/* =========================================================
   将来のアップデート時にもデータを壊しにくくする
========================================================= */

function mergeWithInitialData(savedData) {

  const initial = createInitialData();

  const merged = {
    ...initial,
    ...savedData,
    habits: {
      ...initial.habits
    }
  };


  Object.keys(HABITS).forEach((habitId) => {

    merged.habits[habitId] = {
      ...initial.habits[habitId],
      ...(savedData.habits?.[habitId] || {})
    };

  });


  return merged;
}


/* =========================================================
   保存
========================================================= */

function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appData)
  );

}


/* =========================================================
   日付
========================================================= */

function getTodayKey() {

  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");


  return `${year}-${month}-${day}`;
}


function getTodayDisplay() {

  const now = new Date();

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }
  ).format(now);

}


/* =========================================================
   アプリ状態
========================================================= */

let appData = loadData();

let currentHabitId = null;

let pendingAction = null;


/* =========================================================
   DOM
========================================================= */

const homeScreen =
  document.getElementById("homeScreen");

const gameScreen =
  document.getElementById("gameScreen");

const habitList =
  document.getElementById("habitList");

const backButton =
  document.getElementById("backButton");

const gameIcon =
  document.getElementById("gameIcon");

const gameEnglishName =
  document.getElementById("gameEnglishName");

const gameTitle =
  document.getElementById("gameTitle");

const currentHeight =
  document.getElementById("currentHeight");

const treeStem =
  document.getElementById("treeStem");

const growthMessage =
  document.getElementById("growthMessage");

const todayDate =
  document.getElementById("todayDate");

const todayPending =
  document.getElementById("todayPending");

const todayCompleted =
  document.getElementById("todayCompleted");

const successButton =
  document.getElementById("successButton");

const failButton =
  document.getElementById("failButton");

const failButtonDescription =
  document.getElementById("failButtonDescription");

const undoButton =
  document.getElementById("undoButton");

const todayResultIcon =
  document.getElementById("todayResultIcon");

const todayResultTitle =
  document.getElementById("todayResultTitle");

const todayResultDescription =
  document.getElementById("todayResultDescription");

const currentStreak =
  document.getElementById("currentStreak");

const totalSuccess =
  document.getElementById("totalSuccess");

const consecutiveFailures =
  document.getElementById("consecutiveFailures");

const nextFailureResult =
  document.getElementById("nextFailureResult");

const riskDescription =
  document.getElementById("riskDescription");

const toast =
  document.getElementById("toast");

const modalOverlay =
  document.getElementById("modalOverlay");

const modalIcon =
  document.getElementById("modalIcon");

const modalTitle =
  document.getElementById("modalTitle");

const modalDescription =
  document.getElementById("modalDescription");

const modalCancelButton =
  document.getElementById("modalCancelButton");

const modalConfirmButton =
  document.getElementById("modalConfirmButton");


/* =========================================================
   ホーム画面
========================================================= */

function renderHome() {

  habitList.innerHTML = "";


  Object.values(HABITS).forEach((habit) => {

    const data =
      appData.habits[habit.id];


    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "habit-card";


    let todayText = "今日は未記録";


    if (
      data.lastActionDate === getTodayKey()
    ) {

      if (data.lastActionType === "success") {
        todayText = "今日は成功済み";
      }

      if (data.lastActionType === "failure") {
        todayText = "今日は失敗を記録";
      }

    }


    button.innerHTML = `

      <span class="habit-icon">
        ${habit.icon}
      </span>

      <span class="habit-content">

        <span class="habit-name">
          ${habit.name}
        </span>

        <span class="habit-meta">
          連続 ${data.currentStreak}日 ・ ${todayText}
        </span>

      </span>

      <span class="habit-height">
        ${formatNumber(data.height)}m
      </span>

      <span class="habit-arrow">
        ›
      </span>

    `;


    button.addEventListener(
      "click",
      () => openHabit(habit.id)
    );


    habitList.appendChild(button);

  });

}


/* =========================================================
   個別画面を開く
========================================================= */

function openHabit(habitId) {

  currentHabitId = habitId;

  homeScreen.classList.remove("active");

  gameScreen.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  renderGame();

}


/* =========================================================
   ホームに戻る
========================================================= */

function goHome() {

  currentHabitId = null;

  gameScreen.classList.remove("active");

  homeScreen.classList.add("active");

  renderHome();

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

}


/* =========================================================
   ゲーム画面描画
========================================================= */

function renderGame() {

  if (!currentHabitId) {
    return;
  }


  const habit =
    HABITS[currentHabitId];

  const data =
    appData.habits[currentHabitId];


  gameIcon.textContent =
    habit.icon;

  gameEnglishName.textContent =
    habit.englishName;

  gameTitle.textContent =
    habit.name;


  currentHeight.textContent =
    formatNumber(data.height);


  currentStreak.textContent =
    formatNumber(data.currentStreak);

  totalSuccess.textContent =
    formatNumber(data.totalSuccess);

  consecutiveFailures.textContent =
    data.consecutiveFailures;


  todayDate.textContent =
    getTodayDisplay();


  renderTree(data.height);

  renderGrowthMessage(data.height);

  renderTodayStatus(data);

  renderFailureRisk(data);

}


/* =========================================================
   木の見た目
========================================================= */

function renderTree(height) {

  /*
    実際の高さをそのまま画面に反映すると
    数百mで画面から飛び出すため、
    見た目だけ対数的に成長させる。
  */

  const visualHeight =
    48 +
    Math.min(
      85,
      Math.log10(height + 1) * 34
    );


  treeStem.style.height =
    `${visualHeight}px`;

}


/* =========================================================
   高さに応じたメッセージ
========================================================= */

function renderGrowthMessage(height) {

  if (height === 0) {

    growthMessage.textContent =
      "地表からスタート。最初の1mを目指そう。";

    return;
  }


  if (height < 10) {

    growthMessage.textContent =
      "まだ若い豆の木。まずは10mを目指そう。";

    return;
  }


  if (height < 30) {

    growthMessage.textContent =
      "10m突破。豆の木はかなり大きくなってきた。";

    return;
  }


  if (height < 100) {

    growthMessage.textContent =
      "地上から見上げるほどの高さになってきた。";

    return;
  }


  if (height < 333) {

    growthMessage.textContent =
      "100m突破。巨大な豆の木へ成長している。";

    return;
  }


  growthMessage.textContent =
    "333m突破。東京タワー級の高さに到達している。";

}


/* =========================================================
   今日の記録状態
========================================================= */

function renderTodayStatus(data) {

  const today =
    getTodayKey();


  if (
    data.lastActionDate !== today
  ) {

    todayPending.classList.remove("hidden");

    todayCompleted.classList.add("hidden");

    updateFailureButton(data);

    return;
  }


  todayPending.classList.add("hidden");

  todayCompleted.classList.remove("hidden");


  if (
    data.lastActionType === "success"
  ) {

    todayResultIcon.textContent = "✓";

    todayResultIcon.style.background =
      "var(--green-pale)";

    todayResultIcon.style.color =
      "var(--green-dark)";

    todayResultTitle.textContent =
      "今日も継続成功";

    todayResultDescription.textContent =
      `豆の木が1m成長し、${formatNumber(data.height)}mになりました。`;

  }


  if (
    data.lastActionType === "failure"
  ) {

    todayResultIcon.textContent = "↘";

    todayResultIcon.style.background =
      "var(--red-light)";

    todayResultIcon.style.color =
      "var(--red)";

    todayResultTitle.textContent =
      "失敗を記録しました";

    todayResultDescription.textContent =
      `現在の高さは${formatNumber(data.height)}mです。明日の成功で連続失敗を止められます。`;

  }

}


/* =========================================================
   失敗ボタン説明
========================================================= */

function updateFailureButton(data) {

  const nextFailureNumber =
    data.consecutiveFailures + 1;


  if (nextFailureNumber === 1) {

    failButtonDescription.textContent =
      "現在の高さの1/5を失う";

  } else if (nextFailureNumber === 2) {

    failButtonDescription.textContent =
      "現在の高さが半分になる";

  } else {

    failButtonDescription.textContent =
      "豆の木が0mに戻る";

  }

}


/* =========================================================
   成功処理
========================================================= */

function recordSuccess() {

  const data =
    appData.habits[currentHabitId];


  if (
    data.lastActionDate === getTodayKey()
  ) {

    showToast(
      "今日はすでに記録されています。"
    );

    return;
  }


  const snapshot =
    createSnapshot(data);


  data.height += 1;

  data.currentStreak += 1;

  data.totalSuccess += 1;

  data.consecutiveFailures = 0;

  data.lastActionDate =
    getTodayKey();

  data.lastActionType =
    "success";


  data.history.push({

    date: getTodayKey(),

    type: "success",

    before: snapshot,

    after: createSnapshot(data)

  });


  saveData();

  renderGame();

  renderHome();

  showToast(
    "🌱 成功！ 豆の木が1m成長しました。"
  );

}


/* =========================================================
   失敗確認
========================================================= */

function requestFailure() {

  const data =
    appData.habits[currentHabitId];


  if (
    data.lastActionDate === getTodayKey()
  ) {

    showToast(
      "今日はすでに記録されています。"
    );

    return;
  }


  const prediction =
    calculateFailureResult(
      data.height,
      data.consecutiveFailures
    );


  pendingAction = "failure";


  modalIcon.textContent =
    "⚠️";

  modalTitle.textContent =
    "失敗を記録しますか？";

  modalDescription.textContent =
    `${formatNumber(data.height)}m → ${formatNumber(prediction.newHeight)}mになります。`;

  modalConfirmButton.textContent =
    "失敗を記録";

  modalConfirmButton.style.background =
    "var(--red)";


  openModal();

}


/* =========================================================
   失敗処理
========================================================= */

function recordFailure() {

  const data =
    appData.habits[currentHabitId];


  if (
    data.lastActionDate === getTodayKey()
  ) {

    closeModal();

    showToast(
      "今日はすでに記録されています。"
    );

    return;
  }


  const snapshot =
    createSnapshot(data);


  const result =
    calculateFailureResult(
      data.height,
      data.consecutiveFailures
    );


  data.height =
    result.newHeight;

  data.currentStreak = 0;

  data.consecutiveFailures =
    Math.min(
      3,
      data.consecutiveFailures + 1
    );

  data.lastActionDate =
    getTodayKey();

  data.lastActionType =
    "failure";


  data.history.push({

    date: getTodayKey(),

    type: "failure",

    before: snapshot,

    after: createSnapshot(data)

  });


  saveData();

  closeModal();

  renderGame();

  renderHome();


  showToast(
    result.message
  );

}


/* =========================================================
   失敗時の計算
========================================================= */

function calculateFailureResult(
  height,
  currentFailures
) {

  const failureNumber =
    currentFailures + 1;


  /* 1回目 */
  if (failureNumber === 1) {

    const loss =
      Math.floor(height / 5);

    const newHeight =
      Math.max(
        0,
        height - loss
      );


    return {

      newHeight,

      loss,

      message:
        `1回目の失敗。${formatNumber(loss)}m失いました。`

    };

  }


  /* 2回目 */
  if (failureNumber === 2) {

    const newHeight =
      Math.floor(height / 2);

    const loss =
      height - newHeight;


    return {

      newHeight,

      loss,

      message:
        `2回連続失敗。高さが半分になりました。`

    };

  }


  /* 3回目以降 */
  return {

    newHeight: 0,

    loss: height,

    message:
      "3回連続失敗。豆の木は0mに戻りました。"

  };

}


/* =========================================================
   次回失敗リスク
========================================================= */

function renderFailureRisk(data) {

  const result =
    calculateFailureResult(
      data.height,
      data.consecutiveFailures
    );


  nextFailureResult.textContent =
    `${formatNumber(data.height)}m → ${formatNumber(result.newHeight)}m`;


  const nextFailureNumber =
    data.consecutiveFailures + 1;


  if (nextFailureNumber === 1) {

    riskDescription.textContent =
      `現在の高さの1/5（${formatNumber(result.loss)}m）が削られます。1/5の端数は切り捨てです。`;

    return;
  }


  if (nextFailureNumber === 2) {

    riskDescription.textContent =
      "連続2回目の失敗となり、残っている高さが半分になります。";

    return;
  }


  riskDescription.textContent =
    "連続3回目の失敗となり、豆の木は地表の0mまで戻ります。";

}


/* =========================================================
   今日の記録を取り消す
========================================================= */

function requestUndo() {

  const data =
    appData.habits[currentHabitId];


  if (
    data.lastActionDate !== getTodayKey()
  ) {

    return;
  }


  pendingAction = "undo";


  modalIcon.textContent =
    "↩";

  modalTitle.textContent =
    "今日の記録を取り消しますか？";

  modalDescription.textContent =
    "今日の操作をする直前の状態に戻します。";

  modalConfirmButton.textContent =
    "取り消す";

  modalConfirmButton.style.background =
    "var(--green-dark)";


  openModal();

}


/* =========================================================
   取り消し実行
========================================================= */

function undoTodayAction() {

  const data =
    appData.habits[currentHabitId];


  if (
    data.lastActionDate !== getTodayKey()
  ) {

    closeModal();

    return;
  }


  const lastHistoryIndex =
    findTodayHistoryIndex(data);


  if (lastHistoryIndex === -1) {

    closeModal();

    showToast(
      "取り消せる記録がありません。"
    );

    return;
  }


  const record =
    data.history[lastHistoryIndex];

  const before =
    record.before;


  data.height =
    before.height;

  data.currentStreak =
    before.currentStreak;

  data.totalSuccess =
    before.totalSuccess;

  data.consecutiveFailures =
    before.consecutiveFailures;

  data.lastActionDate =
    before.lastActionDate;

  data.lastActionType =
    before.lastActionType;


  data.history.splice(
    lastHistoryIndex,
    1
  );


  saveData();

  closeModal();

  renderGame();

  renderHome();


  showToast(
    "今日の記録を取り消しました。"
  );

}


/* =========================================================
   今日の履歴を探す
========================================================= */

function findTodayHistoryIndex(data) {

  for (
    let i = data.history.length - 1;
    i >= 0;
    i--
  ) {

    if (
      data.history[i].date === getTodayKey()
    ) {

      return i;
    }

  }


  return -1;
}


/* =========================================================
   スナップショット
========================================================= */

function createSnapshot(data) {

  return {

    height:
      data.height,

    currentStreak:
      data.currentStreak,

    totalSuccess:
      data.totalSuccess,

    consecutiveFailures:
      data.consecutiveFailures,

    lastActionDate:
      data.lastActionDate,

    lastActionType:
      data.lastActionType

  };

}


/* =========================================================
   数字表示
========================================================= */

function formatNumber(number) {

  return Number(number).toLocaleString(
    "ja-JP"
  );

}


/* =========================================================
   Toast
========================================================= */

let toastTimer = null;


function showToast(message) {

  toast.textContent =
    message;

  toast.classList.add("show");


  if (toastTimer) {
    clearTimeout(toastTimer);
  }


  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2600);

}


/* =========================================================
   Modal
========================================================= */

function openModal() {

  modalOverlay.classList.remove(
    "hidden"
  );

}


function closeModal() {

  modalOverlay.classList.add(
    "hidden"
  );

  pendingAction = null;

}


/* =========================================================
   イベント
========================================================= */

backButton.addEventListener(
  "click",
  goHome
);


successButton.addEventListener(
  "click",
  recordSuccess
);


failButton.addEventListener(
  "click",
  requestFailure
);


undoButton.addEventListener(
  "click",
  requestUndo
);


modalCancelButton.addEventListener(
  "click",
  closeModal
);


modalConfirmButton.addEventListener(
  "click",
  () => {

    if (
      pendingAction === "failure"
    ) {

      recordFailure();

      return;
    }


    if (
      pendingAction === "undo"
    ) {

      undoTodayAction();

    }

  }
);


modalOverlay.addEventListener(
  "click",
  (event) => {

    if (
      event.target === modalOverlay
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   初期表示
========================================================= */

renderHome();