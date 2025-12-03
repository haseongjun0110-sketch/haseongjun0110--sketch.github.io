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
  {
    id: "start",
    type: "start",
    text: "그림자 숲의 모험",
    image: null,
    choices: []
  },
  {
    id: "char_create",
    type: "charCreate",
    text: "어둠이 내려앉은 숲 입구에서, 당신은 자신이 누구인지 떠올려야 합니다.\n이름을 정하고, 당신의...니다.\n• 지혜(WIS): 특수한 선택지를 열어줍니다.\n• 체력(VIT): 실패를 견딜 수 있는 횟수입니다.",
    image: null,
    choices: []
  },
  {
    id: "intro_scene",
    type: "scene",
    text: "당신은 이름도 기억나지 않은 채, 어둠이 내려앉은 숲 입구에 서 있습니다.\n어디선가 이상한 속삭임이 들려옵니다.\n\n— \"그림자 숲에 발을 들인 이상, 돌아갈 수 없다.\"",
    image: null,
    choices: [
      {
        label: "숲 안으로 들어간다",
        next: "forest_entrance",
        requires: null
      }
    ]
  },
  {
    id: "forest_entrance",
    type: "scene",
    text: "나무들은 마치 무언가를 숨기듯 빽빽하게 서 있습니다.\n멀리서 늑대 울음 같은 소리가 들려옵니다.\n\n당신은 본능적으로 긴장합니다.",
    image: null,
    choices: [
      {
        label: "소리가 나는 쪽으로 다가간다",
        next: "wolf_warning",
        requires: null
      },
      {
        label: "조심스럽게 다른 길을 찾는다",
        next: "quiet_path",
        requires: null
      }
    ]
  },
  {
    id: "quiet_path",
    type: "scene",
    text: "당신은 늑대 소리를 피해서 조용한 길로 접어듭니다.\n그러나 어둠은 점점 더 짙어지고, 시야는 점점 좁아집니다.",
    image: null,
    choices: [
      {
        label: "계속 앞으로 나아간다",
        next: "deep_dark",
        requires: null
      }
    ]
  },
  {
    id: "deep_dark",
    type: "scene",
    text: "빛은 거의 사라졌고, 당신의 숨소리만이 귀에 울립니다.\n\n발 밑에서 무언가 부러지는 소리가 납니다.",
    image: null,
    choices: [
      {
        label: "뒤를 돌아본다",
        next: "wolf_appears",
        requires: null
      }
    ]
  },
  {
    id: "wolf_warning",
    type: "scene",
    text: "울음소리는 점점 선명해지고, 마침내 당신은 초라한 폐허 근처에서 늑대 한 마리를 보게 됩니다.\n늑대는 아직 당신을 알아채지 못한 듯합니다.",
    image: null,
    choices: [
      {
        label: "조용히 뒤로 물러난다",
        next: "quiet_path",
        requires: null
      },
      {
        label: "천천히 다가간다",
        next: "wolf_notice",
        requires: null
      }
    ]
  },
  {
    id: "wolf_notice",
    type: "scene",
    text: "당신의 발소리에 늑대가 고개를 듭니다.\n\n노란 눈동자가 당신을 똑바로 바라봅니다.",
    image: null,
    choices: [
      {
        label: "눈을 피하지 않고 응시한다",
        next: "wolf_stare",
        requires: null
      },
      {
        label: "천천히 뒤로 물러난다",
        next: "wolf_growl",
        requires: null
      }
    ]
  },
  {
    id: "wolf_stare",
    type: "scene",
    text: "잠시 동안, 숲 속에는 당신과 늑대의 숨소리만이 울립니다.\n늑대의 꼬리가 천천히 내려갑니다.",
    image: null,
    choices: [
      {
        label: "조심스럽게 한 걸음 다가간다",
        next: "wolf_react",
        requires: null
      }
    ]
  },
  {
    id: "wolf_react",
    type: "scene",
    text: "늑대는 낮게 으르렁거리며 물러납니다.\n당신을 당장 공격할 생각은 없는 듯하지만, 완전히 등을 보이고 돌아서지는 않습니다.",
    image: null,
    choices: [
      {
        label: "더 이상 자극하지 않고 물러난다",
        next: "safe_clearing",
        requires: null
      }
    ]
  },
  {
    id: "wolf_growl",
    type: "scene",
    text: "당신이 물러나려는 순간, 늑대가 날카로운 이빨을 드러내며 으르렁거립니다.\n\n도망치려면 지금뿐입니다!",
    image: null,
    choices: [
      {
        label: "전력으로 도망친다",
        next: "escape_run",
        requires: null
      },
      {
        label: "자리에 서서 늑대를 응시한다",
        next: "wolf_charge",
        requires: null
      }
    ]
  },
  {
    id: "wolf_appears",
    type: "scene",
    text: "어둠 속에서 번쩍이는 두 개의 눈.\n늑대가 이미 당신을 노려보고 있습니다.",
    image: null,
    choices: [
      {
        label: "비명을 지르며 도망친다",
        next: "escape_run",
        requires: null
      },
      {
        label: "숨을 죽이고 지켜본다",
        next: "wolf_charge",
        requires: null
      }
    ]
  },
  {
    id: "wolf_charge",
    type: "scene",
    text: "늑대가 갑자기 당신을 향해 돌진합니다!\n\n피해야 합니다!",
    image: null,
    choices: [
      {
        label: "옆으로 구른다",
        next: "dodge_qte",
        requires: null
      }
    ]
  },
  {
    id: "dodge_qte",
    type: "qte",
    text: "늑대의 돌진을 피하기 위해 재빨리 몸을 움직여야 합니다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right"],
      baseTimeLimit: 1500,
      successNext: "wolf_escaped",
      failNext: "wolf_hit"
    }
  },
  {
    id: "wolf_escaped",
    type: "scene",
    text: "당신은 재빠르게 몸을 피했습니다! 늑대가 허공을 가르며 지나갑니다.\n\n늑대는 으르렁거리며 다시 자세를 잡습니다. 하지만 이번에는 당신이 먼저 움직일 기회가 있습니다.",
    image: null,
    choices: [
      {
        label: "도망친다",
        next: "escape_run",
        requires: null
      },
      {
        label: "나뭇가지를 집어든다",
        next: "grab_branch",
        requires: null
      }
    ]
  },
  {
    id: "wolf_hit",
    type: "scene",
    text: "늑대의 몸통이 당신을 강하게 들이받습니다.\n\n몸이 공중으로 떠올랐다가 바닥에 내동댕이쳐집니다.",
    image: null,
    choices: [
      {
        label: "고통 속에서 의식이 흐려진다...",
        next: "check_death",
        requires: null
      }
    ]
  },
  {
    id: "grab_branch",
    type: "scene",
    text: "당신은 땅에 떨어진 굵은 나뭇가지를 집어듭니다.\n\n늑대가 다시 달려옵니다! 타이밍을 맞춰 휘둘러야 합니다.",
    image: null,
    choices: [
      {
        label: "늑대를 향해 나뭇가지를 휘두른다",
        next: "branch_swing",
        requires: null
      }
    ]
  },
  {
    id: "branch_swing",
    type: "qte",
    text: "정확한 타이밍에 나뭇가지를 휘둘러라!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right"],
      baseTimeLimit: 1500,
      successNext: "branch_hit",
      failNext: "branch_miss"
    }
  },
  {
    id: "branch_hit",
    type: "scene",
    text: "정확히 늑대의 옆구리를 가격했습니다! 늑대가 비명을 지르며 뒷걸음질칩니다.\n\n늑대는 잠시 당신을 노려보더니, 숲 속으로 사라집니다.",
    image: null,
    choices: [
      {
        label: "긴장을 풀고 주변을 살핀다",
        next: "safe_clearing",
        requires: null
      }
    ]
  },
  {
    id: "branch_miss",
    type: "scene",
    text: "타이밍을 놓쳤습니다! 나뭇가지는 허공을 가르며 휘둘러졌고, 늑대는 그대로 당신에게 달려듭니다.",
    image: null,
    choices: [
      {
        label: "충격에 쓰러진다",
        next: "check_death",
        requires: null
      }
    ]
  },
  {
    id: "escape_run",
    type: "qte",
    text: "도망치려면 온 힘을 다해 달려야 한다! 빠르게 발을 움직여라!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 3000,
      baseTarget: 15,
      successNext: "escape_success",
      failNext: "escape_fail"
    }
  },
  {
    id: "escape_success",
    type: "scene",
    text: "당신은 숨이 턱까지 차오를 때까지 달렸습니다.\n\n뒤를 돌아보니, 늑대의 모습은 보이지 않습니다.",
    image: null,
    choices: [
      {
        label: "조심스럽게 발걸음을 늦춘다",
        next: "safe_clearing",
        requires: null
      }
    ]
  },
  {
    id: "escape_fail",
    type: "scene",
    text: "다리가 풀리며 당신은 앞으로 고꾸라집니다.\n\n늑대의 발톱이 등을 깊게 긁고 지나갑니다.",
    image: null,
    choices: [
      {
        label: "의식을 잃는다",
        next: "check_death",
        requires: null
      }
    ]
  },
  {
    id: "check_death",
    type: "scene",
    text: "이 장면은 실제로는 화면에 보이지 않고, 플레이어의 상태를 점검하는 용도입니다.",
    image: null,
    choices: []
  },
  {
    id: "wounded_continue",
    type: "scene",
    text: "당신은 고통스러운 몸을 이끌고 겨우 일어납니다.\n\n아직 완전히 끝난 것은 아닙니다.",
    image: null,
    choices: [
      {
        label: "비틀거리며 앞으로 나아간다",
        next: "safe_clearing",
        requires: null
      }
    ]
  },

  {
    id: "safe_clearing",
    type: "scene",
    text: "당신은 숲 속 작은 빈터에 도착했습니다. 달빛이 비추는 이곳은 비교적 안전해 보입니다.\n\n멀리서 들리던 늑대의 울음소리는 점점 멀어져 갑니다. 오늘의 모험은 이것으로 충분합니다... 라고 느끼던 바로 그때, 계곡 아래쪽에서 낯선 심장 박동 같은 진동이 느껴집니다.\n\n— 데모 종료 지점 —\n\n이곳에서 쉬어갈 수도 있고, 더 깊은 곳으로 내려갈 수도 있습니다.",
    image: null,
    choices: [
      {
        label: "오늘은 여기까지 쉰다 (처음으로 돌아가기)",
        next: "__restart__",
        requires: null
      },
      {
        label: "계곡 아래로 내려가 본다",
        next: "shadow_valley_entrance",
        requires: null
      }
    ]
  },

  /* ───────── 여기서부터 도파민 시나리오 추가 ───────── */

  {
    id: "shadow_valley_entrance",
    type: "scene",
    text: "당신은 빈터의 가장자리에서 가파르게 내려가는 계곡 길을 발견합니다.\n\n안개 사이로 검은 연기가 피어오르고, 심장이 쿵, 하고 크게 한 번 뛵니다.\n이곳이 바로 그림자의 심장이 가까워지는 길목입니다.",
    image: null,
    choices: [
      {
        label: "계곡 안으로 내려간다",
        next: "first_temptation",
        requires: null
      },
      {
        label: "주변부터 살펴본다",
        next: "small_discovery",
        requires: null
      }
    ]
  },
  {
    id: "small_discovery",
    type: "scene",
    text: "발치 근처에 검게 빛나는 결정 조각 하나가 떨어져 있습니다.\n손끝이 닿는 순간, 뜨거운 열기가 손바닥을 찌릅니다.",
    image: null,
    choices: [
      {
        label: "흑결정을 흡수한다",
        next: "dark_shard_buff",
        requires: null
      },
      {
        label: "위험해 보인다. 두고 간다",
        next: "first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "dark_shard_buff",
    type: "scene",
    text: "심장이 잠깐 멎는 듯하더니, 곧 폭발하듯 다시 뛰기 시작합니다.\n몸이 가벼워진 것만 같습니다. 민첩이 조금 오른 듯한 기분입니다.",
    image: null,
    choices: [
      {
        label: "새로운 힘을 느끼며 앞으로 나아간다",
        next: "first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "first_temptation",
    type: "scene",
    text: "계곡 바닥 가까이 내려오자, 바위 위로 검은 물결이 솟아오릅니다.\n\n그림자가 목소리를 냅니다.\n“네 힘을 시험받고 싶은가? 받아들여라. 그러면 더 강해진다.”",
    image: null,
    choices: [
      {
        label: "그 힘을 받아들인다",
        next: "temptation_qte",
        requires: null
      },
      {
        label: "위험하다. 무시하고 지나간다",
        next: "shadow_mock",
        requires: null
      }
    ]
  },
  {
    id: "shadow_mock",
    type: "scene",
    text: "그림자가 비웃는 소리를 냅니다.\n“겁쟁이.”\n속삭임만 남기고 그림자는 사라지지만, 등줄기를 타고 올라오는 욕망은 사라지지 않습니다.",
    image: null,
    choices: [
      {
        label: "뒤를 돌아보지 않고 달려간다",
        next: "chase_qte",
        requires: null
      }
    ]
  },
  {
    id: "temptation_qte",
    type: "qte",
    text: "그림자가 갑자기 방향들을 던집니다.\n패턴은 짧지만 빠릅니다. 그 흐름을 따라잡으십시오.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "left", "right"],
      baseTimeLimit: 1500,
      successNext: "temptation_success",
      failNext: "temptation_fail"
    }
  },
  {
    id: "temptation_success",
    type: "scene",
    text: "당신은 모든 움직임을 완벽하게 따라냈습니다.\n그림자가 웃습니다.\n“마침내, 조금은 쓸 만해졌군.”",
    image: null,
    choices: [
      {
        label: "민첩이 강해진 느낌이다",
        next: "chase_start",
        requires: null
      },
      {
        label: "머리가 맑아진 느낌이다",
        next: "chase_start",
        requires: null
      }
    ]
  },
  {
    id: "temptation_fail",
    type: "scene",
    text: "순간 흐름을 놓쳤습니다. 그림자의 가시가 몸을 스치고 지나갑니다.\n숨이 멎을 뻔했지만, 아직은 살아 있습니다.",
    image: null,
    choices: [
      {
        label: "이를 악물고 다시 일어난다",
        next: "chase_start",
        requires: null
      }
    ]
  },
  {
    id: "chase_start",
    type: "scene",
    text: "위에서, 옆에서, 아래에서 그림자의 기척이 들립니다.\n“도망쳐라. 혹은 힘을 증명해라.”",
    image: null,
    choices: [
      {
        label: "전력으로 달린다",
        next: "chase_qte",
        requires: null
      },
      {
        label: "이젠 도망치지 않는다. 맞선다",
        next: "confront_qte",
        requires: null
      }
    ]
  },
  {
    id: "chase_qte",
    type: "qte",
    text: "발밑이 무너지기 전에, 그림자에게 잡히기 전에 달려야 합니다!\nZ 키를 연타해 속도를 유지하십시오!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2000,
      baseTarget: 14,
      successNext: "chase_success",
      failNext: "chase_fail"
    }
  },
  {
    id: "chase_success",
    type: "scene",
    text: "당신은 그림자의 손을 아슬아슬하게 따돌리고 언덕 위로 뛰어올랐습니다.\n심장은 터질 듯하지만, 입가에는 웃음이 번집니다.",
    image: null,
    choices: [
      {
        label: "더 이상 도망치지 않는다. 돌아서서 선다",
        next: "confront_qte",
        requires: null
      }
    ]
  },
  {
    id: "chase_fail",
    type: "scene",
    text: "다리가 순간 풀리며 넘어졌습니다. 그림자의 손이 등을 스치고 지나갑니다.\n살아는 있지만, 몸 여기저기가 욱신거립니다.",
    image: null,
    choices: [
      {
        label: "이를 악물고 일어난다",
        next: "confront_qte",
        requires: null
      }
    ]
  },
  {
    id: "confront_qte",
    type: "qte",
    text: "당신은 더 이상 등을 보이지 않기로 결심합니다.\n그림자가 던지는 공격의 방향을 모두 읽어내야 합니다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right", "up"],
      baseTimeLimit: 1800,
      successNext: "confront_success",
      failNext: "confront_fail"
    }
  },
  {
    id: "confront_success",
    type: "scene",
    text: "당신은 모든 공격을 피하고 버텨냈습니다.\n그림자가 조용히 박수를 칩니다.\n“좋다. 이제 대화할 자격은 생겼군.”",
    image: null,
    choices: [
      {
        label: "그림자와 마주 선다",
        next: "shadow_talk",
        requires: null
      }
    ]
  },
  {
    id: "confront_fail",
    type: "scene",
    text: "당신은 바위에 부딪혀 숨이 턱 막힙니다. 하지만 그림자는 마지막 일격을 멈춥니다.\n“아직 끝낼 생각은 없다. 일어나라.”",
    image: null,
    choices: [
      {
        label: "갓난 숨을 몰아쉬며 일어난다",
        next: "shadow_talk",
        requires: null
      }
    ]
  },
  {
    id: "shadow_talk",
    type: "scene",
    text: "인간의 형태를 한 그림자가 눈앞에 서 있습니다.\n“네 안의 욕망을 봤다. 더 강해지고 싶지 않나?”",
    image: null,
    choices: [
      {
        label: "원한다. 이 힘을 더 원한다",
        next: "ending_empower",
        requires: null
      },
      {
        label: "아니. 지금의 나로 충분하다",
        next: "ending_refuse",
        requires: null
      }
    ]
  },
  {
    id: "ending_empower",
    type: "scene",
    text: "그림자의 손이 당신의 가슴 위에 포개집니다.\n뜨겁고도 달콤한 힘이 온몸으로 흘러들어옵니다.\n당신은 더 이상 예전의 당신이 아닙니다.\n\n어둠과 함께 걷는, 새로운 힘의 주인이 되었습니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아간다",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "ending_refuse",
    type: "scene",
    text: "당신은 조용히 고개를 젓습니다.\n“그래, 그런 선택도 나쁘지 않지.” 그림자가 미소를 짓습니다.\n어둠은 서서히 걷히고, 계곡에는 차가운 새벽 공기만이 남습니다.\n\n당신은 당신 자신의 힘으로, 다시 숲길을 향해 나아갑니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아간다",
        next: "__restart__",
        requires: null
      }
    ]
  },

  /* ───────── 기존 공통 사망씬 유지 ───────── */

  {
    id: "death_generic",
    type: "death",
    text: "너의 의식은 어둠 속으로 가라앉았다...\n\n너무 많은 상처를 입었습니다. 숲의 어둠이 당신을 삼켰습니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
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
