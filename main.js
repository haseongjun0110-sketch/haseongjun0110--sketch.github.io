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

    {
    id: "safe_clearing",
    type: "scene",
    text: "늑대에게서 가까스로 살아남은 끝에, 너는 작은 빈터에 도착한다.\n달빛이 내려앉은 이곳만큼은 잠시 숨을 고를 수 있을 것 같다.\n\n하지만 산 아래 계곡 쪽에서, 심장 박동 같은 둔탁한 진동이 전해진다.",
    image: null,
    choices: [
      {
        label: "오늘은 여기서 끝낸다 (데모 종료)",
        next: "__restart__",
        requires: null
      },
      {
        label: "심장 소리를 따라 계곡 아래로 내려간다",
        next: "valley_entrance",
        requires: null
      }
    ]
  },
  {
    id: "valley_entrance",
    type: "scene",
    text: "비탈을 따라 내려가자 안개가 더 짙어진다.\n그때, 누군가의 발소리가 들린다.\n\n흰 망토를 두른 여행자 아린, 병색이 완연한 기사 세릴, 책뭉치를 안은 학자 마엘이 모습을 드러낸다.",
    image: null,
    choices: [
      {
        label: "누구냐고 묻는다",
        next: "meet_companions",
        requires: null
      }
    ]
  },
  {
    id: "meet_companions",
    type: "scene",
    text: "아린: \"우린 계곡 아래 그림자의 심장을 찾고 있어. 너도 그 소리 들었지?\"\n세릴은 헉헉거리며 창을 짚고 선다. 피부 아래로 옅은 검은 실핏줄이 비친다.\n마엘: \"이대로 오래 걷게 하면 위험해. 선택해야 해.\"",
    image: null,
    choices: [
      {
        label: "세릴을 꽉 부축하고 빠르게 내려간다 (AGI 4 이상)",
        next: "escort_fast",
        requires: { agi: 4 }
      },
      {
        label: "세릴 상태를 먼저 자세히 본다 (WIS 4 이상)",
        next: "ceryl_check",
        requires: { wis: 4 }
      },
      {
        label: "말 대신 앞장서서 조심조심 내려간다",
        next: "descend_normal",
        requires: null
      }
    ]
  },
  {
    id: "escort_fast",
    type: "scene",
    text: "너는 세릴의 팔을 잡고 리듬을 맞춰 내려간다.\n아린이 뒤에서 웃는다. \"발걸음이 꽤 빠르네. 덕분에 체력이 덜 깎였어.\"",
    image: null,
    choices: [
      {
        label: "계곡 바닥으로 계속 내려간다",
        next: "shadow_shard",
        requires: null
      }
    ]
  },
  {
    id: "ceryl_check",
    type: "scene",
    text: "맥과 호흡, 피부 색을 찬찬히 살핀다.\n세릴의 혈관을 따라 검은 줄기가 천천히 올라오고 있다.\n마엘: \"지금 이 속도면, 한 번 더 큰 충격이 오면 위험해. 불필요한 싸움은 피하자.\"",
    image: null,
    choices: [
      {
        label: "조심조심 내려가되, 싸움은 피하기로 한다",
        next: "descend_careful",
        requires: null
      }
    ]
  },
  {
    id: "descend_careful",
    type: "scene",
    text: "너는 일부러 돌아가는 길을 택한다.\n시간은 조금 더 걸리지만, 계곡 아래에서 싸움이 터질 가능성은 줄어든다.",
    image: null,
    choices: [
      {
        label: "계곡 바닥으로 계속 내려간다",
        next: "shadow_shard",
        requires: null
      }
    ]
  },
  {
    id: "descend_normal",
    type: "scene",
    text: "굳이 말은 하지 않지만, 네 속도를 다른 사람들에 맞춘다.\n심장 소리는 점점 커진다.",
    image: null,
    choices: [
      {
        label: "계곡 바닥으로 계속 내려간다",
        next: "shadow_shard",
        requires: null
      }
    ]
  },
  {
    id: "shadow_shard",
    type: "scene",
    text: "계곡 바닥, 바위 틈에 검게 빛나는 결정 조각이 박혀 있다.\n손을 가까이 대자 진동이 손끝까지 파고든다.\n마엘: \"저게 이 구역의 작은 분신일지도 몰라. 건드릴 거야?\"",
    image: null,
    choices: [
      {
        label: "그냥 지나친다",
        next: "first_core_view",
        requires: null
      },
      {
        label: "조각을 뽑아 든다 (AGI 4 이상 추천)",
        next: "shard_qte",
        requires: { agi: 4 }
      }
    ]
  },
  {
    id: "shard_qte",
    type: "qte",
    text: "결정을 뽑는 순간, 그림자가 손을 타고 몸 안으로 밀려든다.\n흐름이 몸을 뒤틀어 버리기 전에, 방향을 바로잡아야 한다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "right", "left"],
      baseTimeLimit: 1800,
      successNext: "shard_stabilize",
      failNext: "shard_backlash"
    }
  },
  {
    id: "shard_stabilize",
    type: "scene",
    text: "너는 흐름을 간신히 제어해낸다.\n아린: \"방금 그거… 아무나 할 수 있는 건 아닌데?\"\n마엘: \"데이터 확보 완료. 나중에 비교해보지.\"",
    image: null,
    choices: [
      {
        label: "결정을 챙기고 앞으로 나아간다",
        next: "first_core_view",
        requires: null
      }
    ]
  },
  {
    id: "shard_backlash",
    type: "scene",
    text: "한순간 손이 미끄러지며 에너지가 역류한다.\n시야가 번쩍이고, 무릎이 꺾인다.\n타로나(어디선가 나타난 엘프 사냥꾼)가 너를 붙잡는다. \"처음이면 저 정도는 각오해야지.\"",
    image: null,
    choices: [
      {
        label: "이를 악물고 일어난다",
        next: "first_core_view",
        requires: null
      }
    ]
  },
  {
    id: "first_core_view",
    type: "scene",
    text: "조금 더 나아가자, 계곡 중앙에 검은 구체가 떠 있다.\n심장처럼 규칙적으로 뛰며, 주변 공기까지 출렁이게 만든다.\n아린: \"저게… 그림자의 심장 중 하나야?\"",
    image: null,
    choices: [
      {
        label: "가까이 다가가 패턴을 관찰한다 (WIS 4 이상)",
        next: "core_observe",
        requires: { wis: 4 }
      },
      {
        label: "일단 동료들을 정비시킨다",
        next: "core_camp",
        requires: null
      }
    ]
  },
  {
    id: "core_observe",
    type: "scene",
    text: "너는 거리를 유지한 채 구체의 맥을 눈으로 쫓는다.\n일정한 간격, 반복되는 파동. 마치 QTE 방향 패턴처럼 보인다.\n마엘: \"좋아. 저 리듬을 기억해두면 다음에 조금 더 버틸 수 있어.\"",
    image: null,
    choices: [
      {
        label: "패턴을 머릿속에 새기고 동료들에게 돌아간다",
        next: "core_camp",
        requires: null
      }
    ]
  },
  {
    id: "core_camp",
    type: "scene",
    text: "심장과 조금 떨어진 곳에 조그만 캠프를 친다.\n아린: \"여기서부터가 진짜야. 어떻게 갈지 정하자.\"",
    image: null,
    choices: [
      {
        label: "위험을 감수하고 지름길로 돌진 (AGI 6 이상)",
        next: "rush_path_qte",
        requires: { agi: 6 }
      },
      {
        label: "조금 돌아가더라도 안전한 루트 (WIS 5 이상)",
        next: "safe_path",
        requires: { wis: 5 }
      },
      {
        label: "중간 정도 난이도의 평범한 루트",
        next: "middle_path",
        requires: null
      }
    ]
  },
  {
    id: "rush_path_qte",
    type: "qte",
    text: "지름길은 발 디딜 곳이 좁고, 그림자 손이 가까이 뻗어 있다.\n순간순간 방향을 정확히 골라내야 한다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right", "up", "down"],
      baseTimeLimit: 1600,
      successNext: "rush_path_success",
      failNext: "rush_path_fail"
    }
  },
  {
    id: "rush_path_success",
    type: "scene",
    text: "너는 거의 미끄러지듯 길을 통과한다.\n타로나: \"저 정도 속도면 내 활보다 빠른데.\"",
    image: null,
    choices: [
      {
        label: "앞쪽에 보이는 불빛으로 다가간다",
        next: "gard_outpost",
        requires: null
      }
    ]
  },
  {
    id: "rush_path_fail",
    type: "scene",
    text: "발이 한 번 꼬인다. 그림자 손이 발목을 스친다.\n마엘: \"살긴 했지만, 이 이상 무리하면 위험하겠는데.\"",
    image: null,
    choices: [
      {
        label: "비틀거리며 계속 나아간다",
        next: "gard_outpost",
        requires: null
      }
    ]
  },
  {
    id: "safe_path",
    type: "scene",
    text: "너는 위험 패턴을 피해 돌아가는 길을 택한다.\n시간은 더 걸리지만 싸움은 적다.\n세릴의 호흡도 그나마 안정적이다.",
    image: null,
    choices: [
      {
        label: "멀리서 보이는 불빛으로 다가간다",
        next: "gard_outpost",
        requires: null
      }
    ]
  },
  {
    id: "middle_path",
    type: "scene",
    text: "너는 완전히 안전하지도, 완전히 위험하지도 않은 길을 고른다.\n어느 정도 싸움은 각오해야 한다.",
    image: null,
    choices: [
      {
        label: "잠시 후, 불빛이 보인다",
        next: "gard_outpost",
        requires: null
      }
    ]
  },
  {
    id: "gard_outpost",
    type: "scene",
    text: "검게 그을린 대장간이 계곡 바닥 한쪽에 박혀 있다.\n거대한 망치를 든 대장장이 가르드가 불꽃 뒤에서 모습을 드러낸다.\n그의 눈동자는 반쯤 그림자에 잠식되어 있다.",
    image: null,
    choices: [
      {
        label: "먼저 말을 건다 (WIS 4 이상)",
        next: "gard_talk_1",
        requires: { wis: 4 }
      },
      {
        label: "말 없이 무기를 쥔다",
        next: "gard_battle_intro",
        requires: null
      }
    ]
  },
  {
    id: "gard_talk_1",
    type: "scene",
    text: "가르드: \"너… 날 기억하나…?\"\n아린이 조용히 속삭인다. \"예전에 우리한테 검을 쥐어주던 대장장이야.\"",
    image: null,
    choices: [
      {
        label: "기억난다고 말한다 (WIS 6 이상)",
        next: "gard_memory_route",
        requires: { wis: 6 }
      },
      {
        label: "솔직히 기억나지 않는다고 말한다",
        next: "gard_anger_route",
        requires: null
      }
    ]
  },
  {
    id: "gard_memory_route",
    type: "scene",
    text: "너는 예전 마을과 불꽃 냄새, 무거운 망치 소리를 떠올린다.\n가르드의表情가 잠시 인간 쪽으로 기울어진다.",
    image: null,
    choices: [
      {
        label: "함께 심장을 부수자고 설득한다 (WIS 8 이상)",
        next: "gard_convince_qte",
        requires: { wis: 8 }   // 거의 맥스급 조건
      },
      {
        label: "그래도 네 손으로 이 싸움을 끝내겠다고 말한다",
        next: "gard_battle_intro",
        requires: null
      }
    ]
  },
  {
    id: "gard_anger_route",
    type: "scene",
    text: "\"기억 못 한다…? 결국 너도 나를 잊었군.\" \n그림자가 그의 팔을 타고 망치로 흘러든다.",
    image: null,
    choices: [
      {
        label: "싸움을 각오한다",
        next: "gard_battle_intro",
        requires: null
      }
    ]
  },
  {
    id: "gard_convince_qte",
    type: "qte",
    text: "너는 말과 표정, 숨 고르는 타이밍까지 다 써서 가르드의 마지막 인간성을 붙잡으려 한다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "left", "down", "right"],
      baseTimeLimit: 1400,
      successNext: "gard_join",
      failNext: "gard_battle_intro"
    }
  },
  {
    id: "gard_join",
    type: "scene",
    text: "가르드의 망치가 바닥으로 떨어진다.\n\"그래… 마지막 한 번 정도는, 같이 싸워줘도 되겠지.\"\n그는 네 옆에 선다.",
    image: null,
    choices: [
      {
        label: "가르드와 함께 심장 앞으로 간다",
        next: "heart_pre_with_gard",
        requires: null
      }
    ]
  },
  {
    id: "gard_battle_intro",
    type: "scene",
    text: "가르드는 망치를 어깨에 멘다.\n\"심장을 부수고 싶다면, 먼저 날 넘어서라.\"",
    image: null,
    choices: [
      {
        label: "회피 위주로 싸운다 (AGI 6 이상)",
        next: "gard_battle_agi_qte",
        requires: { agi: 6 }
      },
      {
        label: "패턴을 읽어 정면으로 받아친다 (WIS 5 이상)",
        next: "gard_battle_wis_qte",
        requires: { wis: 5 }
      },
      {
        label: "생각할 틈 없이 정면 돌진한다",
        next: "gard_battle_brute_qte",
        requires: null
      }
    ]
  },
  {
    id: "gard_battle_agi_qte",
    type: "qte",
    text: "망치가 번개처럼 휘둘러진다.\n네 몸이 반사적으로 비켜나야 한다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right", "up"],
      baseTimeLimit: 1700,
      successNext: "gard_down",
      failNext: "gard_hit"
    }
  },
  {
    id: "gard_battle_wis_qte",
    type: "qte",
    text: "너는 망치의 궤적과 그림자의 흐름을 읽는다.\n다음에 올 위치를 미리 잡아야 한다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "up", "right", "left"],
      baseTimeLimit: 1900,
      successNext: "gard_down",
      failNext: "gard_hit"
    }
  },
  {
    id: "gard_battle_brute_qte",
    type: "qte",
    text: "너는 숨 돌릴 틈도 없이 돌진한다.\n순수한 힘 싸움이다. Z키를 난타해 망치의 압력을 밀어낸다!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2000,
      baseTarget: 20,
      successNext: "gard_down",
      failNext: "gard_hit"
    }
  },
  {
    id: "gard_hit",
    type: "scene",
    text: "망치가 옆구리를 스친다. 숨이 턱 막힌다.\n그래도 가르드는 마지막 일격을 멈춘다.\n\"…여기까지 왔으면, 심장까지는 보내주지.\"",
    image: null,
    choices: [
      {
        label: "상처를 부여잡고 심장 앞으로 간다",
        next: "heart_pre_no_gard",
        requires: null
      }
    ]
  },
  {
    id: "gard_down",
    type: "scene",
    text: "마지막 타격에 망치가 날아가고, 가르드가 무릎을 꿇는다.\n그는 옅게 웃는다. \"좋은 타격이었어.\"",
    image: null,
    choices: [
      {
        label: "가르드를 뒤에 남겨두고 심장 앞으로 간다",
        next: "heart_pre_no_gard",
        requires: null
      }
    ]
  },
  {
    id: "heart_pre_with_gard",
    type: "scene",
    text: "너, 아린, 마엘, 세릴, 타로나, 가르드. 여섯 명이 심장 앞에 선다.\n커다란 검은 구체가 심장처럼 꿈틀거린다.",
    image: null,
    choices: [
      {
        label: "심장을 부수려 한다",
        next: "heart_break_qte",
        requires: null
      },
      {
        label: "심장의 힘을 이용하려 한다",
        next: "heart_use",
        requires: null
      }
    ]
  },
  {
    id: "heart_pre_no_gard",
    type: "scene",
    text: "너, 아린, 마엘, 세릴, 타로나. 다섯 명이 심장 앞에 선다.\n가르드는 여기까지였다.",
    image: null,
    choices: [
      {
        label: "심장을 부수려 한다",
        next: "heart_break_qte",
        requires: null
      },
      {
        label: "심장의 힘을 이용하려 한다",
        next: "heart_use",
        requires: null
      }
    ]
  },
  {
    id: "heart_break_qte",
    type: "qte",
    text: "심장이 폭주하기 시작한다.\n지금까지 버텨 온 모든 패턴과 감각을 총동원해 Z키를 난타해라!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 2600,
      baseTarget: 22,
      successNext: "ending_heart_break",
      failNext: "ending_shadow"
    }
  },
  {
    id: "heart_use",
    type: "scene",
    text: "너는 심장을 바라보며 생각한다.\n\"부수는 것만이 답일까? 이 힘을 내가 쥐면, 다시는 아무도 이런 일을 겪지 않게 할 수 있지 않을까.\"",
    image: null,
    choices: [
      {
        label: "심장을 받아들인다",
        next: "ending_shadow",
        requires: null
      },
      {
        label: "마지막 순간, 밖에 남겨둔 평범한 삶을 떠올린다 (WIS 7 이상)",
        next: "ending_leave",
        requires: { wis: 7 }
      }
    ]
  },
  {
    id: "ending_heart_break",
    type: "scene",
    text: "심장이 갈라지며 검은 조각이 빛 속으로 흩어진다.\n숲을 덮던 그림자가 벗겨지고, 계곡 공기가 맑아진다.\n너의 선택과 실패, 그리고 버틴 만큼의 QTE가 이 숲을 살렸다.",
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
    text: "너는 그림자와 하나가 된다.\n더는 인간도, 괴물도 아니다. 하지만 이제 이 숲은 너의 심장과 함께 뛴다.\n언젠가 또 누군가가 이곳에 내려올 때, 이번에는 네가 시험을 내릴 것이다.",
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
    id: "ending_leave",
    type: "scene",
    text: "너는 심장을 완전히 부수지도, 온전히 받아들이지도 않는다.\n대신 그 일부를 봉인하고, 숲 밖으로 돌아설 길을 선택한다.\n네 안에는 언제든 다시 돌아와 이 선택의続きを 할 수 있는 조용한 두 번째 심장이 남는다.",
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
