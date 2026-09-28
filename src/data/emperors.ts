import type { PeriodId } from "./ming-dynasty";
import { toneForEmperorBand } from "./timeline-palette";

/** 在位皇帝色带（连续色块，按年跨度比例渲染） */

export type EmperorId =
  | "taizu"
  | "huizong" // 惠帝
  | "chengzu"
  | "renzong"
  | "xuanzong"
  | "yingzong" // 正统 + 天顺
  | "daizong"
  | "xianzong"
  | "xiaozong"
  | "wuzong"
  | "shizong"
  | "muzong"
  | "shenzong"
  | "guangzong"
  | "xizong"
  | "sizong";

export interface EmperorBand {
  id: EmperorId;
  name: string;
  templeName: string;
  /** 色带上柔和显示的文案，如「明成祖 朱棣」 */
  displayName: string;
  /** 年号简称，如「洪武」「永乐」 */
  eraLabel: string;
  startYear: number;
  endYear: number;
  /** 柔和背景色 */
  color: string;
  accent: string;
  periodIds: PeriodId[];
}

function band(
  partial: Omit<EmperorBand, "color" | "accent">
): EmperorBand {
  const tone = toneForEmperorBand(partial.id, partial.eraLabel);
  return { ...partial, color: tone.color, accent: tone.accent };
}

export const EMPEROR_BANDS: EmperorBand[] = [
  band({
    id: "taizu",
    name: "朱元璋",
    templeName: "明太祖",
    displayName: "明太祖 朱元璋",
    eraLabel: "洪武",
    startYear: 1368,
    endYear: 1398,
    periodIds: ["hongwu"],
  }),
  band({
    id: "huizong",
    name: "朱允炆",
    templeName: "明惠帝",
    displayName: "明惠帝 朱允炆",
    eraLabel: "建文",
    startYear: 1399,
    endYear: 1402,
    periodIds: ["jianwen"],
  }),
  band({
    id: "chengzu",
    name: "朱棣",
    templeName: "明成祖",
    displayName: "明成祖 朱棣",
    eraLabel: "永乐",
    startYear: 1402,
    endYear: 1424,
    periodIds: ["yongle"],
  }),
  band({
    id: "renzong",
    name: "朱高炽",
    templeName: "明仁宗",
    displayName: "明仁宗 朱高炽",
    eraLabel: "洪熙",
    startYear: 1425,
    endYear: 1425,
    periodIds: ["hongxi"],
  }),
  band({
    id: "xuanzong",
    name: "朱瞻基",
    templeName: "明宣宗",
    displayName: "明宣宗 朱瞻基",
    eraLabel: "宣德",
    startYear: 1426,
    endYear: 1435,
    periodIds: ["xuande"],
  }),
  band({
    id: "yingzong",
    name: "朱祁镇",
    templeName: "明英宗",
    displayName: "明英宗 朱祁镇",
    eraLabel: "正统",
    startYear: 1436,
    endYear: 1449,
    periodIds: ["zhengtong"],
  }),
  band({
    id: "daizong",
    name: "朱祁钰",
    templeName: "明代宗",
    displayName: "明代宗 朱祁钰",
    eraLabel: "景泰",
    startYear: 1450,
    endYear: 1456,
    periodIds: ["jingtai"],
  }),
  band({
    id: "yingzong",
    name: "朱祁镇",
    templeName: "明英宗",
    displayName: "明英宗 朱祁镇（复位）",
    eraLabel: "天顺",
    startYear: 1457,
    endYear: 1464,
    periodIds: ["tianshun"],
  }),
  band({
    id: "xianzong",
    name: "朱见深",
    templeName: "明宪宗",
    displayName: "明宪宗 朱见深",
    eraLabel: "成化",
    startYear: 1465,
    endYear: 1487,
    periodIds: ["chenghua"],
  }),
  band({
    id: "xiaozong",
    name: "朱祐樘",
    templeName: "明孝宗",
    displayName: "明孝宗 朱祐樘",
    eraLabel: "弘治",
    startYear: 1488,
    endYear: 1505,
    periodIds: ["hongzhi"],
  }),
  band({
    id: "wuzong",
    name: "朱厚照",
    templeName: "明武宗",
    displayName: "明武宗 朱厚照",
    eraLabel: "正德",
    startYear: 1506,
    endYear: 1521,
    periodIds: ["zhengde"],
  }),
  band({
    id: "shizong",
    name: "朱厚熜",
    templeName: "明世宗",
    displayName: "明世宗 朱厚熜",
    eraLabel: "嘉靖",
    startYear: 1522,
    endYear: 1566,
    periodIds: ["jiajing"],
  }),
  band({
    id: "muzong",
    name: "朱载垕",
    templeName: "明穆宗",
    displayName: "明穆宗 朱载垕",
    eraLabel: "隆庆",
    startYear: 1567,
    endYear: 1572,
    periodIds: ["longqing"],
  }),
  band({
    id: "shenzong",
    name: "朱翊钧",
    templeName: "明神宗",
    displayName: "明神宗 朱翊钧",
    eraLabel: "万历",
    startYear: 1573,
    endYear: 1620,
    periodIds: ["wanli"],
  }),
  band({
    id: "guangzong",
    name: "朱常洛",
    templeName: "明光宗",
    displayName: "明光宗 朱常洛",
    eraLabel: "泰昌",
    startYear: 1620,
    endYear: 1620,
    periodIds: ["taichang"],
  }),
  band({
    id: "xizong",
    name: "朱由校",
    templeName: "明熹宗",
    displayName: "明熹宗 朱由校",
    eraLabel: "天启",
    startYear: 1621,
    endYear: 1627,
    periodIds: ["tianqi"],
  }),
  band({
    id: "sizong",
    name: "朱由检",
    templeName: "明思宗",
    displayName: "明思宗 朱由检",
    eraLabel: "崇祯",
    startYear: 1628,
    endYear: 1644,
    periodIds: ["chongzhen"],
  }),
];

/** 英宗复位段与正统段共用 id，筛选时合并同一皇帝 */
export function getBandsByEmperorId(id: EmperorId): EmperorBand[] {
  return EMPEROR_BANDS.filter((b) => b.id === id);
}

export function findEmperorBandAtYear(year: number): EmperorBand | undefined {
  return EMPEROR_BANDS.find((b) => year >= b.startYear && year <= b.endYear);
}

export function getEmperorDisplayRange(band: EmperorBand): string {
  return band.startYear === band.endYear
    ? `${band.startYear}`
    : `${band.startYear}—${band.endYear}`;
}
