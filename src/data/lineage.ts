/**
 * 明朝帝王血缘谱系 · 帝位承袭 · 继承逻辑
 * — 英宗为一人双年号（正统 / 天顺），代宗穿插其间
 */

import type { PeriodId } from "./ming-dynasty";
import type { EmperorId } from "./emperors";

/** 谱系节点：含皇帝与关键非帝亲族（如懿文太子、兴献王） */
export type LineageNodeId =
  | EmperorId
  | "yiwen" // 朱标 · 懿文太子
  | "xingxian"; // 朱祐杬 · 兴献王

export type BloodLinkStyle = "solid" | "dashed" | "usurp";

export type InheritanceMode =
  | "primogeniture" // 嫡长 / 按长幼
  | "designated" // 指定储君
  | "collateral" // 旁支入继
  | "usurpation" // 非常规夺位
  | "restoration" // 复位
  | "fraternal"; // 兄终弟及

export interface ReignLabel {
  title: string;
  periodId: PeriodId;
  startYear: number;
  endYear: number;
}

export interface LineagePerson {
  id: LineageNodeId;
  /** 姓名 */
  name: string;
  /** 庙号（非帝可为空） */
  templeName?: string;
  /** 谥号简写 */
  posthumousName?: string;
  /** 年号标签；英宗有两个 */
  reigns: ReignLabel[];
  /** 是否登基为帝 */
  isEmperor: boolean;
  /** 帝位序（1–16）；非帝为 null。英宗仅占一席 */
  throneOrder: number | null;
  /** 谱系图坐标（相对画布） */
  x: number;
  y: number;
  birthDeath?: string;
  summary: string;
  color: string;
  accent: string;
}

export interface BloodEdge {
  id: string;
  from: LineageNodeId;
  to: LineageNodeId;
  /** 血缘说明 */
  label: string;
  style: BloodLinkStyle;
}

export interface SuccessionStep {
  order: number;
  emperorId: EmperorId;
  /** 展示用任次标签，如「第 6 任」 */
  orderLabel: string;
  /** 若为英宗，标注双年号 */
  reignNote?: string;
}

/** 相邻两任之间的继承逻辑（按帝位第一次登基顺序；英宗复位另记） */
export interface InheritanceLink {
  fromId: EmperorId;
  toId: EmperorId;
  kinship: string;
  mode: InheritanceMode;
  modeLabel: string;
  note?: string;
}

export const LINEAGE_PERSONS: LineagePerson[] = [
  {
    id: "taizu",
    name: "朱元璋",
    templeName: "明太祖",
    posthumousName: "高皇帝",
    reigns: [
      { title: "洪武", periodId: "hongwu", startYear: 1368, endYear: 1398 },
    ],
    isEmperor: true,
    throneOrder: 1,
    x: 420,
    y: 40,
    birthDeath: "1328—1398",
    summary: "开国立制，废丞相，奠定明朝皇权格局。",
    color: "#8b3a3a",
    accent: "#c45c5c",
  },
  {
    id: "yiwen",
    name: "朱标",
    templeName: undefined,
    posthumousName: "懿文太子",
    reigns: [],
    isEmperor: false,
    throneOrder: null,
    x: 220,
    y: 160,
    birthDeath: "1355—1392",
    summary: "太祖嫡长子，早逝。其子朱允炆继位为建文帝。",
    color: "#6b5a45",
    accent: "#9a8568",
  },
  {
    id: "huizong",
    name: "朱允炆",
    templeName: "明惠帝",
    posthumousName: "让皇帝（后追）",
    reigns: [
      { title: "建文", periodId: "jianwen", startYear: 1399, endYear: 1402 },
    ],
    isEmperor: true,
    throneOrder: 2,
    x: 220,
    y: 300,
    birthDeath: "1377—？",
    summary: "祖孙相承。削藩引发靖难，城破下落成谜。",
    color: "#6b5a45",
    accent: "#9a8568",
  },
  {
    id: "chengzu",
    name: "朱棣",
    templeName: "明成祖",
    posthumousName: "文皇帝",
    reigns: [
      { title: "永乐", periodId: "yongle", startYear: 1403, endYear: 1424 },
    ],
    isEmperor: true,
    throneOrder: 3,
    x: 620,
    y: 300,
    birthDeath: "1360—1424",
    summary: "靖难夺位。迁都北京，郑和下西洋，国力巅峰。",
    color: "#2d6a5a",
    accent: "#4a9a82",
  },
  {
    id: "renzong",
    name: "朱高炽",
    templeName: "明仁宗",
    posthumousName: "昭皇帝",
    reigns: [
      { title: "洪熙", periodId: "hongxi", startYear: 1425, endYear: 1425 },
    ],
    isEmperor: true,
    throneOrder: 4,
    x: 620,
    y: 440,
    birthDeath: "1378—1425",
    summary: "在位十月，宽仁恤民，仁宣之治开端。",
    color: "#4a6b8a",
    accent: "#6d92b5",
  },
  {
    id: "xuanzong",
    name: "朱瞻基",
    templeName: "明宣宗",
    posthumousName: "章皇帝",
    reigns: [
      { title: "宣德", periodId: "xuande", startYear: 1426, endYear: 1435 },
    ],
    isEmperor: true,
    throneOrder: 5,
    x: 620,
    y: 560,
    birthDeath: "1399—1435",
    summary: "继承仁政，史称仁宣之治。",
    color: "#3d7a6a",
    accent: "#5a9e8a",
  },
  {
    id: "yingzong",
    name: "朱祁镇",
    templeName: "明英宗",
    posthumousName: "睿皇帝",
    reigns: [
      { title: "正统", periodId: "zhengtong", startYear: 1436, endYear: 1449 },
      { title: "天顺", periodId: "tianshun", startYear: 1457, endYear: 1464 },
    ],
    isEmperor: true,
    throneOrder: 6,
    x: 480,
    y: 700,
    birthDeath: "1427—1464",
    summary:
      "一人两度称帝：正统被俘后退位，景泰后夺门复位改元天顺。",
    color: "#7a5a3d",
    accent: "#a87e55",
  },
  {
    id: "daizong",
    name: "朱祁钰",
    templeName: "明代宗",
    posthumousName: "景皇帝",
    reigns: [
      { title: "景泰", periodId: "jingtai", startYear: 1450, endYear: 1456 },
    ],
    isEmperor: true,
    throneOrder: 7,
    x: 760,
    y: 700,
    birthDeath: "1428—1457",
    summary: "兄俘弟继。于谦保卫北京；后被英宗复位所废。",
    color: "#5a4a6b",
    accent: "#7e6a94",
  },
  {
    id: "xianzong",
    name: "朱见深",
    templeName: "明宪宗",
    posthumousName: "纯皇帝",
    reigns: [
      { title: "成化", periodId: "chenghua", startYear: 1465, endYear: 1487 },
    ],
    isEmperor: true,
    throneOrder: 8,
    x: 480,
    y: 860,
    birthDeath: "1447—1487",
    summary: "英宗之子。设西厂，万贵妃专宠。",
    color: "#6b4a5a",
    accent: "#946878",
  },
  {
    id: "xiaozong",
    name: "朱祐樘",
    templeName: "明孝宗",
    posthumousName: "敬皇帝",
    reigns: [
      { title: "弘治", periodId: "hongzhi", startYear: 1488, endYear: 1505 },
    ],
    isEmperor: true,
    throneOrder: 9,
    x: 480,
    y: 1000,
    birthDeath: "1470—1505",
    summary: "弘治中兴，勤政爱民。",
    color: "#3d6b5a",
    accent: "#5a9480",
  },
  {
    id: "xingxian",
    name: "朱祐杬",
    templeName: undefined,
    posthumousName: "兴献王",
    reigns: [],
    isEmperor: false,
    throneOrder: null,
    x: 200,
    y: 1000,
    birthDeath: "1476—1519",
    summary: "宪宗次子、孝宗异母弟。其子朱厚熜入继大统为嘉靖帝。",
    color: "#5a4a6b",
    accent: "#8a6a9a",
  },
  {
    id: "wuzong",
    name: "朱厚照",
    templeName: "明武宗",
    posthumousName: "毅皇帝",
    reigns: [
      { title: "正德", periodId: "zhengde", startYear: 1506, endYear: 1521 },
    ],
    isEmperor: true,
    throneOrder: 10,
    x: 480,
    y: 1140,
    birthDeath: "1491—1521",
    summary: "孝宗嫡长子。无嗣而终，皇位传于堂弟。",
    color: "#8a5a3d",
    accent: "#b87a55",
  },
  {
    id: "shizong",
    name: "朱厚熜",
    templeName: "明世宗",
    posthumousName: "肃皇帝",
    reigns: [
      { title: "嘉靖", periodId: "jiajing", startYear: 1522, endYear: 1566 },
    ],
    isEmperor: true,
    throneOrder: 11,
    x: 200,
    y: 1140,
    birthDeath: "1507—1566",
    summary: "兴献王长子，以旁支入继。大礼议争执本生皇考尊号。",
    color: "#5a3d6b",
    accent: "#7e5a94",
  },
  {
    id: "muzong",
    name: "朱载垕",
    templeName: "明穆宗",
    posthumousName: "庄皇帝",
    reigns: [
      { title: "隆庆", periodId: "longqing", startYear: 1567, endYear: 1572 },
    ],
    isEmperor: true,
    throneOrder: 12,
    x: 200,
    y: 1280,
    birthDeath: "1537—1572",
    summary: "世宗第三子（长、次早夭）。隆庆开关、俺答封贡。",
    color: "#3d5a7a",
    accent: "#5a7ea0",
  },
  {
    id: "shenzong",
    name: "朱翊钧",
    templeName: "明神宗",
    posthumousName: "显皇帝",
    reigns: [
      { title: "万历", periodId: "wanli", startYear: 1573, endYear: 1620 },
    ],
    isEmperor: true,
    throneOrder: 13,
    x: 200,
    y: 1420,
    birthDeath: "1563—1620",
    summary: "在位最长。前期张居正改革，后期怠政。",
    color: "#6b3d3d",
    accent: "#945555",
  },
  {
    id: "guangzong",
    name: "朱常洛",
    templeName: "明光宗",
    posthumousName: "贞皇帝",
    reigns: [
      { title: "泰昌", periodId: "taichang", startYear: 1620, endYear: 1620 },
    ],
    isEmperor: true,
    throneOrder: 14,
    x: 200,
    y: 1560,
    birthDeath: "1582—1620",
    summary: "在位一月，红丸案暴卒。",
    color: "#5a5a4a",
    accent: "#7a7a65",
  },
  {
    id: "xizong",
    name: "朱由校",
    templeName: "明熹宗",
    posthumousName: "哲皇帝",
    reigns: [
      { title: "天启", periodId: "tianqi", startYear: 1621, endYear: 1627 },
    ],
    isEmperor: true,
    throneOrder: 15,
    x: 80,
    y: 1700,
    birthDeath: "1605—1627",
    summary: "光宗长子。魏忠贤专权。",
    color: "#4a4a5a",
    accent: "#6a6a7a",
  },
  {
    id: "sizong",
    name: "朱由检",
    templeName: "明思宗",
    posthumousName: "烈皇帝 / 庄烈愍皇帝",
    reigns: [
      { title: "崇祯", periodId: "chongzhen", startYear: 1628, endYear: 1644 },
    ],
    isEmperor: true,
    throneOrder: 16,
    x: 320,
    y: 1700,
    birthDeath: "1611—1644",
    summary: "光宗第五子、熹宗异母弟。甲申殉国，明亡。",
    color: "#3d2a2a",
    accent: "#6b4545",
  },
];

/** 血缘连线（谁是谁的儿子 / 弟弟） */
export const BLOOD_EDGES: BloodEdge[] = [
  {
    id: "b-taizu-yiwen",
    from: "taizu",
    to: "yiwen",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-taizu-chengzu",
    from: "taizu",
    to: "chengzu",
    label: "第四子（燕王）",
    style: "dashed",
  },
  {
    id: "b-yiwen-huizong",
    from: "yiwen",
    to: "huizong",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-chengzu-renzong",
    from: "chengzu",
    to: "renzong",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-renzong-xuanzong",
    from: "renzong",
    to: "xuanzong",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-xuanzong-yingzong",
    from: "xuanzong",
    to: "yingzong",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-xuanzong-daizong",
    from: "xuanzong",
    to: "daizong",
    label: "次子",
    style: "dashed",
  },
  {
    id: "b-yingzong-xianzong",
    from: "yingzong",
    to: "xianzong",
    label: "长子",
    style: "solid",
  },
  {
    id: "b-xianzong-xiaozong",
    from: "xianzong",
    to: "xiaozong",
    label: "第三子（后立为储）",
    style: "solid",
  },
  {
    id: "b-xianzong-xingxian",
    from: "xianzong",
    to: "xingxian",
    label: "次子（兴献王）",
    style: "dashed",
  },
  {
    id: "b-xiaozong-wuzong",
    from: "xiaozong",
    to: "wuzong",
    label: "嫡长子",
    style: "solid",
  },
  {
    id: "b-xingxian-shizong",
    from: "xingxian",
    to: "shizong",
    label: "长子 → 入继大统",
    style: "dashed",
  },
  {
    id: "b-shizong-muzong",
    from: "shizong",
    to: "muzong",
    label: "第三子（长次早夭）",
    style: "solid",
  },
  {
    id: "b-muzong-shenzong",
    from: "muzong",
    to: "shenzong",
    label: "第三子（后为储）",
    style: "solid",
  },
  {
    id: "b-shenzong-guangzong",
    from: "shenzong",
    to: "guangzong",
    label: "长子",
    style: "solid",
  },
  {
    id: "b-guangzong-xizong",
    from: "guangzong",
    to: "xizong",
    label: "长子",
    style: "solid",
  },
  {
    id: "b-guangzong-sizong",
    from: "guangzong",
    to: "sizong",
    label: "第五子",
    style: "dashed",
  },
];

/** 靖难夺位：非血缘父系，特殊政治连线 */
export const USURP_EDGES: BloodEdge[] = [
  {
    id: "u-huizong-chengzu",
    from: "huizong",
    to: "chengzu",
    label: "靖难之役 · 夺位",
    style: "usurp",
  },
];

/** 十六帝承袭链（英宗一人一席） */
export const SUCCESSION_CHAIN: SuccessionStep[] = [
  { order: 1, emperorId: "taizu", orderLabel: "第 1 任" },
  { order: 2, emperorId: "huizong", orderLabel: "第 2 任" },
  { order: 3, emperorId: "chengzu", orderLabel: "第 3 任" },
  { order: 4, emperorId: "renzong", orderLabel: "第 4 任" },
  { order: 5, emperorId: "xuanzong", orderLabel: "第 5 任" },
  {
    order: 6,
    emperorId: "yingzong",
    orderLabel: "第 6 任",
  },
  { order: 7, emperorId: "daizong", orderLabel: "第 7 任" },
  { order: 8, emperorId: "xianzong", orderLabel: "第 8 任" },
  { order: 9, emperorId: "xiaozong", orderLabel: "第 9 任" },
  { order: 10, emperorId: "wuzong", orderLabel: "第 10 任" },
  { order: 11, emperorId: "shizong", orderLabel: "第 11 任" },
  { order: 12, emperorId: "muzong", orderLabel: "第 12 任" },
  { order: 13, emperorId: "shenzong", orderLabel: "第 13 任" },
  { order: 14, emperorId: "guangzong", orderLabel: "第 14 任" },
  { order: 15, emperorId: "xizong", orderLabel: "第 15 任" },
  { order: 16, emperorId: "sizong", orderLabel: "第 16 任" },
];

/**
 * 帝位相邻继承逻辑
 * 含：建文→永乐（夺位）、正统→景泰、景泰→天顺（复位）、正德→嘉靖（旁支）等
 */
export const INHERITANCE_LINKS: InheritanceLink[] = [
  {
    fromId: "taizu",
    toId: "huizong",
    kinship: "皇太孙（懿文太子嫡长子）",
    mode: "designated",
    modeLabel: "遗诏传孙",
    note: "太子朱标早逝，太祖传位皇太孙",
  },
  {
    fromId: "huizong",
    toId: "chengzu",
    kinship: "叔侄",
    mode: "usurpation",
    modeLabel: "靖难夺位",
    note: "燕王起兵清君侧，攻陷南京",
  },
  {
    fromId: "chengzu",
    toId: "renzong",
    kinship: "嫡长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
  },
  {
    fromId: "renzong",
    toId: "xuanzong",
    kinship: "嫡长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
  },
  {
    fromId: "xuanzong",
    toId: "yingzong",
    kinship: "嫡长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
    note: "年号正统",
  },
  {
    fromId: "yingzong",
    toId: "daizong",
    kinship: "异母弟",
    mode: "fraternal",
    modeLabel: "兄俘弟继",
    note: "土木堡英宗被俘，郕王监国称帝，改元景泰",
  },
  {
    fromId: "daizong",
    toId: "yingzong",
    kinship: "异母兄（本人）",
    mode: "restoration",
    modeLabel: "夺门复位",
    note: "英宗复位，改元天顺；一人两度称帝",
  },
  {
    fromId: "yingzong",
    toId: "xianzong",
    kinship: "长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
    note: "自天顺传位",
  },
  {
    fromId: "xianzong",
    toId: "xiaozong",
    kinship: "第三子",
    mode: "designated",
    modeLabel: "册立为储",
  },
  {
    fromId: "xiaozong",
    toId: "wuzong",
    kinship: "嫡长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
  },
  {
    fromId: "wuzong",
    toId: "shizong",
    kinship: "堂兄",
    mode: "collateral",
    modeLabel: "旁支入继（无嗣继承）",
    note: "武宗无子，兄终弟及旁支——兴献王长子入继",
  },
  {
    fromId: "shizong",
    toId: "muzong",
    kinship: "亲生第三子（皇长子、皇次子早夭）",
    mode: "primogeniture",
    modeLabel: "嫡长继承（按长幼顺序）",
  },
  {
    fromId: "muzong",
    toId: "shenzong",
    kinship: "第三子（后立为太子）",
    mode: "designated",
    modeLabel: "册立为储",
  },
  {
    fromId: "shenzong",
    toId: "guangzong",
    kinship: "长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
  },
  {
    fromId: "guangzong",
    toId: "xizong",
    kinship: "长子",
    mode: "primogeniture",
    modeLabel: "嫡长继承",
  },
  {
    fromId: "xizong",
    toId: "sizong",
    kinship: "异母弟",
    mode: "fraternal",
    modeLabel: "兄终弟及",
    note: "熹宗无子，传位五弟信王",
  },
];

export const LINEAGE_CANVAS = { width: 920, height: 1860 };

export function getPerson(id: LineageNodeId): LineagePerson {
  return LINEAGE_PERSONS.find((p) => p.id === id)!;
}

export function getEmperorPerson(id: EmperorId): LineagePerson {
  return getPerson(id);
}

export function getPersonByPeriodId(periodId: PeriodId): LineagePerson | undefined {
  return LINEAGE_PERSONS.find((p) =>
    p.reigns.some((r) => r.periodId === periodId)
  );
}

export function getSuccessionNeighbors(emperorId: EmperorId): {
  prev: SuccessionStep | null;
  current: SuccessionStep;
  next: SuccessionStep | null;
} {
  const idx = SUCCESSION_CHAIN.findIndex((s) => s.emperorId === emperorId);
  return {
    prev: idx > 0 ? SUCCESSION_CHAIN[idx - 1] : null,
    current: SUCCESSION_CHAIN[idx],
    next: idx >= 0 && idx < SUCCESSION_CHAIN.length - 1
      ? SUCCESSION_CHAIN[idx + 1]
      : null,
  };
}

/** 档案卡「上一任 / 下一任」对比：按帝位序，特殊处理英宗↔代宗 */
export function getInheritanceComparison(emperorId: EmperorId): {
  prev: {
    person: LineagePerson;
    kinship: string;
    modeLabel: string;
    link: InheritanceLink;
  } | null;
  next: {
    person: LineagePerson;
    kinship: string;
    modeLabel: string;
    link: InheritanceLink;
  } | null;
} {
  const { prev, next } = getSuccessionNeighbors(emperorId);

  const findLink = (from: EmperorId, to: EmperorId) =>
    INHERITANCE_LINKS.find((l) => l.fromId === from && l.toId === to);

  // 英宗作为主体：上一任取宣宗；下一任取代宗（正统→景泰），另在档案中说明天顺复位
  let prevLink =
    prev && findLink(prev.emperorId, emperorId)
      ? findLink(prev.emperorId, emperorId)!
      : null;
  let nextLink =
    next && findLink(emperorId, next.emperorId)
      ? findLink(emperorId, next.emperorId)!
      : null;

  // 代宗的上一任是英宗（正统），下一任在帝位序上是宪宗，但政治上先有英宗复位
  // 对代宗：next 在十六帝序是宪宗，但继承链上景泰→天顺更关键——用 usurp/restoration 链
  if (emperorId === "daizong") {
    nextLink = findLink("daizong", "yingzong") ?? nextLink;
  }
  if (emperorId === "yingzong") {
    // 下一任对比：优先景泰（第一次让位）
    nextLink = findLink("yingzong", "daizong") ?? nextLink;
  }
  if (emperorId === "xianzong") {
    prevLink = findLink("yingzong", "xianzong") ?? prevLink;
  }

  const nextPersonId =
    emperorId === "daizong"
      ? ("yingzong" as EmperorId)
      : emperorId === "yingzong"
        ? ("daizong" as EmperorId)
        : next?.emperorId;

  return {
    prev: prev && prevLink
      ? {
          person: getEmperorPerson(prev.emperorId),
          kinship: prevLink.kinship,
          modeLabel: prevLink.modeLabel,
          link: prevLink,
        }
      : prev
        ? {
            person: getEmperorPerson(prev.emperorId),
            kinship: "—",
            modeLabel: "—",
            link: {
              fromId: prev.emperorId,
              toId: emperorId,
              kinship: "—",
              mode: "primogeniture",
              modeLabel: "—",
            },
          }
        : null,
    next: nextPersonId && nextLink
      ? {
          person: getEmperorPerson(nextPersonId),
          kinship: nextLink.kinship,
          modeLabel: nextLink.modeLabel,
          link: nextLink,
        }
      : next
        ? {
            person: getEmperorPerson(next.emperorId),
            kinship: "—",
            modeLabel: "—",
            link: {
              fromId: emperorId,
              toId: next.emperorId,
              kinship: "—",
              mode: "primogeniture",
              modeLabel: "—",
            },
          }
        : null,
  };
}

/** 高亮血缘链路：祖先 + 后代 + 自身 */
export function getBloodPathIds(focusId: LineageNodeId): Set<LineageNodeId> {
  const ids = new Set<LineageNodeId>([focusId]);
  const parents = new Map<LineageNodeId, LineageNodeId[]>();
  const children = new Map<LineageNodeId, LineageNodeId[]>();

  for (const e of BLOOD_EDGES) {
    if (!parents.has(e.to)) parents.set(e.to, []);
    parents.get(e.to)!.push(e.from);
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push(e.to);
  }

  const walkUp = (id: LineageNodeId) => {
    for (const p of parents.get(id) ?? []) {
      if (!ids.has(p)) {
        ids.add(p);
        walkUp(p);
      }
    }
  };
  const walkDown = (id: LineageNodeId) => {
    for (const c of children.get(id) ?? []) {
      if (!ids.has(c)) {
        ids.add(c);
        walkDown(c);
      }
    }
  };
  walkUp(focusId);
  walkDown(focusId);

  // 靖难相关：点成祖或惠帝时互相高亮
  if (focusId === "chengzu" || focusId === "huizong") {
    ids.add("huizong");
    ids.add("chengzu");
    ids.add("taizu");
    ids.add("yiwen");
  }

  return ids;
}

export function getHighlightedEdges(focusId: LineageNodeId): Set<string> {
  const path = getBloodPathIds(focusId);
  const set = new Set<string>();
  for (const e of [...BLOOD_EDGES, ...USURP_EDGES]) {
    if (path.has(e.from) && path.has(e.to)) set.add(e.id);
  }
  return set;
}

export type EgoLayoutPerson = LineagePerson & {
  layoutX: number;
  layoutY: number;
};

export interface EgoNeighborhood {
  focusId: LineageNodeId;
  nodeIds: Set<LineageNodeId>;
  persons: EgoLayoutPerson[];
  edges: BloodEdge[];
  canvas: { width: number; height: number };
}

function buildParentChildMaps() {
  const parents = new Map<LineageNodeId, LineageNodeId[]>();
  const children = new Map<LineageNodeId, LineageNodeId[]>();
  for (const e of BLOOD_EDGES) {
    if (!parents.has(e.to)) parents.set(e.to, []);
    parents.get(e.to)!.push(e.from);
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push(e.to);
  }
  return { parents, children };
}

/**
 * 以焦点为中心的近邻子图：父母、同辈兄弟、子女；
 * 靖难相关时纳入夺位边两端。自动排布坐标供浮层可读展示。
 */
export function getEgoNeighborhood(focusId: LineageNodeId): EgoNeighborhood {
  const { parents, children } = buildParentChildMaps();
  const ids = new Set<LineageNodeId>([focusId]);

  const parentIds = parents.get(focusId) ?? [];
  for (const p of parentIds) ids.add(p);

  // 同辈：与焦点共享同一父系
  const siblingIds = new Set<LineageNodeId>();
  for (const p of parentIds) {
    for (const c of children.get(p) ?? []) {
      ids.add(c);
      if (c !== focusId) siblingIds.add(c);
    }
  }

  const childIds = children.get(focusId) ?? [];
  for (const c of childIds) ids.add(c);

  // 靖难：惠帝/成祖互看时补齐太祖–懿文–惠帝–成祖
  if (focusId === "chengzu" || focusId === "huizong") {
    ids.add("taizu");
    ids.add("yiwen");
    ids.add("huizong");
    ids.add("chengzu");
  }

  // 旁支入继：世宗时带上兴献王
  if (focusId === "shizong") ids.add("xingxian");
  if (focusId === "xingxian") {
    ids.add("xianzong");
    ids.add("shizong");
  }

  const edges = [...BLOOD_EDGES, ...USURP_EDGES].filter(
    (e) => ids.has(e.from) && ids.has(e.to)
  );

  // —— 按辈分行自动排布 ——
  // 预留节点左侧御像宽度，避免多分支时卡片与画像重叠
  const NODE_W = 118;
  const PORTRAIT_GUTTER = 54;
  const GAP_X = 56;
  const ROW_GAP = 132;
  const PAD = 48;
  const SLOT_W = NODE_W + PORTRAIT_GUTTER;

  type RowKey = "ancestors" | "focus" | "descendants";
  const rows: Record<RowKey, LineageNodeId[]> = {
    ancestors: [],
    focus: [],
    descendants: [],
  };

  const ancestorSet = new Set<LineageNodeId>();
  for (const p of parentIds) ancestorSet.add(p);
  if (ids.has("taizu") && focusId !== "taizu") {
    // 靖难补丁：太祖、懿文放在祖先行
    if (focusId === "chengzu" || focusId === "huizong") {
      ancestorSet.add("taizu");
      ancestorSet.add("yiwen");
    }
  }
  if (focusId === "shizong" && ids.has("xingxian")) {
    ancestorSet.add("xingxian");
    // 兴献之父宪宗也可出现在祖先
    if (ids.has("xianzong")) ancestorSet.add("xianzong");
  }

  for (const id of ancestorSet) {
    if (ids.has(id) && id !== focusId) rows.ancestors.push(id);
  }

  // 焦点行：兄弟 + 焦点（焦点居中偏好）
  const focusRow = [focusId, ...Array.from(siblingIds)];
  // 去重且保持稳定：按 throneOrder / x 排序
  const uniqFocus = Array.from(new Set(focusRow));
  uniqFocus.sort((a, b) => {
    if (a === focusId) return -1;
    if (b === focusId) return 1;
    const pa = getPerson(a);
    const pb = getPerson(b);
    return (pa.throneOrder ?? 99) - (pb.throneOrder ?? 99) || pa.x - pb.x;
  });
  // 焦点放中间
  const withoutFocus = uniqFocus.filter((id) => id !== focusId);
  const mid = Math.floor(withoutFocus.length / 2);
  rows.focus = [
    ...withoutFocus.slice(0, mid),
    focusId,
    ...withoutFocus.slice(mid),
  ];

  for (const c of childIds) {
    if (ids.has(c)) rows.descendants.push(c);
  }
  // 靖难时成祖子女不在惠帝 ego 的 descendants；已由 childIds 处理

  // 祖先行按原 y/x 排序
  rows.ancestors.sort((a, b) => getPerson(a).x - getPerson(b).x);
  rows.descendants.sort((a, b) => getPerson(a).x - getPerson(b).x);

  const activeRows = (
    [
      ["ancestors", rows.ancestors],
      ["focus", rows.focus],
      ["descendants", rows.descendants],
    ] as const
  ).filter(([, list]) => list.length > 0);

  const maxCount = Math.max(...activeRows.map(([, list]) => list.length), 1);
  const contentW = maxCount * SLOT_W + (maxCount - 1) * GAP_X;
  const width = Math.max(420, contentW + PAD * 2);
  const NODE_H = 86;
  const height =
    activeRows.length * NODE_H +
    (activeRows.length - 1) * (ROW_GAP - NODE_H) +
    PAD * 2;

  const positions = new Map<LineageNodeId, { x: number; y: number }>();
  activeRows.forEach(([, list], rowIndex) => {
    const rowW = list.length * SLOT_W + (list.length - 1) * GAP_X;
    const startX = (width - rowW) / 2 + PORTRAIT_GUTTER;
    const y = PAD + rowIndex * ROW_GAP;
    list.forEach((id, i) => {
      // 卡片左缘；画像画在其左侧 gutter 内
      positions.set(id, {
        x: startX + i * (SLOT_W + GAP_X),
        y,
      });
    });
  });

  // 确保所有 ids 都有位置（兜底）
  let fallbackI = 0;
  for (const id of ids) {
    if (!positions.has(id)) {
      positions.set(id, {
        x: PAD + PORTRAIT_GUTTER + (fallbackI % 3) * (SLOT_W + GAP_X),
        y:
          PAD +
          activeRows.length * ROW_GAP +
          Math.floor(fallbackI / 3) * ROW_GAP,
      });
      fallbackI += 1;
    }
  }

  const persons: EgoLayoutPerson[] = Array.from(ids).map((id) => {
    const p = getPerson(id);
    const pos = positions.get(id)!;
    return { ...p, layoutX: pos.x, layoutY: pos.y };
  });

  const maxY = Math.max(...persons.map((p) => p.layoutY), 0);
  const canvas = {
    width,
    height: Math.max(height, maxY + NODE_H + PAD),
  };

  return { focusId, nodeIds: ids, persons, edges, canvas };
}

export function reignTitlesLabel(person: LineagePerson): string {
  if (person.reigns.length === 0) return "未称帝";
  return person.reigns.map((r) => r.title).join(" / ");
}

export function isEmperorId(id: LineageNodeId): id is EmperorId {
  return LINEAGE_PERSONS.find((p) => p.id === id)?.isEmperor === true;
}

/** 皇帝 → 默认时期（英宗取正统） */
export function getDefaultPeriodForEmperor(id: EmperorId): PeriodId {
  const person = getEmperorPerson(id);
  return person.reigns[0]?.periodId ?? "hongwu";
}

/** 档案卡展示用年号称号，如「嘉靖」「正统·天顺」 */
export function displayReignHonorific(person: {
  reigns: { title: string }[];
  templeName?: string;
}): string {
  if (person.reigns.length === 0) return person.templeName ?? "未称帝";
  if (person.reigns.length === 1) return `${person.reigns[0].title}帝`;
  return `${person.reigns.map((r) => r.title).join("·")}`;
}
