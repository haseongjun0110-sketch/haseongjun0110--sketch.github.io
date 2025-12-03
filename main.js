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
    text: "Glass Line: 기업의 심장",
    image: null,
    choices: []
  },
  {
    id: "char_create",
    type: "charCreate",
    text:
      "너는 정보전을 전문으로 하는 프리랜서 용병이다.\n" +
      "이번 계약은, 가족의 병원비 전액을 대가로 경쟁사 B 회장을 무너뜨리는 것.\n\n" +
      "이름을 정하고, 어느 쪽에 더 특화된 사람인지 떠올려라.\n" +
      "민첩은 상황판단과 손놀림, 지혜는 해킹과 판짜기, 체력은 버티는 힘을 의미한다.",
    image: null,
    choices: []
  },

  // ──────────────────────
  // 브리핑 & 첫 허브
  // ──────────────────────
  {
    id: "intro_scene",
    type: "scene",
    text:
      "새벽, 비 내리는 공사장 옥상.\n" +
      "기업 A의 부사장이 담배를 비틀어 끄며 너를 돌아본다.\n\n" +
      "“문건 하나만 가져와. B사 회장의 개인 금고에 들어있어.”\n" +
      "“그걸로 회장을 내려앉히고, 회사도 반쯤은 같이 무너뜨릴 거다.”\n\n" +
      "그의 눈빛이 잠시 흐릿해졌다가, 다시 차갑게 식는다.\n" +
      "“대신, 네 가족 병원비는 우리가 끝까지 책임진다. 도와주는 게 아니라… 거래야.”",
    image: null,
    choices: [
      {
        label: "“조건만 지키면 된다.”",
        next: "route_hub",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "“문건이 정확히 뭔지는 말 안 해줄 거냐.”",
        next: "route_hub",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  {
    id: "route_hub",
    type: "scene",
    text:
      "B사 본사 야경이 아래로 펼쳐진다.\n" +
      "손에는 대충 그려진 도면 한 장과, 불완전한 정보 몇 조각뿐.\n\n" +
      "어디부터 파고들지 정해야 한다.",
    image: null,
    choices: [
      {
        label: "야간 트래픽을 타고 네트워크부터 뚫는다 (해킹)",
        next: "hack_intro",
        requires: {
          flags: [
            { key: "flag_route_hack_locked", not: true }
          ]
        }
      },
      {
        label: "건물 안으로 직접 잠입한다 (잠입)",
        next: "infil_intro",
        requires: {
          flags: [
            { key: "flag_route_infil_locked", not: true }
          ]
        }
      },
      {
        label: "B사 인사팀 인간 하나를 납치해 털어본다 (납치·심문)",
        next: "kidnap_intro",
        requires: {
          flags: [
            { key: "flag_route_kidnap_locked", not: true }
          ]
        }
      },
      {
        label: "더 이상 시도할 방법이 없다",
        next: "bad_all_routes_failed",
        requires: {
          flags: [
            { key: "flag_route_hack_locked", value: true },
            { key: "flag_route_infil_locked", value: true },
            { key: "flag_route_kidnap_locked", value: true }
          ]
        }
      }
    ]
  },

  // ──────────────────────
  // 해킹 루트
  // ──────────────────────
  {
    id: "hack_intro",
    type: "scene",
    text:
      "인근 빌딩 옥상, 노트북과 안테나를 펼친다.\n" +
      "B사 건물에서 새어 나오는 무선 트래픽이 밤공기처럼 넘실거린다.\n\n" +
      "어떻게 물꼬를 틀까.",
    image: null,
    choices: [
      {
        label: "무선 AP를 통째로 가로채 인증 토큰을 훔친다",
        next: "qte_hack_sniff",
        requires: null
      },
      {
        label: "직원 VPN을 흉내 내어 조용히 파고든다",
        next: "qte_hack_vpn",
        requires: null
      }
    ]
  },

  {
    id: "qte_hack_sniff",
    type: "qte",
    text:
      "보안팀 스캐너가 주파수 대역을 훑는다.\n" +
      "탐지선을 피해가며 패킷을 긁어야 한다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "left", "right"],
      baseTimeLimit: 2500,
      targetCount: 2,
      successNext: "hack_sniff_success",
      failNext: "hack_sniff_fail"
    }
  },
  {
    id: "hack_sniff_success",
    type: "scene",
    text:
      "인증 토큰 몇 개가 손에 들어온다.\n" +
      "그 중 하나엔 회장 개인 단말로 보이는 식별자가 붙어 있다.\n\n" +
      "이걸로 내부 메일 서버를 두드려볼 수 있겠다.",
    image: null,
    choices: [
      {
        label: "내부 메일 서버에 접속해 본다",
        next: "hack_mail_access",
        requires: null,
        setFlags: {
          flag_route_hack_cleared: true,
          flag_info_mail: true
        }
      },
      {
        label: "일단 다른 루트와 병행하기 위해 물러난다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_hack_cleared: true
        }
      }
    ]
  },
  {
    id: "hack_sniff_fail",
    type: "scene",
    text:
      "경고 로그가 쌓이는 소리가 귀에 들리는 듯하다.\n" +
      "모니터에 보안 팀의 역추적 IP가 찍힌다.\n\n" +
      "더 이상 이 채널은 위험하다.",
    image: null,
    choices: [
      {
        label: "장비를 접고 다른 방법을 찾는다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_hack_locked: true,
          flag_crime_exposed: true
        }
      }
    ]
  },

  {
    id: "qte_hack_vpn",
    type: "qte",
    text:
      "직원들의 평소 접속 패턴을 흉내 낸다.\n" +
      "미묘한 타이밍 차이를 맞추지 못하면 바로 튕겨나간다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4000,
      baseTarget: 15,
      successNext: "hack_vpn_success",
      failNext: "hack_vpn_fail"
    }
  },
  {
    id: "hack_vpn_success",
    type: "scene",
    text:
      "로그인이 성공한다.\n" +
      "임원 캘린더에 ‘비공개 일정’이 줄지어 있다.\n" +
      "그 중 하나: “47F 별관 – 개인 금고 점검”.",
    image: null,
    choices: [
      {
        label: "별관 층 정보를 머릿속에 새기고 빠져나온다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_hack_cleared: true,
          flag_info_schedule: true
        }
      },
      {
        label: "지금 바로 이 정보로 심층 서버에 더 들어가 본다",
        next: "mid_access_server",
        requires: null,
        setFlags: {
          flag_route_hack_cleared: true,
          flag_info_schedule: true
        }
      }
    ]
  },
  {
    id: "hack_vpn_fail",
    type: "scene",
    text:
      "접속이 튕기고, 화면에 `다중 로그인 시도 감지` 메시지가 뜬다.\n" +
      "누군가 이 라인을 타고 네 쪽으로 오고 있을지도 모른다.",
    image: null,
    choices: [
      {
        label: "즉시 접속을 끊고 다른 방법을 찾는다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_hack_locked: true
        }
      }
    ]
  },

  {
    id: "hack_mail_access",
    type: "scene",
    text:
      "메일함을 훑자, 회장과 A사 간부 사이의 오래된 메일 쓰레드가 드러난다.\n" +
      "싸우고, 화해하고, 다시 싸우는 문장들.\n\n" +
      "“당신이 내 회사를 이해해줄 줄 알았어.”\n" +
      "“그건 당신 집착을 덮어주는 말이 아니야.”",
    image: null,
    choices: [
      {
        label: "로그를 저장하고 한 발 물러난다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_hack_cleared: true,
          flag_info_mail: true
        }
      }
    ]
  },

  // ──────────────────────
  // 잠입 루트
  // ──────────────────────
  {
    id: "infil_intro",
    type: "scene",
    text:
      "야간 출입문. 경비 둘이 졸림을 참으며 CCTV를 훑고 있다.\n" +
      "너는 후드를 눌러쓰고 건물 그림자에 붙는다.",
    image: null,
    choices: [
      {
        label: "경비 교대 타이밍에 맞춰 로비를 통과한다",
        next: "qte_infil_lobby",
        requires: null
      },
      {
        label: "외벽 청소용 작업대에 매달려 3층까지 올라간다",
        next: "qte_infil_wall",
        requires: null
      }
    ]
  },

  {
    id: "qte_infil_lobby",
    type: "qte",
    text:
      "교대 종이 울린다.\n" +
      "카메라 사각지대를 타고 움직이지 못하면, 그대로 얼굴이 찍힌다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right"],
      baseTimeLimit: 2500,
      targetCount: 2,
      successNext: "infil_lobby_success",
      failNext: "infil_lobby_fail"
    }
  },
  {
    id: "infil_lobby_success",
    type: "scene",
    text:
      "무사히 로비를 통과한다.\n" +
      "인적 없는 복도 끝에 ‘임원 전용층’ 표시가 걸린 엘리베이터가 보인다.",
    image: null,
    choices: [
      {
        label: "임원 전용 엘리베이터를 따라가 본다",
        next: "infil_exec_floor",
        requires: null,
        setFlags: { flag_route_infil_cleared: true }
      }
    ]
  },
  {
    id: "infil_lobby_fail",
    type: "scene",
    text:
      "카메라가 딱 너를 향해 돌아온다.\n" +
      "경보음이 울리기 시작한다. 문 앞 경비의 시선이 너와 마주친다.",
    image: null,
    choices: [
      {
        label: "몸을 돌려 어둠 속으로 튄다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_infil_locked: true,
          flag_crime_exposed: true
        }
      }
    ]
  },

  {
    id: "qte_infil_wall",
    type: "qte",
    text:
      "낡은 작업대가 삐걱거린다.\n" +
      "떨어지지 않으려면 몸의 중심을 계속 조정해야 한다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4500,
      baseTarget: 14,
      successNext: "infil_wall_success",
      failNext: "infil_wall_fail"
    }
  },
  {
    id: "infil_wall_success",
    type: "scene",
    text:
      "3층 발코니 난간을 잡고 몸을 끌어올린다.\n" +
      "유리창 너머로 회장실 비서석과 문이 보인다.",
    image: null,
    choices: [
      {
        label: "자물쇠를 따고 안으로 들어간다",
        next: "infil_exec_floor",
        requires: null,
        setFlags: { flag_route_infil_cleared: true }
      }
    ]
  },
  {
    id: "infil_wall_fail",
    type: "scene",
    text:
      "작업대가 크게 흔들리고, 너는 비명을 삼킨 채 바닥으로 떨어진다.\n" +
      "뼈가 부러진 느낌이지만, 일단 살아는 있다.",
    image: null,
    choices: [
      {
        label: "이대로 계속했다간 죽는다. 돌아간다",
        next: "route_hub",
        requires: null,
        setFlags: { flag_route_infil_locked: true }
      }
    ]
  },

  {
    id: "infil_exec_floor",
    type: "scene",
    text:
      "회장실 앞 복도.\n" +
      "장식장 속 가족 사진 중 하나에서, 네 고용주와 닮은 얼굴이 보인다.\n\n" +
      "A사 간부의 이름이 떠오른다.",
    image: null,
    choices: [
      {
        label: "사진을 찍어두고 떠난다",
        next: "route_hub",
        requires: null,
        setFlags: { flag_info_phone: true }
      },
      {
        label: "서류함을 뒤져 더 많은 단서를 찾는다",
        next: "infil_docs",
        requires: null
      }
    ]
  },
  {
    id: "infil_docs",
    type: "scene",
    text:
      "서류함에는 ‘가사 조정 합의서’ 초안이 끼워져 있다.\n" +
      "회장 배우자의 이름과 A사 직함이 또렷하게 적혀 있다.\n\n" +
      "회사 싸움인 줄 알았던 일이, 누군가의 집안 싸움과 겹쳐진다.",
    image: null,
    choices: [
      {
        label: "문건을 찍어두고 조용히 철수한다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_info_mail: true,
          flag_route_infil_cleared: true
        }
      },
      {
        label: "이 정보만으로도 서버를 더 깊이 찔러본다",
        next: "mid_access_server",
        requires: null,
        setFlags: {
          flag_info_mail: true,
          flag_route_infil_cleared: true
        }
      }
    ]
  },

  // ──────────────────────
  // 납치·심문 루트
  // ──────────────────────
  {
    id: "kidnap_intro",
    type: "scene",
    text:
      "야간 버스 정류장.\n" +
      "B사 ID 카드를 목에 건 인사팀 직원이 피곤한 얼굴로 서 있다.\n" +
      "이런 인간이 가장 많은 걸 알고 있으면서도, 가장 약하다.",
    image: null,
    choices: [
      {
        label: "뒤에서 덮쳐 골목으로 끌고 들어간다 (강경)",
        next: "qte_kidnap_grab",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "“담배 한 개비 빌릴 수 있냐”고 말을 걸며 자연스럽게 파고든다",
        next: "qte_kidnap_soft",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  {
    id: "qte_kidnap_grab",
    type: "qte",
    text:
      "정류장 CCTV 사각지대를 정확히 맞춰야 한다.\n" +
      "타이밍을 놓치면 그대로 신고다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["down", "left", "right"],
      baseTimeLimit: 2500,
      targetCount: 2,
      successNext: "kidnap_hard_success",
      failNext: "kidnap_hard_fail"
    }
  },
  {
    id: "kidnap_hard_success",
    type: "scene",
    text:
      "직원의 입과 눈을 막은 채 골목으로 끌고 들어간다.\n" +
      "몇 번의 위협 끝에 그가 토해낸 이름은… A사 간부의 이름이다.\n" +
      "“회장님이랑… 그 사람이… 예전에….”",
    image: null,
    choices: [
      {
        label: "주소와 더러운 뒷얘기까지 캐낸다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_kidnap_cleared: true,
          flag_info_phone: true,
          flag_crime_exposed: true
        }
      }
    ]
  },
  {
    id: "kidnap_hard_fail",
    type: "scene",
    text:
      "직원이 비명을 지르며 몸부림친다.\n" +
      "근처에서 누군가 휴대폰을 꺼내는 소리가 들린다.\n" +
      "멀리서 경광등 소리가 들려오는 것 같다.",
    image: null,
    choices: [
      {
        label: "손을 떼고 골목을 빠져나간다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_kidnap_locked: true,
          flag_crime_exposed: true
        }
      }
    ]
  },

  {
    id: "qte_kidnap_soft",
    type: "qte",
    text:
      "대화의 리듬을 맞춘다.\n" +
      "그가 의심하기 전에 자연스럽게 회장 이야기를 꺼내야 한다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 5000,
      baseTarget: 13,
      successNext: "kidnap_soft_success",
      failNext: "kidnap_soft_fail"
    }
  },
  {
    id: "kidnap_soft_success",
    type: "scene",
    text:
      "그는 한숨을 쉬며 말한다.\n" +
      "“회장님 사생활이 좀 복잡하긴 하죠… 예전에 A사 쪽이랑…”\n" +
      "술김에 내뱉은 말이라지만, 퍼즐 조각은 또 하나 모인다.",
    image: null,
    choices: [
      {
        label: "더 묻지 않고, 이 정도 정보만 챙겨 떠난다",
        next: "route_hub",
        requires: null,
        setFlags: {
          flag_route_kidnap_cleared: true,
          flag_info_mail: true
        }
      }
    ]
  },
  {
    id: "kidnap_soft_fail",
    type: "scene",
    text:
      "그는 얼굴을 찡그리며 한 발 물러선다.\n" +
      "“죄송한데, 이런 얘기 불편하네요.”\n" +
      "조금 뒤, 그가 휴대폰으로 누군가에게 전화를 건다.",
    image: null,
    choices: [
      {
        label: "역효과다. 더 엮이면 안 된다",
        next: "route_hub",
        requires: null,
        setFlags: { flag_route_kidnap_locked: true }
      }
    ]
  },

  // ──────────────────────
  // 모든 루트 실패 BAD END
  // ──────────────────────
  {
    id: "bad_all_routes_failed",
    type: "scene",
    text:
      "해킹은 막혔고, 잠입은 들켰고,\n" +
      "사람 하나 붙잡아보는 것마저 역효과였다.\n\n" +
      "손에 쥔 건 아무 것도 없고, 시간만 흘렀다.",
    image: null,
    choices: [
      {
        label: "계약은 실패했다…",
        next: "end_bad_contract_fail",
        requires: null
      }
    ]
  },
  {
    id: "end_bad_contract_fail",
    type: "scene",
    text:
      "기업 A는 아무 말 없이 연락을 끊었다.\n" +
      "병원비 고지서는 계속 쌓여간다.\n\n" +
      "이번 판에서, 넌 아무 것도 지키지 못했다.",
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
  // 중반: 서버 심층 접근 & B 용병 접촉
  // ──────────────────────
  {
    id: "mid_access_server",
    type: "scene",
    text:
      "모아둔 조각들을 이어 붙이자,\n" +
      "B사 중앙 서버의 정확한 주소와 포트가 떠오른다.\n\n" +
      "이제, 회사의 심장부를 직접 찌를 차례다.",
    image: null,
    choices: [
      {
        label: "임원 메일 서버를 집중적으로 훑어본다",
        next: "qte_mid_mail_breach",
        requires: null
      },
      {
        label: "임원용 메신저 로그를 파고든다",
        next: "qte_mid_chat_breach",
        requires: null
      }
    ]
  },

  {
    id: "qte_mid_mail_breach",
    type: "qte",
    text:
      "패킷 사이로 누군가의 눈길 같은 게 느껴진다.\n" +
      "누군가 너를 역추적하고 있다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "down", "left", "right"],
      baseTimeLimit: 3000,
      targetCount: 2,
      successNext: "mid_mail_success",
      failNext: "mid_mail_fail"
    }
  },
  {
    id: "mid_mail_success",
    type: "scene",
    text:
      "메일 한 묶음이 열리며,\n" +
      "회장과 A사 간부 사이의 오래된 메일 쓰레드가 드러난다.\n" +
      "비즈니스 보고라기보다, 거의 부부싸움에 가까운 감정의 폭발이다.",
    image: null,
    choices: [
      {
        label: "둘의 감정사를 대략 짐작하며 로그를 저장한다",
        next: "mid_b_merc_contact",
        requires: null,
        setFlags: { flag_info_mail: true }
      }
    ]
  },
  {
    id: "mid_mail_fail",
    type: "scene",
    text:
      "화면이 검게 깜빡이고, 시스템 메시지가 뜬다.\n" +
      "`침입자 탐지 – 연결 종료`\n\n" +
      "누군가 네 IP를 따라오고 있을지도 모른다.",
    image: null,
    choices: [
      {
        label: "케이블을 뽑고 숨을 죽인다",
        next: "mid_b_merc_contact",
        requires: null,
        setFlags: { flag_crime_exposed: true }
      }
    ]
  },

  {
    id: "qte_mid_chat_breach",
    type: "qte",
    text:
      "실시간으로 오가는 채팅창 사이를 헤집는다.\n" +
      "잘못 건드리면, 네 패킷이 대화창에 그대로 찍힌다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4500,
      baseTarget: 15,
      successNext: "mid_chat_success",
      failNext: "mid_chat_fail"
    }
  },
  {
    id: "mid_chat_success",
    type: "scene",
    text:
      "‘내가 그런 식으로 회사 운영하라고 했어?’\n" +
      "‘우리는 직원들 삶도 책임져야 한다고 했잖아.’\n\n" +
      "A사 간부 ID와 회장 ID가 서로를 비난하는 대화가 보인다.\n" +
      "비즈니스가 아니라, 오래된 관계의 균열처럼 보인다.",
    image: null,
    choices: [
      {
        label: "로그를 캡쳐하고 연결을 끊는다",
        next: "mid_b_merc_contact",
        requires: null,
        setFlags: { flag_info_mail: true }
      }
    ]
  },
  {
    id: "mid_chat_fail",
    type: "scene",
    text:
      "채팅창에 정체불명의 문자열이 찍힌다.\n" +
      "곧바로 ‘누구야?’라는 메시지가 따라온다.\n" +
      "그 직후, 연결이 강제로 끊긴다.",
    image: null,
    choices: [
      {
        label: "망했다. 이건 들켰다",
        next: "mid_b_merc_contact",
        requires: null,
        setFlags: { flag_crime_exposed: true }
      }
    ]
  },

  {
    id: "mid_b_merc_contact",
    type: "scene",
    text:
      "이어폰에서 낯선 목소리가 들린다.\n" +
      "“너, 여기서 뭐 하는지 알아.”\n" +
      "“이 라인을 계속 쓰면, 네 가족 사진부터 털릴 거다.”\n\n" +
      "목소리는 정확히 네가 뭘 하고 있었는지 읊는다. B사 용병이다.",
    image: null,
    choices: [
      {
        label: "“너희 회장이 뭘 숨기는지 알게 되면 말이 달라질 거다.”",
        next: "mid_b_merc_argue",
        requires: null
      },
      {
        label: "통신을 끊고 현장 쪽 루트에 집중한다",
        next: "pre_final_infil",
        requires: null
      }
    ]
  },

  {
    id: "mid_b_merc_argue",
    type: "scene",
    text:
      "“숨기는 건 어느 쪽인데?”\n" +
      "“네 고용주, A사 간부. 그 인간이 우리 회장의 배우자였어.”\n" +
      "“넌 지금, 그 인간의 질투와 복수심을 대신 처리하는 도구야.”\n\n" +
      "목소리는 차갑지만, 분노보다 피로가 묻어 있다.",
    image: null,
    choices: [
      {
        label: "“그래도 내 가족은 지켜야 해.”",
        next: "pre_final_infil",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "“…그래서 너희는 방어만 한다는 거냐.”",
        next: "pre_final_infil",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  // ──────────────────────
  // 최종 침입
  // ──────────────────────
  {
    id: "pre_final_infil",
    type: "scene",
    text:
      "모아진 단서들은 하나의 좌표를 가리킨다.\n" +
      "B사 별관 47층, 개인 금고.\n\n" +
      "거기에 회장의 치부와, A사 간부의 사적인 칼날이 함께 잠들어 있다.",
    image: null,
    choices: [
      {
        label: "엘리베이터를 해킹해 47층까지 직행한다",
        next: "qte_final_elevator",
        requires: null
      },
      {
        label: "계단을 이용해 경비를 피해 올라간다",
        next: "qte_final_stairs",
        requires: null
      }
    ]
  },

  {
    id: "qte_final_elevator",
    type: "qte",
    text:
      "엘리베이터 패널이 빨갛게 깜빡인다.\n" +
      "접근권한을 위조하지 못하면, 1층 보안실로 직행이다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4000,
      baseTarget: 15,
      successNext: "final_elevator_success",
      failNext: "final_elevator_fail"
    }
  },
  {
    id: "final_elevator_success",
    type: "scene",
    text:
      "엘리베이터 문이 조용히 닫히고,\n" +
      "47층 숫자가 불이 들어온다.\n" +
      "이 위에, 네가 찾던 모든 답이 있다.",
    image: null,
    choices: [
      {
        label: "금고층 복도로 나선다",
        next: "final_b_merc_confront",
        requires: null
      }
    ]
  },
  {
    id: "final_elevator_fail",
    type: "scene",
    text:
      "엘리베이터가 1층 보안실로 내려가기 시작한다.\n" +
      "이대로면 구속이다.",
    image: null,
    choices: [
      {
        label: "비상 정지 레버를 강제로 당겨 버린다",
        next: "final_elevator_brake",
        requires: null
      }
    ]
  },
  {
    id: "final_elevator_brake",
    type: "scene",
    text:
      "경보음과 함께 엘리베이터가 급정지한다.\n" +
      "그 사이를 틈타, 너는 위층으로 향하는 계단을 향해 달린다.",
    image: null,
    choices: [
      {
        label: "계단을 통해 47층까지 올라간다",
        next: "qte_final_stairs",
        requires: null,
        setFlags: { flag_crime_exposed: true }
      }
    ]
  },

  {
    id: "qte_final_stairs",
    type: "qte",
    text:
      "계단참마다 보안 카메라와 센서가 있다.\n" +
      "숨이 차오르는 와중에도, 정확한 타이밍을 놓치면 안 된다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["up", "left", "right"],
      baseTimeLimit: 4500,
      targetCount: 3,
      successNext: "final_stairs_success",
      failNext: "final_stairs_fail"
    }
  },
  {
    id: "final_stairs_success",
    type: "scene",
    text:
      "숨이 목구멍을 태우는 느낌과 함께,\n" +
      "드디어 47층 출입문 앞에 선다.",
    image: null,
    choices: [
      {
        label: "문을 열고 복도 안으로 들어간다",
        next: "final_b_merc_confront",
        requires: null
      }
    ]
  },
  {
    id: "final_stairs_fail",
    type: "scene",
    text:
      "한 번의 실수.\n" +
      "센서가 붉게 빛나고, 경보음이 울린다.\n" +
      "더 이상 숨을 곳이 없다.",
    image: null,
    choices: [
      {
        label: "마지막 힘을 짜내어 문을 부수고 안으로 돌입한다",
        next: "final_b_merc_confront",
        requires: null,
        setFlags: { flag_crime_exposed: true }
      }
    ]
  },

  // ──────────────────────
  // 최종 대치 + 3단 QTE
  // ──────────────────────
  {
    id: "final_b_merc_confront",
    type: "scene",
    text:
      "금고실 앞 복도.\n" +
      "B사 용병이 벽에 기대 서 있다.\n\n" +
      "“여기까지 왔으면, 이젠 말로는 안 되겠지.”\n" +
      "“하지만 기억해. 네가 지키려는 가족 수랑, 내가 지키려는 가족 수가 얼마나 다른지.”",
    image: null,
    choices: [
      {
        label: "“그냥 비켜. 이건 나랑 네 회장 문제야.”",
        next: "qte_final_round1",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "“그래도, 여기서 물러날 수는 없어.”",
        next: "qte_final_round1",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  {
    id: "qte_final_round1",
    type: "qte",
    text:
      "그는 곧장 달려들지 않는다.\n" +
      "비살상용 곤봉을 빙글 돌리며, 너를 벽 쪽으로 몰아붙인다.",
    image: null,
    qte: {
      qteType: "direction",
      directions: ["left", "right", "up", "down"],
      baseTimeLimit: 3000,
      targetCount: 2,
      successNext: "final_round1_success",
      failNext: null,
      deathNext: "final_death"
    }
  },
  {
    id: "final_round1_success",
    type: "scene",
    text:
      "몇 번의 휘두름을 간신히 피하자,\n" +
      "그의 호흡도 조금 거칠어진다.\n" +
      "“네가 이렇게까지 할 줄은 몰랐네.”",
    image: null,
    choices: [
      {
        label: "숨 돌릴 틈 없이 붙는다",
        next: "qte_final_round2",
        requires: null
      }
    ]
  },

  {
    id: "qte_final_round2",
    type: "qte",
    text:
      "이번엔 정면으로 몸을 던져온다.\n" +
      "팔과 팔이 엉키고, 바닥에 굴러 떨어진다.\n" +
      "누가 위로 올라탈지가 모든 걸 가른다.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 4500,
      baseTarget: 16,
      successNext: "final_round2_success",
      failNext: null,
      deathNext: "final_death"
    }
  },
  {
    id: "final_round2_success",
    type: "scene",
    text:
      "간신히 그의 팔을 비트는 데 성공한다.\n" +
      "그는 이를 악물고 말한다.\n\n" +
      "“네 고용주, A사 간부. 그 인간이 내 상관의 배우자였어.”\n" +
      "“네가 지금 부수려는 건… 그냥 회장이 아니라, 한 집안 전체야.”",
    image: null,
    choices: [
      {
        label: "“나도 집안 하나는 지켜야 해.”",
        next: "qte_final_round3",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "“…그래서 넌 죽이지 않으려 했던 거냐.”",
        next: "qte_final_round3",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  {
    id: "qte_final_round3",
    type: "qte",
    text:
      "마지막 일격의 순간.\n" +
      "너의 주먹이 먼저 닿을지,\n" +
      "그의 전기 충격봉이 먼저 닿을지.",
    image: null,
    qte: {
      qteType: "mash",
      key: "z",
      baseTimeLimit: 3500,
      baseTarget: 14,
      successNext: "final_round3_success",
      failNext: null,
      deathNext: "final_death"
    }
  },
  {
    id: "final_round3_success",
    type: "scene",
    text:
      "그의 몸에서 힘이 빠져나간다.\n" +
      "네가 원한다면, 지금 여기서 끝낼 수 있다.\n" +
      "아니면, 그냥 기절만 시킬 수도 있다.",
    image: null,
    choices: [
      {
        label: "목을 꺾어 확실히 끝낸다",
        next: "final_choice_after_kill",
        requires: null,
        setFlags: { style_aggressive: true }
      },
      {
        label: "호흡만 남겨두고 기절만 시킨다",
        next: "final_choice_after_knockout",
        requires: null,
        setFlags: { style_empathy: true }
      }
    ]
  },

  {
  id: "wounded_continue",
  type: "scene",
  text:
    "잠깐의 빈틈 때문에 치명상은 피했지만,\n" +
    "몸 곳곳이 멍들고 저려온다.",
  image: null,
  choices: [
    {
      label: "이를 악물고 다시 맞선다",
      next: "final_b_merc_confront",
      requires: null
    }
  ]
},


  {
    id: "final_death",
    type: "death",
    text:
      "한순간의 빈틈.\n" +
      "전기 충격이 척추를 타고 올라온다.\n" +
      "팔과 다리가 동시에 굳어버린다.\n\n" +
      "시야가 검게 말려들어가기 직전,\n" +
      "떠오르는 얼굴이 둘 있다.\n" +
      "“미안… 내 딸… 자기…”",
    image: null,
    choices: []
  },

  // ──────────────────────
  // 엔딩 분기용 체크 씬
  // ──────────────────────
  {
    id: "final_choice_after_kill",
    type: "scene",
    text:
      "그의 목에서 짧은 소리가 나고,\n" +
      "몸이 축 늘어진다.\n" +
      "복도에는 너와 시체, 그리고 닫힌 금고 문뿐이다.",
    image: null,
    choices: [
      {
        label: "문건을 챙겨 A사에게 넘긴다",
        next: "ending_A_or_D_check",
        requires: null,
        setFlags: { flag_chose_document: true }
      }
    ]
  },

  {
    id: "final_choice_after_knockout",
    type: "scene",
    text:
      "그는 깊은 숨을 몰아쉬며 쓰러져 있다.\n" +
      "생사는 붙어 있지만, 당분간 일어날 수는 없다.\n" +
      "금고는 여전히 네 손이 닿을 곳에 있다.",
    image: null,
    choices: [
      {
        label: "문건을 확보해 두 기업의 내막을 세상에 폭로한다",
        next: "ending_B_or_D_check",
        requires: null,
        setFlags: {
          flag_chose_whistle: true,
          style_empathy: true
        }
      },
      {
        label: "아무 것도 가져가지 않고, 그냥 떠난다",
        next: "ending_C_or_D_check",
        requires: null,
        setFlags: {
          flag_chose_nothing: true,
          style_empathy: true
        }
      }
    ]
  },

  {
    id: "ending_A_or_D_check",
    type: "scene",
    text:
      "문건을 손에 쥔 채, 너는 건물 밖으로 향한다.\n" +
      "어딘가에서 싸이렌 소리가 들려오는 것 같다.",
    image: null,
    choices: [
      {
        label: "걸음을 재촉한다",
        next: "ending_A",
        requires: {
          flags: [
            { key: "flag_crime_exposed", not: true }
          ]
        }
      },
      {
        label: "뒤를 돌아본다",
        next: "ending_D",
        requires: {
          flags: [
            { key: "flag_crime_exposed", value: true }
          ]
        }
      }
    ]
  },

  {
    id: "ending_B_or_D_check",
    type: "scene",
    text:
      "문건 내용은 회장의 치정과,\n" +
      "그걸 칼날처럼 이용하려 했던 A사 간부의 사적인 메모들로 가득하다.",
    image: null,
    choices: [
      {
        label: "내부고발자로서 이 모든 걸 제출한다",
        next: "ending_B",
        requires: {
          flags: [
            { key: "flag_crime_exposed", not: true }
          ]
        }
      },
      {
        label: "이미 너무 많은 눈에 띄었다",
        next: "ending_D",
        requires: {
          flags: [
            { key: "flag_crime_exposed", value: true }
          ]
        }
      }
    ]
  },

  {
    id: "ending_C_or_D_check",
    type: "scene",
    text:
      "너는 금고를 닫고, 아무 것도 가져가지 않는다.\n" +
      "복수도, 정의도, 어느 쪽에도 서지 않은 채.",
    image: null,
    choices: [
      {
        label: "조용히 건물을 빠져나간다",
        next: "ending_C",
        requires: {
          flags: [
            { key: "flag_crime_exposed", not: true }
          ]
        }
      },
      {
        label: "그러기엔 이미 너무 늦었다",
        next: "ending_D",
        requires: {
          flags: [
            { key: "flag_crime_exposed", value: true }
          ]
        }
      }
    ]
  },

  // ──────────────────────
  // 엔딩 A/B/C/D
  // ──────────────────────
  {
    id: "ending_A",
    type: "scene",
    text:
      "문건이 A사 회의실 테이블 위에 놓인다.\n" +
      "그 뒤로, B사 주가 폭락과 구조조정 뉴스가 연달아 쏟아진다.\n\n" +
      "해고된 수천 명의 얼굴이 스쳐지나간다.\n" +
      "네 가족의 병원비는 계속 지급된다.\n\n" +
      "“내 가족은 살았지만… 몇 천 가족은 무너졌군.”",
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
    id: "ending_B",
    type: "scene",
    text:
      "너와 B사 용병의 증언, 그리고 문건 일부가\n" +
      "검찰 조사실 책상 위에 놓인다.\n\n" +
      "A사 간부는 직무유기와 보복성 업무 남용으로 구속되고,\n" +
      "B사는 구조조정 없이 재편을 약속한다.\n" +
      "정부는 퇴직·의료 지원 프로그램을 내놓는다.\n\n" +
      "용병은 마지막으로 말한다.\n" +
      "“넌, 우리도 네 가족도 지켰다.”",
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
    id: "ending_C",
    type: "scene",
    text:
      "너는 아무에게도 문건을 넘기지 않는다.\n" +
      "두 기업은 각자의 방식대로 버틴다.\n\n" +
      "병원비 고지서는 여전히 무겁게 쌓여가고,\n" +
      "네 가족은 벼랑 끝에 서 있다.\n\n" +
      "“…이 싸움에, 내 가족을 더 이상 태울 순 없었어.”",
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
    id: "ending_D",
    type: "scene",
    text:
      "건물 밖, 경찰차와 순찰차가 원을 그린다.\n" +
      "싸이렌 불빛이 너의 그림자를 길게 끌어낸다.\n\n" +
      "너는 뒷골목으로 몸을 던진다.\n\n" +
      "‘어디까지 도망쳐야 할까?\n" +
      "  어쩌다가 이렇게 된 걸까?\n" +
      "  가족들에게… 돌아갈 순 있을까?’",
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
  // 공통 데스
  // ──────────────────────
  {
    id: "death_generic",
    type: "death",
    text:
      "너의 의식은 어둠 속으로 가라앉았다.\n\n" +
      "너무 많은 상처를 입었고,\n" +
      "이번 판에서, 네 가족에게 돌아갈 길은 끊겼다.",
    image: null,
    choices: []
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
