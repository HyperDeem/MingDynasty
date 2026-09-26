/** 明朝全景 — 时期与内容 Mock 数据 */

export type PeriodId =
  | "hongwu"
  | "jianwen"
  | "yongle"
  | "hongxi"
  | "xuande"
  | "zhengtong"
  | "jingtai"
  | "tianshun"
  | "chenghua"
  | "hongzhi"
  | "zhengde"
  | "jiajing"
  | "longqing"
  | "wanli"
  | "taichang"
  | "tianqi"
  | "chongzhen";

export interface EmperorInfo {
  name: string;
  templeName: string;
  reignTitle: string;
  lifespan: string;
  reignYears: string;
  summary: string;
  portraitHint?: string;
}

export interface MajorEvent {
  id: string;
  title: string;
  year: string;
  description: string;
  tags?: string[];
}

export interface TerritoryData {
  peakYear: string;
  areaWanKm2: number;
  provinces: number;
  capitals: string[];
  highlights: { label: string; value: string }[];
  /** ECharts 简易疆域示意：南北向控制点（归一化 0–100） */
  mapSketch: { name: string; coords: [number, number] }[];
}

export interface PeriodContent {
  emperor: EmperorInfo;
  events: MajorEvent[];
  territory: TerritoryData;
}

export interface TimelinePeriod {
  id: PeriodId;
  label: string;
  shortLabel: string;
  startYear: number;
  endYear: number;
  era: "early" | "mid" | "late";
}

/** 左侧垂直时间轴：贯穿 1368–1644 */
export const TIMELINE_PERIODS: TimelinePeriod[] = [
  {
    id: "hongwu",
    label: "洪武时期",
    shortLabel: "洪武",
    startYear: 1368,
    endYear: 1398,
    era: "early",
  },
  {
    id: "jianwen",
    label: "建文时期",
    shortLabel: "建文",
    startYear: 1399,
    endYear: 1402,
    era: "early",
  },
  {
    id: "yongle",
    label: "永乐时期",
    shortLabel: "永乐",
    startYear: 1403,
    endYear: 1424,
    era: "early",
  },
  {
    id: "hongxi",
    label: "洪熙时期",
    shortLabel: "洪熙",
    startYear: 1425,
    endYear: 1425,
    era: "early",
  },
  {
    id: "xuande",
    label: "宣德时期",
    shortLabel: "宣德",
    startYear: 1426,
    endYear: 1435,
    era: "early",
  },
  {
    id: "zhengtong",
    label: "正统时期",
    shortLabel: "正统",
    startYear: 1436,
    endYear: 1449,
    era: "mid",
  },
  {
    id: "jingtai",
    label: "景泰时期",
    shortLabel: "景泰",
    startYear: 1450,
    endYear: 1456,
    era: "mid",
  },
  {
    id: "tianshun",
    label: "天顺时期",
    shortLabel: "天顺",
    startYear: 1457,
    endYear: 1464,
    era: "mid",
  },
  {
    id: "chenghua",
    label: "成化时期",
    shortLabel: "成化",
    startYear: 1465,
    endYear: 1487,
    era: "mid",
  },
  {
    id: "hongzhi",
    label: "弘治时期",
    shortLabel: "弘治",
    startYear: 1488,
    endYear: 1505,
    era: "mid",
  },
  {
    id: "zhengde",
    label: "正德时期",
    shortLabel: "正德",
    startYear: 1506,
    endYear: 1521,
    era: "mid",
  },
  {
    id: "jiajing",
    label: "嘉靖时期",
    shortLabel: "嘉靖",
    startYear: 1522,
    endYear: 1566,
    era: "late",
  },
  {
    id: "longqing",
    label: "隆庆时期",
    shortLabel: "隆庆",
    startYear: 1567,
    endYear: 1572,
    era: "late",
  },
  {
    id: "wanli",
    label: "万历时期",
    shortLabel: "万历",
    startYear: 1573,
    endYear: 1620,
    era: "late",
  },
  {
    id: "taichang",
    label: "泰昌时期",
    shortLabel: "泰昌",
    startYear: 1620,
    endYear: 1620,
    era: "late",
  },
  {
    id: "tianqi",
    label: "天启时期",
    shortLabel: "天启",
    startYear: 1621,
    endYear: 1627,
    era: "late",
  },
  {
    id: "chongzhen",
    label: "崇祯时期",
    shortLabel: "崇祯",
    startYear: 1628,
    endYear: 1644,
    era: "late",
  },
];

/** 各时期右侧内容；永乐时期为完整示范，其余为占位摘要 */
export const PERIOD_CONTENTS: Record<PeriodId, PeriodContent> = {
  hongwu: {
    emperor: {
      name: "朱元璋",
      templeName: "明太祖",
      reignTitle: "洪武",
      lifespan: "1328–1398",
      reignYears: "1368–1398",
      summary:
        "元朝末年兴起于江淮，推翻蒙元建立明朝。厉行集权、整顿吏治，奠定明朝基本制度与版图格局。",
    },
    events: [
      {
        id: "hw-founding",
        title: "定都南京，建国号「明」",
        year: "1368",
        description: "朱元璋于南京称帝，改元洪武，开启近三百年明朝统治。",
        tags: ["建国"],
      },
    ],
    territory: {
      peakYear: "1398",
      areaWanKm2: 650,
      provinces: 13,
      capitals: ["南京"],
      highlights: [
        { label: "两京", value: "南京" },
        { label: "边防", value: "九边雏形" },
      ],
      mapSketch: [
        { name: "南京", coords: [72, 58] },
        { name: "北京", coords: [68, 28] },
      ],
    },
  },
  jianwen: {
    emperor: {
      name: "朱允炆",
      templeName: "明惠帝",
      reignTitle: "建文",
      lifespan: "1377–？",
      reignYears: "1399–1402",
      summary: "太祖之孙。推行削藩，引发靖难之役，最终败于燕王朱棣。",
    },
    events: [
      {
        id: "jw-jingnan",
        title: "靖难之役",
        year: "1399–1402",
        description: "燕王朱棣起兵「清君侧」，攻陷南京，建文帝下落成谜。",
        tags: ["内战"],
      },
    ],
    territory: {
      peakYear: "1402",
      areaWanKm2: 650,
      provinces: 13,
      capitals: ["南京"],
      highlights: [{ label: "政局", value: "削藩与靖难" }],
      mapSketch: [{ name: "南京", coords: [72, 58] }],
    },
  },
  yongle: {
    emperor: {
      name: "朱棣",
      templeName: "明成祖",
      reignTitle: "永乐",
      lifespan: "1360–1424",
      reignYears: "1403–1424",
      summary:
        "靖难之役后即位。迁都北京、编修《永乐大典》、五征漠北，并派遣郑和七下西洋，将明朝国力推向巅峰。史称「永乐盛世」。",
      portraitHint: "明成祖坐像（示意）",
    },
    events: [
      {
        id: "yl-zhenghe",
        title: "郑和下西洋",
        year: "1405–1433",
        description:
          "永乐三年起，太监郑和率领庞大船队远航西洋，历时近三十年，先后到达东南亚、印度洋沿岸及东非等地，彰显国威、拓展朝贡贸易。永乐年间完成前六次远航，规模空前。",
        tags: ["航海", "外交", "朝贡"],
      },
      {
        id: "yl-beijing",
        title: "迁都北京",
        year: "1421",
        description:
          "永乐十九年正式迁都北京，南京为留都。营建紫禁城与北京城池，奠定此后明清政治中心格局。",
        tags: ["迁都", "营建"],
      },
      {
        id: "yl-yongle-dadian",
        title: "编修《永乐大典》",
        year: "1403–1408",
        description:
          "集天下典籍之大成，编成两万余卷类书，是世界文化史上规模空前的百科全书式汇编。",
        tags: ["文教"],
      },
    ],
    territory: {
      peakYear: "1424",
      areaWanKm2: 997,
      provinces: 13,
      capitals: ["北京", "南京（留都）"],
      highlights: [
        { label: "两京制", value: "北京 / 南京" },
        { label: "航海影响", value: "西洋诸国朝贡" },
        { label: "北疆", value: "五征漠北" },
        { label: "交趾", value: "一度设交趾布政司" },
      ],
      mapSketch: [
        { name: "北京", coords: [68, 28] },
        { name: "南京", coords: [72, 58] },
        { name: "交趾", coords: [58, 88] },
        { name: "哈密", coords: [28, 32] },
        { name: "琉球", coords: [92, 52] },
      ],
    },
  },
  hongxi: {
    emperor: {
      name: "朱高炽",
      templeName: "明仁宗",
      reignTitle: "洪熙",
      lifespan: "1378–1425",
      reignYears: "1425",
      summary: "在位仅十月。宽仁恤民，欲罢西洋宝船、迁都南京，未及施行而崩。",
    },
    events: [
      {
        id: "hx-short",
        title: "仁政初施",
        year: "1425",
        description: "赦免建文旧臣、减轻赋役，史称「仁宣之治」之开端。",
      },
    ],
    territory: {
      peakYear: "1425",
      areaWanKm2: 990,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "政风", value: "宽仁" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  xuande: {
    emperor: {
      name: "朱瞻基",
      templeName: "明宣宗",
      reignTitle: "宣德",
      lifespan: "1399–1435",
      reignYears: "1426–1435",
      summary: "继承仁宗宽仁之政，社会安定，史称「仁宣之治」。宣德窑瓷器享誉后世。",
    },
    events: [
      {
        id: "xd-zhenghe7",
        title: "郑和第七次下西洋",
        year: "1431–1433",
        description: "最后一次大规模远航，郑和卒于返航途中（一说），此后宝船渐停。",
        tags: ["航海"],
      },
    ],
    territory: {
      peakYear: "1435",
      areaWanKm2: 950,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "盛世", value: "仁宣之治" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  zhengtong: {
    emperor: {
      name: "朱祁镇",
      templeName: "明英宗",
      reignTitle: "正统",
      lifespan: "1427–1464",
      reignYears: "1436–1449",
      summary: "幼年即位，王振专权。土木堡之变被俘，明朝由盛转衰的转折点。",
    },
    events: [
      {
        id: "zt-tumubao",
        title: "土木堡之变",
        year: "1449",
        description: "英宗亲征瓦剌，全军覆没被俘，五十万大军溃散。",
        tags: ["边患"],
      },
    ],
    territory: {
      peakYear: "1449",
      areaWanKm2: 900,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "危机", value: "土木之变" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  jingtai: {
    emperor: {
      name: "朱祁钰",
      templeName: "明代宗",
      reignTitle: "景泰",
      lifespan: "1428–1457",
      reignYears: "1450–1456",
      summary: "英宗被俘后监国称帝。于谦领导北京保卫战，力挽危局。",
    },
    events: [
      {
        id: "jt-defense",
        title: "北京保卫战",
        year: "1449",
        description: "于谦整军抗敌，击退瓦剌，保住京师。",
        tags: ["卫国"],
      },
    ],
    territory: {
      peakYear: "1456",
      areaWanKm2: 880,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "名臣", value: "于谦" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  tianshun: {
    emperor: {
      name: "朱祁镇",
      templeName: "明英宗",
      reignTitle: "天顺",
      lifespan: "1427–1464",
      reignYears: "1457–1464",
      summary: "夺门之变复位，改元天顺。诛杀于谦，朝政再起波澜。",
    },
    events: [
      {
        id: "ts-duomen",
        title: "夺门之变",
        year: "1457",
        description: "石亨、曹吉祥等拥英宗复位，景帝被废。",
      },
    ],
    territory: {
      peakYear: "1464",
      areaWanKm2: 880,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "政变", value: "夺门复辟" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  chenghua: {
    emperor: {
      name: "朱见深",
      templeName: "明宪宗",
      reignTitle: "成化",
      lifespan: "1447–1487",
      reignYears: "1465–1487",
      summary: "万贵妃专宠，宦官势力抬头；同时设西厂，朝政日趋腐败。",
    },
    events: [
      {
        id: "ch-xichang",
        title: "设立西厂",
        year: "1477",
        description: "汪直提督西厂，特务政治加剧。",
      },
    ],
    territory: {
      peakYear: "1487",
      areaWanKm2: 870,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "特务", value: "西厂" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  hongzhi: {
    emperor: {
      name: "朱祐樘",
      templeName: "明孝宗",
      reignTitle: "弘治",
      lifespan: "1470–1505",
      reignYears: "1488–1505",
      summary: "勤政爱民，任用贤臣，史称「弘治中兴」，明朝中期难得的治世。",
    },
    events: [
      {
        id: "hz-zhongxing",
        title: "弘治中兴",
        year: "1488–1505",
        description: "整顿吏治、节用爱民，与民休息。",
        tags: ["中兴"],
      },
    ],
    territory: {
      peakYear: "1505",
      areaWanKm2: 870,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "治世", value: "弘治中兴" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  zhengde: {
    emperor: {
      name: "朱厚照",
      templeName: "明武宗",
      reignTitle: "正德",
      lifespan: "1491–1521",
      reignYears: "1506–1521",
      summary: "嬉游无度，宠信宦官刘瑾；多次微服出巡，朝政紊乱。",
    },
    events: [
      {
        id: "zd-liujin",
        title: "刘瑾专权",
        year: "1506–1510",
        description: "「八虎」之一刘瑾权倾朝野，后被凌迟处死。",
      },
    ],
    territory: {
      peakYear: "1521",
      areaWanKm2: 860,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "宦官", value: "刘瑾" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  jiajing: {
    emperor: {
      name: "朱厚熜",
      templeName: "明世宗",
      reignTitle: "嘉靖",
      lifespan: "1507–1566",
      reignYears: "1522–1566",
      summary: "大礼议后长期不上朝，迷信道教；东南倭患、北方俺答屡犯边。",
    },
    events: [
      {
        id: "jj-wokou",
        title: "东南倭患",
        year: "嘉靖中后期",
        description: "倭寇与海盗勾结侵扰沿海，戚继光、俞大猷等抗倭名将崛起。",
        tags: ["边患"],
      },
    ],
    territory: {
      peakYear: "1566",
      areaWanKm2: 850,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "海防", value: "抗倭战争" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  longqing: {
    emperor: {
      name: "朱载垕",
      templeName: "明穆宗",
      reignTitle: "隆庆",
      lifespan: "1537–1572",
      reignYears: "1567–1572",
      summary: "开放海禁（隆庆开关），与俺答封贡议和，边海局势暂时缓和。",
    },
    events: [
      {
        id: "lq-kaiguan",
        title: "隆庆开关",
        year: "1567",
        description: "部分开放民间海外贸易，刺激东南沿海经济。",
        tags: ["贸易"],
      },
    ],
    territory: {
      peakYear: "1572",
      areaWanKm2: 850,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "开放", value: "隆庆开关" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  wanli: {
    emperor: {
      name: "朱翊钧",
      templeName: "明神宗",
      reignTitle: "万历",
      lifespan: "1563–1620",
      reignYears: "1573–1620",
      summary:
        "在位四十八年，明朝最长。前期张居正改革，后期怠政数十年，国本之争、矿税四出，国势日颓。",
    },
    events: [
      {
        id: "wl-zhangjuzheng",
        title: "张居正改革",
        year: "1573–1582",
        description: "考成法、一条鞭法，财政与吏治一度振兴。",
        tags: ["改革"],
      },
      {
        id: "wl-chaoxian",
        title: "万历援朝抗倭",
        year: "1592–1598",
        description: "日本丰臣秀吉入侵朝鲜，明军出兵援助，史称「万历朝鲜之役」。",
        tags: ["战争"],
      },
    ],
    territory: {
      peakYear: "1582",
      areaWanKm2: 840,
      provinces: 13,
      capitals: ["北京"],
      highlights: [
        { label: "改革", value: "一条鞭法" },
        { label: "外战", value: "援朝抗倭" },
      ],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  taichang: {
    emperor: {
      name: "朱常洛",
      templeName: "明光宗",
      reignTitle: "泰昌",
      lifespan: "1582–1620",
      reignYears: "1620",
      summary: "在位仅一月，因「红丸案」暴卒，明末宫廷三大案之一。",
    },
    events: [
      {
        id: "tc-hongwan",
        title: "红丸案",
        year: "1620",
        description: "光宗服红丸后猝死，朝野震动。",
      },
    ],
    territory: {
      peakYear: "1620",
      areaWanKm2: 820,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "宫廷", value: "红丸案" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  tianqi: {
    emperor: {
      name: "朱由校",
      templeName: "明熹宗",
      reignTitle: "天启",
      lifespan: "1605–1627",
      reignYears: "1621–1627",
      summary: "沉迷木工，魏忠贤阉党专权，东林党人惨遭镇压。",
    },
    events: [
      {
        id: "tq-weizhongxian",
        title: "魏忠贤专权",
        year: "天启年间",
        description: "阉党遍布朝野，厂卫横行，政治黑暗至极。",
      },
    ],
    territory: {
      peakYear: "1627",
      areaWanKm2: 800,
      provinces: 13,
      capitals: ["北京"],
      highlights: [{ label: "阉党", value: "魏忠贤" }],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
  chongzhen: {
    emperor: {
      name: "朱由检",
      templeName: "明思宗",
      reignTitle: "崇祯",
      lifespan: "1611–1644",
      reignYears: "1628–1644",
      summary:
        "勤勉却刚愎。内有流民起义，外有后金（清）进逼。李自成破京，皇帝自缢煤山，明朝灭亡。",
    },
    events: [
      {
        id: "cz-fall",
        title: "甲申之变",
        year: "1644",
        description: "李自成军入京，崇祯自缢于煤山，享国二百七十六年的明朝宣告终结。",
        tags: ["亡国"],
      },
    ],
    territory: {
      peakYear: "1644",
      areaWanKm2: 700,
      provinces: 13,
      capitals: ["北京"],
      highlights: [
        { label: "内乱", value: "李自成、张献忠" },
        { label: "外患", value: "后金入关前夜" },
      ],
      mapSketch: [{ name: "北京", coords: [68, 28] }],
    },
  },
};

export const DYNASTY_META = {
  title: "全景明朝",
  subtitle: "1368 — 1644",
  startYear: 1368,
  endYear: 1644,
  defaultPeriodId: "yongle" as PeriodId,
};

export function getPeriodById(id: PeriodId): TimelinePeriod {
  return TIMELINE_PERIODS.find((p) => p.id === id)!;
}

export function getPeriodContent(id: PeriodId): PeriodContent {
  return PERIOD_CONTENTS[id];
}
