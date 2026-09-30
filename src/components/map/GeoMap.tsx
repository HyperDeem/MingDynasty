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
  LABEL_PROVINCES,
  shortProvinceLabel,
  isGlowRegion,
  type CapitalMarker,
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
      out.push({
        name: String(props.name ?? "外延区"),
        region: props.region ? String(props.region) : null,
        fill: props.fill ?? MAP_THEME.core,
        opacity: props.opacityHint ?? 0.28,
        rings: geometryToMercatorRings(geom),
        labelAt: polygonLabelPoint(f.geometry),
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
    } = propsRef.current;
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

    // 省面
    for (let i = 0; i < provinces.length; i++) {
      const p = provinces[i];
      const path = paths.provinces[i];
      const isCore = coreSet.has(p.name);
      const isHover = hover === p.name;
      ctx.fillStyle =
        isHover && !isCore ? MAP_THEME.landHover : MAP_THEME.land;
      ctx.fill(path);

      if (hasPrev && prevSet.has(p.name)) {
        ctx.fillStyle = hexToRgba(MAP_THEME.core, (1 - t) * 0.32);
        ctx.fill(path);
      }
      if (isCore) {
        ctx.fillStyle = hexToRgba(
          MAP_THEME.core,
          (hasPrev ? t : 1) * (isHover ? 0.4 : 0.32)
        );
        ctx.fill(path);
      }
    }

    // 外延
    const drawExtras = (list: ExtraFeat[], pathList: Path2D[], mul: number) => {
      if (mul <= 0.01) return;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const path = pathList[i];
        const canGlow = e.region != null && isGlowRegion(e.region);
        const lit =
          canGlow && glow > 0.01 && glowRegion != null && glowRegion === e.region;

        if (lit) {
          const lift = glow * 3.6;
          ctx.save();
          ctx.translate(0, -lift);
          ctx.shadowColor = hexToRgba(e.fill, 0.5 + glow * 0.3);
          ctx.shadowBlur = 8 + glow * 16;
          ctx.fillStyle = hexToRgba(
            e.fill,
            Math.min(0.62, e.opacity * mul * (1.2 + glow * 0.6))
          );
          ctx.fill(path);
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.strokeStyle = hexToRgba(e.fill, 0.58 + glow * 0.35);
          ctx.lineWidth = 1.5 + glow * 0.9;
          ctx.setLineDash([]);
          ctx.stroke(path);
          // 内缘高光，增强“抬升”
          ctx.strokeStyle = `rgba(255, 252, 245, ${0.2 + glow * 0.28})`;
          ctx.lineWidth = 1.1;
          ctx.stroke(path);
          ctx.restore();
        } else {
          ctx.fillStyle = hexToRgba(e.fill, e.opacity * mul);
          ctx.fill(path);
          ctx.strokeStyle = hexToRgba("#2f554d", 0.45 * mul);
          ctx.lineWidth = 1;
          ctx.setLineDash([3.2, 3.2]);
          ctx.stroke(path);
          ctx.setLineDash([]);
        }
      }
    };
    drawExtras(
      prevExtrasRef.current,
      paths.prevExtras,
      hasPrev ? 1 - t : 0
    );
    drawExtras(
      extrasRef.current,
      paths.extras,
      hasPrev ? Math.max(t, 0.05) : 1
    );

    // 省界
    ctx.strokeStyle = "rgba(79, 84, 76, 0.28)";
    ctx.lineWidth = 0.7;
    for (const path of paths.provinces) ctx.stroke(path);

    ctx.strokeStyle = hexToRgba("#2f554d", hasPrev ? 0.3 + t * 0.35 : 0.55);
    ctx.lineWidth = 1.1;
    for (let i = 0; i < provinces.length; i++) {
      if (!coreSet.has(provinces[i].name)) continue;
      ctx.stroke(paths.provinces[i]);
    }

    // 标签
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      '500 10px "Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif';
    for (const p of provinces) {
      if (!p.showLabel || !p.shortName) continue;
      const [x, y] = project(p.centroid[0], p.centroid[1], view);
      if (x < -40 || y < -20 || x > w + 40 || y > h + 20) continue;
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "rgba(248, 249, 245, 0.95)";
      ctx.strokeText(p.shortName, x, y);
      ctx.fillStyle = hexToRgba(MAP_THEME.inkFaint, 0.8);
      ctx.fillText(p.shortName, x, y);
    }

    ctx.font =
      '500 10.5px "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif';
    for (const e of extrasRef.current) {
      if (!e.labelAt) continue;
      const [x, y] = project(e.labelAt[0], e.labelAt[1], view);
      ctx.fillStyle = hexToRgba(MAP_THEME.inkSoft, 0.75 * (hasPrev ? t : 1));
      ctx.fillText(e.name, x, y);
    }

    for (const c of caps) {
      const [x, y] = project(c.coordinates[0], c.coordinates[1], view);
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 249, 243, 0.95)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = MAP_THEME.capital;
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = MAP_THEME.paperRaised;
      ctx.stroke();
      ctx.font =
        '600 11px "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = "rgba(248, 249, 245, 0.95)";
      ctx.strokeText(c.name, x, y + 8);
      ctx.fillStyle = MAP_THEME.inkSoft;
      ctx.fillText(c.name, x, y + 8);
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
            const simplified = simplifyGeometry(f.geometry, 4);
            const rings = geometryToMercatorRings(simplified);
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

      for (let i = extrasRef.current.length - 1; i >= 0; i--) {
        if (ctx.isPointInPath(paths.extras[i], sx, sy)) {
          const e = extrasRef.current[i];
          return { name: e.name, isCore: false, region: e.region };
        }
      }

      const core = new Set(propsRef.current.coreProvinces);
      let coreHit: string | null = null;
      let landHit: string | null = null;
      for (let i = 0; i < provincesRef.current.length; i++) {
        if (!ctx.isPointInPath(paths.provinces[i], sx, sy)) continue;
        const name = provincesRef.current[i].name;
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
        <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-[rgba(248,249,245,0.55)] text-[#898d80]">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4cab2] border-t-[#3f6f64]" />
          <p className="text-xs">省界底图加载中…</p>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-[rgba(248,249,245,0.92)] px-4 text-center">
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
