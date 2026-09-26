/**
 * 明朝关键时期疆域 GeoJSON 目录
 *
 * 说明：
 * - CHGIS / 谭其骧《中国历史地图集》矢量多为学术许可，禁止商业再分发。
 * - 本目录提供**示意性**简化边界，用于交互演示（永乐极盛 → 弃交趾 / 奴儿干淡出 → 长城一线）。
 * - 生产环境可替换为自行转换的 CHGIS Time Slice / 谭图数字化成果。
 *
 * 参考来源概念：
 * - CHGIS (Harvard / 复旦): https://chgis.fas.harvard.edu/
 * - 谭其骧《中国历史地图集》第七册（元明时期）
 */

export type MingTerritoryRegionId =
  | "core"
  | "jiaozhi"
  | "nurgan"
  | "northwest"
  | "maritime";

export interface MingTerritorySnapshotMeta {
  id: string;
  /** 该快照代表的中心年份 */
  year: number;
  /** 适用年份闭区间 */
  yearFrom: number;
  yearTo: number;
  label: string;
  description: string;
  /** public 路径，如 /geojson/ming/1420-yongle-peak.json */
  path: string;
  /** 本快照包含的特殊区域（用于 UI 提示） */
  regions: MingTerritoryRegionId[];
}

/** 按时间顺序的关键快照（非逐年） */
export const MING_TERRITORY_SNAPSHOTS: MingTerritorySnapshotMeta[] = [
  {
    id: "1368-hongwu",
    year: 1368,
    yearFrom: 1368,
    yearTo: 1401,
    label: "洪武开国",
    description: "两京十三省雏形，北控漠南边缘，尚未经营交趾与奴儿干。",
    path: "/geojson/ming/1368-hongwu.json",
    regions: ["core", "northwest"],
  },
  {
    id: "1420-yongle-peak",
    year: 1420,
    yearFrom: 1402,
    yearTo: 1426,
    label: "永乐极盛",
    description:
      "设交趾布政司，置奴儿干都司；版图北抵外兴安岭一带、南逾红河（示意）。",
    path: "/geojson/ming/1420-yongle-peak.json",
    regions: ["core", "jiaozhi", "nurgan", "northwest"],
  },
  {
    id: "1435-post-jiaozhi",
    year: 1435,
    yearFrom: 1427,
    yearTo: 1448,
    label: "弃交趾之后",
    description: "宣德二年弃交趾；奴儿干名义尚存，实际控制渐弱。",
    path: "/geojson/ming/1435-post-jiaozhi.json",
    regions: ["core", "nurgan", "northwest"],
  },
  {
    id: "1450-post-tumu",
    year: 1450,
    yearFrom: 1449,
    yearTo: 1566,
    label: "土木之后 · 内缩",
    description:
      "土木堡之变后北疆压力增大；奴儿干都司淡出，边界向长城—辽东一线收缩。",
    path: "/geojson/ming/1450-post-tumu.json",
    regions: ["core", "northwest"],
  },
  {
    id: "1582-wanli",
    year: 1582,
    yearFrom: 1567,
    yearTo: 1620,
    label: "万历中叶",
    description: "九边长城为北界常态；东南海贸活跃，东北辽东仍为边镇。",
    path: "/geojson/ming/1582-wanli.json",
    regions: ["core", "northwest", "maritime"],
  },
  {
    id: "1644-fall",
    year: 1644,
    yearFrom: 1621,
    yearTo: 1644,
    label: "明末",
    description: "辽东失陷、流民四起；示意版图进一步收缩。",
    path: "/geojson/ming/1644-fall.json",
    regions: ["core"],
  },
];

export function resolveTerritorySnapshot(
  year: number
): MingTerritorySnapshotMeta {
  const clamped = Math.min(1644, Math.max(1368, year));
  const hit = MING_TERRITORY_SNAPSHOTS.find(
    (s) => clamped >= s.yearFrom && clamped <= s.yearTo
  );
  return hit ?? MING_TERRITORY_SNAPSHOTS[0];
}

/** 地图默认视角：东亚 */
export const MING_MAP_VIEW = {
  center: [108.5, 35] as [number, number],
  zoom: 3.2,
  minZoom: 2.2,
  maxZoom: 7,
  bounds: [
    [70, 10],
    [145, 58],
  ] as [[number, number], [number, number]],
};
