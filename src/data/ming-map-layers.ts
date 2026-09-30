/**
 * 明朝疆域地图图层定义
 * 核心区：对齐现代省级边界高亮（视觉对齐省界底图）
 * 额外区：交趾 / 奴儿干 / 西北羁縻 / 海贸带示意多边形
 */

import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { MingTerritoryRegionId } from "@/data/ming-territory";

/** 与 china-provinces.json 中 name 字段一致 */
export const MING_FULL_CORE_PROVINCES = [
  "北京市",
  "天津市",
  "河北省",
  "山西省",
  "山东省",
  "河南省",
  "陕西省",
  "甘肃省",
  "宁夏回族自治区",
  "四川省",
  "重庆市",
  "湖北省",
  "湖南省",
  "江西省",
  "安徽省",
  "江苏省",
  "上海市",
  "浙江省",
  "福建省",
  "广东省",
  "海南省",
  "广西壮族自治区",
  "云南省",
  "贵州省",
  "辽宁省",
] as const;

/** 明末示意收缩：去辽东与甘宁边缘 */
export const MING_LATE_CORE_PROVINCES = [
  "北京市",
  "天津市",
  "河北省",
  "山西省",
  "山东省",
  "河南省",
  "陕西省",
  "四川省",
  "重庆市",
  "湖北省",
  "湖南省",
  "江西省",
  "安徽省",
  "江苏省",
  "上海市",
  "浙江省",
  "福建省",
  "广东省",
  "海南省",
  "广西壮族自治区",
  "云南省",
  "贵州省",
] as const;

export const REGION_STYLE: Record<
  MingTerritoryRegionId,
  { fill: string; stroke: string; opacity: number; label: string }
> = {
  core: {
    fill: "#3f6f64",
    stroke: "#2f554d",
    opacity: 0.28,
    /** 回退文案；界面优先用快照的 coreLegendLabel */
    label: "核心疆域",
  },
  jiaozhi: {
    fill: "#4f8a7d",
    stroke: "#3f6f64",
    opacity: 0.32,
    label: "交趾布政司",
  },
  nurgan: {
    fill: "#5d8a6b",
    stroke: "#3f6f64",
    opacity: 0.26,
    label: "奴儿干都司",
  },
  northwest: {
    fill: "#6f7f96",
    stroke: "#41506e",
    opacity: 0.26,
    label: "西北羁縻",
  },
  maritime: {
    fill: "#b08a3e",
    stroke: "#8a6c30",
    opacity: 0.22,
    label: "东南海贸带",
  },
};

/**
 * 地图纸色体系
 * 冷灰蓝海水 · 暖米非明辖陆地 · 青瓷核心疆域 · 朱砂都城印
 */
export const MAP_THEME = {
  paper: "#f4f1e9",
  paperRaised: "#fbf9f3",
  /** 海洋 / 水体：极淡黛青，衬出大陆轮廓 */
  ocean: "#E8ECEB",
  /** 无归属陆地（省面，非核心） */
  land: "#efe9df",
  landHover: "#e6ddd0",
  landMuted: "#f3efe6",
  boundary: "rgba(79, 84, 76, 0.32)",
  boundaryStrong: "rgba(47, 85, 77, 0.45)",
  ink: "#222621",
  inkSoft: "#4f544c",
  inkFaint: "#898d80",
  hairline: "#e3dcca",
  hairlineStrong: "#d4cab2",
  core: REGION_STYLE.core.fill,
  /** 都城朱砂印 */
  capital: "#c43c2c",
  capitalGlow: "rgba(196, 60, 44, 0.4)",
  capitalRim: "#9a2e22",
} as const;

export interface CapitalMarker {
  id: string;
  name: string;
  coordinates: [number, number];
}

export const MING_CAPITALS: Record<string, CapitalMarker[]> = {
  "1368-hongwu": [
    { id: "nanjing", name: "应天", coordinates: [118.796, 32.06] },
  ],
  "1420-yongle-peak": [
    { id: "beijing", name: "京师", coordinates: [116.407, 39.905] },
    { id: "nanjing", name: "南京", coordinates: [118.796, 32.06] },
  ],
  "1435-post-jiaozhi": [
    { id: "beijing", name: "京师", coordinates: [116.407, 39.905] },
    { id: "nanjing", name: "南京", coordinates: [118.796, 32.06] },
  ],
  "1450-post-tumu": [
    { id: "beijing", name: "京师", coordinates: [116.407, 39.905] },
  ],
  "1582-wanli": [
    { id: "beijing", name: "京师", coordinates: [116.407, 39.905] },
  ],
  "1644-fall": [
    { id: "beijing", name: "京师", coordinates: [116.407, 39.905] },
  ],
};

/** 额外区域示意多边形（非省界对齐部分） */
const EXTRA_GEOMETRIES: Record<string, Feature<Polygon>> = {
  jiaozhi: {
    type: "Feature",
    properties: {
      id: "jiaozhi",
      name: "交趾布政司",
      region: "jiaozhi",
      fill: REGION_STYLE.jiaozhi.fill,
      opacityHint: REGION_STYLE.jiaozhi.opacity,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [102.2, 23.4],
          [104.0, 23.5],
          [105.5, 23.2],
          [106.8, 22.8],
          [107.6, 22.0],
          [108.2, 21.2],
          [108.0, 20.2],
          [107.2, 19.2],
          [106.2, 18.4],
          [105.2, 17.8],
          [104.2, 17.9],
          [103.4, 18.6],
          [102.8, 19.6],
          [102.4, 20.8],
          [102.2, 22.2],
          [102.2, 23.4],
        ],
      ],
    },
  },
  nurgan: {
    type: "Feature",
    properties: {
      id: "nurgan",
      name: "奴儿干都司",
      region: "nurgan",
      fill: REGION_STYLE.nurgan.fill,
      opacityHint: REGION_STYLE.nurgan.opacity,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [121.5, 42.2],
          [124.5, 42.8],
          [128.0, 44.0],
          [131.5, 46.0],
          [134.5, 48.5],
          [137.0, 51.0],
          [138.5, 53.2],
          [136.0, 54.5],
          [132.0, 54.0],
          [127.5, 52.0],
          [124.0, 49.5],
          [121.5, 46.5],
          [120.2, 44.0],
          [121.5, 42.2],
        ],
      ],
    },
  },
  nurganNominal: {
    type: "Feature",
    properties: {
      id: "nurgan",
      name: "奴儿干都司（名义）",
      region: "nurgan",
      fill: REGION_STYLE.nurgan.fill,
      opacityHint: 0.2,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [122.0, 42.5],
          [126.0, 43.5],
          [130.5, 46.0],
          [133.5, 48.5],
          [132.0, 50.5],
          [127.0, 48.5],
          [123.5, 45.5],
          [121.5, 43.5],
          [122.0, 42.5],
        ],
      ],
    },
  },
  northwest: {
    type: "Feature",
    properties: {
      id: "northwest",
      name: "哈密—嘉峪关以西羁縻",
      region: "northwest",
      fill: REGION_STYLE.northwest.fill,
      opacityHint: REGION_STYLE.northwest.opacity,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [88.5, 39.0],
          [92.0, 38.2],
          [95.5, 37.8],
          [98.0, 38.5],
          [99.5, 40.0],
          [98.0, 42.0],
          [94.5, 42.8],
          [91.0, 42.2],
          [88.8, 40.8],
          [88.5, 39.0],
        ],
      ],
    },
  },
  northwestEdge: {
    type: "Feature",
    properties: {
      id: "northwest",
      name: "甘肃—哈密边缘",
      region: "northwest",
      fill: REGION_STYLE.northwest.fill,
      opacityHint: 0.28,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [92.5, 38.5],
          [96.0, 37.8],
          [99.0, 38.8],
          [101.0, 40.2],
          [99.5, 41.5],
          [96.0, 41.8],
          [93.5, 40.5],
          [92.5, 38.5],
        ],
      ],
    },
  },
  jiubian: {
    type: "Feature",
    properties: {
      id: "northwest",
      name: "九边沿线",
      region: "northwest",
      fill: REGION_STYLE.northwest.fill,
      opacityHint: 0.26,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [98.5, 37.8],
          [103.0, 38.5],
          [108.0, 39.5],
          [112.5, 40.2],
          [116.5, 40.0],
          [119.0, 40.5],
          [118.0, 41.6],
          [113.0, 41.8],
          [107.5, 41.2],
          [102.5, 40.2],
          [99.0, 39.0],
          [98.5, 37.8],
        ],
      ],
    },
  },
  maritime: {
    type: "Feature",
    properties: {
      id: "maritime",
      name: "东南海贸带",
      region: "maritime",
      fill: REGION_STYLE.maritime.fill,
      opacityHint: REGION_STYLE.maritime.opacity,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [117.2, 21.8],
          [119.5, 22.8],
          [121.5, 24.5],
          [122.8, 26.8],
          [122.2, 28.5],
          [120.5, 27.2],
          [118.8, 25.0],
          [117.5, 23.2],
          [117.2, 21.8],
        ],
      ],
    },
  },
};

export interface MingMapLayerSpec {
  coreProvinces: readonly string[];
  extraIds: string[];
  capitals: CapitalMarker[];
}

export const MING_MAP_LAYERS: Record<string, MingMapLayerSpec> = {
  "1368-hongwu": {
    coreProvinces: MING_FULL_CORE_PROVINCES,
    extraIds: ["northwestEdge"],
    capitals: MING_CAPITALS["1368-hongwu"],
  },
  "1420-yongle-peak": {
    coreProvinces: MING_FULL_CORE_PROVINCES,
    extraIds: ["jiaozhi", "nurgan", "northwest"],
    capitals: MING_CAPITALS["1420-yongle-peak"],
  },
  "1435-post-jiaozhi": {
    coreProvinces: MING_FULL_CORE_PROVINCES,
    extraIds: ["nurganNominal", "northwestEdge"],
    capitals: MING_CAPITALS["1435-post-jiaozhi"],
  },
  "1450-post-tumu": {
    coreProvinces: MING_FULL_CORE_PROVINCES,
    extraIds: ["jiubian"],
    capitals: MING_CAPITALS["1450-post-tumu"],
  },
  "1582-wanli": {
    coreProvinces: MING_FULL_CORE_PROVINCES,
    extraIds: ["jiubian", "maritime"],
    capitals: MING_CAPITALS["1582-wanli"],
  },
  "1644-fall": {
    coreProvinces: MING_LATE_CORE_PROVINCES,
    extraIds: [],
    capitals: MING_CAPITALS["1644-fall"],
  },
};

export function getMapLayerSpec(snapshotId: string): MingMapLayerSpec {
  return MING_MAP_LAYERS[snapshotId] ?? MING_MAP_LAYERS["1368-hongwu"];
}

export function buildExtrasGeoJSON(extraIds: string[]): FeatureCollection {
  const features = extraIds
    .map((id) => EXTRA_GEOMETRIES[id])
    .filter(Boolean)
    .map((f) => structuredClone(f));
  return { type: "FeatureCollection", features };
}

export function buildCapitalsGeoJSON(
  capitals: CapitalMarker[]
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: capitals.map((c) => ({
      type: "Feature",
      properties: { id: c.id, name: c.name },
      geometry: { type: "Point", coordinates: c.coordinates },
    })),
  };
}

export function shortProvinceLabel(name: string): string {
  return name
    .replace(/壮族|回族|维吾尔|特别行政/g, "")
    .replace(/(省|市|自治区|区)$/g, "");
}

/** 底图上显示的省名（避免过密） */
export const LABEL_PROVINCES = new Set([
  "北京市",
  "河北省",
  "山西省",
  "山东省",
  "河南省",
  "陕西省",
  "甘肃省",
  "四川省",
  "湖北省",
  "湖南省",
  "江西省",
  "安徽省",
  "江苏省",
  "浙江省",
  "福建省",
  "广东省",
  "广西壮族自治区",
  "云南省",
  "贵州省",
  "辽宁省",
  "吉林省",
  "黑龙江省",
  "内蒙古自治区",
  "新疆维吾尔自治区",
  "西藏自治区",
  "青海省",
]);
