"use strict";


/* =========================================================
   BEAN GROWTH
   VERSION 3.0
========================================================= */

const STORAGE_KEY =
  "beanGrowthGame_v1";


/*
  Version 3.0 provisional event rules

  毎月1日・15日
  → 特別成長日

  その他の日
  → 8%でゲリラ成長日
*/

const SPECIAL_DAYS_OF_MONTH =
  [1, 15];

const GUERRILLA_RATE =
  0.08;



/* =========================================================
   HABITS
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
   MILESTONES
========================================================= */

const MILESTONES = [

  {
    height: 0,
    name: "地表",
    icon: "🌍",
    category: "EARTH",

    shortDescription:
      "すべての豆の木はここから始まります。",

    description:
      "地球の地表、0m地点です。小さな豆の種がここから空へ向かって成長していきます。"
  },

  {
    height: 1,
    name: "最初の1メートル",
    icon: "🌱",
    category: "FIRST STEP",

    shortDescription:
      "最初の成長を達成しました。",

    description:
      "最初の1mです。どれほど巨大な豆の木でも、始まりはこの1mです。"
  },

  {
    height: 2,
    name: "成人の身長",
    icon: "🧍",
    category: "HUMAN",

    shortDescription:
      "人間と同じくらいの高さです。",

    description:
      "成人の身長を約2mとして比較しています。豆の木は人間を見下ろすほどになりました。"
  },

  {
    height: 5,
    name: "キリン",
    icon: "🦒",
    category: "ANIMAL",

    shortDescription:
      "地上で最も背の高い動物級です。",

    description:
      "成体のキリンはおよそ4〜6mほどになります。5mの豆の木はキリンと同じ規模です。"
  },

  {
    height: 10,
    name: "電柱",
    icon: "⚡",
    category: "STRUCTURE",

    shortDescription:
      "街中の電柱ほどの高さです。",

    description:
      "一般的な電柱にはさまざまな大きさがありますが、約10m前後のものがあります。"
  },

  {
    height: 20,
    name: "6階建て級",
    icon: "🏢",
    category: "BUILDING",

    shortDescription:
      "中規模の建物級です。",

    description:
      "階高をおよそ3m前後として考えると、20mは6階建て前後の建物に相当します。"
  },

  {
    height: 30,
    name: "シロナガスクジラ",
    icon: "🐋",
    category: "ANIMAL",

    shortDescription:
      "世界最大級の動物の全長です。",

    description:
      "シロナガスクジラは最大級では全長30m前後になります。"
  },

  {
    height: 50,
    name: "15階建て級",
    icon: "🏙️",
    category: "BUILDING",

    shortDescription:
      "中高層建築級の高さです。",

    description:
      "50mになると、中高層マンションなどと比較できるほどの高さになります。"
  },

  {
    height: 100,
    name: "100メートル",
    icon: "🌳",
    category: "GIANT",

    shortDescription:
      "ついに3桁へ到達。",

    description:
      "100mは人間の身長のおよそ50倍。巨大構造物の領域へ入ります。"
  },

  {
    height: 146.6,
    name: "ギザの大ピラミッド",
    icon: "🔺",
    category: "LANDMARK",

    shortDescription:
      "古代の巨大建造物級です。",

    description:
      "ギザの大ピラミッドは建設当初約146.6mだったとされています。"
  },

  {
    height: 333,
    name: "東京タワー",
    icon: "🗼",
    category: "LANDMARK",

    shortDescription:
      "東京タワーの333mに到達。",

    description:
      "東京タワーの高さは333mです。日本を代表する塔と同じ高さです。"
  },

  {
    height: 634,
    name: "東京スカイツリー",
    icon: "📡",
    category: "LANDMARK",

    shortDescription:
      "高さ634mを突破。",

    description:
      "東京スカイツリーの高さは634mです。"
  },

  {
    height: 828,
    name: "ブルジュ・ハリファ",
    icon: "🏙️",
    category: "BUILDING",

    shortDescription:
      "超高層建築物級です。",

    description:
      "ドバイのブルジュ・ハリファは828mです。"
  },

  {
    height: 1000,
    name: "1キロメートル",
    icon: "☁️",
    category: "SKY",

    shortDescription:
      "高さ1kmへ到達しました。",

    description:
      "1,000mは1kmです。ここから空のスケールへ入っていきます。"
  },

  {
    height: 3776,
    name: "富士山",
    icon: "🗻",
    category: "MOUNTAIN",

    shortDescription:
      "日本最高峰を突破。",

    description:
      "富士山の標高は3,776mです。"
  },

  {
    height: 8849,
    name: "エベレスト",
    icon: "🏔️",
    category: "MOUNTAIN",

    shortDescription:
      "地球最高峰級です。",

    description:
      "エベレストの標高は約8,849mです。"
  },

  {
    height: 10000,
    name: "旅客機の巡航高度",
    icon: "✈️",
    category: "AVIATION",

    shortDescription:
      "旅客機が飛ぶ空へ到達。",

    description:
      "大型旅客機はおおむね高度10km前後を巡航します。"
  },

  {
    height: 12000,
    name: "成層圏の入口付近",
    icon: "🌤️",
    category: "ATMOSPHERE",

    shortDescription:
      "大気上層へ進みます。",

    description:
      "対流圏界面は場所や季節によって変化します。12kmはその境界付近を示す目安です。"
  },

  {
    height: 20000,
    name: "成層圏",
    icon: "☀️",
    category: "ATMOSPHERE",

    shortDescription:
      "通常の航空機を大きく超えました。",

    description:
      "高度20kmでは空気は非常に薄くなります。"
  },

  {
    height: 50000,
    name: "成層圏上部",
    icon: "🌌",
    category: "ATMOSPHERE",

    shortDescription:
      "宇宙が近づいてきました。",

    description:
      "高度約50kmは成層圏の上端付近です。"
  },

  {
    height: 100000,
    name: "宇宙の入口",
    icon: "🚀",
    category: "SPACE",

    shortDescription:
      "カーマン・ラインへ到達。",

    description:
      "高度100kmはカーマン・ラインと呼ばれ、宇宙の境界として広く使われる目安です。"
  },

  {
    height: 400000,
    name: "ISS軌道級",
    icon: "🛰️",
    category: "SPACE",

    shortDescription:
      "国際宇宙ステーション級です。",

    description:
      "ISSは高度約400km前後を周回しています。"
  },

  {
    height: 35786000,
    name: "静止軌道",
    icon: "📡",
    category: "ORBIT",

    shortDescription:
      "静止衛星の軌道高度です。",

    description:
      "赤道上空約35,786kmには静止軌道があります。"
  },

  {
    height: 384400000,
    name: "月",
    icon: "🌕",
    category: "MOON",

    shortDescription:
      "地球から月までの距離級です。",

    description:
      "地球と月の平均距離は約38万4,400kmです。"
  }

];



/* =========================================================
   INITIAL DATA
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

    version: "3.0",

    habits: {

      noMasturbation:
        createInitialHabitData(),

      noAlcohol:
        createInitialHabitData(),

      noSmoking:
        createInitialHabitData()

    }

  };

}



/* =========================================================
   STORAGE
========================================================= */

function loadData() {

  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!saved) {

    return createInitialData();

  }


  try {

    return mergeWithInitialData(
      JSON.parse(saved)
    );

  } catch (error) {

    console.error(
      "保存データの読み込み失敗",
      error
    );

    return createInitialData();

  }

}


function mergeWithInitialData(
  saved
) {

  const initial =
    createInitialData();


  const merged = {

    ...initial,

    ...saved,

    version:
      "3.0",

    habits: {
      ...initial.habits
    }

  };


  Object.keys(
    HABITS
  ).forEach(
    habitId => {

      merged.habits[
        habitId
      ] = {

        ...initial.habits[
          habitId
        ],

        ...(
          saved.habits?.[
            habitId
          ] || {}
        )

      };

    }
  );


  return merged;

}


function saveData() {

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(
      appData
    )

  );

}



/* =========================================================
   DATE
========================================================= */

function getTodayKey() {

  const date =
    new Date();


  const y =
    date.getFullYear();


  const m =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const d =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${y}-${m}-${d}`;

}


function getTodayDisplay() {

  return new Intl.DateTimeFormat(

    "ja-JP",

    {

      year: "numeric",

      month: "long",

      day: "numeric",

      weekday: "short"

    }

  ).format(
    new Date()
  );

}



/* =========================================================
   APP STATE
========================================================= */

let appData =
  loadData();


let currentHabitId =
  null;


let pendingAction =
  null;


/* Developer sandbox */

let developerMode =
  false;


let developerData =
  null;


let developerOriginalData =
  null;


let developerForcedEvent =
  "auto";



/* =========================================================
   DOM SHORTCUT
========================================================= */

const $ =
  id =>
    document.getElementById(id);



/* =========================================================
   HOME
========================================================= */

function renderHome() {

  const habitList =
    $("habitList");


  habitList.innerHTML =
    "";


  Object.values(
    HABITS
  ).forEach(
    habit => {

      const data =
        appData.habits[
          habit.id
        ];


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "habit-card";


      let status =
        "今日は未記録";


      if (
        data.lastActionDate ===
        getTodayKey()
      ) {

        status =
          data.lastActionType ===
          "success"
            ?
            "今日は成功済み"
            :
            "今日は失敗を記録";

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
            連続 ${data.currentStreak}日 ・ ${status}
          </span>

        </span>

        <span class="habit-height">
          ${formatHeight(data.height)}
        </span>

        <span class="habit-arrow">
          ›
        </span>

      `;


      button.addEventListener(
        "click",
        () =>
          openHabit(
            habit.id
          )
      );


      habitList.appendChild(
        button
      );

    }
  );

}



/* =========================================================
   OPEN / CLOSE GAME
========================================================= */

function openHabit(
  habitId
) {

  currentHabitId =
    habitId;


  $("homeScreen")
    .classList
    .remove("active");


  $("gameScreen")
    .classList
    .add("active");


  renderGame();


  window.scrollTo(
    0,
    0
  );

}


function goHome() {

  if (
    developerMode
  ) {

    exitDeveloperMode();

  }


  currentHabitId =
    null;


  $("gameScreen")
    .classList
    .remove("active");


  $("homeScreen")
    .classList
    .add("active");


  renderHome();


  window.scrollTo(
    0,
    0
  );

}



/* =========================================================
   ACTIVE DATA
========================================================= */

function getActiveData() {

  if (
    developerMode
  ) {

    return developerData;

  }


  return appData.habits[
    currentHabitId
  ];

}



/* =========================================================
   GAME RENDER
========================================================= */

function renderGame() {

  if (
    !currentHabitId
  ) {

    return;

  }


  const habit =
    HABITS[
      currentHabitId
    ];


  const data =
    getActiveData();


  $("gameIcon").textContent =
    habit.icon;


  $("gameEnglishName").textContent =
    habit.englishName;


  $("gameTitle").textContent =
    habit.name;


  $("currentHeight").textContent =
    formatNumber(
      data.height
    );


  $("currentStreak").textContent =
    formatNumber(
      data.currentStreak
    );


  $("totalSuccess").textContent =
    formatNumber(
      data.totalSuccess
    );


  $("consecutiveFailures").textContent =
    data.consecutiveFailures;


  $("todayDate").textContent =
    getTodayDisplay();


  renderDeveloperState();

  renderTree(
    data.height
  );

  renderGrowthMessage(
    data.height
  );

  renderEvent(
    data
  );

  renderMilestones(
    data.height
  );

  renderTodayStatus(
    data
  );

  renderFailureRisk(
    data
  );

}



/* =========================================================
   TREE
========================================================= */

function renderTree(
  height
) {

  const visualHeight =

    48 +

    Math.min(

      85,

      Math.log10(
        height + 1
      ) * 34

    );


  $("treeStem").style.height =
    `${visualHeight}px`;

}



/* =========================================================
   GROWTH MESSAGE
========================================================= */

function renderGrowthMessage(
  height
) {

  const current =
    findCurrentMilestone(
      height
    );


  const next =
    findNextMilestone(
      height
    );


  if (!next) {

    $("growthMessage").textContent =
      "月まで到達。豆の木は地球を離れました。";

    return;

  }


  if (
    height === 0
  ) {

    $("growthMessage").textContent =
      "地表からスタート。最初の1mを目指そう。";

    return;

  }


  $("growthMessage").textContent =
    `${current.name}を突破。次は${next.name}。`;

}



/* =========================================================
   EVENT SYSTEM
========================================================= */

function getEventForToday() {

  /*
    開発者モードで
    強制指定されている場合
  */

  if (
    developerMode &&
    developerForcedEvent !==
    "auto"
  ) {

    return eventFromType(
      developerForcedEvent
    );

  }


  const today =
    new Date();


  const day =
    today.getDate();


  /*
    特別成長日
  */

  if (
    SPECIAL_DAYS_OF_MONTH
      .includes(day)
  ) {

    return eventFromType(
      "special"
    );

  }


  /*
    ゲリラ抽選

    Math.random()を使うと
    更新のたび結果が変わるため、
    日付から固定値を作る。
  */

  const seed =
    hashString(
      getTodayKey()
    );


  const value =
    seededRandom(
      seed
    );


  if (
    value <
    GUERRILLA_RATE
  ) {

    return eventFromType(
      "guerrilla"
    );

  }


  return eventFromType(
    "normal"
  );

}



/* =========================================================
   EVENT TYPES
========================================================= */

function eventFromType(
  type
) {

  switch (type) {

    case "special":

      return {

        type:
          "special",

        special:
          true,

        guerrilla:
          false,

        icon:
          "✨",

        title:
          "特別成長日",

        reward:
          "+10m",

        description:
          "今日継続できれば、豆の木が一気に10m成長します。"

      };


    case "guerrilla":

      return {

        type:
          "guerrilla",

        special:
          false,

        guerrilla:
          true,

        icon:
          "⚡",

        title:
          "ゲリラ成長日",

        reward:
          "×1.1",

        description:
          "今日継続できれば、現在の高さが1.1倍になります。"

      };


    case "both":

      return {

        type:
          "both",

        special:
          true,

        guerrilla:
          true,

        icon:
          "🔥",

        title:
          "超成長日",

        reward:
          "+10m → ×1.1",

        description:
          "10m成長したあと、さらに高さが1.1倍になります。"

      };


    default:

      return {

        type:
          "normal",

        special:
          false,

        guerrilla:
          false,

        icon:
          "🌱",

        title:
          "通常成長日",

        reward:
          "+1m",

        description:
          "今日継続できれば、豆の木が1m成長します。"

      };

  }

}



/* =========================================================
   DETERMINISTIC RANDOM
========================================================= */

function hashString(
  text
) {

  let hash =
    2166136261;


  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    hash ^=
      text.charCodeAt(i);


    hash =
      Math.imul(
        hash,
        16777619
      );

  }


  return hash >>> 0;

}


function seededRandom(
  seed
) {

  let x =
    seed;


  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;


  return (
    (x >>> 0)
    /
    4294967296
  );

}



/* =========================================================
   EVENT DISPLAY
========================================================= */

function renderEvent(
  data
) {

  const event =
    getEventForToday();


  const card =
    $("eventCard");


  card.classList.remove(

    "special-event",

    "guerrilla-event",

    "both-event"

  );


  if (
    event.type ===
    "special"
  ) {

    card.classList.add(
      "special-event"
    );

  }


  if (
    event.type ===
    "guerrilla"
  ) {

    card.classList.add(
      "guerrilla-event"
    );

  }


  if (
    event.type ===
    "both"
  ) {

    card.classList.add(
      "both-event"
    );

  }


  $("eventIcon").textContent =
    event.icon;


  $("eventTitle").textContent =
    event.title;


  $("eventDescription").textContent =
    event.description;


  $("eventReward").textContent =
    event.reward;


  const result =
    calculateSuccessResult(
      data.height,
      event
    );


  $("successButtonDescription").textContent =
    `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}`;

}



/* =========================================================
   SUCCESS CALCULATION
========================================================= */

function calculateSuccessResult(
  height,
  event
) {

  let newHeight =
    height;


  /*
    通常
  */

  if (
    !event.special &&
    !event.guerrilla
  ) {

    newHeight =
      height + 1;

  }


  /*
    特別
  */

  if (
    event.special &&
    !event.guerrilla
  ) {

    newHeight =
      height + 10;

  }


  /*
    ゲリラ
  */

  if (
    !event.special &&
    event.guerrilla
  ) {

    newHeight =
      roundToOneDecimal(
        height * 1.1
      );

  }


  /*
    特別 + ゲリラ
  */

  if (
    event.special &&
    event.guerrilla
  ) {

    newHeight =
      roundToOneDecimal(
        (height + 10)
        *
        1.1
      );

  }


  return {

    newHeight:
      roundToOneDecimal(
        newHeight
      ),

    gained:
      roundToOneDecimal(
        newHeight - height
      )

  };

}



/* =========================================================
   RECORD SUCCESS
========================================================= */

function recordSuccess() {

  if (
    developerMode
  ) {

    simulateDeveloperSuccess();

    return;

  }


  const data =
    getActiveData();


  if (
    data.lastActionDate ===
    getTodayKey()
  ) {

    showToast(
      "今日はすでに記録されています。"
    );

    return;

  }


  const snapshot =
    createSnapshot(
      data
    );


  const event =
    getEventForToday();


  const result =
    calculateSuccessResult(
      data.height,
      event
    );


  data.height =
    result.newHeight;


  data.currentStreak +=
    1;


  data.totalSuccess +=
    1;


  data.consecutiveFailures =
    0;


  data.lastActionDate =
    getTodayKey();


  data.lastActionType =
    "success";


  data.history.push({

    date:
      getTodayKey(),

    type:
      "success",

    eventType:
      event.type,

    before:
      snapshot,

    after:
      createSnapshot(
        data
      )

  });


  saveData();


  renderGame();

  renderHome();


  showToast(
    `🌱 成功！ ${formatHeight(result.gained)}成長しました。`
  );

}



/* =========================================================
   FAILURE
========================================================= */

function requestFailure() {

  if (
    developerMode
  ) {

    simulateDeveloperFailure();

    return;

  }


  const data =
    getActiveData();


  if (
    data.lastActionDate ===
    getTodayKey()
  ) {

    showToast(
      "今日はすでに記録されています。"
    );

    return;

  }


  const result =
    calculateFailureResult(

      data.height,

      data.consecutiveFailures

    );


  pendingAction =
    "failure";


  $("modalIcon").textContent =
    "⚠️";


  $("modalTitle").textContent =
    "失敗を記録しますか？";


  $("modalDescription").textContent =
    `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}になります。`;


  $("modalConfirmButton").textContent =
    "失敗を記録";


  openModal();

}


function recordFailure() {

  const data =
    getActiveData();


  const snapshot =
    createSnapshot(
      data
    );


  const result =
    calculateFailureResult(

      data.height,

      data.consecutiveFailures

    );


  data.height =
    result.newHeight;


  data.currentStreak =
    0;


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

    date:
      getTodayKey(),

    type:
      "failure",

    before:
      snapshot,

    after:
      createSnapshot(
        data
      )

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
   FAILURE CALCULATION
========================================================= */

function calculateFailureResult(
  height,
  failures
) {

  const number =
    failures + 1;


  /*
    1回目
  */

  if (
    number === 1
  ) {

    const loss =
      Math.floor(
        height / 5
      );


    const newHeight =
      roundToOneDecimal(
        Math.max(
          0,
          height - loss
        )
      );


    return {

      newHeight,

      loss,

      message:
        `1回目の失敗。${formatHeight(loss)}失いました。`

    };

  }


  /*
    2回目
  */

  if (
    number === 2
  ) {

    const newHeight =
      floorToOneDecimal(
        height / 2
      );


    return {

      newHeight,

      loss:
        roundToOneDecimal(
          height - newHeight
        ),

      message:
        "2回連続失敗。高さが半分になりました。"

    };

  }


  /*
    3回目
  */

  return {

    newHeight: 0,

    loss: height,

    message:
      "3回連続失敗。豆の木は0mに戻りました。"

  };

}



/* =========================================================
   FAILURE RISK
========================================================= */

function renderFailureRisk(
  data
) {

  const result =
    calculateFailureResult(

      data.height,

      data.consecutiveFailures

    );


  $("nextFailureResult").textContent =
    `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}`;


  const next =
    data.consecutiveFailures + 1;


  if (
    next === 1
  ) {

    $("riskDescription").textContent =
      `現在の高さの1/5を計算し、端数を切り捨てた${formatHeight(result.loss)}が削られます。`;

  } else if (
    next === 2
  ) {

    $("riskDescription").textContent =
      "連続2回目の失敗。残っている高さが半分になります。";

  } else {

    $("riskDescription").textContent =
      "連続3回目の失敗。豆の木は0mまで戻ります。";

  }


  updateFailureButton(
    data
  );

}


function updateFailureButton(
  data
) {

  const next =
    data.consecutiveFailures + 1;


  if (
    next === 1
  ) {

    $("failButtonDescription").textContent =
      "現在の高さの1/5を失う";

  } else if (
    next === 2
  ) {

    $("failButtonDescription").textContent =
      "現在の高さが半分になる";

  } else {

    $("failButtonDescription").textContent =
      "豆の木が0mに戻る";

  }

}



/* =========================================================
   TODAY STATUS
========================================================= */

function renderTodayStatus(
  data
) {

  /*
    Developer modeでは
    通常ボタンを表示したまま何度でもテスト
  */

  if (
    developerMode
  ) {

    $("todayPending")
      .classList
      .remove("hidden");


    $("todayCompleted")
      .classList
      .add("hidden");


    return;

  }


  if (
    data.lastActionDate !==
    getTodayKey()
  ) {

    $("todayPending")
      .classList
      .remove("hidden");


    $("todayCompleted")
      .classList
      .add("hidden");


    return;

  }


  $("todayPending")
    .classList
    .add("hidden");


  $("todayCompleted")
    .classList
    .remove("hidden");


  if (
    data.lastActionType ===
    "success"
  ) {

    $("todayResultIcon").textContent =
      "✓";


    $("todayResultIcon").style.background =
      "var(--green-pale)";


    $("todayResultIcon").style.color =
      "var(--green-dark)";


    $("todayResultTitle").textContent =
      "今日も継続成功";


    $("todayResultDescription").textContent =
      `現在の高さは${formatHeight(data.height)}です。`;

  } else {

    $("todayResultIcon").textContent =
      "↘";


    $("todayResultIcon").style.background =
      "var(--red-light)";


    $("todayResultIcon").style.color =
      "var(--red)";


    $("todayResultTitle").textContent =
      "失敗を記録しました";


    $("todayResultDescription").textContent =
      `現在の高さは${formatHeight(data.height)}です。`;

  }

}



/* =========================================================
   UNDO
========================================================= */

function requestUndo() {

  if (
    developerMode
  ) {

    return;

  }


  const data =
    getActiveData();


  const index =
    findTodayHistoryIndex(
      data
    );


  if (
    index === -1
  ) {

    return;

  }


  pendingAction =
    "undo";


  $("modalIcon").textContent =
    "↩";


  $("modalTitle").textContent =
    "今日の記録を取り消しますか？";


  $("modalDescription").textContent =
    "今日の操作直前の状態へ戻します。";


  $("modalConfirmButton").textContent =
    "取り消す";


  openModal();

}


function undoTodayAction() {

  const data =
    getActiveData();


  const index =
    findTodayHistoryIndex(
      data
    );


  if (
    index === -1
  ) {

    closeModal();

    return;

  }


  const before =
    data.history[
      index
    ].before;


  restoreSnapshot(
    data,
    before
  );


  data.history.splice(
    index,
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


function findTodayHistoryIndex(
  data
) {

  for (

    let i =
      data.history.length - 1;

    i >= 0;

    i--

  ) {

    if (
      data.history[i].date ===
      getTodayKey()
    ) {

      return i;

    }

  }


  return -1;

}



/* =========================================================
   MILESTONES
========================================================= */

function findCurrentMilestone(
  height
) {

  let current =
    MILESTONES[0];


  for (
    const item
    of MILESTONES
  ) {

    if (
      height >=
      item.height
    ) {

      current =
        item;

    } else {

      break;

    }

  }


  return current;

}


function findNextMilestone(
  height
) {

  return (
    MILESTONES.find(
      item =>
        item.height >
        height
    )
    ||
    null
  );

}


function renderMilestones(
  height
) {

  const current =
    findCurrentMilestone(
      height
    );


  const next =
    findNextMilestone(
      height
    );


  $("currentMilestoneIcon").textContent =
    current.icon;


  $("currentMilestoneName").textContent =
    current.name;


  $("currentMilestoneHeight").textContent =
    formatHeight(
      current.height
    );


  $("currentMilestoneDescription").textContent =
    current.shortDescription;


  $("currentMilestoneDetailButton").onclick =
    () =>
      openMilestoneModal(
        current
      );


  if (!next) {

    $("nextMilestoneCard")
      .classList
      .add("hidden");

  } else {

    $("nextMilestoneCard")
      .classList
      .remove("hidden");


    $("nextMilestoneIcon").textContent =
      next.icon;


    $("nextMilestoneName").textContent =
      next.name;


    $("nextMilestoneHeight").textContent =
      formatHeight(
        next.height
      );


    const distance =
      roundToOneDecimal(
        next.height -
        height
      );


    $("distanceToNext").textContent =
      formatHeight(
        distance
      );


    const interval =
      next.height -
      current.height;


    let progress =
      0;


    if (
      interval > 0
    ) {

      progress =
        (
          (
            height -
            current.height
          )
          /
          interval
        )
        *
        100;

    }


    progress =
      Math.max(
        0,
        Math.min(
          100,
          progress
        )
      );


    $("milestoneProgressBar")
      .style
      .width =
        `${progress}%`;


    $("progressText").textContent =
      `${current.name} → ${next.name}　${progress.toFixed(1)}%`;


    $("nextMilestoneDetailButton").onclick =
      () =>
        openMilestoneModal(
          next
        );

  }


  renderAchievements(
    height
  );

}



/* =========================================================
   ACHIEVEMENTS
========================================================= */

function renderAchievements(
  height
) {

  const reached =
    MILESTONES.filter(

      item =>
        item.height > 0
        &&
        item.height <= height

    );


  $("achievementCount").textContent =
    reached.length;


  $("achievementList").innerHTML =
    "";


  if (
    reached.length === 0
  ) {

    const item =
      document.createElement(
        "div"
      );


    item.className =
      "achievement-item";


    item.innerHTML = `

      <span class="achievement-icon">
        🌱
      </span>

      <span class="achievement-name">
        まだ未到達
      </span>

      <span class="achievement-height">
        最初の1mへ
      </span>

    `;


    $("achievementList")
      .appendChild(
        item
      );


    return;

  }


  reached
    .slice()
    .reverse()
    .forEach(
      milestone => {

        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.className =
          "achievement-item";


        button.innerHTML = `

          <span class="achievement-icon">
            ${milestone.icon}
          </span>

          <span class="achievement-name">
            ${milestone.name}
          </span>

          <span class="achievement-height">
            ${formatHeight(milestone.height)}
          </span>

        `;


        button.addEventListener(
          "click",
          () =>
            openMilestoneModal(
              milestone
            )
        );


        $("achievementList")
          .appendChild(
            button
          );

      }
    );

}



/* =========================================================
   MILESTONE MODAL
========================================================= */

function openMilestoneModal(
  item
) {

  $("milestoneModalIcon").textContent =
    item.icon;


  $("milestoneModalCategory").textContent =
    item.category;


  $("milestoneModalName").textContent =
    item.name;


  $("milestoneModalHeight").textContent =
    formatHeight(
      item.height
    );


  $("milestoneModalDescription").textContent =
    item.description;


  $("milestoneModalOverlay")
    .classList
    .remove("hidden");

}


function closeMilestoneModal() {

  $("milestoneModalOverlay")
    .classList
    .add("hidden");

}



/* =========================================================
   DEVELOPER MODE
========================================================= */

function openDeveloperSelector() {

  $("developerModalOverlay")
    .classList
    .remove("hidden");

}


function closeDeveloperSelector() {

  $("developerModalOverlay")
    .classList
    .add("hidden");

}


function startDeveloperMode(
  habitId
) {

  currentHabitId =
    habitId;


  developerMode =
    true;


  developerOriginalData =
    deepClone(
      appData.habits[
        habitId
      ]
    );


  developerData =
    deepClone(
      developerOriginalData
    );


  developerForcedEvent =
    "auto";


  $("developerEventSelect").value =
    "auto";


  closeDeveloperSelector();


  $("homeScreen")
    .classList
    .remove("active");


  $("gameScreen")
    .classList
    .add("active");


  renderGame();


  window.scrollTo(
    0,
    0
  );

}


function exitDeveloperMode() {

  developerMode =
    false;


  developerData =
    null;


  developerOriginalData =
    null;


  developerForcedEvent =
    "auto";


  $("developerPanel")
    .classList
    .add("hidden");


  $("developerIndicator")
    .classList
    .add("hidden");


  if (
    currentHabitId
  ) {

    renderGame();

  }

}


function renderDeveloperState() {

  if (
    developerMode
  ) {

    $("developerIndicator")
      .classList
      .remove("hidden");


    $("developerPanel")
      .classList
      .remove("hidden");

  } else {

    $("developerIndicator")
      .classList
      .add("hidden");


    $("developerPanel")
      .classList
      .add("hidden");

  }

}



/* =========================================================
   DEVELOPER HEIGHT
========================================================= */

function developerAddHeight(
  amount
) {

  if (
    !developerMode
  ) {

    return;

  }


  developerData.height =
    roundToOneDecimal(

      developerData.height
      +
      amount

    );


  renderGame();

}


function developerSetHeight() {

  if (
    !developerMode
  ) {

    return;

  }


  const input =
    Number(
      $("developerHeightInput")
        .value
    );


  if (
    !Number.isFinite(input)
    ||
    input < 0
  ) {

    showToast(
      "0以上の高さを入力してください。"
    );

    return;

  }


  developerData.height =
    roundToOneDecimal(
      input
    );


  renderGame();


  showToast(
    `テスト高度を${formatHeight(input)}に設定しました。`
  );

}



/* =========================================================
   DEVELOPER FAILURE STATE
========================================================= */

function developerSetFailureCount(
  count
) {

  if (
    !developerMode
  ) {

    return;

  }


  developerData.consecutiveFailures =
    count;


  if (
    count > 0
  ) {

    developerData.currentStreak =
      0;

  }


  renderGame();

}



/* =========================================================
   DEVELOPER SUCCESS
========================================================= */

function simulateDeveloperSuccess() {

  const event =
    getEventForToday();


  const result =
    calculateSuccessResult(

      developerData.height,

      event

    );


  developerData.height =
    result.newHeight;


  developerData.currentStreak +=
    1;


  developerData.totalSuccess +=
    1;


  developerData.consecutiveFailures =
    0;


  renderGame();


  showToast(
    `🧪 成功テスト：${formatHeight(result.gained)}成長`
  );

}



/* =========================================================
   DEVELOPER FAILURE
========================================================= */

function simulateDeveloperFailure() {

  const result =
    calculateFailureResult(

      developerData.height,

      developerData.consecutiveFailures

    );


  developerData.height =
    result.newHeight;


  developerData.currentStreak =
    0;


  developerData.consecutiveFailures =
    Math.min(

      3,

      developerData.consecutiveFailures
      +
      1

    );


  renderGame();


  showToast(
    `🧪 ${result.message}`
  );

}



/* =========================================================
   DEVELOPER RESET
========================================================= */

function resetDeveloperData() {

  if (
    !developerMode
  ) {

    return;

  }


  developerData =
    deepClone(
      developerOriginalData
    );


  developerForcedEvent =
    "auto";


  $("developerEventSelect").value =
    "auto";


  $("developerHeightInput").value =
    "";


  renderGame();


  showToast(
    "テストデータを元に戻しました。"
  );

}



/* =========================================================
   SNAPSHOT
========================================================= */

function createSnapshot(
  data
) {

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


function restoreSnapshot(
  data,
  snapshot
) {

  data.height =
    snapshot.height;


  data.currentStreak =
    snapshot.currentStreak;


  data.totalSuccess =
    snapshot.totalSuccess;


  data.consecutiveFailures =
    snapshot.consecutiveFailures;


  data.lastActionDate =
    snapshot.lastActionDate;


  data.lastActionType =
    snapshot.lastActionType;

}



/* =========================================================
   UTILITIES
========================================================= */

function deepClone(
  object
) {

  return JSON.parse(
    JSON.stringify(
      object
    )
  );

}


function roundToOneDecimal(
  value
) {

  return Math.round(
    value * 10
  ) / 10;

}


function floorToOneDecimal(
  value
) {

  return Math.floor(
    value * 10
  ) / 10;

}


function formatNumber(
  number
) {

  return Number(
    number
  ).toLocaleString(

    "ja-JP",

    {

      maximumFractionDigits:
        1

    }

  );

}


function formatHeight(
  meters
) {

  const value =
    Number(
      meters
    );


  if (
    value < 1000
  ) {

    return (
      `${formatNumber(value)}m`
    );

  }


  if (
    value < 1000000
  ) {

    return (
      `${formatNumber(value / 1000)}km`
    );

  }


  return (
    `${formatNumber(value / 1000)}km`
  );

}



/* =========================================================
   TOAST
========================================================= */

let toastTimer =
  null;


function showToast(
  message
) {

  $("toast").textContent =
    message;


  $("toast")
    .classList
    .add("show");


  if (
    toastTimer
  ) {

    clearTimeout(
      toastTimer
    );

  }


  toastTimer =
    setTimeout(
      () => {

        $("toast")
          .classList
          .remove("show");

      },
      2400
    );

}



/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function openModal() {

  $("modalOverlay")
    .classList
    .remove("hidden");

}


function closeModal() {

  $("modalOverlay")
    .classList
    .add("hidden");


  pendingAction =
    null;

}



/* =========================================================
   EVENTS
========================================================= */

$("backButton")
  .addEventListener(
    "click",
    goHome
  );


$("successButton")
  .addEventListener(
    "click",
    recordSuccess
  );


$("failButton")
  .addEventListener(
    "click",
    requestFailure
  );


$("undoButton")
  .addEventListener(
    "click",
    requestUndo
  );



/* confirmation modal */

$("modalCancelButton")
  .addEventListener(
    "click",
    closeModal
  );


$("modalConfirmButton")
  .addEventListener(
    "click",
    () => {

      if (
        pendingAction ===
        "failure"
      ) {

        recordFailure();

      } else if (
        pendingAction ===
        "undo"
      ) {

        undoTodayAction();

      }

    }
  );


$("modalOverlay")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("modalOverlay")
      ) {

        closeModal();

      }

    }
  );



/* milestone modal */

$("milestoneModalClose")
  .addEventListener(
    "click",
    closeMilestoneModal
  );


$("milestoneModalOverlay")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("milestoneModalOverlay")
      ) {

        closeMilestoneModal();

      }

    }
  );



/* developer selector */

$("developerButton")
  .addEventListener(
    "click",
    openDeveloperSelector
  );


$("developerModalClose")
  .addEventListener(
    "click",
    closeDeveloperSelector
  );


document
  .querySelectorAll(
    ".developer-habit-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          startDeveloperMode(
            button.dataset
              .developerHabit
          );

        }
      );

    }
  );



/* developer height buttons */

document
  .querySelectorAll(
    "[data-add-height]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          developerAddHeight(
            Number(
              button.dataset
                .addHeight
            )
          );

        }
      );

    }
  );


$("developerSetHeightButton")
  .addEventListener(
    "click",
    developerSetHeight
  );



/* forced event */

$("developerEventSelect")
  .addEventListener(
    "change",
    event => {

      developerForcedEvent =
        event.target.value;


      renderGame();

    }
  );



/* failure counts */

document
  .querySelectorAll(
    ".dev-failure-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          developerSetFailureCount(
            Number(
              button.dataset
                .failureCount
            )
          );

        }
      );

    }
  );



/* developer simulations */

$("developerSuccessButton")
  .addEventListener(
    "click",
    simulateDeveloperSuccess
  );


$("developerFailureButton")
  .addEventListener(
    "click",
    simulateDeveloperFailure
  );


$("developerResetButton")
  .addEventListener(
    "click",
    resetDeveloperData
  );


$("developerExitButton")
  .addEventListener(
    "click",
    () => {

      exitDeveloperMode();

      showToast(
        "開発者モードを終了しました。"
      );

    }
  );



/* =========================================================
   START
========================================================= */

renderHome();