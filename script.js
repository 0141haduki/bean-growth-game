"use strict";


/* =========================================================
   Bean Growth
   Version 2.0
========================================================= */


const STORAGE_KEY =
  "beanGrowthGame_v1";


/* =========================================================
   習慣
========================================================= */

const HABITS = {

  noMasturbation: {

    id:
      "noMasturbation",

    name:
      "オナ禁",

    englishName:
      "NO MASTURBATION",

    icon:
      "🌱"

  },


  noAlcohol: {

    id:
      "noAlcohol",

    name:
      "禁酒",

    englishName:
      "NO ALCOHOL",

    icon:
      "🍺"

  },


  noSmoking: {

    id:
      "noSmoking",

    name:
      "禁煙",

    englishName:
      "NO SMOKING",

    icon:
      "🚭"

  }

};


/* =========================================================
   VERSION 2
   高さ比較データ

   height はすべてメートル
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
      "地球の地表、0m地点です。小さな豆の種が、ここから空に向かって成長していきます。継続する1日ごとに、あなたの豆の木は1mずつ上へ伸びていきます。"
  },


  {
    height: 1,

    name: "1メートル",

    icon: "🌱",

    category: "FIRST STEP",

    shortDescription:
      "最初の1m。豆の木の成長が始まりました。",

    description:
      "最初の成功によって豆の木が地表から1mまで成長した地点です。巨大な目標も、すべて最初の1mから始まります。"
  },


  {
    height: 2,

    name: "成人の身長",

    icon: "🧍",

    category: "HUMAN",

    shortDescription:
      "人間と同じくらいの高さになりました。",

    description:
      "成人の身長をおよそ2mとして比較しています。まだ小さな豆の木ですが、人間を見下ろせる程度まで成長しました。"
  },


  {
    height: 5,

    name: "キリン",

    icon: "🦒",

    category: "ANIMAL",

    shortDescription:
      "地上で最も背の高い動物級です。",

    description:
      "成体のキリンは個体差がありますが、およそ4〜6mほどの高さになります。5mまで育った豆の木は、地上で最も背の高い動物と同じ規模です。"
  },


  {
    height: 10,

    name: "電柱",

    icon: "⚡",

    category: "STRUCTURE",

    shortDescription:
      "街中の電柱を見上げる高さです。",

    description:
      "一般的な電柱にはさまざまな長さがありますが、およそ10m前後のものがあります。10mに到達すると、日常生活で見かける構造物としてもかなり高い存在になります。"
  },


  {
    height: 20,

    name: "6階建ての建物",

    icon: "🏢",

    category: "BUILDING",

    shortDescription:
      "中規模の建物を超える高さです。",

    description:
      "建物の階高を約3m前後と考えると、20mはおおむね6階建て前後の建物に相当する高さです。"
  },


  {
    height: 30,

    name: "シロナガスクジラ",

    icon: "🐋",

    category: "ANIMAL",

    shortDescription:
      "地球最大級の動物の全長に到達。",

    description:
      "シロナガスクジラは最大級の個体では全長30m前後になります。豆の木を横に倒せば、巨大なクジラと同じほどの長さです。"
  },


  {
    height: 50,

    name: "15階建て級",

    icon: "🏙️",

    category: "BUILDING",

    shortDescription:
      "高層建築が見えてくる高さです。",

    description:
      "50mになると、一般的な中高層マンションなどに匹敵する高さになります。地上から見上げる豆の木としてはかなり巨大です。"
  },


  {
    height: 100,

    name: "100メートル",

    icon: "🌳",

    category: "GIANT",

    shortDescription:
      "ついに3桁。巨大な豆の木です。",

    description:
      "100mは30階前後の建築物に近い規模です。人間の身長のおよそ50倍。ここから豆の木は巨大構造物の領域へ入っていきます。"
  },


  {
    height: 150,

    name: "ピラミッド級",

    icon: "🔺",

    category: "LANDMARK",

    shortDescription:
      "ギザの大ピラミッド級の高さです。",

    description:
      "ギザの大ピラミッドは建設当初約146.6mでした。150mの豆の木は、古代世界を代表する巨大建造物に匹敵します。"
  },


  {
    height: 333,

    name: "東京タワー",

    icon: "🗼",

    category: "LANDMARK",

    shortDescription:
      "東京タワーの高さ333mに到達。",

    description:
      "東京タワーの高さは333mです。地表から333日分を単純に積み上げるだけでも、東京の象徴的な建造物と同じ高さになります。"
  },


  {
    height: 634,

    name: "東京スカイツリー",

    icon: "📡",

    category: "LANDMARK",

    shortDescription:
      "高さ634m、日本最大級の塔を突破。",

    description:
      "東京スカイツリーの高さは634mです。東京タワーのおよそ1.9倍。豆の木がこの地点まで育てば、地上の巨大建造物を次々に超えていきます。"
  },


  {
    height: 828,

    name: "ブルジュ・ハリファ",

    icon: "🏙️",

    category: "BUILDING",

    shortDescription:
      "超高層建築物の領域です。",

    description:
      "ドバイのブルジュ・ハリファは828m。世界でも特に高い超高層建築物として知られています。"
  },


  {
    height: 1000,

    name: "1キロメートル",

    icon: "☁️",

    category: "SKY",

    shortDescription:
      "ついに高さ1kmに到達。",

    description:
      "1,000mは1kmです。人間が地表から見上げる尺度から、空そのものを意識する高さへ入ります。"
  },


  {
    height: 3776,

    name: "富士山",

    icon: "🗻",

    category: "MOUNTAIN",

    shortDescription:
      "日本最高峰の高さを突破。",

    description:
      "富士山の標高は3,776mです。豆の木の先端が富士山頂と同じ高度まで到達したことになります。"
  },


  {
    height: 8849,

    name: "エベレスト",

    icon: "🏔️",

    category: "MOUNTAIN",

    shortDescription:
      "地球最高峰級の高さです。",

    description:
      "エベレストの標高は約8,849mです。地球上の山として最高地点にあたる領域です。"
  },


  {
    height: 10000,

    name: "旅客機の巡航高度",

    icon: "✈️",

    category: "AVIATION",

    shortDescription:
      "旅客機が飛ぶ高さに到達。",

    description:
      "大型旅客機は一般に高度約10km前後を巡航します。豆の木の先端が、飛行機が飛び交う空まで伸びています。"
  },


  {
    height: 12000,

    name: "成層圏の入口付近",

    icon: "🌤️",

    category: "ATMOSPHERE",

    shortDescription:
      "大気のさらに上層へ進みます。",

    description:
      "対流圏界面の高度は緯度や季節によって変化しますが、おおむね10〜17km付近です。12kmは成層圏に近づく領域として設定しています。"
  },


  {
    height: 20000,

    name: "成層圏",

    icon: "☀️",

    category: "ATMOSPHERE",

    shortDescription:
      "通常の人間生活から大きく離れた高度です。",

    description:
      "高度20kmでは空気は非常に薄く、一般的な旅客機の巡航高度を大きく超えています。"
  },


  {
    height: 50000,

    name: "成層圏上部",

    icon: "🌌",

    category: "ATMOSPHERE",

    shortDescription:
      "宇宙が近づいてきました。",

    description:
      "高度約50kmは成層圏の上端付近です。その上には中間圏が広がっています。"
  },


  {
    height: 100000,

    name: "宇宙の入口",

    icon: "🚀",

    category: "SPACE",

    shortDescription:
      "カーマン・ライン、100kmに到達。",

    description:
      "高度100kmはカーマン・ラインと呼ばれ、宇宙空間の境界として広く用いられる目安です。ここから先は本格的に宇宙の世界です。"
  },


  {
    height: 400000,

    name: "ISS軌道級",

    icon: "🛰️",

    category: "SPACE",

    shortDescription:
      "国際宇宙ステーション級の高度です。",

    description:
      "国際宇宙ステーションは高度およそ400km前後を周回しています。軌道高度は時間とともに変化するため、ゲームでは400kmを目安とします。"
  },


  {
    height: 35786000,

    name: "静止軌道",

    icon: "📡",

    category: "ORBIT",

    shortDescription:
      "静止衛星が使う軌道高度です。",

    description:
      "赤道上空約35,786kmには静止軌道があります。この軌道を地球の自転方向に周回する衛星は、地上からほぼ同じ場所に見えます。"
  },


  {
    height: 384400000,

    name: "月",

    icon: "🌕",

    category: "MOON",

    shortDescription:
      "地球から月までの平均距離級です。",

    description:
      "地球と月の平均距離は約38万4,400kmです。ここまで到達すれば、豆の木は地球から月へ届く規模になります。"
  }

];


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

    version: "2.0",

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
   保存データ読み込み
========================================================= */

function loadData() {

  const savedData =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!savedData) {

    return createInitialData();

  }


  try {

    const parsed =
      JSON.parse(savedData);

    return mergeWithInitialData(
      parsed
    );

  } catch (error) {

    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );


    return createInitialData();

  }

}


/* =========================================================
   データ互換
========================================================= */

function mergeWithInitialData(
  savedData
) {

  const initial =
    createInitialData();


  const merged = {

    ...initial,

    ...savedData,

    version:
      "2.0",

    habits: {
      ...initial.habits
    }

  };


  Object.keys(
    HABITS
  ).forEach(
    (habitId) => {

      merged.habits[
        habitId
      ] = {

        ...initial.habits[
          habitId
        ],

        ...(
          savedData.habits?.[
            habitId
          ] || {}
        )

      };

    }
  );


  return merged;

}


/* =========================================================
   保存
========================================================= */

function saveData() {

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(
      appData
    )

  );

}


/* =========================================================
   日付
========================================================= */

function getTodayKey() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


function getTodayDisplay() {

  const now =
    new Date();


  return new Intl.DateTimeFormat(

    "ja-JP",

    {

      year:
        "numeric",

      month:
        "long",

      day:
        "numeric",

      weekday:
        "short"

    }

  ).format(
    now
  );

}


/* =========================================================
   状態
========================================================= */

let appData =
  loadData();


let currentHabitId =
  null;


let pendingAction =
  null;


let selectedMilestone =
  null;


/* =========================================================
   DOM
========================================================= */

const homeScreen =
  document.getElementById(
    "homeScreen"
  );


const gameScreen =
  document.getElementById(
    "gameScreen"
  );


const habitList =
  document.getElementById(
    "habitList"
  );


const backButton =
  document.getElementById(
    "backButton"
  );


const gameIcon =
  document.getElementById(
    "gameIcon"
  );


const gameEnglishName =
  document.getElementById(
    "gameEnglishName"
  );


const gameTitle =
  document.getElementById(
    "gameTitle"
  );


const currentHeight =
  document.getElementById(
    "currentHeight"
  );


const treeStem =
  document.getElementById(
    "treeStem"
  );


const growthMessage =
  document.getElementById(
    "growthMessage"
  );


const todayDate =
  document.getElementById(
    "todayDate"
  );


const todayPending =
  document.getElementById(
    "todayPending"
  );


const todayCompleted =
  document.getElementById(
    "todayCompleted"
  );


const successButton =
  document.getElementById(
    "successButton"
  );


const failButton =
  document.getElementById(
    "failButton"
  );


const failButtonDescription =
  document.getElementById(
    "failButtonDescription"
  );


const undoButton =
  document.getElementById(
    "undoButton"
  );


const todayResultIcon =
  document.getElementById(
    "todayResultIcon"
  );


const todayResultTitle =
  document.getElementById(
    "todayResultTitle"
  );


const todayResultDescription =
  document.getElementById(
    "todayResultDescription"
  );


const currentStreak =
  document.getElementById(
    "currentStreak"
  );


const totalSuccess =
  document.getElementById(
    "totalSuccess"
  );


const consecutiveFailures =
  document.getElementById(
    "consecutiveFailures"
  );


const nextFailureResult =
  document.getElementById(
    "nextFailureResult"
  );


const riskDescription =
  document.getElementById(
    "riskDescription"
  );


const toast =
  document.getElementById(
    "toast"
  );


const modalOverlay =
  document.getElementById(
    "modalOverlay"
  );


const modalIcon =
  document.getElementById(
    "modalIcon"
  );


const modalTitle =
  document.getElementById(
    "modalTitle"
  );


const modalDescription =
  document.getElementById(
    "modalDescription"
  );


const modalCancelButton =
  document.getElementById(
    "modalCancelButton"
  );


const modalConfirmButton =
  document.getElementById(
    "modalConfirmButton"
  );


/* =========================================================
   VERSION 2 DOM
========================================================= */

const currentMilestoneIcon =
  document.getElementById(
    "currentMilestoneIcon"
  );


const currentMilestoneName =
  document.getElementById(
    "currentMilestoneName"
  );


const currentMilestoneHeight =
  document.getElementById(
    "currentMilestoneHeight"
  );


const currentMilestoneDescription =
  document.getElementById(
    "currentMilestoneDescription"
  );


const currentMilestoneDetailButton =
  document.getElementById(
    "currentMilestoneDetailButton"
  );


const nextMilestoneCard =
  document.getElementById(
    "nextMilestoneCard"
  );


const nextMilestoneIcon =
  document.getElementById(
    "nextMilestoneIcon"
  );


const nextMilestoneName =
  document.getElementById(
    "nextMilestoneName"
  );


const nextMilestoneHeight =
  document.getElementById(
    "nextMilestoneHeight"
  );


const distanceToNext =
  document.getElementById(
    "distanceToNext"
  );


const milestoneProgressBar =
  document.getElementById(
    "milestoneProgressBar"
  );


const progressText =
  document.getElementById(
    "progressText"
  );


const nextMilestoneDetailButton =
  document.getElementById(
    "nextMilestoneDetailButton"
  );


const achievementCount =
  document.getElementById(
    "achievementCount"
  );


const achievementList =
  document.getElementById(
    "achievementList"
  );


const milestoneModalOverlay =
  document.getElementById(
    "milestoneModalOverlay"
  );


const milestoneModalIcon =
  document.getElementById(
    "milestoneModalIcon"
  );


const milestoneModalCategory =
  document.getElementById(
    "milestoneModalCategory"
  );


const milestoneModalName =
  document.getElementById(
    "milestoneModalName"
  );


const milestoneModalHeight =
  document.getElementById(
    "milestoneModalHeight"
  );


const milestoneModalDescription =
  document.getElementById(
    "milestoneModalDescription"
  );


const milestoneModalClose =
  document.getElementById(
    "milestoneModalClose"
  );


/* =========================================================
   ホーム
========================================================= */

function renderHome() {

  habitList.innerHTML =
    "";


  Object.values(
    HABITS
  ).forEach(
    (habit) => {

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


      let todayText =
        "今日は未記録";


      if (
        data.lastActionDate ===
        getTodayKey()
      ) {

        if (
          data.lastActionType ===
          "success"
        ) {

          todayText =
            "今日は成功済み";

        }


        if (
          data.lastActionType ===
          "failure"
        ) {

          todayText =
            "今日は失敗を記録";

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

            連続 ${data.currentStreak}日
            ・
            ${todayText}

          </span>

        </span>


        <span class="habit-height">

          ${formatNumber(
            data.height
          )}m

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
   個別画面
========================================================= */

function openHabit(
  habitId
) {

  currentHabitId =
    habitId;


  homeScreen.classList.remove(
    "active"
  );


  gameScreen.classList.add(
    "active"
  );


  window.scrollTo({

    top: 0,

    behavior:
      "instant"

  });


  renderGame();

}


/* =========================================================
   戻る
========================================================= */

function goHome() {

  currentHabitId =
    null;


  gameScreen.classList.remove(
    "active"
  );


  homeScreen.classList.add(
    "active"
  );


  renderHome();


  window.scrollTo({

    top: 0,

    behavior:
      "instant"

  });

}


/* =========================================================
   ゲーム画面
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
    appData.habits[
      currentHabitId
    ];


  gameIcon.textContent =
    habit.icon;


  gameEnglishName.textContent =
    habit.englishName;


  gameTitle.textContent =
    habit.name;


  currentHeight.textContent =
    formatNumber(
      data.height
    );


  currentStreak.textContent =
    formatNumber(
      data.currentStreak
    );


  totalSuccess.textContent =
    formatNumber(
      data.totalSuccess
    );


  consecutiveFailures.textContent =
    data.consecutiveFailures;


  todayDate.textContent =
    getTodayDisplay();


  renderTree(
    data.height
  );


  renderGrowthMessage(
    data.height
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
   木の表示
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


  treeStem.style.height =
    `${visualHeight}px`;

}


/* =========================================================
   高さメッセージ
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

    growthMessage.textContent =
      "月まで到達。豆の木は地球を大きく離れました。";

    return;

  }


  if (
    height === 0
  ) {

    growthMessage.textContent =
      "地表からスタート。最初の1mを目指そう。";

    return;

  }


  growthMessage.textContent =
    `${current.name}を突破。次は${next.name}。`;

}


/* =========================================================
   VERSION 2
   現在の到達地点
========================================================= */

function findCurrentMilestone(
  height
) {

  let current =
    MILESTONES[0];


  for (
    const milestone
    of MILESTONES
  ) {

    if (
      height >=
      milestone.height
    ) {

      current =
        milestone;

    } else {

      break;

    }

  }


  return current;

}


/* =========================================================
   次の目標
========================================================= */

function findNextMilestone(
  height
) {

  return (
    MILESTONES.find(
      milestone =>
        milestone.height >
        height
    )
    ||
    null
  );

}


/* =========================================================
   マイルストーン表示
========================================================= */

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


  currentMilestoneIcon.textContent =
    current.icon;


  currentMilestoneName.textContent =
    current.name;


  currentMilestoneHeight.textContent =
    formatHeight(
      current.height
    );


  currentMilestoneDescription.textContent =
    current.shortDescription;


  currentMilestoneDetailButton.onclick =
    () =>
      openMilestoneModal(
        current
      );


  if (!next) {

    nextMilestoneCard.classList.add(
      "hidden"
    );

  } else {

    nextMilestoneCard.classList.remove(
      "hidden"
    );


    nextMilestoneIcon.textContent =
      next.icon;


    nextMilestoneName.textContent =
      next.name;


    nextMilestoneHeight.textContent =
      formatHeight(
        next.height
      );


    const distance =
      next.height -
      height;


    distanceToNext.textContent =
      formatHeight(
        distance
      );


    const previousHeight =
      current.height;


    const interval =
      next.height -
      previousHeight;


    let progress =
      0;


    if (
      interval > 0
    ) {

      progress =

        (
          (
            height -
            previousHeight
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


    milestoneProgressBar.style.width =
      `${progress}%`;


    progressText.textContent =
      `${current.name}から${next.name}まで ${progress.toFixed(1)}%`;


    nextMilestoneDetailButton.onclick =
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
   到達済み一覧
========================================================= */

function renderAchievements(
  height
) {

  const reached =
    MILESTONES.filter(
      milestone =>
        milestone.height > 0 &&
        milestone.height <=
        height
    );


  achievementCount.textContent =
    reached.length;


  achievementList.innerHTML =
    "";


  if (
    reached.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "achievement-item";


    empty.innerHTML = `

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


    achievementList.appendChild(
      empty
    );


    return;

  }


  reached
    .slice()
    .reverse()
    .forEach(
      milestone => {

        const item =
          document.createElement(
            "button"
          );


        item.type =
          "button";


        item.className =
          "achievement-item";


        item.innerHTML = `

          <span class="achievement-icon">

            ${milestone.icon}

          </span>

          <span class="achievement-name">

            ${milestone.name}

          </span>

          <span class="achievement-height">

            ${formatHeight(
              milestone.height
            )}

          </span>

        `;


        item.addEventListener(

          "click",

          () =>
            openMilestoneModal(
              milestone
            )

        );


        achievementList.appendChild(
          item
        );

      }
    );

}


/* =========================================================
   マイルストーン詳細
========================================================= */

function openMilestoneModal(
  milestone
) {

  selectedMilestone =
    milestone;


  milestoneModalIcon.textContent =
    milestone.icon;


  milestoneModalCategory.textContent =
    milestone.category;


  milestoneModalName.textContent =
    milestone.name;


  milestoneModalHeight.textContent =
    formatHeight(
      milestone.height
    );


  milestoneModalDescription.textContent =
    milestone.description;


  milestoneModalOverlay.classList.remove(
    "hidden"
  );

}


/* =========================================================
   マイルストーンを閉じる
========================================================= */

function closeMilestoneModal() {

  milestoneModalOverlay.classList.add(
    "hidden"
  );


  selectedMilestone =
    null;

}


/* =========================================================
   今日の状態
========================================================= */

function renderTodayStatus(
  data
) {

  const today =
    getTodayKey();


  if (
    data.lastActionDate !==
    today
  ) {

    todayPending.classList.remove(
      "hidden"
    );


    todayCompleted.classList.add(
      "hidden"
    );


    updateFailureButton(
      data
    );


    return;

  }


  todayPending.classList.add(
    "hidden"
  );


  todayCompleted.classList.remove(
    "hidden"
  );


  if (
    data.lastActionType ===
    "success"
  ) {

    todayResultIcon.textContent =
      "✓";


    todayResultIcon.style.background =
      "var(--green-pale)";


    todayResultIcon.style.color =
      "var(--green-dark)";


    todayResultTitle.textContent =
      "今日も継続成功";


    todayResultDescription.textContent =
      `豆の木が1m成長し、${formatHeight(data.height)}になりました。`;

  }


  if (
    data.lastActionType ===
    "failure"
  ) {

    todayResultIcon.textContent =
      "↘";


    todayResultIcon.style.background =
      "var(--red-light)";


    todayResultIcon.style.color =
      "var(--red)";


    todayResultTitle.textContent =
      "失敗を記録しました";


    todayResultDescription.textContent =
      `現在の高さは${formatHeight(data.height)}です。明日の成功で連続失敗を止められます。`;

  }

}


/* =========================================================
   失敗ボタン
========================================================= */

function updateFailureButton(
  data
) {

  const nextFailureNumber =
    data.consecutiveFailures
    +
    1;


  if (
    nextFailureNumber ===
    1
  ) {

    failButtonDescription.textContent =
      "現在の高さの1/5を失う";

  } else if (
    nextFailureNumber ===
    2
  ) {

    failButtonDescription.textContent =
      "現在の高さが半分になる";

  } else {

    failButtonDescription.textContent =
      "豆の木が0mに戻る";

  }

}


/* =========================================================
   成功
========================================================= */

function recordSuccess() {

  const data =
    appData.habits[
      currentHabitId
    ];


  if (
    data.lastActionDate ===
    getTodayKey()
  ) {

    showToast(
      "今日はすでに記録されています。"
    );

    return;

  }


  const beforeHeight =
    data.height;


  const oldNext =
    findNextMilestone(
      beforeHeight
    );


  const snapshot =
    createSnapshot(
      data
    );


  data.height += 1;


  data.currentStreak += 1;


  data.totalSuccess += 1;


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


  if (
    oldNext &&
    data.height >=
    oldNext.height
  ) {

    showToast(
      `🎉 ${oldNext.name}に到達！`
    );

  } else {

    showToast(
      "🌱 成功！ 豆の木が1m成長しました。"
    );

  }

}


/* =========================================================
   失敗確認
========================================================= */

function requestFailure() {

  const data =
    appData.habits[
      currentHabitId
    ];


  if (
    data.lastActionDate ===
    getTodayKey()
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


  pendingAction =
    "failure";


  modalIcon.textContent =
    "⚠️";


  modalTitle.textContent =
    "失敗を記録しますか？";


  modalDescription.textContent =
    `${formatHeight(data.height)} → ${formatHeight(prediction.newHeight)}になります。`;


  modalConfirmButton.textContent =
    "失敗を記録";


  modalConfirmButton.style.background =
    "var(--red)";


  openModal();

}


/* =========================================================
   失敗
========================================================= */

function recordFailure() {

  const data =
    appData.habits[
      currentHabitId
    ];


  if (
    data.lastActionDate ===
    getTodayKey()
  ) {

    closeModal();


    showToast(
      "今日はすでに記録されています。"
    );


    return;

  }


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

      data.consecutiveFailures
      +
      1

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
   失敗計算
========================================================= */

function calculateFailureResult(
  height,
  currentFailures
) {

  const failureNumber =
    currentFailures
    +
    1;


  if (
    failureNumber ===
    1
  ) {

    const loss =
      Math.floor(
        height / 5
      );


    const newHeight =

      Math.max(

        0,

        height - loss

      );


    return {

      newHeight,

      loss,

      message:
        `1回目の失敗。${formatHeight(loss)}失いました。`

    };

  }


  if (
    failureNumber ===
    2
  ) {

    const newHeight =
      Math.floor(
        height / 2
      );


    const loss =
      height -
      newHeight;


    return {

      newHeight,

      loss,

      message:
        "2回連続失敗。高さが半分になりました。"

    };

  }


  return {

    newHeight:
      0,

    loss:
      height,

    message:
      "3回連続失敗。豆の木は0mに戻りました。"

  };

}


/* =========================================================
   次回リスク
========================================================= */

function renderFailureRisk(
  data
) {

  const result =
    calculateFailureResult(

      data.height,

      data.consecutiveFailures

    );


  nextFailureResult.textContent =
    `${formatHeight(data.height)} → ${formatHeight(result.newHeight)}`;


  const nextFailureNumber =
    data.consecutiveFailures
    +
    1;


  if (
    nextFailureNumber ===
    1
  ) {

    riskDescription.textContent =
      `現在の高さの1/5（${formatHeight(result.loss)}）が削られます。1/5の端数は切り捨てです。`;


    return;

  }


  if (
    nextFailureNumber ===
    2
  ) {

    riskDescription.textContent =
      "連続2回目の失敗となり、残っている高さが半分になります。";


    return;

  }


  riskDescription.textContent =
    "連続3回目の失敗となり、豆の木は地表の0mまで戻ります。";

}


/* =========================================================
   取り消し確認
========================================================= */

function requestUndo() {

  const data =
    appData.habits[
      currentHabitId
    ];


  if (
    data.lastActionDate !==
    getTodayKey()
  ) {

    return;

  }


  pendingAction =
    "undo";


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
   取り消し
========================================================= */

function undoTodayAction() {

  const data =
    appData.habits[
      currentHabitId
    ];


  if (
    data.lastActionDate !==
    getTodayKey()
  ) {

    closeModal();

    return;

  }


  const lastHistoryIndex =
    findTodayHistoryIndex(
      data
    );


  if (
    lastHistoryIndex ===
    -1
  ) {

    closeModal();


    showToast(
      "取り消せる記録がありません。"
    );


    return;

  }


  const record =
    data.history[
      lastHistoryIndex
    ];


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
   今日の履歴
========================================================= */

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
   Snapshot
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


/* =========================================================
   数字
========================================================= */

function formatNumber(
  number
) {

  return Number(
    number
  ).toLocaleString(
    "ja-JP"
  );

}


/* =========================================================
   高さ表記
========================================================= */

function formatHeight(
  meters
) {

  if (
    meters <
    1000
  ) {

    return (
      `${formatNumber(meters)}m`
    );

  }


  if (
    meters <
    1000000
  ) {

    const km =
      meters / 1000;


    if (
      Number.isInteger(
        km
      )
    ) {

      return (
        `${formatNumber(km)}km`
      );

    }


    return (
      `${km.toLocaleString(
        "ja-JP",
        {
          maximumFractionDigits:
            3
        }
      )}km`
    );

  }


  const km =
    Math.round(
      meters / 1000
    );


  return (
    `${formatNumber(km)}km`
  );

}


/* =========================================================
   Toast
========================================================= */

let toastTimer =
  null;


function showToast(
  message
) {

  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


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

        toast.classList.remove(
          "show"
        );

      },

      2600

    );

}


/* =========================================================
   Confirmation modal
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


  pendingAction =
    null;

}


/* =========================================================
   Events
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
      pendingAction ===
      "failure"
    ) {

      recordFailure();

      return;

    }


    if (
      pendingAction ===
      "undo"
    ) {

      undoTodayAction();

    }

  }

);


modalOverlay.addEventListener(

  "click",

  event => {

    if (
      event.target ===
      modalOverlay
    ) {

      closeModal();

    }

  }

);


milestoneModalClose.addEventListener(

  "click",

  closeMilestoneModal

);


milestoneModalOverlay.addEventListener(

  "click",

  event => {

    if (
      event.target ===
      milestoneModalOverlay
    ) {

      closeMilestoneModal();

    }

  }

);


/* =========================================================
   起動
========================================================= */

renderHome();