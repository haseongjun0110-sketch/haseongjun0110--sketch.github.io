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
    text: "Shadowed Ruins: 폐허의 용병단",
    image: null,
    choices: []
  },
  {
    id: "char_create",
    type: "charCreate",
    text:
      "당신은 작은 용병단의 일원입니다.\n" +
      "오늘의 임무는 정체불명의 그림자에게 파괴된 마을을 조사하는 것.\n\n" +
      "이름을 정하고, 당신이 어떤 전투 스타일을 선호하는지 떠올려 보세요.",
    image: null,
    choices: []
  },

  // ──────────────────────
  // 마을 폐허 진입
  // ──────────────────────
  {
    id: "intro_scene",
    type: "scene",
    text:
      "폐허가 된 마을은 이미 죽은 지 오래였습니다.\n" +
      "부서진 집과 구부러진 가로등 사이로, 죽음의 기운이 짙게 깔려 있습니다.\n\n" +
      "단장 아이린이 앞에서 멈춰 섭니다.\n" +
      "“상황이 심상치 않아. 방심하지 마.”",
    image: null,
    choices: [
      {
        label: "단장에게 다음 행동을 묻는다",
        next: "command_query",
        requires: null
      },
      {
        label: "주변의 그림자 움직임을 살핀다",
        next: "shadow_scan",
        requires: null
      }
    ]
  },
  {
    id: "command_query",
    type: "scene",
    text:
      "“단장님, 이제 어떻게 하죠?”\n\n" +
      "아이린은 짧게 숨을 고르고 말합니다.\n" +
      "“폐허 전체를 수색한다. 발칸이 선두에서 길을 연다.\n" +
      "카이와 엘라는 후방에서 지원.”\n\n" +
      "발칸은 무겁게 고개를 끄덕이고, 카이는 주변을 계산하듯 살핍니다.\n" +
      "엘라는 불안한 눈으로 당신을 봅니다.",
    image: null,
    choices: [
      {
        label: "발칸과 함께 선두에 선다",
        next: "ruin_advance",
        requires: null
      },
      {
        label: "엘라와 카이와 함께 후방을 맡는다",
        next: "rear_guard",
        requires: null
      }
    ]
  },
  {
    id: "shadow_scan",
    type: "scene",
    text:
      "당신은 시야를 좁혀 오로지 그림자만을 바라봅니다.\n" +
      "보통의 그림자는 움직이지 않지만… 이곳의 그림자는 숨을 쉬고 있습니다.\n\n" +
      "특히 폐허 깊숙한 곳에서, 거대한 무언가가 응축되는 기분 나쁜 박동이 느껴집니다.",
    image: null,
    choices: [
      {
        label: "모두에게 경고하고 후퇴를 주장한다",
        next: "retreat_argument",
        requires: null
      },
      {
        label: "혼자 그림자의 근원을 찾아 나선다",
        next: "deep_shadow_lure",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 후퇴 주장 & 급습 QTE
  // ──────────────────────
  {
    id: "retreat_argument",
    type: "scene",
    text:
      "“단장님, 지금 이대로 전진하면 죽습니다. 후퇴해야—”\n\n" +
      "“안 돼.” 아이린이 말을 끊습니다.\n" +
      "“우리가 물러서면, 누군가의 마지막 희망도 사라져.”\n\n" +
      "그 말이 끝나기도 전에, 발밑의 그림자가 폭발하듯 솟구칩니다.",
    image: null,
    choices: [
      {
        label: "다가오는 그림자의 급습을 피한다",
        next: "retreat_qte_entry",
        requires: null
      }
    ]
  },
  {
    id: "retreat_qte_entry",
    type: "qte",
    text: "거대한 그림자의 팔이 아이린을 향해 튀어나옵니다!\n방향키로 빠르게 피해야 합니다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "left", "right"],
      baseTimeLimit: 2500,
      successNext: "quick_dodge",
      failNext: "death_irene_fail"
    }
  },
  {
    id: "death_irene_fail",
    type: "death",
    text:
      "그림자의 팔이 아이린을 붙잡습니다.\n" +
      "“모두… 도망쳐…!”\n\n" +
      "단장의 목소리는 어둠 속으로 꺼져갑니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "quick_dodge",
    type: "scene",
    text:
      "당신은 반사적으로 아이린을 밀쳐내며 몸을 굴립니다.\n" +
      "어둠의 발톱이 허공에서 허망하게 스칩니다.\n\n" +
      "그림자는 방향을 틀어 뒤쪽의 마법사 카이를 향해 달려듭니다.",
    image: null,
    choices: [
      {
        label: "카이를 구하기 위해 몸을 던진다",
        next: "qte_kai_save",
        requires: null
      }
    ]
  },
  {
    id: "qte_kai_save",
    type: "qte",
    text:
      "카이는 얇은 마법 장막을 치지만, 그것만으로는 부족합니다.\n" +
      "전력을 다해 달려가 그를 끌어내야 합니다!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4000,
      baseTarget: 12,
      successNext: "kai_sacrifice",
      failNext: "death_kai_fail"
    }
  },
  {
    id: "death_kai_fail",
    type: "death",
    text:
      "당신의 손이 닿기 전, 그림자가 카이의 몸을 완전히 뒤덮습니다.\n" +
      "그의 비명은 몇 초 뒤, 완전한 침묵으로 바뀝니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "kai_sacrifice",
    type: "scene",
    text:
      "당신은 몸을 던져 그림자를 밀어내고 카이를 끌어당깁니다.\n" +
      "카이는 헉헉대며 한 방향을 손가락으로 가리킵니다.\n\n" +
      "“그림자가… 달아난다… 근원은… 저쪽이야…”",
    image: null,
    choices: [
      {
        label: "그림자를 쫓는다",
        next: "deep_shadow_lure",
        requires: null
      },
      {
        label: "발칸과 엘라 쪽으로 합류한다",
        next: "ruin_advance",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 후방 선택
  // ──────────────────────
  {
    id: "rear_guard",
    type: "scene",
    text:
      "당신은 후방에 남아 카이와 엘라를 지킵니다.\n" +
      "전방의 긴장감과는 다른, 기묘한 정적이 흐릅니다.\n\n" +
      "카이가 낮게 말합니다.\n" +
      "“뒤쪽 공기도 이상하군. 앞만 위험한 게 아니야.”",
    image: null,
    choices: [
      {
        label: "발칸과 합류하러 성당 쪽으로 이동한다",
        next: "ruin_advance",
        requires: null
      },
      {
        label: "뒤편의 더 깊은 그림자를 조사한다",
        next: "deep_shadow_lure",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 성당 앞
  // ──────────────────────
  {
    id: "ruin_advance",
    type: "scene",
    text:
      "부서진 스테인드글라스 조각들이 성당 앞 바닥에 흩어져 있습니다.\n" +
      "안쪽에서 인간도, 짐승도 아닌 울음소리가 울립니다.\n\n" +
      "발칸이 낮게 으르렁거립니다.\n" +
      "“들어간다. 지금이 아니면 늦는다.”\n" +
      "엘라는 양손을 모으고 떨리는 숨을 삼킵니다.",
    image: null,
    choices: [
      {
        label: "발칸이 문을 부수고 돌입하게 둔다",
        next: "cathedral_assault",
        requires: null
      },
      {
        label: "조용히 내부를 살피며 잠입한다",
        next: "cathedral_stealth",
        requires: null
      },
      {
        label: "엘라에게 치유 마법을 준비하게 한다",
        next: "protect_ella",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 엘라 보호 & QTE
  // ──────────────────────
  {
    id: "protect_ella",
    type: "scene",
    text:
      "엘라는 두 손을 모아 부드러운 빛을 모읍니다.\n" +
      "“치유 장막을 준비할게요… 조금만 시간 주세요.”\n\n" +
      "그때 성당 문이 쾅 하고 열리며, 그림자 괴물이 엘라를 향해 돌진합니다.",
    image: null,
    choices: [
      {
        label: "엘라를 향한 공격을 가로막는다",
        next: "qte_protect_ella",
        requires: null
      }
    ]
  },
  {
    id: "qte_protect_ella",
    type: "qte",
    text:
      "거대한 그림자 괴물이 엘라에게 달려듭니다!\n" +
      "방향키로 몸을 던져 그 사이를 비집고 들어가야 합니다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "left", "right"],
      baseTimeLimit: 2000,
      successNext: "balcan_hero",
      failNext: "death_ella_fail"
    }
  },
  {
    id: "death_ella_fail",
    type: "death",
    text:
      "당신이 한 발 늦었습니다.\n" +
      "괴물의 이빨이 엘라를 삼키고, 희미하게 빛나던 치유 마력도 함께 꺼집니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "balcan_hero",
    type: "scene",
    text:
      "당신이 괴물의 길을 막아선 사이, 발칸이 옆에서 뛰어들어 괴물의 몸통을 찍어버립니다.\n" +
      "엘라는 가까스로 목숨을 건집니다.\n\n" +
      "하지만 발칸의 팔에는 깊은 상처가 남습니다.\n" +
      "“괜찮다… 이 정도는, 아직 쓸 만해.”",
    image: null,
    choices: [
      {
        label: "엘라의 상처와 상태를 먼저 확인한다",
        next: "healing_choice",
        requires: null
      },
      {
        label: "발칸과 함께 괴물을 마무리하러 돌격한다",
        next: "final_fight_balcan",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 대돌입 루트
  // ──────────────────────
  {
    id: "cathedral_assault",
    type: "scene",
    text:
      "발칸이 성당 문을 박살내고 돌입합니다.\n" +
      "안에는 그림자에 갇힌 소녀와, 천장에 매달린 흡수체들이 보입니다.\n\n" +
      "순식간에 수십 개의 그림자가 떨어져 발칸을 덮칩니다.",
    image: null,
    choices: [
      {
        label: "전력을 다해 발칸을 지원한다",
        next: "qte_cathedral_assault",
        requires: null
      }
    ]
  },
  {
    id: "qte_cathedral_assault",
    type: "qte",
    text:
      "흡수체들이 한꺼번에 쏟아져 내립니다!\n" +
      "Z 키를 연타해 그 무게를 밀어내야 합니다!",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 5000,
      baseTarget: 15,
      successNext: "balcan_rage",
      failNext: "death_balcan_fail"
    }
  },
  {
    id: "death_balcan_fail",
    type: "death",
    text:
      "발칸은 그림자들에 깔려 더 이상 보이지 않습니다.\n" +
      "무거운 침묵만이 성당 안에 남습니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "balcan_rage",
    type: "scene",
    text:
      "당신의 지원 덕분에 쓰러지지 않은 발칸은\n" +
      "폭발하는 분노로 흡수체들을 하나씩 박살냅니다.\n\n" +
      "중앙에 갇혀 있던 소녀가 떨리는 목소리로 말합니다.\n" +
      "“제… 제발… 여기서 나가고 싶어요…”",
    image: null,
    choices: [
      {
        label: "소녀를 안고 즉시 후퇴한다",
        next: "end_girl_rescue",
        requires: null
      },
      {
        label: "소녀를 엘라에게 맡기고 다른 생존자를 수색한다",
        next: "search_for_irene",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 잠입 루트
  // ──────────────────────
  {
    id: "cathedral_stealth",
    type: "scene",
    text:
      "당신은 숨을 죽이고 성당 안으로 미끄러져 들어갑니다.\n" +
      "중앙에는 그림자 고리에 갇힌 소녀가 있고,\n" +
      "주변에는 흡수체들이 일정한 리듬으로 움직이고 있습니다.",
    image: null,
    choices: [
      {
        label: "위험을 감수하고 소녀에게 달려간다",
        next: "dash_to_girl",
        requires: null
      },
      {
        label: "흡수체들의 약점을 먼저 찾는다",
        next: "shadow_weakness",
        requires: null
      }
    ]
  },
  {
    id: "dash_to_girl",
    type: "scene",
    text:
      "심장이 요동치지만, 당신은 발걸음을 멈추지 않습니다.\n" +
      "소녀를 감싼 그림자 고리가 당신의 돌진을 감지하고 진동합니다.",
    image: null,
    choices: [
      {
        label: "강제로 고리를 찢고 소녀를 구출한다",
        next: "balcan_rage",
        requires: null
      },
      {
        label: "흡수체들과의 전투를 각오한다",
        next: "cathedral_assault",
        requires: null
      }
    ]
  },
  {
    id: "shadow_weakness",
    type: "scene",
    text:
      "흡수체들의 움직임을 유심히 관찰하자,\n" +
      "특정한 소리와 진동에 약하다는 걸 눈치챕니다.\n\n" +
      "치유 마법과의 상성이 떠오릅니다.",
    image: null,
    choices: [
      {
        label: "엘라에게 소리를 이용한 치유 마법을 쓰라 지시한다",
        next: "protect_ella",
        requires: null
      },
      {
        label: "그 약점을 노리고 직접 돌입한다",
        next: "cathedral_assault",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 깊은 그림자 루트
  // ──────────────────────
  {
    id: "deep_shadow_lure",
    type: "scene",
    text:
      "당신은 그림자를 따라 낡은 건물 안으로 들어섭니다.\n" +
      "공기는 눅눅하고, 한 곳으로 모든 어둠이 빨려 들어가는 느낌입니다.\n\n" +
      "갑자기 천장에서 거대한 촉수가 떨어져 당신을 내려칩니다.",
    image: null,
    choices: [
      {
        label: "촉수가 떨어지는 방향을 보고 피한다",
        next: "qte_shadow_tentacle",
        requires: null
      }
    ]
  },
  {
    id: "qte_shadow_tentacle",
    type: "qte",
    text:
      "촉수가 번개처럼 떨어집니다!\n" +
      "방향키로 한 순간의 틈을 찾아 몸을 빼야 합니다!",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "left", "right"],
      baseTimeLimit: 3000,
      successNext: "escape_success",
      failNext: "death_trap"
    }
  },
  {
    id: "death_trap",
    type: "death",
    text:
      "촉수가 당신의 몸을 감싸고, 깊은 그림자 속으로 끌고 들어갑니다.\n" +
      "빛은 점점 멀어져 갑니다.",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "escape_success",
    type: "scene",
    text:
      "당신은 가까스로 촉수를 피해 구르지만, 바닥이 무너져 지하로 떨어집니다.\n\n" +
      "지하실 중앙에는 검은 심장처럼 뛰는 ‘그림자 촉매’가 놓여 있습니다.",
    image: null,
    choices: [
      {
        label: "망설이지 않고 촉매를 파괴한다",
        next: "end_catalyst_destruction",
        requires: null
      },
      {
        label: "촉매를 조사해 정체를 파악한다",
        next: "catalyst_analysis",
        requires: null
      }
    ]
  },
  {
    id: "catalyst_analysis",
    type: "scene",
    text:
      "촉매에 손을 얹자, 차가운 맥동이 손끝으로 전해집니다.\n" +
      "이것은 그림자와 인간을 연결하는 고리.\n" +
      "부수면, 그 자리를 누군가의 생명으로 메워야 합니다.",
    image: null,
    choices: [
      {
        label: "일단 동료들에게 돌아가 이 정보를 알린다",
        next: "return_with_info",
        requires: null
      },
      {
        label: "당신이 그 자리를 대신 메우기로 결심한다",
        next: "end_catalyst_sacrifice",
        requires: null
      }
    ]
  },
  {
    id: "return_with_info",
    type: "scene",
    text:
      "당신은 촉매를 그대로 둔 채, 동료들에게 돌아가기로 합니다.\n" +
      "하지만 위에서는 이미 전투가 한창입니다.",
    image: null,
    choices: [
      {
        label: "발칸과 엘라 쪽으로 간다",
        next: "ruin_advance",
        requires: null
      },
      {
        label: "아이린의 행방을 먼저 찾는다",
        next: "search_for_irene",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 발칸과 마지막 전투
  // ──────────────────────
  {
    id: "final_fight_balcan",
    type: "scene",
    text:
      "당신과 발칸은 괴물의 핵을 향해 돌격합니다.\n" +
      "괴물의 울부짖음이 건물 전체를 뒤흔듭니다.",
    image: null,
    choices: [
      {
        label: "정면 돌파로 핵을 파괴한다",
        next: "crush_core",
        requires: null
      },
      {
        label: "발칸이 기회를 잡을 수 있도록 주의를 끈다",
        next: "distraction_strike",
        requires: null
      }
    ]
  },
  {
    id: "crush_core",
    type: "scene",
    text:
      "당신은 괴물의 공격을 정면으로 버텨내고,\n" +
      "발칸이 핵을 산산이 부수도록 길을 엽니다.\n\n" +
      "어둠의 울음이 끊기고, 성당은 무겁게 숨을 내쉽니다.\n\n" +
      "엔딩 C: 힘으로 얻은 승리",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "distraction_strike",
    type: "scene",
    text:
      "당신은 괴물의 시선을 끌기 위해 몸을 던집니다.\n" +
      "그 틈을 타 발칸이 핵을 강타합니다.\n\n" +
      "괴물은 쓰러지지만, 당신은 치명상을 입습니다.",
    image: null,
    choices: [
      {
        label: "엘라에게 치료를 부탁한다",
        next: "healing_choice",
        requires: null
      },
      {
        label: "최후의 힘을 짜내어 폐허를 수색한다",
        next: "search_for_irene",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 아이린 수색 & 촉매
  // ──────────────────────
  {
    id: "search_for_irene",
    type: "scene",
    text:
      "폐허의 중심부에서 아이린이 서 있는 것이 보입니다.\n" +
      "그녀의 뒤에는, 당신이 봤던 것과 같은 촉매가 뛰고 있습니다.\n" +
      "아이린의 몸은 이미 반쯤 그림자에 잠식돼 있습니다.\n\n" +
      "“촉매를… 파괴해… 부탁이야…”",
    image: null,
    choices: [
      {
        label: "엘라의 힘을 빌려 아이린을 치료한다",
        next: "save_irene",
        requires: null
      },
      {
        label: "아이린의 뜻대로 촉매를 파괴한다",
        next: "end_catalyst_destruction",
        requires: null
      }
    ]
  },
  {
    id: "save_irene",
    type: "scene",
    text:
      "엘라의 치유 마법이 아이린의 몸을 감싸며\n" +
      "그림자의 잠식을 억누릅니다.\n\n" +
      "아이린은 겨우 숨을 고르며 말합니다.\n" +
      "“살아남았군… 하지만, 이 상처는 오래 갈 거야.”\n\n" +
      "엔딩 B: 일시적 평화",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 촉매 엔딩들
  // ──────────────────────
  {
    id: "end_catalyst_sacrifice",
    type: "scene",
    text:
      "당신은 촉매에 손을 얹고, 그 안으로 몸을 던지듯 깊이 파고듭니다.\n" +
      "차가운 맥동이 당신의 심장을 삼킵니다.\n\n" +
      "재앙은 멈추었지만, 당신이라는 존재도 함께 사라집니다.\n\n" +
      "엔딩 A: 고독한 구원",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "end_catalyst_destruction",
    type: "scene",
    text:
      "당신은 촉매를 산산이 부숩니다.\n" +
      "어둠의 에너지가 폭발하듯 사라지고, 동료들이 당신을 끌어냅니다.\n\n" +
      "그러나 촉매의 파편은 어딘가로 흩어졌습니다.\n" +
      "위기는 넘겼지만, 뿌리는 완전히 사라지지 않았습니다.\n\n" +
      "엔딩 B: 일시적 평화",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 치유 & 소녀 엔딩
  // ──────────────────────
  {
    id: "healing_choice",
    type: "scene",
    text:
      "엘라의 치유 마법이 상처를 봉합합니다.\n" +
      "모두가 지쳐 있지만, 최소한 오늘의 재앙은 멈췄습니다.\n\n" +
      "엔딩 B: 일시적 평화",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },
  {
    id: "end_girl_rescue",
    type: "scene",
    text:
      "당신은 소녀를 품에 안고 폐허를 빠져나옵니다.\n" +
      "뒤돌아본 마을은 여전히 잿더미지만,\n" +
      "소녀의 눈동자 속에는 아직 희망의 빛이 남아 있습니다.\n\n" +
      "엔딩 D: 새로운 시작",
    image: null,
    choices: [
      {
        label: "처음으로 돌아가기",
        next: "__restart__",
        requires: null
      }
    ]
  },

  // ──────────────────────
  // 공통 데스 처리용
  // ──────────────────────
  {
    id: "death_generic",
    type: "death",
    text:
      "너의 의식은 어둠 속으로 가라앉았습니다.\n\n" +
      "너무 많은 상처를 입었고,\n" +
      "폐허를 뒤덮은 그림자가 마지막 숨결까지 삼켜버립니다.",
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
