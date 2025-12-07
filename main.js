// main.js — 씬 배열 주도 엔진 + 엔트리식 창작 모드

// ──────────────────────
// 전역 상태
// ──────────────────────
var textDisplayTimer = null;
var charCreateStats = null;

// 씬 정의 (브라우저 저장에서 불러옴)
var SCENES = [];

// 게임 상태
var state = {
  currentSceneId: null,
  player: {
    name: "",
    stats: {
      agi: 3,
      wis: 3,
      vit: 3
    },
    failures: 0 // 지금은 안 써도 되고, 필요하면 effects로 조정 가능
  },
  meters: {}, // 부상, 공작, 의심 등 자유 게이지
  flags: {},  // 플래그
  runActive: false,
  settings: {
    textSpeed: "normal",
    qteDifficulty: "normal",
    mute: false,
    fontSize: "normal"
  },
  currentQTE: {
    sceneId: null,
    type: null,          // "direction" | "mash"
    timeLimit: 0,
    endTime: 0,
    timerId: null,
    directions: null,
    targetDir: null,
    targetCount: 0,
    currentCount: 0,
    mashKey: "z",
    mashTarget: 0,
    mashCount: 0,
    overlayId: null,
    successNext: null,
    failNext: null,
    successEffects: null,
    failEffects: null
  }
};

// ──────────────────────
// 로컬스토리지: 씬 / 세이브
// ──────────────────────
var SCENES_KEY = "glassline_scenes";
var SAVE_KEY = "glassline_save";

function loadScenesFromStorage() {
  var raw = localStorage.getItem(SCENES_KEY);
  if (!raw) {
    SCENES = [];
    return;
  }
  try {
    var parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      SCENES = parsed;
    } else {
      SCENES = [];
    }
  } catch (e) {
    console.error("씬 로드 실패:", e);
    SCENES = [];
  }
}

function saveScenesToStorage() {
  try {
    localStorage.setItem(SCENES_KEY, JSON.stringify(SCENES));
  } catch (e) {
    console.error("씬 저장 실패:", e);
  }
}

function saveGame() {
  var data = {
    currentSceneId: state.currentSceneId,
    player: state.player,
    meters: state.meters,
    flags: state.flags,
    runActive: state.runActive,
    settings: state.settings
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("세이브 실패:", e);
  }
}

function loadGameFromStorage() {
  var raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  try {
    var data = JSON.parse(raw);
    state.currentSceneId = data.currentSceneId || null;
    state.player = data.player || state.player;
    state.meters = data.meters || {};
    state.flags = data.flags || {};
    state.runActive = !!data.runActive;
    state.settings = data.settings || state.settings;

    applySettingsToDOM();
    updatePlayerStatusUI();

    if (state.currentSceneId) {
      loadScene(state.currentSceneId);
    }
    return true;
  } catch (e) {
    console.error("로드 실패:", e);
    return false;
  }
}

function restartGame() {
  state.currentSceneId = null;
  state.player = {
    name: "",
    stats: { agi: 3, wis: 3, vit: 3 },
    failures: 0
  };
  state.meters = {};
  state.flags = {};
  state.runActive = false;

  updatePlayerStatusUI();
  clearSceneUI();
  var startScreen = document.getElementById("start-screen");
  if (startScreen) startScreen.classList.remove("hidden");
}

// ──────────────────────
// 유틸: 씬 / 효과 / 조건
// ──────────────────────
function findScene(id) {
  if (!id) return null;
  for (var i = 0; i < SCENES.length; i++) {
    if (SCENES[i].id === id) return SCENES[i];
  }
  return null;
}

function applyEffects(effects) {
  if (!effects) return;

  // stats: delta
  if (effects.stats) {
    for (var s in effects.stats) {
      if (!state.player.stats.hasOwnProperty(s)) {
        state.player.stats[s] = 0;
      }
      state.player.stats[s] += effects.stats[s];
    }
  }

  // setStats: 절대값
  if (effects.setStats) {
    for (var ss in effects.setStats) {
      state.player.stats[ss] = effects.setStats[ss];
    }
  }

  // meters: delta
  if (effects.meters) {
    for (var m in effects.meters) {
      if (!state.meters.hasOwnProperty(m)) {
        state.meters[m] = 0;
      }
      state.meters[m] += effects.meters[m];
    }
  }

  // setMeters: 절대값
  if (effects.setMeters) {
    for (var sm in effects.setMeters) {
      state.meters[sm] = effects.setMeters[sm];
    }
  }

  // flags: 단순 대입
  if (effects.flags) {
    for (var f in effects.flags) {
      state.flags[f] = effects.flags[f];
    }
  }

  // failures delta
  if (typeof effects.failures === "number") {
    state.player.failures += effects.failures;
    if (state.player.failures < 0) state.player.failures = 0;
  }

  updatePlayerStatusUI();
}

function compareNumber(a, op, b) {
  if (op === ">") return a > b;
  if (op === "<") return a < b;
  if (op === ">=") return a >= b;
  if (op === "<=") return a <= b;
  if (op === "==") return a === b;
  if (op === "!=") return a !== b;
  return true;
}

function checkConditions(conditions) {
  if (!conditions || conditions.length === 0) return true;

  for (var i = 0; i < conditions.length; i++) {
    var c = conditions[i];
    if (c.type === "flag") {
      var fv = !!state.flags[c.key];
      var want = (typeof c.value === "undefined") ? true : c.value;
      var ok = (fv === want);
      if (c.not) ok = !ok;
      if (!ok) return false;
    } else if (c.type === "stat") {
      var sv = state.player.stats[c.key] || 0;
      if (!compareNumber(sv, c.op, c.value)) return false;
    } else if (c.type === "meter") {
      var mv = state.meters[c.key] || 0;
      if (!compareNumber(mv, c.op, c.value)) return false;
    }
  }
  return true;
}

// ──────────────────────
// 씬 로딩 / 렌더링
// ──────────────────────
function clearSceneUI() {
  document.getElementById("scene-image").innerHTML = "";
  document.getElementById("scene-text").textContent = "";
  document.getElementById("scene-choices").innerHTML = "";
}

function displayText(text) {
  var textEl = document.getElementById("scene-text");
  if (!textEl) return;

  if (textDisplayTimer) {
    clearInterval(textDisplayTimer);
    textDisplayTimer = null;
  }

  var speedMap = {
    slow: 60,
    normal: 35,
    fast: 15
  };
  var delay = speedMap[state.settings.textSpeed] || 35;

  var i = 0;
  textEl.textContent = "";
  var chars = (text || "").split("");

  textDisplayTimer = setInterval(function () {
    if (i >= chars.length) {
      clearInterval(textDisplayTimer);
      textDisplayTimer = null;
      return;
    }
    textEl.textContent += chars[i];
    i++;
  }, delay);
}

function updatePlayerStatusUI() {
  var el = document.getElementById("player-status");
  if (!el) return;

  var name = state.player.name || "이름 없음";
  var s = state.player.stats;
  var parts = [];
  parts.push(name);
  parts.push("AGI " + s.agi);
  parts.push("WIS " + s.wis);
  parts.push("VIT " + s.vit);

  var meterKeys = Object.keys(state.meters);
  if (meterKeys.length > 0) {
    var ms = meterKeys.map(function (k) {
      return k + ":" + state.meters[k];
    });
    parts.push("[" + ms.join(", ") + "]");
  }

  el.textContent = parts.join(" | ");
}

function loadScene(id) {
  var scene = findScene(id);
  state.currentSceneId = id || null;

  if (!scene) {
    clearSceneUI();
    updatePlayerStatusUI();
    return;
  }

  // 씬 진입 효과
  if (scene.onEnter && scene.onEnter.effects) {
    applyEffects(scene.onEnter.effects);
  }
  // 즉시 점프
  if (scene.onEnter && scene.onEnter.goto) {
    loadScene(scene.onEnter.goto);
    return;
  }

  renderScene(scene);
}

function renderScene(scene) {
  if (!scene) return;

  if (scene.type === "start") {
    clearSceneUI();
    // start-screen이 따로 있으니 여기서는 별도 처리 안 함
  } else if (scene.type === "charCreate") {
    renderCharCreateScene(scene);
  } else if (scene.type === "qte") {
    startQTEScene(scene);
  } else {
    renderNormalScene(scene);
  }
}

// ──────────────────────
// 캐릭터 생성
// ──────────────────────
function renderCharCreateScene(scene) {
  charCreateStats = { agi: 3, wis: 3, vit: 3, points: 6 };

  clearSceneUI();
  displayText(scene.text || "");

  var choicesDiv = document.getElementById("scene-choices");
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

    row.appendChild(document.createElement("br"));
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
  startBtn.addEventListener("click", function () {
    var name = document.getElementById("char-name-input").value.trim();
    if (name === "") {
      name = "이름없는 용병";
    }
    state.player.name = name;
    state.player.stats.agi = charCreateStats.agi;
    state.player.stats.wis = charCreateStats.wis;
    state.player.stats.vit = charCreateStats.vit;
    state.player.failures = 0;
    state.runActive = true;

    updatePlayerStatusUI();

    var nextId = (scene.onStartNext || "intro");
    loadScene(nextId);
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

    minusBtn.disabled = charCreateStats[statKey] <= 3;
    plusBtn.disabled =
      charCreateStats.points <= 0 || charCreateStats[statKey] >= 10;
  }
}

// ──────────────────────
// 일반 씬 렌더링
// ──────────────────────
function renderNormalScene(scene) {
  clearSceneUI();

  if (scene.image) {
    var imgDiv = document.getElementById("scene-image");
    imgDiv.innerHTML = "";
    var img = document.createElement("img");
    img.src = scene.image;
    imgDiv.appendChild(img);
  }

  displayText(scene.text || "");

  var choicesDiv = document.getElementById("scene-choices");
  choicesDiv.innerHTML = "";

  var choices = scene.choices || [];
  if (choices.length === 0) {
    var btn = document.createElement("button");
    btn.textContent = "계속";
    btn.addEventListener("click", function () {});
    choicesDiv.appendChild(btn);
    return;
  }

  for (var i = 0; i < choices.length; i++) {
    (function (choice) {
      if (choice.conditions && !checkConditions(choice.conditions)) {
        return;
      }

      var btn = document.createElement("button");
      btn.textContent = choice.label || "(선택지)";
      btn.addEventListener("click", function () {
        if (choice.effects) {
          applyEffects(choice.effects);
        }

        var nextId = choice.next;
        if (!nextId) return;

        if (nextId === "__restart__") {
          restartGame();
        } else {
          loadScene(nextId);
        }
      });
      choicesDiv.appendChild(btn);
    })(choices[i]);
  }
}

// ──────────────────────
// QTE 처리
// ──────────────────────
function startQTEScene(scene) {
  var cfg = scene.qte || {};
  var type = cfg.qteType;

  var diff = state.settings.qteDifficulty || "normal";
  var timeMul = diff === "easy" ? 1.3 : diff === "hard" ? 0.75 : 1.0;
  var baseTime = cfg.baseTimeLimit || 3000;

  state.currentQTE.sceneId = scene.id;
  state.currentQTE.successNext = cfg.successNext || null;
  state.currentQTE.failNext = cfg.failNext || null;
  state.currentQTE.successEffects = cfg.successEffects || null;
  state.currentQTE.failEffects = cfg.failEffects || null;

  state.currentQTE.timeLimit = Math.floor(baseTime * timeMul);
  state.currentQTE.endTime = Date.now() + state.currentQTE.timeLimit;

  if (state.currentQTE.timerId) {
    clearInterval(state.currentQTE.timerId);
    state.currentQTE.timerId = null;
  }

  if (type === "direction") {
    startDirectionQTE(cfg, scene.text || "");
  } else if (type === "mash") {
    startMashQTE(cfg, scene.text || "");
  }
}

function startDirectionQTE(cfg, text) {
  state.currentQTE.type = "direction";
  state.currentQTE.overlayId = "qte-direction-overlay";
  state.currentQTE.directions = cfg.directions || ["up", "down", "left", "right"];
  state.currentQTE.targetCount = cfg.targetCount || 1;
  state.currentQTE.currentCount = 0;

  var overlay = document.getElementById("qte-direction-overlay");
  var textEl = overlay.querySelector(".qte-text");
  var bar = overlay.querySelector(".qte-timer-fill");
  textEl.textContent = text;
  bar.style.width = "100%";

  overlay.classList.remove("hidden");

  pickNextDirection();

  state.currentQTE.timerId = setInterval(function () {
    updateQTETimer(bar);
  }, 50);

  window.addEventListener("keydown", handleDirectionKeydown);
  var btns = overlay.querySelectorAll(".dir-btn");
  btns.forEach(function (b) {
    b.addEventListener("click", handleDirectionButtonClick);
  });
}

function pickNextDirection() {
  var dirs = state.currentQTE.directions;
  var target = dirs[Math.floor(Math.random() * dirs.length)];
  state.currentQTE.targetDir = target;

  var overlay = document.getElementById("qte-direction-overlay");
  var buttons = overlay.querySelectorAll(".dir-btn");
  buttons.forEach(function (btn) {
    if (btn.getAttribute("data-dir") === target) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function handleDirectionKeydown(e) {
  var dir = null;
  if (e.key === "ArrowUp") dir = "up";
  else if (e.key === "ArrowDown") dir = "down";
  else if (e.key === "ArrowLeft") dir = "left";
  else if (e.key === "ArrowRight") dir = "right";
  if (!dir) return;
  checkDirectionInput(dir);
}

function handleDirectionButtonClick(e) {
  var dir = e.target.getAttribute("data-dir");
  if (!dir) return;
  checkDirectionInput(dir);
}

function checkDirectionInput(dir) {
  if (state.currentQTE.type !== "direction") return;

  if (dir === state.currentQTE.targetDir) {
    state.currentQTE.currentCount++;
    if (state.currentQTE.currentCount >= state.currentQTE.targetCount) {
      finishQTE(true);
    } else {
      pickNextDirection();
    }
  } else {
    finishQTE(false);
  }
}

function startMashQTE(cfg, text) {
  state.currentQTE.type = "mash";
  state.currentQTE.overlayId = "qte-mash-overlay";
  state.currentQTE.mashKey = (cfg.key || "z").toLowerCase();

  var diff = state.settings.qteDifficulty || "normal";
  var mul = diff === "easy" ? 0.8 : diff === "hard" ? 1.2 : 1.0;
  var baseTarget = cfg.baseTarget || 10;

  state.currentQTE.mashTarget = Math.max(1, Math.floor(baseTarget * mul));
  state.currentQTE.mashCount = 0;

  var overlay = document.getElementById("qte-mash-overlay");
  var textEl = overlay.querySelector(".qte-text");
  var bar = overlay.querySelector(".qte-timer-fill");
  var targetEl = document.getElementById("qte-mash-target");
  var countEl = document.getElementById("qte-mash-count");
  var button = document.getElementById("qte-mash-button");

  textEl.textContent = text;
  bar.style.width = "100%";
  targetEl.textContent = state.currentQTE.mashTarget;
  countEl.textContent = "0";

  overlay.classList.remove("hidden");

  state.currentQTE.timerId = setInterval(function () {
    updateQTETimer(bar);
  }, 50);

  window.addEventListener("keydown", handleMashKeydown);
  button.addEventListener("click", handleMashButtonClick);
}

function handleMashKeydown(e) {
  if (state.currentQTE.type !== "mash") return;
  if (e.key.toLowerCase() === state.currentQTE.mashKey) {
    incrementMash();
  }
}

function handleMashButtonClick() {
  if (state.currentQTE.type !== "mash") return;
  incrementMash();
}

function incrementMash() {
  state.currentQTE.mashCount++;
  var countEl = document.getElementById("qte-mash-count");
  if (countEl) countEl.textContent = state.currentQTE.mashCount;

  if (state.currentQTE.mashCount >= state.currentQTE.mashTarget) {
    finishQTE(true);
  }
}

function updateQTETimer(bar) {
  var now = Date.now();
  var remain = state.currentQTE.endTime - now;
  if (remain <= 0) {
    bar.style.width = "0%";
    finishQTE(false);
  } else {
    var ratio = remain / state.currentQTE.timeLimit;
    bar.style.width = Math.max(0, Math.min(1, ratio)) * 100 + "%";
  }
}

function finishQTE(success) {
  var overlayId = state.currentQTE.overlayId;
  var overlay = overlayId ? document.getElementById(overlayId) : null;

  if (state.currentQTE.timerId) {
    clearInterval(state.currentQTE.timerId);
    state.currentQTE.timerId = null;
  }

  if (state.currentQTE.type === "direction") {
    window.removeEventListener("keydown", handleDirectionKeydown);
    if (overlay) {
      var btns = overlay.querySelectorAll(".dir-btn");
      btns.forEach(function (b) {
        b.removeEventListener("click", handleDirectionButtonClick);
      });
    }
  } else if (state.currentQTE.type === "mash") {
    window.removeEventListener("keydown", handleMashKeydown);
    var btn = document.getElementById("qte-mash-button");
    if (btn) {
      btn.removeEventListener("click", handleMashButtonClick);
    }
  }

  if (overlay) overlay.classList.add("hidden");

  var nextId = success ? state.currentQTE.successNext : state.currentQTE.failNext;
  var eff = success ? state.currentQTE.successEffects : state.currentQTE.failEffects;
  state.currentQTE.type = null;

  if (eff) applyEffects(eff);
  if (nextId) {
    if (nextId === "__restart__") {
      restartGame();
    } else {
      loadScene(nextId);
    }
  }
}

// ──────────────────────
// 설정 UI
// ──────────────────────
function applySettingsToDOM() {
  var body = document.body;
  body.classList.remove("font-small", "font-normal", "font-large");
  var sizeClass =
    state.settings.fontSize === "small"
      ? "font-small"
      : state.settings.fontSize === "large"
      ? "font-large"
      : "font-normal";
  body.classList.add(sizeClass);

  var textSel = document.getElementById("setting-text-speed");
  var fontSel = document.getElementById("setting-font-size");
  var muteChk = document.getElementById("setting-mute");
  var qteSel = document.getElementById("setting-qte-difficulty");

  if (textSel) textSel.value = state.settings.textSpeed;
  if (fontSel) fontSel.value = state.settings.fontSize;
  if (muteChk) muteChk.checked = state.settings.mute;
  if (qteSel) qteSel.value = state.settings.qteDifficulty;
}

function openSettings() {
  document.getElementById("settings-overlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("settings-overlay").classList.add("hidden");
}

// ──────────────────────
// 창작 모드 (비번 + 에디터)
// ──────────────────────
var EDITOR_PASSWORD = "3927";
var editorCurrentSceneId = null;

function openEditorPassword() {
  var overlay = document.getElementById("editor-password-overlay");
  var input = document.getElementById("editor-password-input");
  var error = document.getElementById("editor-password-error");
  if (!overlay || !input || !error) return;

  overlay.classList.remove("hidden");
  input.value = "";
  error.textContent = "";
  input.focus();
}

function closeEditorPassword() {
  var overlay = document.getElementById("editor-password-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function tryOpenEditor() {
  var input = document.getElementById("editor-password-input");
  var error = document.getElementById("editor-password-error");
  if (!input || !error) return;
  var val = input.value.trim();
  if (val === EDITOR_PASSWORD) {
    closeEditorPassword();
    openEditor();
  } else {
    error.textContent = "비밀번호가 틀렸습니다.";
  }
}

function openEditor() {
  var overlay = document.getElementById("editor-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");

  refreshEditorSceneSelect();
  loadSceneIntoEditor(null);
  updateEditorQTESection();
}

function closeEditor() {
  var overlay = document.getElementById("editor-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}

// 에디터: 씬 목록 select 채우기
function refreshEditorSceneSelect() {
  var select = document.getElementById("editor-scene-select");
  if (!select) return;
  select.innerHTML = "";

  var optNew = document.createElement("option");
  optNew.value = "";
  optNew.textContent = "(새 씬)";
  select.appendChild(optNew);

  for (var i = 0; i < SCENES.length; i++) {
    var s = SCENES[i];
    var opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.id + " (" + (s.type || "scene") + ")";
    if (s.id === editorCurrentSceneId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }
}

// 에디터: 씬 읽어서 폼에 반영
function loadSceneIntoEditor(id) {
  editorCurrentSceneId = id;

  var idInput = document.getElementById("editor-scene-id");
  var typeSel = document.getElementById("editor-scene-type");
  var imgInput = document.getElementById("editor-scene-image");
  var textArea = document.getElementById("editor-scene-text");

  var onEnterEffectsDiv = document.getElementById("editor-onenter-effects");
  var qteSection = document.getElementById("editor-qte-section");
  var qteTypeSel = document.getElementById("editor-qte-type");
  var qteBaseTime = document.getElementById("editor-qte-base-time");
  var qteTargetCount = document.getElementById("editor-qte-target-count");
  var qteBaseTarget = document.getElementById("editor-qte-base-target");
  var qteKey = document.getElementById("editor-qte-key");
  var qteSuccessNext = document.getElementById("editor-qte-success-next");
  var qteFailNext = document.getElementById("editor-qte-fail-next");
  var qteSuccessEffectsDiv = document.getElementById("editor-qte-success-effects");
  var qteFailEffectsDiv = document.getElementById("editor-qte-fail-effects");

  var choicesContainer = document.getElementById("editor-choices-container");

  // 기본 초기화
  idInput.value = id || "";
  typeSel.value = "scene";
  imgInput.value = "";
  textArea.value = "";
  onEnterEffectsDiv.innerHTML = "";
  qteSuccessEffectsDiv.innerHTML = "";
  qteFailEffectsDiv.innerHTML = "";
  qteBaseTime.value = 3000;
  qteTargetCount.value = 1;
  qteBaseTarget.value = 10;
  qteKey.value = "z";
  qteSuccessNext.value = "";
  qteFailNext.value = "";
  choicesContainer.innerHTML = "";

  var scene = id ? findScene(id) : null;

  if (scene) {
    idInput.value = scene.id || "";
    typeSel.value = scene.type || "scene";
    imgInput.value = scene.image || "";
    textArea.value = scene.text || "";

    // onEnter.effects
    if (scene.onEnter && scene.onEnter.effects) {
      addEffectRow(onEnterEffectsDiv, scene.onEnter.effects);
    }

    // QTE
    if (scene.type === "qte" && scene.qte) {
      var q = scene.qte;
      qteTypeSel.value = q.qteType || "direction";
      qteBaseTime.value = q.baseTimeLimit || 3000;
      qteTargetCount.value = q.targetCount || 1;
      qteBaseTarget.value = q.baseTarget || 10;
      qteKey.value = q.key || "z";
      qteSuccessNext.value = q.successNext || "";
      qteFailNext.value = q.failNext || "";

      if (q.successEffects) {
        addEffectRow(qteSuccessEffectsDiv, q.successEffects);
      }
      if (q.failEffects) {
        addEffectRow(qteFailEffectsDiv, q.failEffects);
      }
    }

    // 선택지
    var choices = scene.choices || [];
    for (var i = 0; i < choices.length; i++) {
      addChoiceBlock(choicesContainer, choices[i]);
    }
  }

  updateEditorQTESection();
}

// editor: QTE 섹션 show/hide
function updateEditorQTESection() {
  var typeSel = document.getElementById("editor-scene-type");
  var qteSection = document.getElementById("editor-qte-section");
  var qteDirRow = document.getElementById("editor-qte-direction-row");
  var qteMashRow = document.getElementById("editor-qte-mash-row");
  var qteTypeSel = document.getElementById("editor-qte-type");

  if (!typeSel || !qteSection) return;

  if (typeSel.value === "qte") {
    qteSection.style.display = "block";
  } else {
    qteSection.style.display = "none";
  }

  if (qteTypeSel.value === "direction") {
    qteDirRow.style.display = "flex";
    qteMashRow.style.display = "none";
  } else {
    qteDirRow.style.display = "none";
    qteMashRow.style.display = "flex";
  }
}

// ──────────────
// 에디터: 효과 row
// ──────────────
function addEffectRow(container, effectObj) {
  if (!container) return;
  var row = document.createElement("div");
  row.className = "editor-effect-row";

  // 타입: stat / meter / flag / failures
  var typeSel = document.createElement("select");
  typeSel.className = "effect-type";
  ["stat", "meter", "flag", "failures"].forEach(function (t) {
    var o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    typeSel.appendChild(o);
  });

  var keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.placeholder = "key(스탯/게이지/플래그명)";
  keyInput.className = "effect-key";

  var opSel = document.createElement("select");
  opSel.className = "effect-op";
  [["add", "증가/감소(+/-)"], ["set", "설정(=)"]].forEach(function (p) {
    var o = document.createElement("option");
    o.value = p[0];
    o.textContent = p[1];
    opSel.appendChild(o);
  });

  var valInput = document.createElement("input");
  valInput.type = "text";
  valInput.className = "effect-value";
  valInput.placeholder = "값";

  var delBtn = document.createElement("button");
  delBtn.textContent = "삭제";
  delBtn.addEventListener("click", function () {
    container.removeChild(row);
  });

  row.appendChild(typeSel);
  row.appendChild(keyInput);
  row.appendChild(opSel);
  row.appendChild(valInput);
  row.appendChild(delBtn);

  container.appendChild(row);

  // effectObj가 있으면 채워주기(가장 단순한 경우만)
  if (effectObj) {
    if (effectObj.stats) {
      for (var k in effectObj.stats) {
        typeSel.value = "stat";
        keyInput.value = k;
        opSel.value = "add";
        valInput.value = effectObj.stats[k];
        break;
      }
    } else if (effectObj.setStats) {
      for (var k2 in effectObj.setStats) {
        typeSel.value = "stat";
        keyInput.value = k2;
        opSel.value = "set";
        valInput.value = effectObj.setStats[k2];
        break;
      }
    } else if (effectObj.meters) {
      for (var m in effectObj.meters) {
        typeSel.value = "meter";
        keyInput.value = m;
        opSel.value = "add";
        valInput.value = effectObj.meters[m];
        break;
      }
    } else if (effectObj.setMeters) {
      for (var m2 in effectObj.setMeters) {
        typeSel.value = "meter";
        keyInput.value = m2;
        opSel.value = "set";
        valInput.value = effectObj.setMeters[m2];
        break;
      }
    } else if (effectObj.flags) {
      for (var f in effectObj.flags) {
        typeSel.value = "flag";
        keyInput.value = f;
        opSel.value = "set";
        valInput.value = effectObj.flags[f];
        break;
      }
    } else if (typeof effectObj.failures === "number") {
      typeSel.value = "failures";
      keyInput.value = "";
      opSel.value = "add";
      valInput.value = effectObj.failures;
    }
  }
}

function readEffectsFromContainer(container) {
  if (!container) return null;
  var rows = container.querySelectorAll(".editor-effect-row");
  if (!rows.length) return null;

  var effects = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var typeSel = r.querySelector(".effect-type");
    var keyInput = r.querySelector(".effect-key");
    var opSel = r.querySelector(".effect-op");
    var valInput = r.querySelector(".effect-value");
    if (!typeSel || !opSel || !valInput) continue;

    var t = typeSel.value;
    var op = opSel.value;
    var vStr = valInput.value.trim();

    if (t === "failures") {
      var delta = parseInt(vStr, 10);
      if (!isNaN(delta)) {
        effects.failures = (effects.failures || 0) + delta;
      }
      continue;
    }

    var key = keyInput.value.trim();
    if (!key) continue;

    if (t === "stat") {
      if (op === "add") {
        var d = parseInt(vStr, 10);
        if (isNaN(d)) continue;
        if (!effects.stats) effects.stats = {};
        effects.stats[key] = (effects.stats[key] || 0) + d;
      } else {
        var sVal = parseInt(vStr, 10);
        if (isNaN(sVal)) continue;
        if (!effects.setStats) effects.setStats = {};
        effects.setStats[key] = sVal;
      }
    } else if (t === "meter") {
      if (op === "add") {
        var md = parseInt(vStr, 10);
        if (isNaN(md)) continue;
        if (!effects.meters) effects.meters = {};
        effects.meters[key] = (effects.meters[key] || 0) + md;
      } else {
        var mv = parseInt(vStr, 10);
        if (isNaN(mv)) continue;
        if (!effects.setMeters) effects.setMeters = {};
        effects.setMeters[key] = mv;
      }
    } else if (t === "flag") {
      if (!effects.flags) effects.flags = {};
      // 문자열 "true"/"false"/그외 → true/false 처리
      var boolVal = vStr.toLowerCase();
      if (boolVal === "true" || boolVal === "1" || boolVal === "t") {
        effects.flags[key] = true;
      } else if (boolVal === "false" || boolVal === "0" || boolVal === "f") {
        effects.flags[key] = false;
      } else {
        effects.flags[key] = !!vStr;
      }
    }
  }

  if (
    !effects.stats &&
    !effects.setStats &&
    !effects.meters &&
    !effects.setMeters &&
    !effects.flags &&
    typeof effects.failures !== "number"
  ) {
    return null;
  }
  return effects;
}

// ──────────────
// 에디터: 조건 row (각 선택지당 1개만)
// ──────────────
function addConditionRow(container, cond) {
  container.innerHTML = "";
  var row = document.createElement("div");
  row.className = "editor-condition-row";

  var typeSel = document.createElement("select");
  typeSel.className = "cond-type";
  [
    ["", "조건 없음"],
    ["stat", "스탯"],
    ["meter", "수치(meter)"],
    ["flag", "플래그"]
  ].forEach(function (p) {
    var o = document.createElement("option");
    o.value = p[0];
    o.textContent = p[1];
    typeSel.appendChild(o);
  });

  var keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "cond-key";
  keyInput.placeholder = "키 이름";

  var opSel = document.createElement("select");
  opSel.className = "cond-op";
  [
    [">=", "이상(>=)"],
    ["<=", "이하(<=)"],
    [">", "초과(>)"],
    ["<", "미만(<)"],
    ["==", "같다(==)"],
    ["!=", "다르다(!=)"]
  ].forEach(function (p) {
    var o = document.createElement("option");
    o.value = p[0];
    o.textContent = p[1];
    opSel.appendChild(o);
  });

  var valInput = document.createElement("input");
  valInput.type = "text";
  valInput.className = "cond-value";
  valInput.placeholder = "값";

  var delBtn = document.createElement("button");
  delBtn.textContent = "조건 삭제";
  delBtn.addEventListener("click", function () {
    container.innerHTML = "";
  });

  row.appendChild(typeSel);
  row.appendChild(keyInput);
  row.appendChild(opSel);
  row.appendChild(valInput);
  row.appendChild(delBtn);
  container.appendChild(row);

  if (cond) {
    typeSel.value = cond.type || "";
    keyInput.value = cond.key || "";
    opSel.value = cond.op || ">=";
    if (typeof cond.value !== "undefined") {
      valInput.value = String(cond.value);
    }
  }
}

function readConditionFromContainer(container) {
  if (!container) return null;
  var row = container.querySelector(".editor-condition-row");
  if (!row) return null;

  var typeSel = row.querySelector(".cond-type");
  var keyInput = row.querySelector(".cond-key");
  var opSel = row.querySelector(".cond-op");
  var valInput = row.querySelector(".cond-value");

  var t = typeSel.value;
  if (!t) return null;

  if (t === "flag") {
    var key = keyInput.value.trim();
    if (!key) return null;
    var vStr = valInput.value.trim().toLowerCase();
    var v;
    if (vStr === "true" || vStr === "1" || vStr === "t") v = true;
    else if (vStr === "false" || vStr === "0" || vStr === "f") v = false;
    else v = true;
    return {
      type: "flag",
      key: key,
      value: v
    };
  } else {
    var key2 = keyInput.value.trim();
    if (!key2) return null;
    var vNum = parseInt(valInput.value.trim(), 10);
    if (isNaN(vNum)) return null;
    return {
      type: t,
      key: key2,
      op: opSel.value || ">=",
      value: vNum
    };
  }
}

// ──────────────
// 에디터: 선택지 block
// ──────────────
function addChoiceBlock(container, choiceObj) {
  var block = document.createElement("div");
  block.className = "editor-choice-block";

  var header = document.createElement("div");
  header.className = "editor-choice-header";

  var title = document.createElement("span");
  title.textContent = "선택지";

  var delBtn = document.createElement("button");
  delBtn.textContent = "선택지 삭제";
  delBtn.addEventListener("click", function () {
    container.removeChild(block);
  });

  header.appendChild(title);
  header.appendChild(delBtn);

  var row1 = document.createElement("div");
  row1.className = "editor-row";
  var labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.placeholder = "선택지 텍스트";
  labelInput.className = "choice-label";
  var nextInput = document.createElement("input");
  nextInput.type = "text";
  nextInput.placeholder = "다음 씬 ID";
  nextInput.className = "choice-next";

  row1.appendChild(labelInput);
  row1.appendChild(nextInput);

  var condContainer = document.createElement("div");
  condContainer.className = "choice-cond-container";

  var addCondBtn = document.createElement("button");
  addCondBtn.textContent = "조건 설정";
  addCondBtn.addEventListener("click", function () {
    // 한 선택지당 조건 1개만
    addConditionRow(condContainer, null);
  });

  var effContainer = document.createElement("div");
  effContainer.className = "choice-eff-container";

  var addEffBtn = document.createElement("button");
  addEffBtn.textContent = "효과 추가";
  addEffBtn.addEventListener("click", function () {
    addEffectRow(effContainer, null);
  });

  block.appendChild(header);
  block.appendChild(row1);

  var condLabel = document.createElement("div");
  condLabel.textContent = "조건 (없으면 항상 선택 가능)";
  block.appendChild(condLabel);
  block.appendChild(condContainer);
  block.appendChild(addCondBtn);

  var effLabel = document.createElement("div");
  effLabel.textContent = "효과 (이 선택지를 눌렀을 때 적용)";
  block.appendChild(effLabel);
  block.appendChild(effContainer);
  block.appendChild(addEffBtn);

  container.appendChild(block);

  if (choiceObj) {
    labelInput.value = choiceObj.label || "";
    nextInput.value = choiceObj.next || "";

    if (choiceObj.conditions && choiceObj.conditions.length > 0) {
      addConditionRow(condContainer, choiceObj.conditions[0]);
    }
    if (choiceObj.effects) {
      addEffectRow(effContainer, choiceObj.effects);
    }
  }
}

function readChoicesFromContainer(container) {
  if (!container) return [];
  var blocks = container.querySelectorAll(".editor-choice-block");
  var result = [];

  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    var labelInput = b.querySelector(".choice-label");
    var nextInput = b.querySelector(".choice-next");
    var condContainer = b.querySelector(".choice-cond-container");
    var effContainer = b.querySelector(".choice-eff-container");

    var label = labelInput.value.trim();
    var next = nextInput.value.trim();
    if (!label) continue;

    var ch = {
      label: label,
      next: next
    };

    var cond = readConditionFromContainer(condContainer);
    if (cond) ch.conditions = [cond];

    var eff = readEffectsFromContainer(effContainer);
    if (eff) ch.effects = eff;

    result.push(ch);
  }

  return result;
}

// ──────────────
// 에디터: 씬 저장
// ──────────────
function saveCurrentSceneFromEditor() {
  var idInput = document.getElementById("editor-scene-id");
  var typeSel = document.getElementById("editor-scene-type");
  var imgInput = document.getElementById("editor-scene-image");
  var textArea = document.getElementById("editor-scene-text");

  var onEnterEffectsDiv = document.getElementById("editor-onenter-effects");
  var qteTypeSel = document.getElementById("editor-qte-type");
  var qteBaseTime = document.getElementById("editor-qte-base-time");
  var qteTargetCount = document.getElementById("editor-qte-target-count");
  var qteBaseTarget = document.getElementById("editor-qte-base-target");
  var qteKey = document.getElementById("editor-qte-key");
  var qteSuccessNext = document.getElementById("editor-qte-success-next");
  var qteFailNext = document.getElementById("editor-qte-fail-next");
  var qteSuccessEffectsDiv = document.getElementById("editor-qte-success-effects");
  var qteFailEffectsDiv = document.getElementById("editor-qte-fail-effects");

  var choicesContainer = document.getElementById("editor-choices-container");

  var id = idInput.value.trim();
  if (!id) {
    alert("씬 ID를 입력하세요.");
    return;
  }

  var scene = {
    id: id,
    type: typeSel.value || "scene",
    image: imgInput.value.trim() || null,
    text: textArea.value || ""
  };

  // onEnter.effects
  var onEnterEff = readEffectsFromContainer(onEnterEffectsDiv);
  if (onEnterEff) {
    scene.onEnter = { effects: onEnterEff };
  }

  // QTE
  if (scene.type === "qte") {
    var qteObj = {
      qteType: qteTypeSel.value || "direction",
      baseTimeLimit: parseInt(qteBaseTime.value, 10) || 3000,
      successNext: qteSuccessNext.value.trim() || null,
      failNext: qteFailNext.value.trim() || null
    };

    if (qteObj.qteType === "direction") {
      qteObj.directions = ["up", "down", "left", "right"];
      qteObj.targetCount = parseInt(qteTargetCount.value, 10) || 1;
    } else {
      qteObj.baseTarget = parseInt(qteBaseTarget.value, 10) || 10;
      qteObj.key = (qteKey.value || "z").toLowerCase();
    }

    var qse = readEffectsFromContainer(qteSuccessEffectsDiv);
    if (qse) qteObj.successEffects = qse;
    var qfe = readEffectsFromContainer(qteFailEffectsDiv);
    if (qfe) qteObj.failEffects = qfe;

    scene.qte = qteObj;
  }

  // 선택지
  var choices = readChoicesFromContainer(choicesContainer);
  if (choices.length > 0) {
    scene.choices = choices;
  }

  // SCENES에 저장 (있으면 덮어쓰기)
  var idx = -1;
  for (var i = 0; i < SCENES.length; i++) {
    if (SCENES[i].id === id) {
      idx = i;
      break;
    }
  }
  if (idx >= 0) {
    SCENES[idx] = scene;
  } else {
    SCENES.push(scene);
  }

  editorCurrentSceneId = id;
  refreshEditorSceneSelect();
  alert("씬 저장 완료: " + id);
}

// ──────────────────────
// 초기화 및 이벤트 바인딩
// ──────────────────────
function setupEventListeners() {
  var startScreen = document.getElementById("start-screen");
  if (startScreen) {
    startScreen.addEventListener("click", function () {
      startScreen.classList.add("hidden");
      var loaded = loadGameFromStorage();
      if (!loaded) {
        // 씬이 하나도 없으면 char_create로, 있으면 첫 씬으로
        if (SCENES.length === 0) {
          // 최소 캐릭터 생성 씬이 있다고 가정
          loadScene("char_create");
        } else {
          loadScene(SCENES[0].id);
        }
      }
    });
  }

  var btnSettings = document.getElementById("btn-settings");
  if (btnSettings) {
    btnSettings.addEventListener("click", openSettings);
  }

  var btnSettingsClose = document.getElementById("btn-settings-close");
  if (btnSettingsClose) {
    btnSettingsClose.addEventListener("click", closeSettings);
  }

  var btnSave = document.getElementById("btn-setting-save");
  if (btnSave) {
    btnSave.addEventListener("click", function () {
      saveGame();
      alert("게임 저장 완료");
    });
  }

  var btnLoad = document.getElementById("btn-setting-load");
  if (btnLoad) {
    btnLoad.addEventListener("click", function () {
      var ok = loadGameFromStorage();
      if (!ok) alert("저장된 게임이 없습니다.");
    });
  }

  var btnRestart = document.getElementById("btn-setting-restart");
  if (btnRestart) {
    btnRestart.addEventListener("click", function () {
      restartGame();
      closeSettings();
    });
  }

  var textSel = document.getElementById("setting-text-speed");
  if (textSel) {
    textSel.addEventListener("change", function () {
      state.settings.textSpeed = textSel.value;
      applySettingsToDOM();
      saveGame();
    });
  }

  var fontSel = document.getElementById("setting-font-size");
  if (fontSel) {
    fontSel.addEventListener("change", function () {
      state.settings.fontSize = fontSel.value;
      applySettingsToDOM();
      saveGame();
    });
  }

  var muteChk = document.getElementById("setting-mute");
  if (muteChk) {
    muteChk.addEventListener("change", function () {
      state.settings.mute = muteChk.checked;
      saveGame();
    });
  }

  var qteSel = document.getElementById("setting-qte-difficulty");
  if (qteSel) {
    qteSel.addEventListener("change", function () {
      state.settings.qteDifficulty = qteSel.value;
      saveGame();
    });
  }

  // 창작 버튼
  var btnEditor = document.getElementById("btn-editor");
  if (btnEditor) {
    btnEditor.addEventListener("click", openEditorPassword);
  }

  var btnEditorPwOk = document.getElementById("btn-editor-password-ok");
  if (btnEditorPwOk) {
    btnEditorPwOk.addEventListener("click", tryOpenEditor);
  }

  var btnEditorPwCancel = document.getElementById("btn-editor-password-cancel");
  if (btnEditorPwCancel) {
    btnEditorPwCancel.addEventListener("click", closeEditorPassword);
  }

  var pwInput = document.getElementById("editor-password-input");
  if (pwInput) {
    pwInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        tryOpenEditor();
      }
    });
  }

  var btnEditorClose = document.getElementById("btn-editor-close");
  if (btnEditorClose) {
    btnEditorClose.addEventListener("click", closeEditor);
  }

  var sceneSelect = document.getElementById("editor-scene-select");
  if (sceneSelect) {
    sceneSelect.addEventListener("change", function () {
      var id = sceneSelect.value || null;
      loadSceneIntoEditor(id);
    });
  }

  var btnNewScene = document.getElementById("btn-editor-new-scene");
  if (btnNewScene) {
    btnNewScene.addEventListener("click", function () {
      editorCurrentSceneId = null;
      loadSceneIntoEditor(null);
      refreshEditorSceneSelect();
    });
  }

  var btnDeleteScene = document.getElementById("btn-editor-delete-scene");
  if (btnDeleteScene) {
    btnDeleteScene.addEventListener("click", function () {
      if (!editorCurrentSceneId) {
        alert("선택된 씬이 없습니다.");
        return;
      }
      if (!confirm("씬 '" + editorCurrentSceneId + "' 를 삭제할까요?")) return;
      var id = editorCurrentSceneId;
      var idx = -1;
      for (var i = 0; i < SCENES.length; i++) {
        if (SCENES[i].id === id) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        SCENES.splice(idx, 1);
        saveScenesToStorage();
      }
      editorCurrentSceneId = null;
      refreshEditorSceneSelect();
      loadSceneIntoEditor(null);
    });
  }

  var btnOnEnterAdd = document.getElementById("btn-editor-onenter-add-effect");
  if (btnOnEnterAdd) {
    btnOnEnterAdd.addEventListener("click", function () {
      var div = document.getElementById("editor-onenter-effects");
      addEffectRow(div, null);
    });
  }

  var typeSel2 = document.getElementById("editor-scene-type");
  if (typeSel2) {
    typeSel2.addEventListener("change", updateEditorQTESection);
  }

  var qteTypeSel = document.getElementById("editor-qte-type");
  if (qteTypeSel) {
    qteTypeSel.addEventListener("change", updateEditorQTESection);
  }

  var btnQteSuccAdd = document.getElementById("btn-editor-qte-success-add-effect");
  if (btnQteSuccAdd) {
    btnQteSuccAdd.addEventListener("click", function () {
      var div = document.getElementById("editor-qte-success-effects");
      addEffectRow(div, null);
    });
  }

  var btnQteFailAdd = document.getElementById("btn-editor-qte-fail-add-effect");
  if (btnQteFailAdd) {
    btnQteFailAdd.addEventListener("click", function () {
      var div = document.getElementById("editor-qte-fail-effects");
      addEffectRow(div, null);
    });
  }

  var btnAddChoice = document.getElementById("btn-editor-add-choice");
  if (btnAddChoice) {
    btnAddChoice.addEventListener("click", function () {
      var container = document.getElementById("editor-choices-container");
      addChoiceBlock(container, null);
    });
  }

  var btnSaveScene = document.getElementById("btn-editor-save-scene");
  if (btnSaveScene) {
    btnSaveScene.addEventListener("click", function () {
      saveCurrentSceneFromEditor();
    });
  }

  var btnSaveAll = document.getElementById("btn-editor-save-all");
  if (btnSaveAll) {
    btnSaveAll.addEventListener("click", function () {
      saveScenesToStorage();
      alert("전체 씬 저장 완료");
    });
  }
}

function initGame() {
  loadScenesFromStorage();
  applySettingsToDOM();
  updatePlayerStatusUI();
  setupEventListeners();
}

document.addEventListener("DOMContentLoaded", initGame);
