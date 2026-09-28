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
      };
      const geom = simplifyGeometry(f.geometry, 1);
      out.push({
        name: String(props.name ?? "外延区"),
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
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const propsRef = useRef({
    coreProvinces,
    previousCoreProvinces,
    capitals,
    crossfade,
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
        ctx.fillStyle = hexToRgba(e.fill, e.opacity * mul);
        ctx.fill(path);
        ctx.strokeStyle = hexToRgba("#2f554d", 0.45 * mul);
        ctx.lineWidth = 1;
        ctx.setLineDash([3.2, 3.2]);
        ctx.stroke(path);
        ctx.setLineDash([]);
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
      '500 10px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
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

    ctx.font = '500 10.5px "Noto Serif SC", "Noto Sans SC", serif';
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
      ctx.font = '600 11px "Noto Serif SC", "Noto Sans SC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = "rgba(248, 249, 245, 0.95)";
      ctx.strokeText(c.name, x, y + 8);
      ctx.fillStyle = MAP_THEME.inkSoft;
      ctx.fillText(c.name, x, y + 8);
    }
  }, [getPaths]);

  const syncCanvasSize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return false;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w < 2 || h < 2) return false;

    const changed =
      sizeRef.current.w !== w ||
      sizeRef.current.h !== h ||
      sizeRef.current.dpr !== dpr;
    sizeRef.current = { w, h, dpr };
    if (
      changed ||
      canvas.width !== Math.floor(w * dpr) ||
      canvas.height !== Math.floor(h * dpr)
    ) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      pathsCacheRef.current = null;
    }
    return true;
  }, []);

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
      if (!syncCanvasSize()) return;
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

  // 尺寸变化：同步清屏后立刻重绘
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      if (!provincesRef.current.length) return;
      resetView(true);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [resetView]);

  // status 就绪后再保底画一次（避免首帧容器高度为 0）
  useEffect(() => {
    if (status !== "ready") return;
    const id = requestAnimationFrame(() => {
      if (provincesRef.current.length) resetView(true);
    });
    return () => cancelAnimationFrame(id);
  }, [status, resetView]);

  // 疆域数据变化
  useEffect(() => {
    extrasRef.current = extrasFromFc(extras);
    prevExtrasRef.current = extrasFromFc(previousExtras);
    pathsCacheRef.current = null;
    if (provincesRef.current.length) paint();
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
    (sx: number, sy: number): { name: string; isCore: boolean } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      // Path 建在 CSS 像素空间；命中检测必须用单位矩阵，
      // 若带 dpr 变换会把指针坐标放大，造成悬停省份与光标错位
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const view = viewRef.current;
      const paths = getPaths(view);

      for (let i = extrasRef.current.length - 1; i >= 0; i--) {
        if (ctx.isPointInPath(paths.extras[i], sx, sy)) {
          return { name: extrasRef.current[i].name, isCore: false };
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
      if (coreHit) return { name: coreHit, isCore: true };
      if (landHit) return { name: landHit, isCore: false };
      return null;
    },
    [getPaths]
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
    if (name !== hoverRef.current) {
      hoverRef.current = name;
      // 始终回报真实地名；核心省在绘制层已有高亮，文案不再替换成总称
      hoverCbRef.current?.(
        name,
        hit ? { name: hit.name, isCore: hit.isCore } : null
      );
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
    if (hoverRef.current) {
      hoverRef.current = null;
      hoverCbRef.current?.(null, null);
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
      className={className ?? "relative h-full w-full min-h-[280px]"}
      role="application"
      aria-label="明朝疆域交互地图"
      onPointerDown={status === "ready" ? onPointerDown : undefined}
      onPointerMove={status === "ready" ? onPointerMove : undefined}
      onPointerUp={status === "ready" ? onPointerUp : undefined}
      onPointerCancel={status === "ready" ? onPointerUp : undefined}
      onPointerLeave={status === "ready" ? onPointerLeave : undefined}
      onWheel={status === "ready" ? onWheel : undefined}
    >
      <canvas
        ref={canvasRef}
        className="territory-render-canvas absolute inset-0 h-full w-full touch-none"
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
