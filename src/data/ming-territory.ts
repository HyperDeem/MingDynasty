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

/**
 * 按时间顺序的关键快照（非逐年）
 * description 据《明史·地理志》及明代官方碑刻记载改写，供界面摘录。
 */
export const MING_TERRITORY_SNAPSHOTS: MingTerritorySnapshotMeta[] = [
  {
    id: "1368-hongwu",
    year: 1368,
    yearFrom: 1368,
    yearTo: 1401,
    label: "洪武开国",
    description:
      "《明史·地理志》：洪武初建都江表，革元中书省，置十三布政使司，分领天下府州县及羁縻诸司；又置都司卫所领番汉诸军。是时京师在应天，交趾布政司、奴儿干都司皆未建置。",
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
      "《明史·地理志》：成祖定都北京，以北平为直隶，增设贵州、交趾二布政使司。永乐七年置奴儿干都司；《敕修奴儿干永宁寺碑记》载其境「东濒海，西接兀良哈，南邻朝鲜，北至奴儿干北海」。",
    path: "/geojson/ming/1420-yongle-peak.json",
    regions: ["core", "jiaozhi", "nurgan", "northwest"],
  },
  {
    id: "1435-post-jiaozhi",
    year: 1435,
    yearFrom: 1427,
    yearTo: 1448,
    label: "弃交趾之后",
    description:
      "《明史·地理志》：仁、宣之际，南交屡叛，旋复弃之外徼。宣德二年罢交趾布政使司。腹里之制，为京师、南京二直隶与十三布政使司。",
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
      "《明史·地理志》：终明之世，为直隶者二——京师、南京；为布政使司者十三。边陲要地称重镇者九：辽东、蓟州、宣府、大同、榆林、宁夏、甘肃、太原、固原，皆分统卫所关堡。",
    path: "/geojson/ming/1450-post-tumu.json",
    regions: ["core", "northwest"],
  },
  {
    id: "1582-wanli",
    year: 1582,
    yearFrom: 1567,
    yearTo: 1620,
    label: "万历中叶",
    description:
      "《明史·地理志》所载两京十三布政使司建置如故；北边仍以辽东、蓟州、宣府、大同、榆林、宁夏、甘肃、太原、固原九镇分统卫所关堡，为明代边防之常制。",
    path: "/geojson/ming/1582-wanli.json",
    regions: ["core", "northwest", "maritime"],
  },
  {
    id: "1644-fall",
    year: 1644,
    yearFrom: 1621,
    yearTo: 1644,
    label: "明末",
    description:
      "《明史》本纪及《地理志》辽东诸卫所载：自天启间沈阳、辽阳相继失守，辽东都司故地多为后金所据。内地名义仍称两京十三布政使司，北边重镇残缺，防线收缩于山海关一带。",
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
