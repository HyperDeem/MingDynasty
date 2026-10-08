"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  MAP_THEME,
  MAP_THEME_MUSEUM,
  LABEL_PROVINCES,
  shortProvinceLabel,
  isGlowRegion,
  type CapitalMarker,
  type MapThemeColors,
} from "@/data/ming-map-layers";
import {
  clampViewToContent,
  fitBounds,
  lonLatToMercator,
  panBy,
  project,
  simplifyGeometry,
  zoomAt,
  type LonLat,
  type ViewTransform,
} from "@/lib/geo-project";

const CHINA_URL = "/geojson/china-provinces.json";

/**
 * 明朝疆域紧凑视域：收束海洋与漠北留白，仍覆盖交趾—辽东示意范围
 */
const CHINA_FOCUS_BBOX: [[number, number], [number, number]] = [
  [82, 20.2],
  [127.5, 46.8],
];
const MAP_FIT_PADDING = 12;

export interface GeoMapProps {
  coreProvinces: readonly string[];
  previousCoreProvinces?: readonly string[] | null;
  extras: FeatureCollection | null;
  previousExtras?: FeatureCollection | null;
  capitals?: CapitalMarker[];
  crossfade?: number;
  /** 由图例等外部驱动的区域高亮（jiaozhi / nurgan / northwest / maritime…） */
  highlightRegion?: string | null;
  /** 展厅关灯：深色陆地 + 疆域微光 */
  museumMode?: boolean;
  className?: string;
  onFeatureHover?: (
    name: string | null,
    props: Record<string, unknown> | null
  ) => void;
  onReady?: (api: GeoMapApi) => void;
}

export interface GeoMapApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

/** 墨卡托单位环，绘制时再乘 view */
type MercatorRing = Float64Array; // [x0,y0,x1,y1,...]

interface ProvinceFeat {
  name: string;
  shortName: string;
  showLabel: boolean;
  centroid: [number, number];
  rings: MercatorRing[];
}

interface ExtraFeat {
  name: string;
  region: string | null;
  fill: string;
  opacity: number;
  rings: MercatorRing[];
  labelAt: [number, number] | null;
  /** 羁縻示意虚点（墨卡托坐标，绘制时投影） */
  stipple: StippleDot[];
}

interface StippleDot {
  mx: number;
  my: number;
  /** 0–1 不透明度权重；边界点更高 */
  weight: number;
  /** 基准屏幕半径（px） */
  size: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function hash01(a: number, b: number, c = 0): number {
  let n =
    Math.imul(a | 0, 374761393) ^
    Math.imul(b | 0, 668265263) ^
    Math.imul(c | 0, 2147483647);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function pointInMercatorRing(mx: number, my: number, ring: MercatorRing): boolean {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2]!;
    const yi = ring[i * 2 + 1]!;
    const xj = ring[j * 2]!;
    const yj = ring[j * 2 + 1]!;
    if ((yi > my) !== (yj > my) && mx < ((xj - xi) * (my - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * 羁縻 / 示意区虚点场：边界带略密，整体疏朗，带法向抖动
 */
function buildInfluenceStipple(rings: MercatorRing[]): StippleDot[] {
  const dots: StippleDot[] = [];
  let seed = 1;

  for (const ring of rings) {
    const n = ring.length / 2;
    if (n < 3) continue;

    // 边界带：沿边稀疏采样 + 法向抖动
    for (let i = 0; i < n; i++) {
      const i2 = (i + 1) % n;
      const x0 = ring[i * 2]!;
      const y0 = ring[i * 2 + 1]!;
      const x1 = ring[i2 * 2]!;
      const y1 = ring[i2 * 2 + 1]!;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1e-9;
      const px = -dy / len;
      const py = dx / len;
      const step = 0.0034;
      const count = Math.max(1, Math.ceil(len / step));
      for (let s = 0; s < count; s++) {
        const h1 = hash01(seed++, i * 17 + s, 1);
        const h2 = hash01(seed++, s * 31 + i, 2);
        // 约四成采样点跳过，避免珠串过密
        if (h1 > 0.62) continue;
        const t = Math.min(
          1,
          Math.max(0, s / count + (h1 - 0.5) * 0.7 / count)
        );
        const perp = (h2 - 0.4) * 0.014;
        dots.push({
          mx: x0 + dx * t + px * perp,
          my: y0 + dy * t + py * perp,
          weight: 0.62 + h2 * 0.38,
          size: 1.55 + h1 * 1.15,
        });

        // 偶发第二点，略错位，保持边界「雾」感但不堆叠
        if (h2 > 0.78) {
          const h3 = hash01(seed++, i, s);
          dots.push({
            mx: x0 + dx * t + px * (perp + (h3 - 0.5) * 0.01),
            my: y0 + dy * t + py * (perp + (h3 - 0.5) * 0.01),
            weight: 0.45 + h3 * 0.3,
            size: 1.2 + h3 * 0.9,
          });
        }
      }
    }

    // 内部极疏：只暗示范围，不铺满
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < ring.length; i += 2) {
      minX = Math.min(minX, ring[i]!);
      maxX = Math.max(maxX, ring[i]!);
      minY = Math.min(minY, ring[i + 1]!);
      maxY = Math.max(maxY, ring[i + 1]!);
    }
    const cell = 0.0085;
    for (let x = minX; x <= maxX; x += cell) {
      for (let y = minY; y <= maxY; y += cell) {
        const ix = Math.floor(x * 1e5);
        const iy = Math.floor(y * 1e5);
        const h = hash01(seed++, ix, iy);
        if (h > 0.07) continue;
        const jx = x + (hash01(ix, iy, 3) - 0.5) * cell * 0.85;
        const jy = y + (hash01(iy, ix, 5) - 0.5) * cell * 0.85;
        if (!pointInMercatorRing(jx, jy, ring)) continue;
        dots.push({
          mx: jx,
          my: jy,
          weight: 0.35 + h * 0.35,
          size: 1.15 + h * 0.85,
        });
      }
    }
  }

  return dots;
}

function featureCentroid(f: Feature): [number, number] {
  const props = f.properties as {
    centroid?: [number, number];
    center?: [number, number];
  } | null;
  if (props?.centroid) return props.centroid;
  if (props?.center) return props.center;
  return [105, 35];
}

function polygonLabelPoint(geometry: Geometry): [number, number] | null {
  let coords: number[][] = [];
  if (geometry.type === "Polygon") coords = geometry.coordinates[0] as number[][];
  else if (geometry.type === "MultiPolygon")
    coords = geometry.coordinates[0][0] as number[][];
  if (!coords.length) return null;
  let sx = 0;
  let sy = 0;
  for (const c of coords) {
    sx += c[0];
    sy += c[1];
  }
  return [sx / coords.length, sy / coords.length];
}

function ringToMercator(ring: LonLat[]): MercatorRing {
  const out = new Float64Array(ring.length * 2);
  for (let i = 0; i < ring.length; i++) {
    const [mx, my] = lonLatToMercator(ring[i][0], ring[i][1]);
    out[i * 2] = mx;
    out[i * 2 + 1] = my;
  }
  return out;
}

function geometryToMercatorRings(geometry: Geometry): MercatorRing[] {
  const rings: MercatorRing[] = [];
  const addPolygon = (poly: LonLat[][]) => {
    for (const ring of poly) {
      if (ring.length >= 3) rings.push(ringToMercator(ring));
    }
  };
  if (geometry.type === "Polygon") {
    addPolygon(geometry.coordinates as LonLat[][]);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates as LonLat[][][]) {
      addPolygon(poly);
    }
  } else if (geometry.type === "GeometryCollection") {
    for (const g of geometry.geometries) {
      rings.push(...geometryToMercatorRings(g));
    }
  }
  return rings;
}

function buildPathFromRings(
  rings: MercatorRing[],
  view: ViewTransform
): Path2D {
  const path = new Path2D();
  for (const ring of rings) {
    if (ring.length < 6) continue;
    path.moveTo(ring[0] * view.scale + view.tx, ring[1] * view.scale + view.ty);
    for (let i = 2; i < ring.length; i += 2) {
      path.lineTo(
        ring[i] * view.scale + view.tx,
        ring[i + 1] * view.scale + view.ty
      );
    }
    path.closePath();
  }
  return path;
}

function extrasFromFc(fc: FeatureCollection | null): ExtraFeat[] {
  if (!fc?.features?.length) return [];
  const out: ExtraFeat[] = [];
  for (const f of fc.features) {
    if (!f.geometry) continue;
    try {
      const props = (f.properties ?? {}) as {
        fill?: string;
        opacityHint?: number;
        name?: string;
        region?: string;
      };
      const geom = simplifyGeometry(f.geometry, 1);
      const rings = geometryToMercatorRings(geom);
      out.push({
        name: String(props.name ?? "外延区"),
        region: props.region ? String(props.region) : null,
        fill: props.fill ?? MAP_THEME.core,
        opacity: props.opacityHint ?? 0.28,
        rings,
        labelAt: polygonLabelPoint(f.geometry),
        stipple: buildInfluenceStipple(rings),
      });
    } catch {
      /* skip bad feature */
    }
  }
  return out;
}

/**
 * Canvas 疆域底图
 * 坐标预投影为 Float 数组；每次绘制在屏幕空间建 Path（避免 setTransform 清屏竞态）
 */
export function GeoMap({
  coreProvinces,
  previousCoreProvinces = null,
  extras,
  previousExtras = null,
  capitals = [],
  crossfade = 1,
  highlightRegion = null,
  museumMode = false,
  className,
  onFeatureHover,
  onReady,
}: GeoMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const provincesRef = useRef<ProvinceFeat[]>([]);
  const extrasRef = useRef<ExtraFeat[]>([]);
  const prevExtrasRef = useRef<ExtraFeat[]>([]);
  const viewRef = useRef<ViewTransform>({ scale: 1, tx: 0, ty: 0 });
  const baseViewRef = useRef<ViewTransform>({ scale: 1, tx: 0, ty: 0 });
  const zoomFactorRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const hoverRef = useRef<string | null>(null);
  const hoverRegionRef = useRef<string | null>(null);
  /** 0–1 外延区发光抬升进度 */
  const glowPulseRef = useRef(0);
  const glowRafRef = useRef<number | null>(null);
  const glowTargetRef = useRef(0);
  /** 淡出期间仍绘制上次发光区域 */
  const glowRegionRef = useRef<string | null>(null);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const propsRef = useRef({
    coreProvinces,
    previousCoreProvinces,
    capitals,
    crossfade,
    highlightRegion,
    museumMode,
  });
  const hoverCbRef = useRef(onFeatureHover);
  const readyCbRef = useRef(onReady);
  const pathsCacheRef = useRef<{
    key: string;
    provinces: Path2D[];
    extras: Path2D[];
    prevExtras: Path2D[];
  } | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  propsRef.current = {
    coreProvinces,
    previousCoreProvinces,
    capitals,
    crossfade,
    highlightRegion,
    museumMode,
  };
  hoverCbRef.current = onFeatureHover;
  readyCbRef.current = onReady;

  const viewKey = (v: ViewTransform) =>
    `${v.scale.toFixed(3)}_${v.tx.toFixed(1)}_${v.ty.toFixed(1)}`;

  const getPaths = useCallback((view: ViewTransform) => {
    const key = viewKey(view);
    const cached = pathsCacheRef.current;
    if (cached?.key === key) return cached;
    const next = {
      key,
      provinces: provincesRef.current.map((p) =>
        buildPathFromRings(p.rings, view)
      ),
      extras: extrasRef.current.map((e) => buildPathFromRings(e.rings, view)),
      prevExtras: prevExtrasRef.current.map((e) =>
        buildPathFromRings(e.rings, view)
      ),
    };
    pathsCacheRef.current = next;
    return next;
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h, dpr } = sizeRef.current;
    if (w <= 0 || h <= 0) return;
    const provinces = provincesRef.current;
    if (!provinces.length) return;

    const view = viewRef.current;
    if (!Number.isFinite(view.scale) || view.scale <= 0) return;

    const {
      coreProvinces: core,
      previousCoreProvinces: prevCore,
      capitals: caps,
      crossfade: tRaw,
      museumMode: dark,
    } = propsRef.current;
    const theme: MapThemeColors = dark ? MAP_THEME_MUSEUM : MAP_THEME;
    const t = Math.min(1, Math.max(0, tRaw));
    const hasPrev = Boolean(prevCore?.length || prevExtrasRef.current.length);
    const coreSet = new Set(core);
    const prevSet = new Set(prevCore ?? []);
    const hover = hoverRef.current;
    const glow = glowPulseRef.current;
    const glowRegion = glowRegionRef.current;
    const paths = getPaths(view);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // 1) 省面底色（统一陆地色，先铺满）
    for (let i = 0; i < provinces.length; i++) {
      const p = provinces[i];
      const path = paths.provinces[i];
      const isCore = coreSet.has(p.name);
      const isHover = hover === p.name;
      ctx.fillStyle =
        isHover && !isCore ? theme.landHover : theme.land;
      ctx.fill(path);
    }

    // 2) 同色描边封缝：盖住抗锯齿/亚像素接缝，避免背景透出
    ctx.save();
    ctx.lineJoin = "miter";
    ctx.miterLimit = 2.5;
    ctx.lineCap = "butt";
    ctx.strokeStyle = theme.land;
    ctx.lineWidth = 1.35;
    for (const path of paths.provinces) ctx.stroke(path);
    ctx.restore();

    // 3) 核心疆域叠色
    for (let i = 0; i < provinces.length; i++) {
      const p = provinces[i];
      const path = paths.provinces[i];
      const isCore = coreSet.has(p.name);
      const isHover = hover === p.name;

      if (hasPrev && prevSet.has(p.name)) {
        ctx.fillStyle = hexToRgba(theme.core, (1 - t) * (dark ? 0.38 : 0.32));
        ctx.fill(path);
      }
      if (isCore) {
        ctx.fillStyle = hexToRgba(
          theme.core,
          (hasPrev ? t : 1) * (isHover ? (dark ? 0.48 : 0.4) : dark ? 0.38 : 0.32)
        );
        ctx.fill(path);
      }
    }

    // 4) 核心区同色微封缝（半透明叠色接缝）
    if (coreSet.size > 0) {
      ctx.save();
      ctx.lineJoin = "miter";
      ctx.lineCap = "butt";
      ctx.strokeStyle = hexToRgba(
        theme.core,
        (hasPrev ? t : 1) * (dark ? 0.38 : 0.32)
      );
      ctx.lineWidth = 1.1;
      for (let i = 0; i < provinces.length; i++) {
        if (!coreSet.has(provinces[i].name)) continue;
        ctx.stroke(paths.provinces[i]);
      }
      ctx.restore();
    }

    // 外延 / 羁縻：疏朗虚点云；hover 时提亮色与不透明度，标出范围
    const drawExtras = (list: ExtraFeat[], mul: number) => {
      if (mul <= 0.01) return;
      const anyLit = glow > 0.01 && glowRegion != null;
      for (let i = 0; i < list.length; i++) {
        const e = list[i]!;
        const canGlow = e.region != null && isGlowRegion(e.region);
        const lit =
          canGlow && anyLit && glowRegion === e.region;
        const idleFill = dark
          ? e.region === "maritime"
            ? "#d4a017"
            : "#2dd4bf"
          : e.region === "maritime"
            ? "#a16207"
            : e.region === "northwest"
              ? "#0f766e"
              : e.fill;
        // hover：直接换高饱和醒目色（非仅调透明度）
        const litFill =
          e.region === "maritime"
            ? dark
              ? "#fbbf24"
              : "#f59e0b"
            : dark
              ? "#f0fdfa"
              : "#f97316";
        const baseFill = lit ? litFill : idleFill;
        const dim = anyLit && !lit ? 0.4 : 1;
        const alphaScale = mul * dim;
        const lift = lit ? -glow * 2.2 : 0;

        ctx.save();
        if (lift) ctx.translate(0, lift);

        if (e.stipple.length > 0) {
          let cx = 0;
          let cy = 0;
          for (const d of e.stipple) {
            cx += d.mx;
            cy += d.my;
          }
          cx /= e.stipple.length;
          cy /= e.stipple.length;
          const sx = cx * view.scale + view.tx;
          const sy = cy * view.scale + view.ty;
          const washR = 56 + Math.min(110, view.scale * 0.014);
          const washCore = lit
            ? (dark ? 0.28 : 0.22) * (0.55 + glow * 0.45)
            : dark
              ? 0.14
              : 0.1;
          const wash = ctx.createRadialGradient(sx, sy, 6, sx, sy, washR);
          wash.addColorStop(0, hexToRgba(baseFill, washCore * mul * dim));
          wash.addColorStop(1, hexToRgba(baseFill, 0));
          ctx.fillStyle = wash;
          ctx.beginPath();
          ctx.arc(sx, sy, washR, 0, Math.PI * 2);
          ctx.fill();
        }

        // 实心点：常态青绿/琥珀；hover 直接变为暖白/亮橙
        for (const d of e.stipple) {
          const x = d.mx * view.scale + view.tx;
          const y = d.my * view.scale + view.ty;
          if (x < -12 || y < -12 || x > w + 12 || y > h + 12) continue;
          const r = Math.max(
            1.35,
            Math.min(3.2, d.size * (lit ? 1.25 : 1))
          );
          const a = lit
            ? Math.min(0.98, 0.82 + d.weight * 0.16) * mul
            : Math.min(0.72, (dark ? 0.42 : 0.5) + d.weight * 0.28) *
              alphaScale;
          ctx.beginPath();
          ctx.fillStyle = hexToRgba(baseFill, a);
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    };
    drawExtras(prevExtrasRef.current, hasPrev ? 1 - t : 0);
    drawExtras(extrasRef.current, hasPrev ? Math.max(t, 0.05) : 1);

    // 5) 省界细线：单次描边，贴合无缝拼图效果
    ctx.save();
    ctx.lineJoin = "miter";
    ctx.miterLimit = 2.5;
    ctx.lineCap = "butt";
    ctx.strokeStyle = dark ? theme.boundary : "rgba(79, 84, 76, 0.32)";
    ctx.lineWidth = 0.65;
    for (const path of paths.provinces) ctx.stroke(path);
    ctx.restore();

    // 核心疆域外轮廓（关灯时微光）
    if (dark) {
      ctx.save();
      ctx.lineJoin = "miter";
      ctx.lineCap = "butt";
      ctx.shadowColor = "rgba(45, 212, 191, 0.28)";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = hexToRgba(
        theme.boundaryStrong,
        hasPrev ? 0.35 + t * 0.4 : 0.7
      );
      ctx.lineWidth = 1.25;
      for (let i = 0; i < provinces.length; i++) {
        if (!coreSet.has(provinces[i].name)) continue;
        ctx.stroke(paths.provinces[i]);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.lineJoin = "miter";
      ctx.lineCap = "butt";
      ctx.strokeStyle = hexToRgba("#2f554d", hasPrev ? 0.3 + t * 0.35 : 0.55);
      ctx.lineWidth = 1.05;
      for (let i = 0; i < provinces.length; i++) {
        if (!coreSet.has(provinces[i].name)) continue;
        ctx.stroke(paths.provinces[i]);
      }
      ctx.restore();
    }

    // 标签：关灯时辖区内暖白+深墨描边，辖区外暗蓝灰虚化
    const labelSerif =
      '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 10px ${labelSerif}`;
    for (const p of provinces) {
      if (!p.showLabel || !p.shortName) continue;
      const [x, y] = project(p.centroid[0], p.centroid[1], view);
      if (x < -40 || y < -20 || x > w + 40 || y > h + 20) continue;
      const inCore = coreSet.has(p.name);

      if (dark) {
        if (inCore) {
          ctx.lineJoin = "round";
          ctx.miterLimit = 2;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#041a18";
          ctx.strokeText(p.shortName, x, y);
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = "#FDFBF7";
          ctx.fillText(p.shortName, x, y);
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
        } else {
          ctx.lineWidth = 0;
          ctx.fillStyle = "#64748b";
          ctx.fillText(p.shortName, x, y);
        }
      } else {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = "rgba(248, 249, 245, 0.95)";
        ctx.strokeText(p.shortName, x, y);
        ctx.fillStyle = hexToRgba(theme.inkFaint, 0.8);
        ctx.fillText(p.shortName, x, y);
      }
    }

    ctx.font = `500 10.5px ${labelSerif}`;
    for (const e of extrasRef.current) {
      if (!e.labelAt) continue;
      const [x, y] = project(e.labelAt[0], e.labelAt[1], view);
      if (dark) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#041a18";
        ctx.strokeText(e.name, x, y);
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = hexToRgba("#FDFBF7", 0.92 * (hasPrev ? t : 1));
        ctx.fillText(e.name, x, y);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      } else {
        ctx.fillStyle = hexToRgba(theme.inkSoft, 0.75 * (hasPrev ? t : 1));
        ctx.fillText(e.name, x, y);
      }
    }

    for (const c of caps) {
      const [x, y] = project(c.coordinates[0], c.coordinates[1], view);
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? "rgba(15, 23, 42, 0.92)"
        : "rgba(251, 249, 243, 0.95)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = theme.capital;
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = theme.paperRaised;
      ctx.stroke();
      if (dark) {
        ctx.save();
        ctx.shadowColor = "rgba(240, 180, 41, 0.45)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = theme.capital;
        ctx.fill();
        ctx.restore();
      }
      ctx.font = `600 11px ${labelSerif}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      if (dark) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#041a18";
        ctx.strokeText(c.name, x, y + 8);
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = "#FDFBF7";
        ctx.fillText(c.name, x, y + 8);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      } else {
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = "rgba(248, 249, 245, 0.95)";
        ctx.strokeText(c.name, x, y + 8);
        ctx.fillStyle = theme.inkSoft;
        ctx.fillText(c.name, x, y + 8);
      }
    }
  }, [getPaths]);

  const bufferShrinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  /**
   * @param mode
   *  - exact：立即按容器分配 backing store（首屏 / 手动重置）
   *  - grow：仅在需要更大缓冲时扩容；缩小时先保持缓冲与 CSS 一致（禁止拉伸），
   *    延迟收缩缓冲，避免时间轴高度动画把位图纵向压扁造成抖动
   */
  const syncCanvasSize = useCallback((mode: "exact" | "grow" = "exact") => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return false;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w < 2 || h < 2) return false;

    sizeRef.current = { w, h, dpr };

    const needW = Math.floor(w * dpr);
    const needH = Math.floor(h * dpr);
    const curW = canvas.width;
    const curH = canvas.height;

    const grow = needW > curW || needH > curH;
    const shrink = needW < curW || needH < curH;
    const dprChanged =
      curW > 0 &&
      curH > 0 &&
      Math.abs(curW / Math.max(1, w) - dpr) > 0.05;

    const applyCssToBuffer = () => {
      // CSS 像素必须与 backing store / dpr 一致，否则浏览器会拉伸位图
      canvas.style.width = `${canvas.width / dpr}px`;
      canvas.style.height = `${canvas.height / dpr}px`;
    };

    if (mode === "exact" || grow || dprChanged || curW === 0 || curH === 0) {
      if (bufferShrinkTimerRef.current) {
        clearTimeout(bufferShrinkTimerRef.current);
        bufferShrinkTimerRef.current = null;
      }
      if (curW !== needW || curH !== needH) {
        canvas.width = needW;
        canvas.height = needH;
        pathsCacheRef.current = null;
      }
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    } else if (shrink) {
      // 保持现有缓冲；CSS 跟缓冲走（不跟更小的容器走），由 wrap overflow 裁切
      applyCssToBuffer();
      if (bufferShrinkTimerRef.current) {
        clearTimeout(bufferShrinkTimerRef.current);
      }
      bufferShrinkTimerRef.current = setTimeout(() => {
        bufferShrinkTimerRef.current = null;
        const c = canvasRef.current;
        const { w: lw, h: lh, dpr: ldpr } = sizeRef.current;
        if (!c) return;
        const tw = Math.floor(lw * ldpr);
        const th = Math.floor(lh * ldpr);
        if (c.width !== tw || c.height !== th) {
          c.width = tw;
          c.height = th;
          pathsCacheRef.current = null;
        }
        c.style.width = `${lw}px`;
        c.style.height = `${lh}px`;
        paint();
      }, 200);
    } else {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    return true;
  }, [paint]);

  const applyView = useCallback(
    (next: ViewTransform) => {
      const { w, h } = sizeRef.current;
      viewRef.current = clampViewToContent(
        next,
        CHINA_FOCUS_BBOX,
        w,
        h,
        0.16
      );
      pathsCacheRef.current = null;
      paint();
    },
    [paint]
  );

  const resetView = useCallback(
    (preserveZoom: boolean) => {
      if (!syncCanvasSize("exact")) return;
      const { w, h } = sizeRef.current;
      const base = fitBounds(CHINA_FOCUS_BBOX, w, h, MAP_FIT_PADDING);
      baseViewRef.current = base;
      if (!preserveZoom) {
        zoomFactorRef.current = 1;
        applyView({ ...base });
      } else {
        applyView(
          zoomAt(
            base,
            w / 2,
            h / 2,
            zoomFactorRef.current,
            base.scale * 0.9,
            base.scale * 8
          )
        );
      }
    },
    [applyView, syncCanvasSize]
  );

  /**
   * 容器尺寸变化：冻结当前投影（不改 scale/tx/ty，不 clamp 重居中）。
   * 时间轴在底部吃高度时，地图相对屏幕顶部保持不动，从下方裁切即可。
   */
  const resyncViewToSize = useCallback(() => {
    if (!provincesRef.current.length) return;
    const hadSize = sizeRef.current.w >= 2 && sizeRef.current.h >= 2;
    if (!syncCanvasSize("grow")) return;
    const { w, h } = sizeRef.current;
    if (w < 2 || h < 2) return;

    baseViewRef.current = fitBounds(CHINA_FOCUS_BBOX, w, h, MAP_FIT_PADDING);

    if (
      !hadSize ||
      !Number.isFinite(viewRef.current.scale) ||
      viewRef.current.scale <= 0
    ) {
      zoomFactorRef.current = 1;
      applyView({ ...baseViewRef.current });
      return;
    }

    zoomFactorRef.current =
      viewRef.current.scale / Math.max(1e-9, baseViewRef.current.scale);
    paint();
  }, [applyView, paint, syncCanvasSize]);

  const resyncViewToSizeRef = useRef(resyncViewToSize);
  resyncViewToSizeRef.current = resyncViewToSize;

  // 加载省界（只跑一次）
  useEffect(() => {
    let cancelled = false;
    let painted = false;
    setStatus("loading");

    const paintWhenReady = () => {
      if (!canvasRef.current || !wrapRef.current) return false;
      if (!provincesRef.current.length) return false;
      resetView(false);
      if (!painted) {
        painted = true;
        readyCbRef.current?.({
          zoomIn: () => {
            const { w, h } = sizeRef.current;
            zoomFactorRef.current = Math.min(8, zoomFactorRef.current * 1.28);
            applyView(
              zoomAt(
                viewRef.current,
                w / 2,
                h / 2,
                1.28,
                baseViewRef.current.scale * 0.9,
                baseViewRef.current.scale * 8
              )
            );
          },
          zoomOut: () => {
            const { w, h } = sizeRef.current;
            zoomFactorRef.current = Math.max(
              0.9,
              zoomFactorRef.current / 1.28
            );
            applyView(
              zoomAt(
                viewRef.current,
                w / 2,
                h / 2,
                1 / 1.28,
                baseViewRef.current.scale * 0.9,
                baseViewRef.current.scale * 8
              )
            );
          },
          reset: () => resetView(false),
        });
      }
      return sizeRef.current.w > 1 && sizeRef.current.h > 1;
    };

    void fetch(CHINA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`省界数据 HTTP ${r.status}`);
        return r.json();
      })
      .then((fc: FeatureCollection) => {
        if (cancelled) return;
        if (!fc?.features?.length) {
          throw new Error("省界 GeoJSON 为空");
        }

        const list: ProvinceFeat[] = [];
        for (const f of fc.features) {
          if (!f.geometry) continue;
          try {
            const name = String(
              (f.properties as { name?: string })?.name ?? ""
            );
            const showLabel = LABEL_PROVINCES.has(name);
            // 保留原始共享边界顶点，避免独立抽稀造成省界缝隙
            const rings = geometryToMercatorRings(f.geometry);
            if (!rings.length) continue;
            list.push({
              name,
              shortName: showLabel ? shortProvinceLabel(name) : "",
              showLabel,
              centroid: featureCentroid(f),
              rings,
            });
          } catch {
            /* skip */
          }
        }
        if (!list.length) throw new Error("未能解析任何省界多边形");

        provincesRef.current = list;
        pathsCacheRef.current = null;
        setStatus("ready");
        setErrorMsg(null);

        // 立刻试画；若容器尚未有尺寸，再等两帧 / resize
        if (!paintWhenReady()) {
          requestAnimationFrame(() => {
            if (!paintWhenReady()) {
              requestAnimationFrame(() => {
                paintWhenReady();
              });
            }
          });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "地图数据加载失败");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅挂载时加载一次
  }, []);

  // 尺寸变化：保持视口中心，不重新 fit（避免切朝/时间轴高度动画时地图抖动）
  // 依赖保持 length=1（用稳定 ref），避免 Fast Refresh 时从 [resetView] 变成 [] 触发 hooks 报错
  const resizeEffectKey = useRef(0);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      resyncViewToSizeRef.current();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [resizeEffectKey]);

  const resetViewRef = useRef(resetView);
  resetViewRef.current = resetView;

  // status 就绪后再保底画一次（避免首帧容器高度为 0）
  // 仅依赖 status，避免 resetView 身份变化时误触发整图重 fit 造成抖动
  useEffect(() => {
    if (status !== "ready") return;
    const id = requestAnimationFrame(() => {
      if (provincesRef.current.length) resetViewRef.current(true);
    });
    return () => cancelAnimationFrame(id);
  }, [status]);

  useEffect(
    () => () => {
      if (bufferShrinkTimerRef.current) {
        clearTimeout(bufferShrinkTimerRef.current);
      }
    },
    []
  );

  // 疆域数据变化：只重绘，不动视口
  const crossfadePaintRaf = useRef<number | null>(null);
  useEffect(() => {
    extrasRef.current = extrasFromFc(extras);
    prevExtrasRef.current = extrasFromFc(previousExtras);
    pathsCacheRef.current = null;
    if (!provincesRef.current.length) return;
    // 合并 crossfade 多帧 setState，减少同步重绘压力
    if (crossfadePaintRaf.current != null) {
      cancelAnimationFrame(crossfadePaintRaf.current);
    }
    crossfadePaintRaf.current = requestAnimationFrame(() => {
      crossfadePaintRaf.current = null;
      paint();
    });
    return () => {
      if (crossfadePaintRaf.current != null) {
        cancelAnimationFrame(crossfadePaintRaf.current);
        crossfadePaintRaf.current = null;
      }
    };
  }, [
    coreProvinces,
    previousCoreProvinces,
    extras,
    previousExtras,
    capitals,
    crossfade,
    museumMode,
    paint,
  ]);

  const hitTest = useCallback(
    (
      sx: number,
      sy: number
    ): { name: string; isCore: boolean; region: string | null } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const view = viewRef.current;
      const paths = getPaths(view);

      /** 虚点有法向抖动，命中区 = 多边形 ∪ 邻近虚点 */
      const hitExtra = (e: ExtraFeat, path: Path2D) => {
        if (ctx.isPointInPath(path, sx, sy)) return true;
        const hitR = 16;
        const hitR2 = hitR * hitR;
        for (const d of e.stipple) {
          const x = d.mx * view.scale + view.tx;
          const y = d.my * view.scale + view.ty;
          const dx = x - sx;
          const dy = y - sy;
          if (dx * dx + dy * dy <= hitR2) return true;
        }
        return false;
      };

      for (let i = extrasRef.current.length - 1; i >= 0; i--) {
        const e = extrasRef.current[i]!;
        if (!hitExtra(e, paths.extras[i]!)) continue;
        return { name: e.name, isCore: false, region: e.region };
      }

      const core = new Set(propsRef.current.coreProvinces);
      let coreHit: string | null = null;
      let landHit: string | null = null;
      for (let i = 0; i < provincesRef.current.length; i++) {
        if (!ctx.isPointInPath(paths.provinces[i]!, sx, sy)) continue;
        const name = provincesRef.current[i]!.name;
        if (core.has(name)) coreHit = name;
        else landHit = name;
      }
      if (coreHit) return { name: coreHit, isCore: true, region: "core" };
      if (landHit) return { name: landHit, isCore: false, region: null };
      return null;
    },
    [getPaths]
  );

  const driveGlow = useCallback((target: number) => {
    glowTargetRef.current = target;
    if (glowRafRef.current != null) return;
    const step = () => {
      const cur = glowPulseRef.current;
      const goal = glowTargetRef.current;
      const next = cur + (goal - cur) * 0.2;
      glowPulseRef.current =
        Math.abs(goal - next) < 0.008 ? goal : next;
      if (glowPulseRef.current < 0.008 && goal === 0) {
        glowRegionRef.current = null;
      }
      paint();
      if (Math.abs(glowTargetRef.current - glowPulseRef.current) > 0.008) {
        glowRafRef.current = requestAnimationFrame(step);
      } else {
        glowPulseRef.current = glowTargetRef.current;
        if (glowTargetRef.current === 0) glowRegionRef.current = null;
        glowRafRef.current = null;
        paint();
      }
    };
    glowRafRef.current = requestAnimationFrame(step);
  }, [paint]);

  const resolveActiveGlowRegion = useCallback((): string | null => {
    const mapHover = hoverRegionRef.current;
    if (isGlowRegion(mapHover)) return mapHover;
    const ext = propsRef.current.highlightRegion;
    if (isGlowRegion(ext)) return ext;
    return null;
  }, []);

  const syncGlow = useCallback(() => {
    const region = resolveActiveGlowRegion();
    if (region) glowRegionRef.current = region;
    driveGlow(region ? 1 : 0);
  }, [driveGlow, resolveActiveGlowRegion]);

  // 图例外部高亮 → 同步发光抬升
  useEffect(() => {
    syncGlow();
  }, [highlightRegion, syncGlow]);

  useEffect(
    () => () => {
      if (glowRafRef.current != null) {
        cancelAnimationFrame(glowRafRef.current);
        glowRafRef.current = null;
      }
    },
    []
  );

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      applyView(panBy(viewRef.current, dx, dy));
      return;
    }

    const hit = hitTest(sx, sy);
    const name = hit?.name ?? null;
    const region = hit?.region ?? null;
    if (name !== hoverRef.current || region !== hoverRegionRef.current) {
      hoverRef.current = name;
      hoverRegionRef.current = region;
      hoverCbRef.current?.(
        name,
        hit
          ? { name: hit.name, isCore: hit.isCore, region: hit.region }
          : null
      );
      syncGlow();
      paint();
    }
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? "pointer" : "grab";
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    dragRef.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  const onPointerLeave = () => {
    dragRef.current.active = false;
    if (hoverRef.current || hoverRegionRef.current) {
      hoverRef.current = null;
      hoverRegionRef.current = null;
      hoverCbRef.current?.(null, null);
      syncGlow();
      paint();
    }
  };

  const onWheel = (e: ReactWheelEvent) => {
    e.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 1 / 1.12 : 1.12;
    const base = baseViewRef.current;
    zoomFactorRef.current = Math.max(
      0.9,
      Math.min(8, zoomFactorRef.current * factor)
    );
    applyView(
      zoomAt(
        viewRef.current,
        e.clientX - rect.left,
        e.clientY - rect.top,
        factor,
        base.scale * 0.9,
        base.scale * 8
      )
    );
  };

  return (
    <div
      ref={wrapRef}
      className={
        className ??
        "relative h-full w-full min-h-[280px] overflow-hidden"
      }
      role="application"
      aria-label="明朝疆域交互地图"
      onPointerDown={status === "ready" ? onPointerDown : undefined}
      onPointerMove={status === "ready" ? onPointerMove : undefined}
      onPointerUp={status === "ready" ? onPointerUp : undefined}
      onPointerCancel={status === "ready" ? onPointerUp : undefined}
      onPointerLeave={status === "ready" ? onPointerLeave : undefined}
      onWheel={status === "ready" ? onWheel : undefined}
    >
      {/* 不用 inset-0/h-full：尺寸只由 JS style 与 backing store 对齐，避免位图被拉伸 */}
      <canvas
        ref={canvasRef}
        className="territory-render-canvas absolute left-0 top-0 touch-none"
      />
      {status === "loading" && (
        <div
          className={`pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 transition-colors duration-700 ${
            museumMode
              ? "bg-[rgba(9,10,15,0.55)] text-slate-400"
              : "bg-[rgba(248,249,245,0.55)] text-[#898d80]"
          }`}
        >
          <span
            className={`h-7 w-7 animate-spin rounded-full border-2 ${
              museumMode
                ? "border-slate-700 border-t-amber-400/80"
                : "border-[#d4cab2] border-t-[#3f6f64]"
            }`}
          />
          <p className="text-xs">省界底图加载中…</p>
        </div>
      )}
      {status === "error" && (
        <div
          className={`absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 px-4 text-center transition-colors duration-700 ${
            museumMode
              ? "bg-[rgba(9,10,15,0.92)] text-slate-300"
              : "bg-[rgba(248,249,245,0.92)]"
          }`}
        >
          <p className="text-sm text-[#b6584f]">地图未能绘制</p>
          <p className="max-w-sm text-xs text-[#898d80]">
            {errorMsg ?? "请检查 /geojson/china-provinces.json 是否可访问"}
          </p>
          <button
            type="button"
            className="mt-1 rounded-md border border-[#d4cab2] bg-[#fbf9f3] px-3 py-1.5 text-xs text-[#4f544c]"
            onClick={() => window.location.reload()}
          >
            刷新重试
          </button>
        </div>
      )}
    </div>
  );
}
