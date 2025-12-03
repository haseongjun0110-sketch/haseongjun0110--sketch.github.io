var textDisplayTimer = null;

var state = {
  currentSceneId: "start",
  player: {
    name: "",
    stats: {
      agi: 3,
      wis: 3,
      vit: 3
    },
    failures: 0
  },
  flags: {},
  runActive: false,
  isDead: false,
  settings: {
    textSpeed: "normal",
    qteDifficulty: "normal",
    mute: false,
    fontSize: "normal"
  },
  currentQTE: {
    sceneId: null,
    type: null,
    timeLimit: 0,
    startedAt: 0,
    timerId: null,
    targetDir: null,
    mashKey: "z",
    mashTarget: 0,
    mashCount: 0,
    overlayId: null,
    targetCount: 1,
    currentCount: 0,
    successNext: null,
    failNext: null,
    deathNext: null,
    woundedNext: null,
    directions: null
  }
};

var SCENES = [

/* ───────────────────────────────
   START / INTRO / CHAR CREATE
─────────────────────────────── */

{
  id: "start",
  type: "start",
  text: "Shadow Forest Adventure",
  image: null,
  choices: []
},

{
  id: "intro_scene",
  type: "scene",
  text: "당신은 어둠이 내려앉은 깊은 그림자 숲으로 향하려 한다. 그 여정에서 당신의 선택과 행동이 운명을 바꾼다.",
  image: null,
  choices: [
    { label:"시작한다", next:"mountain_path_start" }
  ]
},

{
  id: "char_create",
  type: "charCreate",
  text: "당신의 정보를 입력해주세요. 각 스탯은 게임의 난이도와 선택지에 영향을 미칩니다.",
  image: null,
  choices: []
},

/* ───────────────────────────────
   본 스토리 시작 — 산길 초입
─────────────────────────────── */

{
  id: "mountain_path_start",
  type: "scene",
  text: "깊은 안개가 깔린 산길. 그림자에 잠식된 생명체들이 어슬렁거린다는 소문이 도는 길목이다.\n당신 곁엔 병색이 완연한 기사, 세릴이 비틀비틀 서 있다.",
  image: null,
  choices: [
    { label: "세릴을 부축하며 전진한다", next: "ceryl_condition" },
    { label: "그의 상태를 묻는다", next: "ceryl_talk_1" }
  ]
},

{
  id: "ceryl_talk_1",
  type: "scene",
  text: "세릴은 숨을 거칠게 내쉰다.\n“그림자가 내 피에 스며들었다… 하지만 아직, 난… 사람이다.”",
  image: null,
  choices: [
    { label: "계속 걷자고 한다", next: "ceryl_condition" },
    { label: "여기서 쉬자고 한다", next: "rest_choice" }
  ]
},

{
  id: "ceryl_condition",
  type: "scene",
  text: "세릴은 힘겹게 걸음을 옮긴다. 그림자가 그의 혈관에서 서서히 꿈틀거리는 것이 보였다.",
  image: null,
  choices: [
    { label: "조심히 상태를 살핀다", next: "rest_choice" },
    { label: "서둘러 계속 간다", next: "mael_meet", setFlags:{ rushed:true } }
  ]
},

{
  id: "rest_choice",
  type: "scene",
  text: "잠시 쉬어가면 세릴의 몸을 살필 수 있다. 그러나 지체하면 그림자가 더 퍼질 위험도 있다.",
  image: null,
  choices: [
    { label: "그대로 쉬게 한다", next: "rest_qte", requires:{ stats:[{key:"wis", min:4}] } },
    { label: "강행군을 선택한다", next: "rush_result", setFlags:{ rushed:true } }
  ]
},

{
  id: "rush_result",
  type: "scene",
  text: "당신은 쉬지 않고 앞으로 나아가기 시작했다. 세릴은 헐떡이며 따라온다.",
  image: null,
  choices: [
    { label: "계속한다", next:"mael_meet" }
  ]
},

/* ───────────────────────────────
   휴식 QTE
─────────────────────────────── */

{
  id: "rest_qte",
  type: "qte",
  text: "세릴이 갑자기 경련을 일으킨다. 그림자가 혈관을 타고 빠르게 번지고 있다.\n진정시키기 위해 정확한 지점을 눌러야 한다. 방향키로 지시된 위치를 눌러라.",
  image: null,
  qte: {
    qteType: "direction",
    directions: ["up","right","left"],
    targetCount: 2,
    baseTimeLimit: 2000,
    successNext: "rest_success",
    failNext: "rest_fail",
    woundedNext: "rest_fail",
    deathNext: "ceryl_death"
  }
},

{
  id: "rest_success",
  type: "scene",
  text: "세릴의 호흡이 안정된다.\n“…고맙다. 덕분에 아직은 괜찮아.”",
  image: null,
  choices: [
    { label: "다시 길을 나선다", next: "mael_meet" }
  ]
},

{
  id: "rest_fail",
  type: "scene",
  text: "손짓을 잘못했다. 세릴의 몸 속 그림자가 폭주한다.\n세릴의 눈이 검게 물든다.",
  image: null,
  choices: [
    { label: "도망친다", next: "ceryl_mutation_qte", setFlags:{ saw_corruption:true } },
    { label: "싸운다", next: "ceryl_mutation_battle", requires:{ stats:[{key:"agi", min:4}]} }
  ]
},

/* ───────────────────────────────
   세릴 변이 QTE
─────────────────────────────── */

{
  id: "ceryl_mutation_qte",
  type: "qte",
  text: "폭주한 세릴이 칼을 휘두르며 다가온다. Z키를 연타해 필사적으로 도망쳐라!",
  image: null,
  qte:{
    qteType:"mash",
    key:"z",
    baseTarget:12,
    baseTimeLimit:2500,
    successNext:"escape_success",
    failNext:"escape_fail",
    woundedNext:"escape_fail",
    deathNext:"death_by_ceryl"
  }
},

{
  id: "escape_success",
  type: "scene",
  text: "당신은 가까스로 칼날을 피해 안개 속으로 달아났다.",
  image: null,
  choices:[
    { label:"더 깊은 곳으로 도망친다", next:"mael_meet" }
  ]
},

{
  id: "escape_fail",
  type: "scene",
  text: "당신은 넘어진다. 세릴의 칼이 팔을 스쳤다.",
  image: null,
  choices:[
    { label:"비틀거리며 도망친다", next:"mael_meet", setFlags:{ injured:true } }
  ]
},

{
  id: "ceryl_mutation_battle",
  type: "scene",
  text: "당신은 칼을 움켜쥔다.\n“제발… 더 늦기 전에…!”\n이미 그림자에 잠식된 세릴이 울부짖는다.",
  image:null,
  choices:[
    { label:"공격한다", next:"ceryl_battle_qte" }
  ]
},

{
  id: "ceryl_battle_qte",
  type: "qte",
  text: "세릴의 칼날이 번개처럼 움직인다. 방향키로 공격을 피하라!",
  image:null,
  qte:{
    qteType:"direction",
    directions:["left","left","right","up"],
    targetCount:3,
    baseTimeLimit:1800,
    successNext:"ceryl_battle_win",
    failNext:"ceryl_battle_lose",
    woundedNext:"ceryl_battle_lose",
    deathNext:"death_by_ceryl"
  }
},

{
  id: "ceryl_battle_win",
  type: "scene",
  text: "세릴은 마지막 힘으로 미소를 지었다.\n“…부탁한다. 그림자의 근원을… 찾아라…”",
  image:null,
  choices:[
    { label:"눈물을 삼키며 전진한다", next:"mael_meet", setFlags:{ ceryl_dead:true } }
  ]
},

{
  id: "ceryl_battle_lose",
  type: "scene",
  text: "당신은 쓰러지고, 세릴의 칼날이 내려온다.",
  image:null,
  choices:[
    { label:"마지막 순간까지 버틴다", next:"ending_death" }
  ]
},

/* ───────────────────────────────
   마엘 조우
─────────────────────────────── */

{
  id: "mael_meet",
  type:"scene",
  text:"앞길에서 마엘, 그림자를 연구하는 학자가 허겁지겁 책을 껴안고 달려온다.\n“좋은 타이밍이야! 너도 그림자에 쫓기고 있지?”",
  image:null,
  choices:[
    { label:"무슨 일이냐고 묻는다", next:"mael_explain" },
    { label:"세릴의 상태를 말한다", next:"mael_react", requires:{ flags:[{key:"ceryl_dead", value:true}] } }
  ]
},

{
  id: "mael_react",
  type:"scene",
  text:"“…그렇군. 안타깝지만… 그의 죽음이 헛되지 않게 해야 한다.”",
  image:null,
  choices:[
    { label:"계속 듣는다", next:"mael_explain" }
  ]
},

{
  id: "mael_explain",
  type:"scene",
  text:"“그림자는 생명력이 약해졌을 때 스며들어 변이시킨다. 근원은… 깊은 숲의 ‘심장’이다.”",
  image:null,
  choices:[
    { label:"그 심장으로 향한다", next:"entrance_tarona" },
    { label:"세릴을 치료할 방법을 묻는다", next:"mael_cure" }
  ]
},

{
  id:"mael_cure",
  type:"scene",
  text:"“이론상 처음 잠식될 때라면 되돌릴 수 있지만… 지금은 너무 늦었을지도.”",
  image:null,
  choices:[
    { label:"포기하지 않겠다고 말한다", next:"entrance_tarona" },
    { label:"현실을 받아들인다", next:"entrance_tarona", setFlags:{ accepted_reality:true } }
  ]
},

/* ───────────────────────────────
   타로나 조우
─────────────────────────────── */

{
  id:"entrance_tarona",
  type:"scene",
  text:"숲의 입구에서 엘프 사냥꾼 타로나가 활을 겨누고 있다.\n“서라. 너희에게 그림자의 냄새가 난다.”",
  image:null,
  choices:[
    { label:"자신은 감염되지 않았다고 말한다", next:"tarona_trust_try" },
    { label:"무기를 내려놓는다", next:"tarona_negotiate" }
  ]
},

{
  id:"tarona_trust_try",
  type:"scene",
  text:"타로나는 의심스러운 눈빛이지만 흔들린다.",
  image:null,
  choices:[
    { label:"마엘에게 증명하게 한다", next:"tarona_join" },
    { label:"직접 팔을 보여준다", next:"infection_check_qte" }
  ]
},

{
  id:"infection_check_qte",
  type:"qte",
  text:"타로나가 반짝이는 의식을 통해 감염 여부를 판별한다.\n지시되는 방향에 맞춰 에너지를 흘려보내라.",
  image:null,
  qte:{
    qteType:"direction",
    directions:["up","down","right"],
    targetCount:2,
    baseTimeLimit:2000,
    successNext:"tarona_join",
    failNext:"tarona_distrust",
    woundedNext:"tarona_distrust",
    deathNext:"death_shadow_burst"
  }
},

{
  id:"tarona_negotiate",
  type:"scene",
  text:"“무기를 내려놓는다고 네가 안전하다는 증거는 되지 않는다.”",
  image:null,
  choices:[
    { label:"그래도 신뢰를 요구한다", next:"tarona_join", requires:{ stats:[{key:"wis", min:5}] } },
    { label:"지나칠 수 있냐고 묻는다", next:"tarona_distrust" }
  ]
},

{
  id:"tarona_join",
  type:"scene",
  text:"타로나는 활을 내리고 고개를 끄덕인다.\n“좋다. 함께 가지.”",
  image:null,
  choices:[
    { label:"숲 깊숙이 들어간다", next:"gard_meet" }
  ]
},

{
  id:"tarona_distrust",
  type:"scene",
  text:"타로나는 길을 막아선다.\n“그림자에 노출된 자는 지나갈 수 없다.”",
  image:null,
  choices:[
    { label:"억지로 돌파한다", next:"breakthrough_qte" },
    { label:"돌아간다", next:"ending_wander" }
  ]
},

/* ───────────────────────────────
   돌파 QTE
─────────────────────────────── */

{
  id:"breakthrough_qte",
  type:"qte",
  text:"타로나가 활을 당긴다! Z키를 연타해 공격을 돌파하라!",
  image:null,
  qte:{
    qteType:"mash",
    key:"z",
    baseTarget:14,
    baseTimeLimit:2300,
    successNext:"breakthrough_success",
    failNext:"breakthrough_fail",
    woundedNext:"breakthrough_fail",
    deathNext:"death_by_tarona"
  }
},

{
  id:"breakthrough_success",
  type:"scene",
  text:"당신은 타로나를 밀치고 숲 속으로 뛰어들었다.",
  image:null,
  choices:[
    { label:"깊은 숲으로 계속 간다", next:"gard_meet" }
  ]
},

{
  id:"breakthrough_fail",
  type:"scene",
  text:"당신은 화살을 맞고 쓰러진다.",
  image:null,
  choices:[
    { label:"마지막 숨을 쉰다", next:"ending_death" }
  ]
},

/* ───────────────────────────────
   대장장이 가르드 조우
─────────────────────────────── */

{
  id:"gard_meet",
  type:"scene",
  text:"어두운 공터 한복판. 그림자에 잠식된 마을의 대장장이 가르드가 거대한 망치를 든 채 나타난다.\n그러나 그의 눈엔 아직 희미하게 인간의 광채가 남아 있다.",
  image:null,
  choices:[
    { label:"말을 걸어본다", next:"gard_talk_1" },
    { label:"싸울 준비를 한다", next:"gard_battle_qte1" }
  ]
},

{
  id:"gard_talk_1",
  type:"scene",
  text:"“너… 나를… 기억하나…?”\n그의 목소리는 갈라져 있지만 절박했다.",
  image:null,
  choices:[
    { label:"기억난다고 한다", next:"gard_memory" },
    { label:"기억나지 않는다고 솔직히 말한다", next:"gard_anger" }
  ]
},

{
  id:"gard_memory",
  type:"scene",
  text:"당신의 말에 가르드는 미약하게 웃었다.\n“…내 마지막 바람은… 이 숲의 심장을… 부수는 것…”",
  image:null,
  choices:[
    { label:"그의 도움을 받는다", next:"gard_accompany" },
    { label:"혼자 가겠다고 한다", next:"heart_entrance" }
  ]
},

{
  id:"gard_accompany",
  type:"scene",
  text:"가르드는 힘겹게 고개를 끄덕인다.\n“함께… 끝을 내자…”",
  image:null,
  choices:[
    { label:"심장으로 향한다", next:"heart_entrance" }
  ]
},

{
  id:"gard_anger",
  type:"scene",
  text:"그림자가 격렬하게 출렁인다.\n“거짓말… 하지 말아라!”",
  image:null,
  choices:[
    { label:"싸운다", next:"gard_battle_qte1" },
    { label:"도망친다", next:"ending_escape" }
  ]
},

/* ───────────────────────────────
   가르드 전투 QTE
─────────────────────────────── */

{
  id:"gard_battle_qte1",
  type:"qte",
  text:"가르드가 그림자 망치를 휘두른다! 방향키로 피하라!",
  image:null,
  qte:{
    qteType:"direction",
    directions:["left","up","right"],
    targetCount:2,
    baseTimeLimit:2000,
    successNext:"gard_battle_win",
    failNext:"gard_battle_fail",
    woundedNext:"gard_battle_fail",
    deathNext:"death_by_gard"
  }
},

{
  id:"gard_battle_win",
  type:"scene",
  text:"“끝…을… 내줘…”\n가르드가 쓰러진다.",
  image:null,
  choices:[
    { label:"숲의 심장으로 간다", next:"heart_entrance", setFlags:{ gard_defeated:true } }
  ]
},

{
  id:"gard_battle_fail",
  type:"scene",
  text:"당신은 망치의 충격에 쓰러진다.",
  image:null,
  choices:[
    { label:"마지막 숨을 쉰다", next:"ending_death" }
  ]
},

/* ───────────────────────────────
   숲의 심장
─────────────────────────────── */

{
  id:"heart_entrance",
  type:"scene",
  text:"심장처럼 뛰는 거대한 그림자 구체가 숲의 중앙에서 꿈틀거린다.\n그 안엔 아린이, 마엘이, 타로나가, 가르드가 겪었던 모든 운명의 끝이 모여든다.",
  image:null,
  choices:[
    { label:"심장을 파괴한다", next:"heart_destroy_qte" },
    { label:"심장을 이용한다", next:"ending_shadow", requires:{ flags:[{key:"gard_defeated", value:false}] } },
    { label:"세릴을 떠올린다", next:"ending_ceryl_memory", requires:{ flags:[{key:"ceryl_dead", value:true}] } }
  ]
},

{
  id:"heart_destroy_qte",
  type:"qte",
  text:"그림자의 심장이 요동친다!\nZ키를 연타해 심장을 찢어라!",
  image:null,
  qte:{
    qteType:"mash",
    key:"z",
    baseTarget:18,
    baseTimeLimit:2600,
    successNext:"ending_destroy",
    failNext:"heart_destroy_fail",
    woundedNext:"heart_destroy_fail",
    deathNext:"death_by_heart"
  }
},

{
  id:"heart_destroy_fail",
  type:"scene",
  text:"그림자가 당신의 몸을 통째로 삼킨다.",
  image:null,
  choices:[
    { label:"어둠 속에 잠긴다", next:"ending_shadow" }
  ]
},

/* ───────────────────────────────
   엔딩들
─────────────────────────────── */

{
  id:"ending_destroy",
  type:"scene",
  text:"당신은 그림자의 근원을 파괴했다.\n숲은 조금씩 생기를 되찾고, 사라져가던 생명들이 되살아난다.\n당신의 선택으로 이 세계는 다시 살아갈 수 있게 되었다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
},

{
  id:"ending_shadow",
  type:"scene",
  text:"당신은 그림자와 하나가 되었다.\n더는 인간도, 괴물도 아니지만…\n어둠은 당신을 받아들였고, 숲은 당신을 새로운 심장으로 삼았다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
},

{
  id:"ending_ceryl_memory",
  type:"scene",
  text:"당신은 마지막 순간, 세릴의 미소를 떠올린다.\n그의 죽음 앞에서 배운 것은 두려움이 아닌, 인간의 흔들리는 마음이었다.\n당신은 조용히 숲을 떠나 새로운 길을 찾는다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
},

{
  id:"ending_escape",
  type:"scene",
  text:"당신은 숲을 벗어났지만, 마음 한켠에 끝내 이겨내지 못한 그림자의 기운이 남아 있었다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
},

{
  id:"ending_wander",
  type:"scene",
  text:"당신은 숲을 떠나 길을 잃었다. 그림자는 멀어졌지만 목적도 함께 사라졌다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
},

{
  id:"ending_death",
  type:"scene",
  text:"당신의 의지는 강했지만… 그림자의 힘은 그보다 더 거셌다.",
  image:null,
  choices:[
    { label:"처음으로 돌아간다", next:"__RESTART__" }
  ]
}

];

var charCreateStats = {
  agi: 3,
  wis: 3,
  vit: 3,
  points: 6
};

function findScene(id) {
  for (var i = 0; i < SCENES.length; i++) {
    if (SCENES[i].id === id) {
      return SCENES[i];
    }
  }
  return null;
}

function initGame() {
  loadSettings();
  applySettingsUI();
  setupEventListeners();
  renderScene(findScene("start"));
  updatePlayerStatusUI();
}

function setupEventListeners() {
  var startScreen = document.getElementById("start-screen");
  startScreen.addEventListener("click", function() {
    startScreen.classList.add("hidden");
    state.currentSceneId = "char_create";
    loadScene("char_create");
  });

  document.getElementById("btn-settings").addEventListener("click", function() {
    openSettings();
  });

  document.getElementById("btn-settings-close").addEventListener("click", function() {
    closeSettings();
  });

  document.getElementById("btn-setting-save").addEventListener("click", function() {
    saveGame();
  });

  document.getElementById("btn-setting-load").addEventListener("click", function() {
    if (state.isDead) {
      restartGame();
    } else {
      loadGame();
    }
  });

  document.getElementById("btn-setting-restart").addEventListener("click", function() {
    restartGame();
  });

  document.getElementById("setting-text-speed").addEventListener("change", function(e) {
    state.settings.textSpeed = e.target.value;
    saveSettings();
  });

  document.getElementById("setting-font-size").addEventListener("change", function(e) {
    state.settings.fontSize = e.target.value;
    applySettingsUI();
    saveSettings();
  });

  document.getElementById("setting-mute").addEventListener("change", function(e) {
    state.settings.mute = e.target.checked;
    saveSettings();
  });

  document.getElementById("setting-qte-difficulty").addEventListener("change", function(e) {
    state.settings.qteDifficulty = e.target.value;
    saveSettings();
  });

  window.addEventListener("keydown", handleQTEKeydown);
}

function openSettings() {
  var saveBtn = document.getElementById("btn-setting-save");
  var loadBtn = document.getElementById("btn-setting-load");

  if (state.runActive && !state.isDead) {
    saveBtn.disabled = false;
  } else {
    saveBtn.disabled = true;
  }

  var saveData = localStorage.getItem("saveData");
  if (saveData) {
    loadBtn.disabled = false;
  } else {
    loadBtn.disabled = true;
  }

  document.getElementById("settings-overlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("settings-overlay").classList.add("hidden");
}

function loadScene(id) {
  state.currentSceneId = id;
  var scene = findScene(id);
  if (scene) {
    renderScene(scene);
  }
}

function renderScene(scene) {
  if (!scene) return;

  switch (scene.type) {
    case "start":
      renderStartScene(scene);
      break;
    case "charCreate":
      renderCharCreateScene(scene);
      break;
    case "scene":
      // id가 check_death 이거나 deathNext/woundedNext가 있으면 데스 체크용 씬으로 취급
      if (scene.id === "check_death" || scene.deathNext || scene.woundedNext) {
        checkAndHandleDeath(scene);
      } else {
        renderNormalScene(scene);
      }
      break;
    case "qte":
      startQTE(scene);
      break;
    case "death":
      renderDeathScene(scene);
      break;
  }

  updatePlayerStatusUI();
}

function renderStartScene(scene) {
  document.getElementById("scene-image").innerHTML = "";
  document.getElementById("scene-text").textContent = "";
  document.getElementById("scene-choices").innerHTML = "";
}

function renderCharCreateScene(scene) {
  charCreateStats = { agi: 3, wis: 3, vit: 3, points: 6 };

  document.getElementById("scene-image").innerHTML = "";
  displayText(scene.text);

  var choicesDiv = document.getElementById("scene-choices");
  choicesDiv.innerHTML = "";

  var container = document.createElement("div");
  container.className = "char-create-container";

  var nameLabel = document.createElement("label");
  nameLabel.textContent = "이름: ";
  var nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "char-name-input";
  nameInput.placeholder = "이름을 입력하세요";
  nameInput.maxLength = 20;
  nameLabel.appendChild(nameInput);
  container.appendChild(nameLabel);

  var stats = ["agi", "wis", "vit"];
  var statNames = { agi: "민첩", wis: "지혜", vit: "체력" };

  for (var i = 0; i < stats.length; i++) {
    var statKey = stats[i];
    var row = document.createElement("div");
    row.className = "stat-row";

    var nameSpan = document.createElement("span");
    nameSpan.className = "stat-name";
    nameSpan.textContent = statNames[statKey];
    row.appendChild(nameSpan);

    var minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.setAttribute("data-stat", statKey);
    minusBtn.setAttribute("data-action", "minus");
    minusBtn.addEventListener("click", handleStatChange);
    row.appendChild(minusBtn);

    var valueSpan = document.createElement("span");
    valueSpan.className = "stat-value";
    valueSpan.id = "stat-value-" + statKey;
    valueSpan.textContent = charCreateStats[statKey];
    row.appendChild(valueSpan);

    var plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.setAttribute("data-stat", statKey);
    plusBtn.setAttribute("data-action", "plus");
    plusBtn.addEventListener("click", handleStatChange);
    row.appendChild(plusBtn);

    container.appendChild(row);
  }

  var pointsDiv = document.createElement("div");
  pointsDiv.className = "points-remaining";
  pointsDiv.id = "points-remaining";
  pointsDiv.textContent = "남은 포인트: " + charCreateStats.points;
  container.appendChild(pointsDiv);

  var startBtn = document.createElement("button");
  startBtn.className = "start-game-btn";
  startBtn.id = "start-game-btn";
  startBtn.textContent = "시작하기";
  startBtn.disabled = true;
  startBtn.addEventListener("click", function() {
    var name = document.getElementById("char-name-input").value.trim();
    if (name === "") {
      name = "이름없는 모험가";
    }
    state.player.name = name;
    state.player.stats.agi = charCreateStats.agi;
    state.player.stats.wis = charCreateStats.wis;
    state.player.stats.vit = charCreateStats.vit;
    state.player.failures = 0;
    state.runActive = true;
    state.isDead = false;
    loadScene("intro_scene");
  });
  container.appendChild(startBtn);

  choicesDiv.appendChild(container);
  updateCharCreateUI();
}

function handleStatChange(e) {
  var stat = e.target.getAttribute("data-stat");
  var action = e.target.getAttribute("data-action");

  if (action === "plus") {
    if (charCreateStats.points > 0 && charCreateStats[stat] < 10) {
      charCreateStats[stat]++;
      charCreateStats.points--;
    }
  } else if (action === "minus") {
    // 최소 3까지
    if (charCreateStats[stat] > 3) {
      charCreateStats[stat]--;
      charCreateStats.points++;
    }
  }

  updateCharCreateUI();
}

function updateCharCreateUI() {
  var stats = ["agi", "wis", "vit"];
  for (var i = 0; i < stats.length; i++) {
    var valueEl = document.getElementById("stat-value-" + stats[i]);
    if (valueEl) {
      valueEl.textContent = charCreateStats[stats[i]];
    }
  }

  var pointsEl = document.getElementById("points-remaining");
  if (pointsEl) {
    pointsEl.textContent = "남은 포인트: " + charCreateStats.points;
  }

  var startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.disabled = charCreateStats.points !== 0;
  }

  var statRows = document.querySelectorAll(".stat-row");
  for (var j = 0; j < statRows.length; j++) {
    var row = statRows[j];
    var buttons = row.querySelectorAll("button");
    var minusBtn = buttons[0];
    var plusBtn = buttons[1];
    var statKey = minusBtn.getAttribute("data-stat");

    // 3 이하면 마이너스 비활성화
    minusBtn.disabled = charCreateStats[statKey] <= 3;
    plusBtn.disabled = charCreateStats.points <= 0 || charCreateStats[statKey] >= 10;
  }
}

/* ---- 선택지 요구조건 / 플래그 시스템 ---- */

var STAT_DISPLAY_NAMES = { agi: "민첩", wis: "지혜", vit: "체력" };

function evaluateChoiceRequirements(choice) {
  var requires = choice.requires;
  var hasRequirements = false;
  var allMet = true;
  var statInfos = [];

  if (!requires) {
    return { has: false, allMet: true, statInfos: [] };
  }

  // 새 형식: { stats: [...], flags: [...] }
  if (requires.stats || requires.flags) {
    var statsArray = requires.stats || [];
    for (var i = 0; i < statsArray.length; i++) {
      var cond = statsArray[i];
      var key = cond.key;
      var current = state.player.stats[key] || 0;
      var name = STAT_DISPLAY_NAMES[key] || key;

      var min = typeof cond.min === "number" ? cond.min : null;
      var max = typeof cond.max === "number" ? cond.max : null;
      var met = true;
      var text = "";

      if (min !== null && max !== null) {
        text = name + " " + min + "~" + max;
        met = (current >= min && current <= max);
      } else if (min !== null) {
        text = name + " ≥ " + min;
        met = (current >= min);
      } else if (max !== null) {
        text = name + " ≤ " + max;
        met = (current <= max);
      } else {
        continue;
      }

      statInfos.push({ text: text, met: met });
      hasRequirements = true;
      if (!met) allMet = false;
    }

    var flagsArray = requires.flags || [];
    for (var j = 0; j < flagsArray.length; j++) {
      var f = flagsArray[j];
      var fKey = f.key;
      var expected = (typeof f.value === "boolean") ? f.value : true;
      var not = !!f.not;
      var currentFlag = !!state.flags[fKey];

      var flagMet = (!not && currentFlag === expected) || (not && currentFlag !== expected);
      hasRequirements = true;
      if (!flagMet) {
        allMet = false;
      }
    }

  } else {
    // 기존 형식: { wis: 4 } → 스탯 ≥ 값
    for (var statKey in requires) {
      if (!requires.hasOwnProperty(statKey)) continue;
      var value = requires[statKey];
      if (typeof value !== "number") continue;

      var cur = state.player.stats[statKey] || 0;
      var nm = STAT_DISPLAY_NAMES[statKey] || statKey;
      var ok = cur >= value;
      var txt = nm + " ≥ " + value;

      statInfos.push({ text: txt, met: ok });
      hasRequirements = true;
      if (!ok) allMet = false;
    }
  }

  return { has: hasRequirements, allMet: allMet, statInfos: statInfos };
}

function renderNormalScene(scene) {
  if (scene.image) {
    document.getElementById("scene-image").innerHTML = '<img src="' + scene.image + '" alt="씬 이미지">';
  } else {
    document.getElementById("scene-image").innerHTML = "";
  }

  displayText(scene.text);

  var choicesDiv = document.getElementById("scene-choices");
  choicesDiv.innerHTML = "";

  for (var i = 0; i < scene.choices.length; i++) {
    var choice = scene.choices[i];

    var wrapper = document.createElement("div");
    wrapper.className = "choice-row";

    var btn = document.createElement("button");
    btn.textContent = choice.label;

    var reqInfo = evaluateChoiceRequirements(choice);
    btn.disabled = !reqInfo.allMet;

    (function(c) {
      btn.addEventListener("click", function() {
        // 선택 효과로 플래그 설정
        if (c.setFlags) {
          for (var fk in c.setFlags) {
            if (c.setFlags.hasOwnProperty(fk)) {
              state.flags[fk] = c.setFlags[fk];
            }
          }
        }
        handleChoice(c);
      });
    })(choice);

    wrapper.appendChild(btn);

    // 요구 스탯 표시 (있을 때만)
    if (reqInfo.has && reqInfo.statInfos.length > 0) {
      var reqSpan = document.createElement("span");
      reqSpan.className = "choice-requirements";

      var parts = [];
      for (var j = 0; j < reqInfo.statInfos.length; j++) {
        var si = reqInfo.statInfos[j];
        var cls = si.met ? "req-met" : "req-fail";
        parts.push('<span class="' + cls + '">' + si.text + '</span>');
      }
      reqSpan.innerHTML = parts.join(" / ");
      wrapper.appendChild(reqSpan);
    }

    choicesDiv.appendChild(wrapper);
  }
}

function renderDeathScene(scene) {
  state.isDead = true;
  state.runActive = false;

  if (scene.image) {
    document.getElementById("scene-image").innerHTML = '<img src="' + scene.image + '" alt="사망 이미지">';
  } else {
    document.getElementById("scene-image").innerHTML = "";
  }

  displayText(scene.text);

  var choicesDiv = document.getElementById("scene-choices");
  choicesDiv.innerHTML = "";

  var btn = document.createElement("button");
  btn.textContent = "처음으로 돌아가기";
  btn.addEventListener("click", function() {
    restartGame();
  });
  choicesDiv.appendChild(btn);
}

function displayText(text) {
  var textDiv = document.getElementById("scene-text");
  var speed = state.settings.textSpeed;

  if (textDisplayTimer) {
    clearInterval(textDisplayTimer);
    textDisplayTimer = null;
  }

  textDiv.style.fontSize = "";
  
  if (speed === "fast") {
    textDiv.textContent = text;
    adjustTextSize(textDiv);
    return;
  }

  var delay = speed === "slow" ? 50 : 25;
  textDiv.textContent = "";

  var index = 0;
  textDisplayTimer = setInterval(function() {
    if (index < text.length) {
      textDiv.textContent += text.charAt(index);
      index++;
      adjustTextSize(textDiv);
    } else {
      clearInterval(textDisplayTimer);
      textDisplayTimer = null;
    }
  }, delay);
}

function adjustTextSize(element) {
  var baseFontSize = 16;
  if (document.body.classList.contains("font-small")) {
    baseFontSize = 14;
  } else if (document.body.classList.contains("font-large")) {
    baseFontSize = 20;
  }
  
  element.style.fontSize = baseFontSize + "px";
  
  var minFontSize = 10;
  var currentSize = baseFontSize;
  
  while (element.scrollHeight > element.clientHeight && currentSize > minFontSize) {
    currentSize -= 1;
    element.style.fontSize = currentSize + "px";
  }
}

function handleChoice(choice) {
  if (choice.next === "__restart__") {
    restartGame();
    return;
  }

  loadScene(choice.next);
}

function checkAndHandleDeath(scene) {
  var deathNext = (scene && scene.deathNext) || "death_generic";
  var woundedNext = (scene && scene.woundedNext) || "wounded_continue";

  if (state.player.failures > state.player.stats.vit) {
    loadScene(deathNext);
  } else {
    loadScene(woundedNext);
  }
}

function updatePlayerStatusUI() {
  var statusDiv = document.getElementById("player-status");
  if (!state.runActive && !state.isDead) {
    statusDiv.textContent = "이름: ??? | 민첩 ? | 지혜 ? | 체력 ? | 실패 ?/?";
  } else {
    var name = state.player.name || "???";
    statusDiv.textContent = "이름: " + name + 
      " | 민첩 " + state.player.stats.agi + 
      " | 지혜 " + state.player.stats.wis + 
      " | 체력 " + state.player.stats.vit + 
      " | 실패 " + state.player.failures + "/" + state.player.stats.vit;
  }
}

/* ---- QTE ---- */

function startQTE(scene) {
  var qte = scene.qte;
  var difficultyMod = { easy: 1.5, normal: 1, hard: 0.5, difficult: 0.5 };
  var difficulty = state.settings.qteDifficulty;
  if (!difficultyMod[difficulty]) {
    difficulty = "normal";
  }

  var baseLimit = qte.baseTimeLimit;
  var timeLimit = baseLimit;

  if (qte.qteType === "direction") {
    // 방향 QTE: 지혜 1당 1초 추가
    var wis = state.player.stats.wis || 0;
    timeLimit = Math.round(baseLimit * difficultyMod[difficulty] + wis * 1000);
  } else if (qte.qteType === "mash") {
    // 연타 QTE: 시간은 난이도만 영향
    timeLimit = Math.round(baseLimit * difficultyMod[difficulty]);
  }

  var targetCount = qte.targetCount || 1;

  state.currentQTE = {
    sceneId: scene.id,
    type: qte.qteType,
    timeLimit: timeLimit,
    startedAt: Date.now(),
    timerId: null,
    targetDir: null,
    mashKey: qte.key || "z",
    mashTarget: 0,
    mashCount: 0,
    successNext: qte.successNext,
    failNext: qte.failNext,
    overlayId: null,
    targetCount: targetCount,
    currentCount: 0,
    deathNext: qte.deathNext || "death_generic",
    woundedNext: qte.woundedNext || qte.failNext || "wounded_continue",
    directions: null
  };

  document.getElementById("btn-settings").disabled = true;

  if (qte.qteType === "direction") {
    var dirOverlay = document.getElementById("qte-direction-overlay");
    state.currentQTE.overlayId = "qte-direction-overlay";
    dirOverlay.classList.remove("hidden");

    dirOverlay.querySelector(".qte-text").textContent = scene.text;

    var dirs = qte.directions;
    state.currentQTE.directions = dirs;

    var targetDir = dirs[Math.floor(Math.random() * dirs.length)];
    state.currentQTE.targetDir = targetDir;

    var dirButtons = dirOverlay.querySelectorAll(".dir-btn");
    for (var i = 0; i < dirButtons.length; i++) {
      dirButtons[i].classList.remove("active");
      if (dirButtons[i].getAttribute("data-dir") === targetDir) {
        dirButtons[i].classList.add("active");
      }
    }

    for (var j = 0; j < dirButtons.length; j++) {
      (function(btn) {
        btn.onclick = function() {
          var dir = btn.getAttribute("data-dir");
          resolveDirectionQTE(dir);
        };
      })(dirButtons[j]);
    }

    dirOverlay.querySelector(".qte-timer-fill").style.width = "100%";

  } else if (qte.qteType === "mash") {
    var mashOverlay = document.getElementById("qte-mash-overlay");
    state.currentQTE.overlayId = "qte-mash-overlay";
    mashOverlay.classList.remove("hidden");

    mashOverlay.querySelector(".qte-text").textContent = scene.text;

    // 연타 목표: baseTarget - 민첩 (최소 1)
    var agi = state.player.stats.agi || 0;
    var mashTarget = qte.baseTarget - agi;
    if (mashTarget < 1) mashTarget = 1;

    state.currentQTE.mashTarget = mashTarget;
    state.currentQTE.mashCount = 0;

    document.getElementById("qte-mash-target").textContent = mashTarget;
    document.getElementById("qte-mash-count").textContent = "0";
    document.getElementById("qte-mash-button").textContent = qte.key ? qte.key.toUpperCase() : "Z";

    document.getElementById("qte-mash-button").onclick = function() {
      incrementMash();
    };

    mashOverlay.querySelector(".qte-timer-fill").style.width = "100%";
  }

  state.currentQTE.timerId = requestAnimationFrame(function() {
    updateQTETimer();
  });
}

function updateQTETimer() {
  var qte = state.currentQTE;
  if (!qte.sceneId || !qte.overlayId) return;

  var elapsed = Date.now() - qte.startedAt;
  var remaining = Math.max(0, qte.timeLimit - elapsed);
  var ratio = remaining / qte.timeLimit;

  var overlay = document.getElementById(qte.overlayId);
  if (overlay) {
    overlay.querySelector(".qte-timer-fill").style.width = (ratio * 100) + "%";
  }

  if (remaining <= 0) {
    endQTE(false);
  } else {
    qte.timerId = requestAnimationFrame(updateQTETimer);
  }
}

function handleQTEKeydown(e) {
  var qte = state.currentQTE;
  if (!qte.sceneId) return;

  if (qte.type === "direction") {
    var dirMap = {
      "ArrowUp": "up",
      "ArrowDown": "down",
      "ArrowLeft": "left",
      "ArrowRight": "right"
    };
    if (dirMap[e.key]) {
      e.preventDefault();
      resolveDirectionQTE(dirMap[e.key]);
    }
  } else if (qte.type === "mash") {
    if (e.key.toLowerCase() === qte.mashKey.toLowerCase()) {
      e.preventDefault();
      incrementMash();
    }
  }
}

function resolveDirectionQTE(dir) {
  var qte = state.currentQTE;
  if (!qte.sceneId || qte.type !== "direction") return;

  // 틀리면 즉시 실패
  if (dir !== qte.targetDir) {
    endQTE(false);
    return;
  }

  // 맞으면 카운터 증가
  qte.currentCount = (qte.currentCount || 0) + 1;

  if (qte.currentCount >= qte.targetCount) {
    // 목표 횟수 도달 → 최종 성공
    endQTE(true);
    return;
  }

  // 아직 목표 미달 → 다음 라운드
  qte.startedAt = Date.now();

  var dirs = qte.directions || [];
  if (dirs.length === 0) return;

  var nextDir = dirs[Math.floor(Math.random() * dirs.length)];
  qte.targetDir = nextDir;

  var overlay = document.getElementById(qte.overlayId);
  if (!overlay) return;

  var dirButtons = overlay.querySelectorAll(".dir-btn");
  for (var i = 0; i < dirButtons.length; i++) {
    dirButtons[i].classList.remove("active");
    if (dirButtons[i].getAttribute("data-dir") === nextDir) {
      dirButtons[i].classList.add("active");
    }
  }

  overlay.querySelector(".qte-timer-fill").style.width = "100%";
}

function incrementMash() {
  var qte = state.currentQTE;
  if (!qte.sceneId || qte.type !== "mash") return;

  qte.mashCount++;
  document.getElementById("qte-mash-count").textContent = qte.mashCount;

  if (qte.mashCount >= qte.mashTarget) {
    endQTE(true);
  }
}

function endQTE(success) {
  var qte = state.currentQTE;

  if (qte.timerId) {
    cancelAnimationFrame(qte.timerId);
  }

  if (qte.overlayId) {
    document.getElementById(qte.overlayId).classList.add("hidden");
  }
  document.getElementById("btn-settings").disabled = false;

  var successNext = qte.successNext;
  var failNext = qte.failNext;
  var deathNext = qte.deathNext || "death_generic";
  var woundedNext = qte.woundedNext || failNext || "wounded_continue";

  // QTE 상태 초기화
  state.currentQTE = {
    sceneId: null,
    type: null,
    timeLimit: 0,
    startedAt: 0,
    timerId: null,
    targetDir: null,
    mashKey: "z",
    mashTarget: 0,
    mashCount: 0,
    overlayId: null,
    targetCount: 1,
    currentCount: 0,
    successNext: null,
    failNext: null,
    deathNext: null,
    woundedNext: null,
    directions: null
  };

  if (success) {
    loadScene(successNext);
  } else {
    state.player.failures++;
    updatePlayerStatusUI();

    if (state.player.failures > state.player.stats.vit) {
      state.isDead = true;
      loadScene(deathNext);
    } else {
      loadScene(woundedNext);
    }
  }
}

/* ---- 세이브/설정 ---- */

function saveGame() {
  if (!state.runActive || state.isDead) {
    return;
  }

  var saveData = {
    currentSceneId: state.currentSceneId,
    player: JSON.parse(JSON.stringify(state.player)),
    flags: JSON.parse(JSON.stringify(state.flags)),
    runActive: state.runActive
  };

  localStorage.setItem("saveData", JSON.stringify(saveData));
  alert("게임이 저장되었습니다.");
}

function loadGame() {
  var saveDataStr = localStorage.getItem("saveData");
  if (!saveDataStr) {
    return;
  }

  if (state.isDead) {
    restartGame();
    return;
  }

  var saveData = JSON.parse(saveDataStr);

  state.currentSceneId = saveData.currentSceneId;
  state.player = saveData.player;
  state.flags = saveData.flags;
  state.runActive = saveData.runActive;
  state.isDead = false;

  document.getElementById("start-screen").classList.add("hidden");
  closeSettings();
  loadScene(state.currentSceneId);
}

function restartGame() {
  localStorage.removeItem("saveData");

  state.currentSceneId = "start";
  state.player = {
    name: "",
    stats: { agi: 3, wis: 3, vit: 3 },
    failures: 0
  };
  state.flags = {};
  state.runActive = false;
  state.isDead = false;

  state.currentQTE = {
    sceneId: null,
    type: null,
    timeLimit: 0,
    startedAt: 0,
    timerId: null,
    targetDir: null,
    mashKey: "z",
    mashTarget: 0,
    mashCount: 0,
    overlayId: null,
    targetCount: 1,
    currentCount: 0,
    successNext: null,
    failNext: null,
    deathNext: null,
    woundedNext: null,
    directions: null
  };

  document.getElementById("qte-direction-overlay").classList.add("hidden");
  document.getElementById("qte-mash-overlay").classList.add("hidden");
  document.getElementById("btn-settings").disabled = false;

  closeSettings();

  document.getElementById("start-screen").classList.remove("hidden");
  renderScene(findScene("start"));
  updatePlayerStatusUI();
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(state.settings));
}

function loadSettings() {
  var settingsStr = localStorage.getItem("settings");
  if (settingsStr) {
    var savedSettings = JSON.parse(settingsStr);
    state.settings.textSpeed = savedSettings.textSpeed || "normal";
    state.settings.qteDifficulty = savedSettings.qteDifficulty || "normal";
    state.settings.mute = savedSettings.mute || false;
    state.settings.fontSize = savedSettings.fontSize || "normal";
  }
}

function applySettingsUI() {
  document.body.classList.remove("font-small", "font-normal", "font-large");
  document.body.classList.add("font-" + state.settings.fontSize);

  document.getElementById("setting-text-speed").value = state.settings.textSpeed;
  document.getElementById("setting-font-size").value = state.settings.fontSize;
  document.getElementById("setting-mute").checked = state.settings.mute;
  document.getElementById("setting-qte-difficulty").value = state.settings.qteDifficulty;
}

window.onload = initGame;
