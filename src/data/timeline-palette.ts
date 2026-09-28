/**
 * 时间轴 / 帝位色带：按疆域六段分章配色（提亮版）
 *
 * 章法对应 MING_TERRITORY_SNAPSHOTS，并套用六种色环关系：
 * 1 开国 · 单色相（朱砂 S/V 阶）
 * 2 极盛 · 相邻色（青绿 → 青灰）
 * 3 守成 · 互补（青绿 × 暖赭）
 * 4 内缩 · 三原色三角（赭为主、灰青辅、藕紫点缀）
 * 5 中叶 · 分裂互补等腰（靛为主、琥珀为辅）
 * 6 明末 · 矩形四色（铁灰、绛红，提亮可读）
 *
 * 原则：段内统一、块际可辨、饱和度与明度足够在纸色底上鲜明。
 */

export type TimelineColorChapterId =
  | "founding"
  | "apex"
  | "consolidation"
  | "contraction"
  | "mid"
  | "fall";

export interface TimelineColorChapter {
  id: TimelineColorChapterId;
  label: string;
  yearFrom: number;
  yearTo: number;
  /** 色环关系简述 */
  harmony: string;
  /** 章节主色（文档 / 调试） */
  keystone: string;
}

export const TIMELINE_COLOR_CHAPTERS: TimelineColorChapter[] = [
  {
    id: "founding",
    label: "开国",
    yearFrom: 1368,
    yearTo: 1401,
    harmony: "单色相 · 朱砂明度阶",
    keystone: "#C24A42",
  },
  {
    id: "apex",
    label: "极盛",
    yearFrom: 1402,
    yearTo: 1426,
    harmony: "相邻色 · 青绿—青灰",
    keystone: "#1F9A86",
  },
  {
    id: "consolidation",
    label: "守成",
    yearFrom: 1427,
    yearTo: 1448,
    harmony: "互补 · 青绿×暖赭",
    keystone: "#2F9A7A",
  },
  {
    id: "contraction",
    label: "内缩",
    yearFrom: 1449,
    yearTo: 1566,
    harmony: "三色 · 赭主 / 灰青辅 / 藕紫点",
    keystone: "#C48A3C",
  },
  {
    id: "mid",
    label: "中叶",
    yearFrom: 1567,
    yearTo: 1620,
    harmony: "分裂互补 · 靛主琥珀辅",
    keystone: "#3A6EB8",
  },
  {
    id: "fall",
    label: "明末",
    yearFrom: 1621,
    yearTo: 1644,
    harmony: "矩形四色 · 铁灰绛红提亮",
    keystone: "#B84858",
  },
];

export function resolveTimelineColorChapter(
  year: number
): TimelineColorChapter {
  const y = Math.min(1644, Math.max(1368, year));
  return (
    TIMELINE_COLOR_CHAPTERS.find((c) => y >= c.yearFrom && y <= c.yearTo) ??
    TIMELINE_COLOR_CHAPTERS[0]!
  );
}

/** color = 色带底；accent = 高光/悬停边 */
export interface BandTone {
  color: string;
  accent: string;
}

/**
 * 各帝色调：同章内色相族一致，仅微调明度/微偏色以区分相邻帝
 */
export const EMPEROR_BAND_TONES: Record<string, BandTone> = {
  /** I 开国 · 朱砂 */
  taizu: { color: "#C24A42", accent: "#E8786E" },
  huizong: { color: "#A85A52", accent: "#D49088" },

  /** II 极盛 · 青绿相邻 */
  chengzu: { color: "#1F9A86", accent: "#3DC4AC" },
  renzong: { color: "#2A8FA8", accent: "#4EB8D0" },

  /** III 守成 · 互补 */
  xuanzong: { color: "#2F9A7A", accent: "#55C4A0" },
  yingzong_zhengtong: { color: "#C4884A", accent: "#E0B070" },

  /** IV 内缩 · 三色（赭 / 灰青 / 藕紫） */
  daizong: { color: "#8B6BB8", accent: "#B090D4" },
  yingzong_tianshun: { color: "#C48A3C", accent: "#E0B05C" },
  xianzong: { color: "#C46A6A", accent: "#E09090" },
  xiaozong: { color: "#3A9A82", accent: "#5CBC9E" },
  wuzong: { color: "#D07A3C", accent: "#E8A060" },
  shizong: { color: "#7A5AA8", accent: "#A080C8" },

  /** V 中叶 · 靛 + 琥珀 */
  muzong: { color: "#3A6EB8", accent: "#5A92D8" },
  shenzong: { color: "#4A5AB8", accent: "#6E7ED4" },
  guangzong: { color: "#D4983C", accent: "#E8BC68" },

  /** VI 明末 · 铁灰 / 绛 */
  xizong: { color: "#6A6A88", accent: "#8E8EAE" },
  sizong: { color: "#B84858", accent: "#D87080" },
};

export function toneForEmperorBand(
  emperorId: string,
  eraLabel?: string
): BandTone {
  if (emperorId === "yingzong") {
    return eraLabel === "天顺"
      ? EMPEROR_BAND_TONES.yingzong_tianshun
      : EMPEROR_BAND_TONES.yingzong_zhengtong;
  }
  return (
    EMPEROR_BAND_TONES[emperorId] ?? {
      color: "#C24A42",
      accent: "#E8786E",
    }
  );
}
