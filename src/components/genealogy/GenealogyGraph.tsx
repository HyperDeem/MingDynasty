"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BLOOD_EDGES,
  LINEAGE_CANVAS,
  LINEAGE_PERSONS,
  USURP_EDGES,
  getBloodPathIds,
  getEgoNeighborhood,
  getHighlightedEdges,
  isEmperorId,
  reignTitlesLabel,
  type BloodEdge,
  type EgoLayoutPerson,
  type LineageNodeId,
  type LineagePerson,
} from "@/data/lineage";
import {
  getEmperorPortraitSrc,
  isLaterCopyPortrait,
} from "@/data/emperor-portraits";

const NODE_W = 118;
const NODE_H = 72;

export type GenealogyMode = "ego" | "full";
type LodLevel = "dot" | "short" | "full";

function lodFromScale(scale: number, mode: GenealogyMode): LodLevel {
  if (mode === "ego") {
    if (scale < 0.55) return "dot";
    if (scale < 0.85) return "short";
    return "full";
  }
  if (scale < 0.58) return "dot";
  if (scale < 0.9) return "short";
  return "full";
}

interface GenealogyGraphProps {
  focusId: LineageNodeId;
  onSelect: (id: LineageNodeId) => void;
  /** ego：近邻可读；full：整图谱 */
  mode?: GenealogyMode;
  /** 全景模式下的「收起」；若提供则在工具栏显示 */
  onRequestFullscreen?: () => void;
  onExitFullscreen?: () => void;
  className?: string;
}

export function GenealogyGraph({
  focusId,
  onSelect,
  mode = "ego",
  onRequestFullscreen,
  onExitFullscreen,
  className = "",
}: GenealogyGraphProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  /** 用户相对适配比例的缩放（1 = 刚好铺满视口） */
  const [userScale, setUserScale] = useState(1);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const scaleRef = useRef(1);
  const layoutRef = useRef({
    offsetX: 0,
    offsetY: 0,
    persons: new Map<LineageNodeId, { drawX: number; drawY: number }>(),
  });

  useEffect(() => {
    setUserScale(1);
  }, [mode, focusId]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const w = Math.round(vp.clientWidth);
      const h = Math.round(vp.clientHeight);
      setViewportSize((prev) => {
        // 忽略滚动条显隐带来的 1–2px 抖动，避免 fitScale 正反馈抽搐
        if (Math.abs(prev.w - w) < 3 && Math.abs(prev.h - h) < 3) return prev;
        return { w, h };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  const ego = useMemo(
    () => (mode === "ego" ? getEgoNeighborhood(focusId) : null),
    [mode, focusId]
  );

  const pathIds = useMemo(() => {
    if (mode === "ego" && ego) return ego.nodeIds;
    return getBloodPathIds(focusId);
  }, [mode, ego, focusId]);

  const edgeIds = useMemo(() => {
    if (mode === "ego" && ego) {
      return new Set(ego.edges.map((e) => e.id));
    }
    return getHighlightedEdges(focusId);
  }, [mode, ego, focusId]);

  const canvas = mode === "ego" && ego ? ego.canvas : LINEAGE_CANVAS;
  const persons: Array<LineagePerson & { drawX: number; drawY: number }> =
    mode === "ego" && ego
      ? ego.persons.map((p: EgoLayoutPerson) => ({
          ...p,
          drawX: p.layoutX,
          drawY: p.layoutY,
        }))
      : LINEAGE_PERSONS.map((p) => ({ ...p, drawX: p.x, drawY: p.y }));

  const edges: BloodEdge[] =
    mode === "ego" && ego ? ego.edges : [...BLOOD_EDGES, ...USURP_EDGES];

  /** ego：按视口适配铺满；full：沿用绝对缩放 */
  const fitScale = useMemo(() => {
    if (mode !== "ego" || viewportSize.w < 8 || viewportSize.h < 8) {
      return mode === "ego" ? 1 : 0.55;
    }
    const pad = 0.9;
    return (
      Math.min(
        viewportSize.w / canvas.width,
        viewportSize.h / canvas.height
      ) * pad
    );
  }, [mode, viewportSize.w, viewportSize.h, canvas.width, canvas.height]);

  const scale =
    mode === "ego" ? fitScale * userScale : 0.55 * userScale;

  const lod = lodFromScale(scale, mode);
  const personById = useMemo(() => {
    const m = new Map<LineageNodeId, (typeof persons)[0]>();
    for (const p of persons) m.set(p.id, p);
    return m;
  }, [persons]);

  // 略小于视口，避免「刚好贴边 → 出滚动条 → 视口变窄 → 缩放再变」循环
  const stageW = Math.max(
    canvas.width * scale,
    Math.max(0, (viewportSize.w || 0) - 1)
  );
  const stageH = Math.max(
    canvas.height * scale,
    Math.max(0, (viewportSize.h || 0) - 1)
  );
  const offsetX = Math.max(0, (stageW - canvas.width * scale) / 2);
  const offsetY = Math.max(0, (stageH - canvas.height * scale) / 2);

  scaleRef.current = scale;
  layoutRef.current = {
    offsetX,
    offsetY,
    persons: new Map(
      persons.map((p) => [p.id, { drawX: p.drawX, drawY: p.drawY }])
    ),
  };

  /** 将当前焦点皇帝滚到视口中心 */
  const scrollFocusIntoView = (behavior: ScrollBehavior = "auto") => {
    const vp = viewportRef.current;
    const person = layoutRef.current.persons.get(focusId);
    if (!vp || !person) return;
    const s = scaleRef.current;
    const { offsetX: ox, offsetY: oy } = layoutRef.current;
    const nodeH =
      (personById.get(focusId)?.reigns.length ?? 0) > 1
        ? NODE_H + 14
        : NODE_H;
    const targetX =
      ox + person.drawX * s - vp.clientWidth / 2 + (NODE_W * s) / 2;
    const targetY =
      oy + person.drawY * s - vp.clientHeight / 2 + (nodeH * s) / 2;
    vp.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior,
    });
  };

  /** 焦点切换 / 模式切换时居中 */
  useEffect(() => {
    const t = window.setTimeout(() => scrollFocusIntoView("auto"), 40);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅跟焦点与模式
  }, [focusId, mode]);

  /**
   * 用户缩放：以选中皇帝为焦点重新锚定视口（布局提交后立刻校正，避免先偏后跳）
   */
  const zoomPendingRef = useRef(false);
  useLayoutEffect(() => {
    if (!zoomPendingRef.current) return;
    zoomPendingRef.current = false;
    scrollFocusIntoView("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userScale, scale, offsetX, offsetY]);

  const minUser = mode === "ego" ? 0.75 : 0.7;
  const maxUser = mode === "ego" ? 1.45 : 2.4;
  const displayPct = Math.round(
    mode === "ego" ? userScale * 100 : scale * 100
  );

  const nudgeScale = (delta: number) => {
    zoomPendingRef.current = true;
    setUserScale((s) => Math.min(maxUser, Math.max(minUser, s + delta)));
  };

  const dragRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    sl: number;
    st: number;
  } | null>(null);

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasActive = Boolean(dragRef.current?.active);
    dragRef.current = null;
    const vp = viewportRef.current;
    if (vp) {
      try {
        if (vp.hasPointerCapture?.(e.pointerId)) {
          vp.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      if (wasActive) vp.style.cursor = "grab";
    }
  };

  return (
    <div className={`relative flex h-full min-h-0 flex-col ${className}`}>
      <div className="museum-emp-toolbar flex shrink-0 items-center justify-center gap-2 border-b border-ink-800/10 bg-[rgba(251,249,243,0.22)] px-3 py-1.5 md:px-4">
        {mode === "full" && <Legend />}
        {mode === "ego" && onRequestFullscreen && (
          <button
            type="button"
            onClick={onRequestFullscreen}
            className="museum-emp-nav-btn border border-ink-800/15 bg-[rgba(251,249,243,0.55)] px-2.5 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
          >
            展开全景
          </button>
        )}
        {mode === "full" && onExitFullscreen && (
          <button
            type="button"
            onClick={onExitFullscreen}
            className="museum-emp-nav-btn border border-ink-800/15 bg-[rgba(251,249,243,0.55)] px-2.5 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
          >
            收起全景
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          className="scrollbar-timeline absolute inset-0 cursor-grab overflow-auto bg-transparent select-none [scrollbar-gutter:stable] active:cursor-grabbing"
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              zoomPendingRef.current = true;
              setUserScale((s) =>
                Math.min(maxUser, Math.max(minUser, s - e.deltaY * 0.0015))
              );
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const t = e.target as HTMLElement;
            if (t.closest("button, a, input, select, textarea")) return;
            const vp = viewportRef.current;
            if (!vp) return;
            e.preventDefault();
            window.getSelection()?.removeAllRanges();
            dragRef.current = {
              active: true,
              x: e.clientX,
              y: e.clientY,
              sl: vp.scrollLeft,
              st: vp.scrollTop,
            };
            vp.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const drag = dragRef.current;
            const vp = viewportRef.current;
            if (!drag?.active || !vp) return;
            e.preventDefault();
            window.getSelection()?.removeAllRanges();
            vp.scrollLeft = drag.sl - (e.clientX - drag.x);
            vp.scrollTop = drag.st - (e.clientY - drag.y);
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
        <div
          className="relative"
          style={{
            width: stageW || canvas.width * scale,
            height: stageH || canvas.height * scale,
          }}
        >
          <div
            className="absolute"
            style={{
              left: offsetX,
              top: offsetY,
              width: canvas.width * scale,
              height: canvas.height * scale,
            }}
          >
          <svg
            width={canvas.width * scale}
            height={canvas.height * scale}
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            className="absolute inset-0"
            aria-hidden
          >
            <defs>
              <marker
                id={`arrow-usurp-${mode}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path
                  d="M0,0 L6,3 L0,6"
                  fill="none"
                  stroke="#c43c2c"
                  strokeWidth="1.2"
                />
              </marker>
              <filter id={`glow-usurp-${mode}`}>
                <feGaussianBlur stdDeviation="1.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((edge) => {
              const from = personById.get(edge.from);
              const to = personById.get(edge.to);
              if (!from || !to) return null;
              const x1 = from.drawX + NODE_W / 2;
              const y1 = from.drawY + NODE_H;
              const x2 = to.drawX + NODE_W / 2;
              const y2 = to.drawY;
              const midY = (y1 + y2) / 2;
              const active = edgeIds.has(edge.id);
              const dimmed = mode === "full" && !active;
              const showLabel = lod !== "dot";

              if (edge.style === "usurp") {
                const path = lightningPath(x1, y1, x2, y2);
                return (
                  <g key={edge.id} opacity={dimmed ? 0.15 : 1}>
                    <path
                      d={path}
                      fill="none"
                      stroke="#c43c2c"
                      strokeWidth={2.4}
                      filter={`url(#glow-usurp-${mode})`}
                      markerEnd={`url(#arrow-usurp-${mode})`}
                    />
                    {showLabel && (
                      <text
                        x={(x1 + x2) / 2 + 8}
                        y={midY}
                        className="fill-cinnabar"
                        fontSize={10}
                        fontFamily="var(--font-display), serif"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              }

              const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
              return (
                <g key={edge.id} opacity={dimmed ? 0.12 : 1}>
                  <path
                    d={d}
                    fill="none"
                    stroke={edge.style === "dashed" ? "#735e40" : "#3d3326"}
                    strokeWidth={edge.style === "solid" ? 2 : 1.5}
                    strokeDasharray={
                      edge.style === "dashed" ? "6 4" : undefined
                    }
                  />
                  {showLabel && (
                    <text
                      x={(x1 + x2) / 2}
                      y={midY - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#8f754f"
                      fontFamily="var(--font-body), sans-serif"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {persons.map((person) => (
            <PersonNode
              key={person.id}
              person={person}
              x={person.drawX}
              y={person.drawY}
              scale={scale}
              lod={lod}
              isFocus={person.id === focusId}
              inPath={pathIds.has(person.id)}
              dimOutOfPath={mode === "full"}
              onSelect={onSelect}
            />
          ))}
          </div>
        </div>
        </div>

        {/* 独立缩放控件：透明圆角玻璃 */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex flex-col items-center gap-2.5 md:bottom-4 md:right-4">
          <button
            type="button"
            onClick={() => nudgeScale(0.12)}
            disabled={userScale >= maxUser - 0.001}
            aria-label="放大血缘树"
            className="pointer-events-auto museum-emp-nav-btn flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-[rgba(251,249,243,0.28)] font-display text-2xl leading-none text-ink-800 shadow-[0_6px_20px_-10px_rgba(48,42,28,0.4)] backdrop-blur-[10px] transition hover:border-cinnabar/40 hover:bg-[rgba(251,249,243,0.55)] hover:text-cinnabar disabled:cursor-default disabled:opacity-30"
          >
            +
          </button>
          <span className="pointer-events-none museum-emp-chip min-w-[2.75rem] rounded-full border border-white/30 bg-[rgba(251,249,243,0.22)] px-2.5 py-1 text-center font-display text-[10px] tabular-nums tracking-wider text-ink-600 backdrop-blur-[10px]">
            {displayPct}%
          </span>
          <button
            type="button"
            onClick={() => nudgeScale(-0.12)}
            disabled={userScale <= minUser + 0.001}
            aria-label="缩小血缘树"
            className="pointer-events-auto museum-emp-nav-btn flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-[rgba(251,249,243,0.28)] font-display text-2xl leading-none text-ink-800 shadow-[0_6px_20px_-10px_rgba(48,42,28,0.4)] backdrop-blur-[10px] transition hover:border-cinnabar/40 hover:bg-[rgba(251,249,243,0.55)] hover:text-cinnabar disabled:cursor-default disabled:opacity-30"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}

/** 全屏全景层 */
export function GenealogyFullscreen({
  open,
  focusId,
  onSelect,
  onClose,
}: {
  open: boolean;
  focusId: LineageNodeId;
  onSelect: (id: LineageNodeId) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-overlay-portal
          className="fixed inset-0 z-[80] flex flex-col bg-[rgba(48,42,28,0.45)] p-3 backdrop-blur-[2px] md:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="museum-emp-scope flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-ink-800/15 bg-[rgba(251,249,243,0.98)] shadow-[0_20px_60px_-20px_rgba(48,42,28,0.5)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <GenealogyGraph
              focusId={focusId}
              onSelect={onSelect}
              mode="full"
              onExitFullscreen={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function PersonNode({
  person,
  x,
  y,
  scale,
  lod,
  isFocus,
  inPath,
  dimOutOfPath,
  onSelect,
}: {
  person: LineagePerson;
  x: number;
  y: number;
  scale: number;
  lod: LodLevel;
  isFocus: boolean;
  inPath: boolean;
  dimOutOfPath: boolean;
  onSelect: (id: LineageNodeId) => void;
}) {
  const dual = person.reigns.length > 1;
  const dimmed = dimOutOfPath && !inPath && !isFocus;
  const emperor =
    person.isEmperor && isEmperorId(person.id) ? person.id : null;
  const portraitSrc = emperor ? getEmperorPortraitSrc(emperor) : null;
  const showPortrait =
    Boolean(emperor) && lod === "full" && (isFocus || inPath);
  const later = emperor ? isLaterCopyPortrait(emperor) : false;
  const objectPos = later ? "object-[50%_35%]" : "object-[50%_12%]";
  const portraitW = 44 * scale;
  const portraitH = (dual ? NODE_H + 14 : NODE_H) * scale;
  const gap = 6 * scale;

  if (lod === "dot") {
    const size = (person.isEmperor ? 14 : 10) * scale * (isFocus ? 1.35 : 1);
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(person.id)}
        title={`${person.name}${person.templeName ? ` · ${person.templeName}` : ""}`}
        className={`absolute rounded-full border-2 transition ${
          isFocus
            ? "border-cinnabar shadow-[0_0_0_4px_rgba(196,60,44,0.35),0_0_18px_rgba(196,60,44,0.45)]"
            : "border-[rgba(247,241,232,0.95)]"
        } ${dimmed ? "opacity-25" : "opacity-100"}`}
        style={{
          left: (x + NODE_W / 2) * scale - size / 2,
          top: (y + NODE_H / 2) * scale - size / 2,
          width: size,
          height: size,
          background: person.accent,
          zIndex: isFocus ? 5 : 1,
        }}
        aria-label={person.name}
        aria-current={isFocus ? "true" : undefined}
      />
    );
  }

  const shortLabel =
    person.reigns[0]?.title ??
    person.templeName?.replace(/^明/, "") ??
    person.name.slice(0, 2);

  if (lod === "short") {
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(person.id)}
        className={`museum-emp-card absolute flex items-center justify-center border px-1 font-display transition ${
          person.isEmperor ? "bg-ink-50/95" : "border-dashed bg-ink-100/80"
        } ${
          isFocus
            ? "museum-emp-card-active border-2 border-cinnabar bg-[rgba(196,60,44,0.08)] shadow-[0_0_0_3px_rgba(196,60,44,0.22),0_4px_14px_rgba(196,60,44,0.2)]"
            : inPath
              ? "border-ink-700/40"
              : "border-ink-800/15"
        } ${dimmed ? "opacity-35" : ""}`}
        style={{
          left: x * scale,
          top: y * scale,
          width: NODE_W * scale,
          height: 36 * scale,
          fontSize: Math.max(10, 12 * scale),
          zIndex: isFocus ? 5 : 1,
        }}
        title={person.name}
        aria-current={isFocus ? "true" : undefined}
      >
        <span
          className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: isFocus ? "#c43c2c" : person.accent }}
        />
        <span
          className={`museum-emp-title truncate font-semibold ${
            isFocus ? "text-cinnabar" : "text-ink-800"
          }`}
        >
          {shortLabel}
        </span>
      </motion.button>
    );
  }

  const nodeH = (dual ? NODE_H + 14 : NODE_H) * scale;
  const ringPad = 5 * scale;

  return (
    <>
      {isFocus && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-sm"
          style={{
            left: x * scale - (showPortrait ? portraitW + gap : 0) - ringPad,
            top: y * scale - ringPad,
            width:
              NODE_W * scale +
              (showPortrait ? portraitW + gap : 0) +
              ringPad * 2,
            height: nodeH + ringPad * 2,
            zIndex: 2,
            background:
              "linear-gradient(135deg, rgba(196,60,44,0.14), rgba(196,60,44,0.03) 55%, rgba(196,60,44,0.1))",
            boxShadow:
              "0 0 0 1.5px rgba(196,60,44,0.55), 0 0 0 4px rgba(196,60,44,0.14), 0 8px 22px rgba(196,60,44,0.18)",
          }}
        />
      )}
      {showPortrait && (
        <button
          type="button"
          onClick={() => onSelect(person.id)}
          title={`${person.name}御像`}
          className={`absolute overflow-hidden border bg-ink-100 transition ${
            isFocus
              ? "border-cinnabar shadow-[inset_0_0_0_1px_rgba(196,60,44,0.35)]"
              : "border-ink-800/15"
          } ${dimmed ? "opacity-40" : ""}`}
          style={{
            left: x * scale - portraitW - gap,
            top: y * scale,
            width: portraitW,
            height: portraitH,
            zIndex: isFocus ? 5 : 2,
          }}
          aria-label={`${person.name}画像`}
        >
          {portraitSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portraitSrc}
              alt=""
              className={`h-full w-full object-cover ${objectPos}`}
              draggable={false}
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center font-display font-bold text-ink-600"
              style={{ fontSize: Math.max(12, 16 * scale) }}
            >
              {person.name.slice(0, 1)}
            </span>
          )}
          {isFocus && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-cinnabar/80 to-transparent py-0.5 text-center font-display text-[8px] tracking-wider text-ink-50"
            >
              当前
            </span>
          )}
        </button>
      )}
      <motion.button
        type="button"
        layout={false}
        onClick={() => onSelect(person.id)}
        className={`museum-emp-card absolute flex flex-col items-stretch border text-left transition-shadow ${
          person.isEmperor ? "bg-ink-50/95" : "border-dashed bg-ink-100/70"
        } ${
          isFocus
            ? "museum-emp-card-active border-cinnabar bg-[rgba(255,248,244,0.98)]"
            : inPath
              ? "border-ink-700/40"
              : "border-ink-800/15"
        } ${dimmed ? "opacity-40" : ""}`}
        style={{
          left: x * scale,
          top: y * scale,
          width: NODE_W * scale,
          height: nodeH,
          zIndex: isFocus ? 5 : 1,
        }}
        aria-current={isFocus ? "true" : undefined}
      >
        <div
          className="shrink-0"
          style={{
            height: isFocus ? 3 * scale : 1 * scale,
            background: isFocus ? "#c43c2c" : person.accent,
          }}
        />
        <div className="flex min-h-0 flex-1 flex-col justify-center px-1.5 py-1">
          <div className="flex items-center gap-1">
            {isFocus && (
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cinnabar"
                style={{
                  boxShadow: "0 0 0 2px rgba(196,60,44,0.25)",
                }}
              />
            )}
            <p
              className={`museum-emp-title truncate font-display font-bold ${
                isFocus ? "text-cinnabar" : "text-ink-900"
              }`}
              style={{ fontSize: Math.max(10, 12 * scale) }}
            >
              {person.name}
            </p>
          </div>
          {person.templeName && (
            <p
              className={`museum-emp-dd truncate ${isFocus ? "text-cinnabar/80" : "text-ink-500"}`}
              style={{ fontSize: Math.max(8, 10 * scale) }}
            >
              {person.templeName}
            </p>
          )}
          {!person.isEmperor && (
            <p
              className="museum-emp-dt truncate text-ink-400"
              style={{ fontSize: Math.max(8, 9 * scale) }}
            >
              {person.posthumousName}
            </p>
          )}
          {person.reigns.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-0.5">
              {person.reigns.map((r) => (
                <span
                  key={r.title}
                  className={`museum-emp-chip border px-1 font-display ${
                    isFocus
                      ? "border-cinnabar/35 bg-cinnabar/10 text-cinnabar"
                      : "border-ink-800/15 bg-ink-100/80 text-ink-700"
                  }`}
                  style={{ fontSize: Math.max(8, 9 * scale) }}
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}
          {person.throneOrder != null && (
            <p
              className={`museum-emp-dt mt-0.5 ${isFocus ? "text-cinnabar/70" : "text-ink-400"}`}
              style={{ fontSize: Math.max(7, 8 * scale) }}
            >
              第 {person.throneOrder} 任 · {reignTitlesLabel(person)}
            </p>
          )}
        </div>
      </motion.button>
    </>
  );
}

function lightningPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1}
    L ${mx - 18} ${my - 12}
    L ${mx + 8} ${my - 4}
    L ${mx - 8} ${my + 8}
    L ${x2} ${y2}`;
}

function Legend() {
  return (
    <div className="museum-emp-dd hidden flex-wrap items-center gap-3 text-[10px] text-ink-500 sm:flex">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-px w-4 bg-ink-800" />
        嫡长 / 直系
      </span>
      <span className="inline-flex items-center gap-1">
        <span
          className="inline-block h-px w-4 border-t border-dashed border-ink-600"
          style={{ borderTopWidth: 1 }}
        />
        旁支 / 次子
      </span>
      <span className="inline-flex items-center gap-1 text-cinnabar">
        <span className="inline-block h-px w-4 bg-cinnabar" />
        夺位
      </span>
    </div>
  );
}
