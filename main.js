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
    text: "당신은 어두운 숲 입구에 서 있습니다. 짙은 안개가 나무 사이를 맴돌고, 어디선가 늑대의 울음소...리가 들려옵니다.\n\n앞으로 나아가면 더 깊은 숲으로 들어가게 됩니다. 어떤 위험이 기다리고 있을지 모릅니다.",
    image: null,
    choices: [
      {
        label: "숲 안으로 들어간다",
        next: "forest_entrance",
        requires: null
      },
      {
        label: "주변을 먼저 살핀다 (지혜 4 필요)",
        next: "forest_path_wise",
        requires: { wis: 4 }
      }
    ]
  },
  {
    id: "forest_entrance",
    type: "scene",
    text: "당신은 조심스럽게 숲 안으로 들어갑니다. 나뭇가지들이 얽혀 있고, 발밑에는 마른 잎들이 수북이 쌓여 있습니다.\n\n멀리서 또 한 번 늑대의 울음소리가 들립니다.",
    image: null,
    choices: [
      {
        label: "소리가 나는 쪽으로 다가간다",
        next: "wolf_warning",
        requires: null
      },
      {
        label: "조용한 길을 찾아본다",
        next: "quiet_path",
        requires: null
      }
    ]
  },
  {
    id: "forest_path_wise",
    type: "scene",
    text: "당신의 날카로운 눈이 주변의 흔적을 포착합니다. 땅에 찍힌 발자국은 분명 늑대의 것입니다.\n\n당신은 발자국이 나 있는 길을 피해서, 상대적으로 안전해 보이는 길을 선택합니다.",
    image: null,
    choices: [
      {
        label: "조용한 길을 따라간다",
        next: "quiet_path",
        requires: null
      }
    ]
  },
  {
    id: "quiet_path",
    type: "scene",
    text: "당신은 늑대 소리를 피해서 조용한 길로 접어듭니다.\n\n나무 사이로 희미한 달빛이 비추고, 공기는 약간 더 차갑게 느껴집니다.",
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
    text: "주변이 점점 어두워집니다. 발걸음 소리와 심장 소리만이 귓가에 울립니다.\n\n갑자기, 당신의 발밑에서 나뭇가지가 부러지는 소리가 크게 울립니다.",
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
    text: "당신은 늑대의 울음소리를 따라가다가, 폐허가 된 돌담 근처에서 한 마리의 늑대를 발견합니다.\n\n늑대는 여전히 당신을 보지 못한 것 같습니다.",
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
    text: "발밑에서 작은 돌멩이가 굴러가며 소리를 냅니다.\n\n늑대가 고개를 돌려 당신을 바라봅니다. 노란 눈동자가 어둠 속에서 빛납니다.",
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
    text: "당신과 늑대는 잠시 서로를 바라봅니다.\n\n숲 속에는 두 존재의 숨소리만이 조용히 울립니다.",
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
    text: "늑대는 낮게 으르렁거리며 뒤로 물러납니다.\n\n당신을 당장 공격할 생각은 없는 듯하지만, 완전히 등을 보이고 돌아서지는 않습니다.",
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
    text: "어둠 속에서 번쩍이는 두 개의 눈이 보입니다.\n\n늑대가 이미 당신을 노려보고 있습니다.",
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
      directions: ["up", "left", "right", "down"],
      baseTimeLimit: 2000,
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
    text: "당신은 전력으로 달렸습니다! 뒤에서 늑대의 발소리가 점점 멀어집니다.\n\n숨을 헐떡이며 멈춰 섰을 때, 늑대는 더 이상 쫓아오지 않았습니다.",
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

  /* 튜토리얼 이후 도파민+동료+가르드 루트 시작 */

  {
    id: "safe_clearing",
    type: "scene",
    text: "당신은 숲 속 작은 빈터에 도착했습니다. 달빛이 비추는 이곳은 비교적 안전해 보입니다.\n\n숨을 고르며 오늘 있었던 일들을 떠올립니다. 그러나 계곡 아래 어딘가에서, 심장 박동 같은 진동이 전해집니다.\n\n이곳에서 쉬어갈 수도 있고, 더 깊은 곳으로 내려가 진짜 심장을 마주할 수도 있습니다.",
    image: null,
    choices: [
      {
        label: "오늘은 여기까지 쉰다 (처음으로 돌아가기)",
        next: "__restart__",
        requires: null
      },
      {
        label: "계곡 아래 심장 소리를 따라 내려간다",
        next: "valley_entrance",
        requires: null
      }
    ]
  },
  {
    id: "valley_entrance",
    type: "scene",
    text: "가파른 비탈을 따라 내려가자, 안개가 더 짙어집니다. 발 아래 돌멩이들이 심장 박동에 맞춰 미세하게 떨립니다.\n곁에서 병든 기사 세릴이 비틀거리며 숨을 내쉽니다.",
    image: null,
    choices: [
      {
        label: "세릴을 부축하며 계속 내려간다",
        next: "dark_shard_discovery",
        requires: null
      },
      {
        label: "세릴 상태부터 점검한다 (지혜 4 필요)",
        next: "ceryl_status_check",
        requires: { wis: 4 }
      }
    ]
  },
  {
    id: "ceryl_status_check",
    type: "scene",
    text: "당신은 세릴의 맥을 짚고 피부를 살핍니다. 검은 실핏줄이 손목을 따라 올라옵니다.\n마엘이 안경을 고쳐 쓰며 중얼거립니다.\n\"여기서 오래 버티게 하면 위험해. 빨리 심장까지 가서 근원을 끊어야 해.\"",
    image: null,
    choices: [
      {
        label: "세릴에게 잠깐만 더 버티라고 말한다",
        next: "dark_shard_discovery",
        requires: null
      },
      {
        label: "세릴을 위에 남겨두고 내려가자고 한다 (지혜 5 필요)",
        next: "ceryl_wait_decision",
        requires: { wis: 5 }
      }
    ]
  },
  {
    id: "ceryl_wait_decision",
    type: "scene",
    text: "세릴은 한숨을 내쉽니다.\n\"여기서 기다릴게. 돌아올 수 있다면… 그때 다시 얘기하자.\"\n아린이 작게 고개를 숙입니다.\n\"꼭 돌아오자. 모두 같이.\"",
    image: null,
    choices: [
      {
        label: "세릴을 남겨두고 계곡 아래로 내려간다",
        next: "dark_shard_discovery",
        requires: null
      }
    ]
  },
  {
    id: "dark_shard_discovery",
    type: "scene",
    text: "계단처럼 이어진 바위 틈 사이, 검게 빛나는 결정 조각 하나가 박혀 있습니다.\n손을 가까이 대자, 심장 박동과 위상이 맞추어지는 듯한 느낌이 듭니다.",
    image: null,
    choices: [
      {
        label: "흑결정을 뽑아 손에 쥔다",
        next: "dark_shard_qte",
        requires: null
      },
      {
        label: "불길하니 건드리지 않는다",
        next: "pre_first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "dark_shard_qte",
    type: "qte",
    text: "결정을 뽑는 순간, 그림자 에너지가 손을 타고 몸 안으로 밀려듭니다.\n폭주하기 전에 흐름을 바로잡아야 합니다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "right", "left"],
      baseTimeLimit: 1600,
      successNext: "dark_shard_boost",
      failNext: "dark_shard_backfire"
    }
  },
  {
    id: "dark_shard_boost",
    type: "scene",
    text: "불길한 열기가 온몸을 타고 흐르지만 곧 신경이 또렷해지고 몸이 가벼워집니다.\n아린이 놀란 눈으로 당신을 바라봅니다.\n\"방금… 네 움직임, 훨씬 빨라졌어.\"",
    image: null,
    choices: [
      {
        label: "새 힘을 느끼며 계곡 아래로 내려간다",
        next: "pre_first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "dark_shard_backfire",
    type: "scene",
    text: "에너지를 제어하지 못했습니다. 시야가 번쩍이며 무릎이 꺾입니다.\n타로나가 당신을 붙잡습니다.\n\"멍청이. 이런 건 처음엔 조금씩 써야 해.\"",
    image: null,
    choices: [
      {
        label: "이를 악물고 일어난다",
        next: "pre_first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "pre_first_temptation",
    type: "scene",
    text: "계곡 바닥이 보일 즈음, 안개 너머로 검은 물결이 꿈틀거립니다.\n심장 박동 소리는 이제 귀를 때릴 정도입니다.",
    image: null,
    choices: [
      {
        label: "코어 앞으로 나아간다",
        next: "first_temptation",
        requires: null
      },
      {
        label: "먼발치에서 코어를 관찰한다 (지혜 4 필요)",
        next: "core_observe",
        requires: { wis: 4 }
      }
    ]
  },
  {
    id: "core_observe",
    type: "scene",
    text: "당신은 거리를 유지한 채 코어를 관찰합니다.\n표면에 떠다니는 패턴이 일정한 주기로 반복됩니다. 마치 QTE 패턴처럼 보입니다.\n마엘이 고개를 끄덕입니다.\n\"좋아. 저 패턴을 눈에 익혀두면 조금은 수월해질 거야.\"",
    image: null,
    choices: [
      {
        label: "패턴을 머릿속에 새기고 앞으로 나아간다",
        next: "first_temptation",
        requires: null
      }
    ]
  },
  {
    id: "first_temptation",
    type: "scene",
    text: "검은 코어가 파도처럼 일렁이며 인간 형상을 만들어냅니다.\n그림자가 웃습니다.\n\"네 욕망을 봤다. 강해지고 싶지? 나를 받아들이면, 더 깊은 곳까지 닿을 수 있다.\"",
    image: null,
    choices: [
      {
        label: "유혹을 받아들인다",
        next: "first_temptation_qte",
        requires: null
      },
      {
        label: "거절하고 돌아서려 한다",
        next: "shadow_mock",
        requires: null
      }
    ]
  },
  {
    id: "first_temptation_qte",
    type: "qte",
    text: "그림자가 방향을 던지기 시작합니다.\n짧고 날카로운 패턴. 실수는 단 한 번도 허용되지 않습니다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "left", "right"],
      baseTimeLimit: 1500,
      successNext: "first_temptation_success",
      failNext: "first_temptation_fail"
    }
  },
  {
    id: "first_temptation_success",
    type: "scene",
    text: "당신은 모든 패턴을 완벽하게 따라잡았습니다.\n그림자가 \"흥미롭군\" 하고 웃습니다.\n아린: \"방금… 움직임이 인간이 아니었어.\"\n타로나: \"좋아. 이 정도면 목숨 걸어볼 만하네.\"",
    image: null,
    choices: [
      {
        label: "힘이 몸 안에 층을 이루는 느낌이다",
        next: "chase_start",
        requires: null
      }
    ]
  },
  {
    id: "first_temptation_fail",
    type: "scene",
    text: "한 순간 흐름을 놓쳤습니다. 그림자의 가시가 심장을 스치듯 지나갑니다.\n무릎이 꺾이지만—완전히 무너지지는 않습니다.\n마엘: \"살아있어. 하지만 더는 같은 실수를 하면 안 돼.\"",
    image: null,
    choices: [
      {
        label: "이를 악물고 일어난다",
        next: "chase_start",
        requires: null
      }
    ]
  },
  {
    id: "shadow_mock",
    type: "scene",
    text: "\"겁쟁이.\"\n그림자는 코어 속으로 다시 가라앉습니다.\n그러나 심장 박동은 오히려 더 빨라집니다. 등에 기묘한 전율이 타고 오릅니다.",
    image: null,
    choices: [
      {
        label: "무시하고 계곡 깊숙이 더 들어간다",
        next: "chase_start",
        requires: null
      }
    ]
  },
  {
    id: "chase_start",
    type: "scene",
    text: "계곡의 벽면을 따라 수많은 그림자 손이 솟아오릅니다.\n\"도망쳐라. 아니면 증명해라.\"\n아린이 손을 내밉니다.\n\"같이 뛰자!\"",
    image: null,
    choices: [
      {
        label: "모두와 함께 전력 질주한다",
        next: "chase_qte",
        requires: null
      },
      {
        label: "혼자 뒤에 남아 그림자를 끌어들인다 (민첩 4 필요)",
        next: "lure_play_qte",
        requires: { agi: 4 }
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
      baseTimeLimit: 2200,
      baseTarget: 16,
      successNext: "chase_success",
      failNext: "chase_fail"
    }
  },
  {
    id: "lure_play_qte",
    type: "qte",
    text: "당신이 뒤에 남아 그림자를 끌어들입니다.\n아린과 타로나가 앞에서 길을 엽니다.\n\"버티기만 해!\"",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2200,
      baseTarget: 18,
      successNext: "lure_success",
      failNext: "lure_fail"
    }
  },
  {
    id: "chase_success",
    type: "scene",
    text: "당신과 동료들은 그림자의 손을 간발의 차이로 따돌리며 절벽 위 턱까지 도달합니다.\n모두가 숨을 헐떡이며 웃습니다.\n아린: \"살았다…! 이런 기분, 나 나쁘지 않은데?\"\n타로나: \"이제 몸이 좀 풀리기 시작했어.\"",
    image: null,
    choices: [
      {
        label: "숨을 고르며 주변을 살핀다",
        next: "mael_camp",
        requires: null
      }
    ]
  },
  {
    id: "chase_fail",
    type: "scene",
    text: "발이 순간 미끄러집니다. 그림자의 손이 발목을 움켜쥡니다.\n타로나가 화살을 쏘아 그 손을 끊습니다.\n타로나: \"멍청아. 두 번은 안 구해준다.\"",
    image: null,
    choices: [
      {
        label: "비틀거리며 동료를 따라간다",
        next: "mael_camp",
        requires: null
      }
    ]
  },
  {
    id: "lure_success",
    type: "scene",
    text: "당신이 뒤에서 그림자를 끌어당기는 동안, 아린과 타로나는 위쪽에 임시 로프를 걸었습니다.\n아린: \"지금!\"\n당신이 마지막 순간에 뛰어 올라가자, 타로나가 당신을 끌어올립니다.\n타로나: \"이 정도면 같이 싸울 자격은 있네.\"",
    image: null,
    choices: [
      {
        label: "숨을 고르며 주변을 살핀다",
        next: "mael_camp",
        requires: null
      }
    ]
  },
  {
    id: "lure_fail",
    type: "scene",
    text: "그림자 손들이 한꺼번에 몰려듭니다.\n마엘이 부적을 꺼내 바닥에 내리꽂습니다. 폭발적인 빛과 함께 손들이 날아가지만, 당신도 함께 나가떨어집니다.\n마엘: \"실험체 하나를 잃을 뻔했군.\"",
    image: null,
    choices: [
      {
        label: "기침을 하며 일어난다",
        next: "mael_camp",
        requires: null
      }
    ]
  },
  {
    id: "mael_camp",
    type: "scene",
    text: "절벽 위 작은 평지에 마엘이 임시 연구 캠프를 차려놓았습니다.\n문양이 새겨진 돌판, 흔들리는 램프, 두꺼운 노트들이 널려 있습니다.\n마엘: \"좋아, 여기까지 온 시점에서 넌 두 가지 선택지가 있어. 강해지는 법을 배울래, 위험을 줄이는 법을 배울래?\"",
    image: null,
    choices: [
      {
        label: "강해지는 법을 배운다 (민첩 4 필요)",
        next: "mael_power_lesson",
        requires: { agi: 4 }
      },
      {
        label: "위험을 줄이는 법을 배운다 (지혜 4 필요)",
        next: "mael_safety_lesson",
        requires: { wis: 4 }
      },
      {
        label: "바로 숲의 입구로 간다",
        next: "tarona_gate",
        requires: null
      }
    ]
  },
  {
    id: "mael_power_lesson",
    type: "scene",
    text: "마엘은 당신의 움직임을 잠깐 관찰하더니, 몸의 중심을 어떻게 써야 하는지 짧고 굵게 알려줍니다.\n\"패턴일수록 먼저 리듬을 잡아. 눈보다 몸이 먼저 반응하게.\"",
    image: null,
    choices: [
      {
        label: "몸이 가벼워진 느낌이다",
        next: "tarona_gate",
        requires: null
      }
    ]
  },
  {
    id: "mael_safety_lesson",
    type: "scene",
    text: "마엘은 실패 사례를 열거하며 언제 무리하지 말아야 하는지 기준을 알려줍니다.\n\"도망치는 게 나쁜 선택이 아니야. 다만, 언제 도망칠지를 아는 건 높은 지능에서 나온다.\"",
    image: null,
    choices: [
      {
        label: "머리가 조금 더 맑아진 느낌이다",
        next: "tarona_gate",
        requires: null
      }
    ]
  },
  {
    id: "tarona_gate",
    type: "scene",
    text: "숲의 관문 앞. 엘프 사냥꾼 타로나가 활을 겨눈 채 서 있습니다.\n타로나: \"멈춰. 이 이상은 진짜 그림자 구역이야. 가고 싶으면, 내 신뢰를 얻거나, 날 뚫고 가거나.\"",
    image: null,
    choices: [
      {
        label: "감염되지 않았다고 말한다",
        next: "tarona_check_qte",
        requires: null
      },
      {
        label: "무기를 내려놓고 신뢰를 구한다 (지혜 5 필요)",
        next: "tarona_trust_talk",
        requires: { wis: 5 }
      },
      {
        label: "그냥 뚫고 지나가겠다고 한다 (민첩 5 필요)",
        next: "tarona_force_qte",
        requires: { agi: 5 }
      }
    ]
  },
  {
    id: "tarona_check_qte",
    type: "qte",
    text: "타로나는 간단한 정화 의식을 펼칩니다.\n\"지금부터 내가 말하는 방향대로 네 기운을 돌려봐.\"",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "right"],
      baseTimeLimit: 2000,
      successNext: "tarona_check_success",
      failNext: "tarona_check_fail"
    }
  },
  {
    id: "tarona_check_success",
    type: "scene",
    text: "의식이 끝나자, 타로나의 눈빛이 조금 부드러워집니다.\n\"좋아. 최소한 지금은 괜찮아 보이네.\"",
    image: null,
    choices: [
      {
        label: "타로나와 함께 숲 안으로 들어간다",
        next: "gard_outpost_approach",
        requires: null
      }
    ]
  },
  {
    id: "tarona_check_fail",
    type: "scene",
    text: "기운이 꼬였습니다. 타로나가 즉시 화살을 겨눕니다.\n\"반응이 이상해. 네 안에 그림자 찌꺼기가 너무 많아.\"",
    image: null,
    choices: [
      {
        label: "해명하려 한다",
        next: "tarona_suspicious_talk",
        requires: null
      },
      {
        label: "바로 도망친다",
        next: "chase_qte",
        requires: null
      }
    ]
  },
  {
    id: "tarona_trust_talk",
    type: "scene",
    text: "당신은 차분하게 지금까지의 여정을 설명하고, 세릴과 아린, 마엘이 모두 증인임을 강조합니다.\n타로나는 한참을 바라보다가 활을 내립니다.\n\"입은 잘 털었네. 좋아, 믿어줄게. 하지만 중간에 이상해지면 바로 쏘겠어.\"",
    image: null,
    choices: [
      {
        label: "타로나와 함께 숲 안으로 들어간다",
        next: "gard_outpost_approach",
        requires: null
      }
    ]
  },
  {
    id: "tarona_force_qte",
    type: "qte",
    text: "당신은 대답 대신 전력으로 돌진합니다.\n타로나: \"해보자 이거지? 후회하지 마!\"",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2000,
      baseTarget: 20,
      successNext: "tarona_force_success",
      failNext: "tarona_force_fail"
    }
  },
  {
    id: "tarona_force_success",
    type: "scene",
    text: "당신은 화살 몇 발을 가까스로 피해내며 타로나 앞으로 파고듭니다.\n타로나가 놀란 표정을 짓더니 웃습니다.\n\"좋아, 인정. 그렇게까지 해서 가겠다면 나도 같이 가줄게.\"",
    image: null,
    choices: [
      {
        label: "타로나와 함께 숲 안으로 들어간다",
        next: "gard_outpost_approach",
        requires: null
      }
    ]
  },
  {
    id: "tarona_force_fail",
    type: "scene",
    text: "화살이 어깨를 스칩니다. 땅에 구르며 비명을 지릅니다.\n타로나: \"그래도 죽이진 않았어. 다시 선택해. 신뢰를 얻든지, 포기하든지.\"",
    image: null,
    choices: [
      {
        label: "다시 신뢰를 구해본다 (지혜 5 필요)",
        next: "tarona_trust_talk",
        requires: { wis: 5 }
      },
      {
        label: "여기서 포기하고 빈터로 돌아간다",
        next: "safe_clearing",
        requires: null
      }
    ]
  },
  {
    id: "tarona_suspicious_talk",
    type: "scene",
    text: "당신은 어떻게든 해명하려 하지만, 타로나의 눈빛은 쉽게 풀리지 않습니다.\n\"좋아. 그럼 시험 하나 더 하자. 진심이라면 버틸 수 있을 거야.\"",
    image: null,
    choices: [
      {
        label: "시험을 받아들인다",
        next: "tarona_check_qte",
        requires: null
      }
    ]
  },
  {
    id: "gard_outpost_approach",
    type: "scene",
    text: "숲 깊은 곳, 검게 그을린 대장간이 보입니다.\n거대한 망치를 든 인간—가르드가 불꽃 뒤에서 모습을 드러냅니다.\n그의 눈동자는 반쯤 그림자에 잠식되어 있지만, 아직 인간의 빛이 남아 있습니다.",
    image: null,
    choices: [
      {
        label: "먼저 말을 건다",
        next: "gard_talk_1",
        requires: null
      },
      {
        label: "바로 무기를 쥔다",
        next: "gard_battle_prep",
        requires: null
      }
    ]
  },
  {
    id: "gard_talk_1",
    type: "scene",
    text: "가르드: \"너… 날 기억하나…?\"\n아린이 갑자기 움찔합니다.\n\"저 사람… 예전에 우리한테 검을 쥐어주던 대장장이야.\"",
    image: null,
    choices: [
      {
        label: "기억난다고 말한다 (지혜 4 필요)",
        next: "gard_memory_route",
        requires: { wis: 4 }
      },
      {
        label: "기억나지 않는다고 솔직히 말한다",
        next: "gard_anger_prep",
        requires: null
      }
    ]
  },
  {
    id: "gard_memory_route",
    type: "scene",
    text: "당신은 예전 마을, 불꽃 냄새, 무거운 망치 소리를 떠올립니다.\n\"당신이 내게 첫 검을 쥐어줬어요. 아직도 손이 기억해요.\"\n가르드의 표정이 잠시 흔들립니다.",
    image: null,
    choices: [
      {
        label: "그를 설득해 함께 심장을 부수자고 한다",
        next: "gard_persuasion_qte",
        requires: null
      },
      {
        label: "죄를 끝내기 위해서라도 검을 들자고 한다",
        next: "gard_battle_prep",
        requires: null
      }
    ]
  },
  {
    id: "gard_anger_prep",
    type: "scene",
    text: "\"기억 못 한다…? 결국 너도… 나를 잊었군.\" \n그림자가 가르드의 팔을 타고 망치로 흘러듭니다.\n타로나: \"말 안 통해. 싸울 준비해.\"",
    image: null,
    choices: [
      {
        label: "전투 준비를 한다",
        next: "gard_battle_prep",
        requires: null
      }
    ]
  },
  {
    id: "gard_persuasion_qte",
    type: "qte",
    text: "당신은 말과 눈빛, 몸짓을 총동원해 가르드를 붙잡습니다.\n\"아직 늦지 않았어요. 같이 끝내요.\"\n흔들리는 마음을 읽어, 정확한 타이밍에 말을 던져야 합니다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "left", "down", "right"],
      baseTimeLimit: 1400,
      successNext: "gard_persuasion_success",
      failNext: "gard_persuasion_fail"
    }
  },
  {
    id: "gard_persuasion_success",
    type: "scene",
    text: "가르드의 망치가 바닥으로 떨어집니다. 그의 눈에서 그림자가 잠시 걷힙니다.\n\"그래… 마지막 한 번만. 함께… 심장을 부수자.\"\n타로나: \"와… 진짜 설득해냈네.\"",
    image: null,
    choices: [
      {
        label: "가르드와 함께 심장을 향해 나아간다",
        next: "heart_pre_all",
        requires: null
      }
    ]
  },
  {
    id: "gard_persuasion_fail",
    type: "scene",
    text: "말이 제대로 먹히지 않습니다. 가르드의 눈동자가 완전히 검게 물듭니다.\n\"이미 늦었어. 내 손은 너무 많은 피를 묻혔어.\"",
    image: null,
    choices: [
      {
        label: "더 이상 말로는 안 된다고 느낀다",
        next: "gard_battle_prep",
        requires: null
      }
    ]
  },
  {
    id: "gard_battle_prep",
    type: "scene",
    text: "가르드는 거대한 망치를 어깨에 멥니다.\n\"그림자를 부술 힘이 필요하다면, 먼저 날 넘어가야 해.\"",
    image: null,
    choices: [
      {
        label: "회피 위주의 전투를 한다 (민첩 4 필요)",
        next: "gard_battle_dodge_qte",
        requires: { agi: 4 }
      },
      {
        label: "패턴을 읽어 정면으로 받아친다 (지혜 4 필요)",
        next: "gard_battle_pattern_qte",
        requires: { wis: 4 }
      },
      {
        label: "무작정 덤벼든다",
        next: "gard_battle_bruteforce_qte",
        requires: null
      }
    ]
  },
  {
    id: "gard_battle_dodge_qte",
    type: "qte",
    text: "가르드의 망치가 번개처럼 휘둘러집니다.\n당신은 몸을 최대한 낮추고, 빈틈만 노려 빠져나가야 합니다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right", "up"],
      baseTimeLimit: 1700,
      successNext: "gard_battle_win",
      failNext: "gard_battle_hit"
    }
  },
  {
    id: "gard_battle_pattern_qte",
    type: "qte",
    text: "당신은 망치의 궤적과 그림자 에너지의 흐름을 눈으로 읽습니다.\n패턴을 이해해, 그 다음 위치로 미리 움직여야 합니다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "up", "right", "left"],
      baseTimeLimit: 1900,
      successNext: "gard_battle_win",
      failNext: "gard_battle_hit"
    }
  },
  {
    id: "gard_battle_bruteforce_qte",
    type: "qte",
    text: "당신은 생각 없이 돌진해 망치를 밀어붙입니다.\n힘 대 힘의 승부입니다. Z 키를 난타해 망치의 무게를 이겨내야 합니다!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 1800,
      baseTarget: 20,
      successNext: "gard_battle_win",
      failNext: "gard_battle_hit"
    }
  },
  {
    id: "gard_battle_hit",
    type: "scene",
    text: "망치가 옆구리를 스쳐 지나갑니다. 뼈가 부서질 듯한 통증이 밀려옵니다.\n그러나 가르드는 마지막 일격을 멈춥니다.\n\"그래… 여기까진 온 거면, 심장까지는 보내줄게. 대신… 난 여기 남겠다.\"",
    image: null,
    choices: [
      {
        label: "상처를 감싸쥐고 일어난다",
        next: "heart_pre_no_gard",
        requires: null
      }
    ]
  },
  {
    id: "gard_battle_win",
    type: "scene",
    text: "당신의 마지막 일격에 망치가 날아가고, 가르드가 무릎을 꿇습니다.\n그의 입가에 옅은 미소가 떠오릅니다.\n\"좋은… 타격이었어. 이 힘이라면… 심장도 부술 수 있겠군…\"",
    image: null,
    choices: [
      {
        label: "가르드를 남겨두고 심장으로 향한다",
        next: "heart_pre_no_gard",
        requires: null
      }
    ]
  },
  {
    id: "heart_pre_all",
    type: "scene",
    text: "당신, 아린, 마엘, 타로나, 가르드. 다섯 명이 그림자의 심장 앞에 섭니다.\n거대한 검은 구체가 심장처럼 꿈틀거리며 박동을 울립니다.\n아린: \"여기까지 온 거면… 결과가 어떻든, 후회 없지?\"\n가르드: \"끝을 내주자. 우리가 망친 것들의, 최소한 일부만이라도.\"",
    image: null,
    choices: [
      {
        label: "심장을 부수려 한다",
        next: "heart_destroy_qte",
        requires: null
      },
      {
        label: "심장의 힘을 이용하려 한다",
        next: "heart_use_prepare",
        requires: null
      }
    ]
  },
  {
    id: "heart_pre_no_gard",
    type: "scene",
    text: "당신, 아린, 마엘, 타로나. 네 명이 그림자의 심장 앞에 섭니다.\n가르드는 여기까지였습니다.\n마엘: \"통계적으로 말하면, 이건 거의 자살 행위야.\"\n타로나: \"입 닥쳐. 지금 필요한 건 각오지, 통계가 아니니까.\"",
    image: null,
    choices: [
      {
        label: "심장을 부수려 한다",
        next: "heart_destroy_qte",
        requires: null
      },
      {
        label: "심장의 힘을 이용하려 한다",
        next: "heart_use_prepare",
        requires: null
      }
    ]
  },
  {
    id: "heart_destroy_qte",
    type: "qte",
    text: "그림자의 심장이 폭주합니다.\n당신은 흑결정, 그림자 코어, 수많은 전투에서 얻은 감각을 총동원해 공허를 찢어야 합니다.\nZ 키를 마지막까지 연타하십시오!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2600,
      baseTarget: 22,
      successNext: "ending_heart_destroy",
      failNext: "heart_overload_fail"
    }
  },
  {
    id: "heart_overload_fail",
    type: "scene",
    text: "손이 멈춘 순간, 심장이 역으로 당신을 삼킵니다.\n아린의 손이 멀어져 갑니다.\n마엘의 목소리가 희미하게 들립니다. \"다음번엔… 더 나은 데이터를…\"",
    image: null,
    choices: [
      {
        label: "어둠 속으로 가라앉는다",
        next: "ending_shadow",
        requires: null
      }
    ]
  },
  {
    id: "heart_use_prepare",
    type: "scene",
    text: "당신은 심장을 바라보며 생각합니다.\n\"부수는 것만이 답일까? 이 힘을, 내가 쥐면 안 될까?\"\n그림자 심장은 조용히 당신을 초대합니다.\n\"드디어, 네가 내게 다가오는군.\"",
    image: null,
    choices: [
      {
        label: "심장을 받아들인다",
        next: "ending_shadow",
        requires: null
      },
      {
        label: "마지막 순간, 세릴을 떠올린다",
        next: "ending_ceryl_memory",
        requires: null
      }
    ]
  },
  {
    id: "ending_heart_destroy",
    type: "scene",
    text: "마침내 심장이 갈라집니다.\n검은 조각들이 흩어지면서, 계곡과 숲을 덮고 있던 그림자가 벗겨집니다.\n세릴이 위쪽에서 내려옵니다. 아직 완전히 회복되진 않았지만, 눈빛은 인간 그대로입니다.\n당신의 선택과 실패, 그리고 도전들이 이 숲과 사람들을 다시 살게 했습니다.",
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
    id: "ending_shadow",
    type: "scene",
    text: "당신은 그림자와 하나가 됩니다.\n더는 인간도, 괴물도 아닙니다.\n하지만 이제, 이 숲은 당신의 박동과 함께 움직입니다.\n누군가가 또다시 계곡 아래로 내려온다면, 이번에는 당신이 시험을 내릴 것입니다.",
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
    id: "ending_ceryl_memory",
    type: "scene",
    text: "마지막 순간, 당신은 위쪽에 남겨두었던 세릴의 얼굴을 떠올립니다.\n그의 미소, 그의 두려움, 그의 희망.\n당신은 심장을 부수지도, 완전히 받아들이지도 않습니다.\n대신 심장의 일부를 봉인한 채 숲 밖으로 나섭니다.\n당신의 가슴 속에는 언제든 다시 돌아와 선택을 이어갈 수 있는 두 번째 심장이 조용히 뛰고 있습니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아간다",
        next: "__restart__",
        requires: null
      }
    ]
  },

  /* 공통 사망 씬 */

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
