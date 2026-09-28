"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  reignTitlesLabel,
  type BloodEdge,
  type EgoLayoutPerson,
  type LineageNodeId,
  type LineagePerson,
} from "@/data/lineage";

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

  useEffect(() => {
    setUserScale(1);
  }, [mode, focusId]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      setViewportSize({ w: vp.clientWidth, h: vp.clientHeight });
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
    const pad = 0.92;
    return Math.min(
      viewportSize.w / canvas.width,
      viewportSize.h / canvas.height
    ) * pad;
  }, [mode, viewportSize, canvas.width, canvas.height]);

  const scale =
    mode === "ego" ? fitScale * userScale : 0.55 * userScale;

  const lod = lodFromScale(scale, mode);
  const personById = useMemo(() => {
    const m = new Map<LineageNodeId, (typeof persons)[0]>();
    for (const p of persons) m.set(p.id, p);
    return m;
  }, [persons]);

  const stageW = Math.max(canvas.width * scale, viewportSize.w || 0);
  const stageH = Math.max(canvas.height * scale, viewportSize.h || 0);
  const offsetX = Math.max(0, (stageW - canvas.width * scale) / 2);
  const offsetY = Math.max(0, (stageH - canvas.height * scale) / 2);

  const scrollToFocus = useCallback(() => {
    const person = personById.get(focusId);
    const vp = viewportRef.current;
    if (!person || !vp) return;
    const targetX =
      offsetX +
      person.drawX * scale -
      vp.clientWidth / 2 +
      (NODE_W * scale) / 2;
    const targetY =
      offsetY +
      person.drawY * scale -
      vp.clientHeight / 2 +
      (NODE_H * scale) / 2;
    vp.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  }, [focusId, scale, personById, offsetX, offsetY]);

  useEffect(() => {
    const t = window.setTimeout(scrollToFocus, 80);
    return () => window.clearTimeout(t);
  }, [scrollToFocus]);

  const minUser = mode === "ego" ? 0.75 : 0.7;
  const maxUser = mode === "ego" ? 1.45 : 2.4;
  const displayPct = Math.round(
    mode === "ego" ? userScale * 100 : scale * 100
  );

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ink-800/10 px-3 py-2 md:px-4">
        <div>
          <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
            {mode === "ego" ? "近邻血缘" : "全景谱系"}
          </p>
          <p className="text-[11px] text-ink-500">
            {mode === "ego"
              ? "父母 · 同辈 · 子女 · 点击切换"
              : "拖拽滚动 · Ctrl+滚轮缩放"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "full" && <Legend />}
          {mode === "ego" && onRequestFullscreen && (
            <button
              type="button"
              onClick={onRequestFullscreen}
              className="border border-ink-800/15 px-2 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
            >
              展开全景
            </button>
          )}
          {mode === "full" && onExitFullscreen && (
            <button
              type="button"
              onClick={onExitFullscreen}
              className="border border-ink-800/15 px-2 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
            >
              收起全景
            </button>
          )}
          <div className="flex items-center gap-1 rounded bg-ink-800/[0.06] p-0.5">
            <button
              type="button"
              className="px-2 py-1 text-xs text-ink-600 hover:text-ink-900"
              onClick={() =>
                setUserScale((s) => Math.max(minUser, s - 0.1))
              }
              aria-label="缩小"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-[10px] tabular-nums text-ink-500">
              {displayPct}%
            </span>
            <button
              type="button"
              className="px-2 py-1 text-xs text-ink-600 hover:text-ink-900"
              onClick={() =>
                setUserScale((s) => Math.min(maxUser, s + 0.1))
              }
              aria-label="放大"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="scrollbar-timeline relative min-h-0 flex-1 overflow-auto bg-gradient-to-b from-ink-100/40 to-transparent"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setUserScale((s) =>
              Math.min(maxUser, Math.max(minUser, s - e.deltaY * 0.0015))
            );
          }
        }}
      >
        <div
          className="relative transition-[width,height] duration-200"
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
          className="fixed inset-0 z-[80] flex flex-col bg-[rgba(48,42,28,0.45)] p-3 backdrop-blur-[2px] md:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-ink-800/15 bg-[rgba(251,249,243,0.98)] shadow-[0_20px_60px_-20px_rgba(48,42,28,0.5)]"
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

  if (lod === "dot") {
    const size = (person.isEmperor ? 14 : 10) * scale;
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(person.id)}
        title={`${person.name}${person.templeName ? ` · ${person.templeName}` : ""}`}
        className={`absolute rounded-full border-2 transition ${
          isFocus
            ? "border-cinnabar shadow-[0_0_0_3px_rgba(196,60,44,0.25)]"
            : "border-[rgba(247,241,232,0.95)]"
        } ${dimmed ? "opacity-25" : "opacity-100"}`}
        style={{
          left: (x + NODE_W / 2) * scale - size / 2,
          top: (y + NODE_H / 2) * scale - size / 2,
          width: size,
          height: size,
          background: person.accent,
        }}
        aria-label={person.name}
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
        className={`absolute flex items-center justify-center border px-1 font-display transition ${
          person.isEmperor ? "bg-ink-50/95" : "border-dashed bg-ink-100/80"
        } ${
          isFocus
            ? "border-cinnabar shadow-[0_0_0_2px_rgba(196,60,44,0.2)]"
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
        }}
        title={person.name}
      >
        <span
          className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: person.accent }}
        />
        <span className="truncate font-semibold text-ink-800">{shortLabel}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      layout={false}
      onClick={() => onSelect(person.id)}
      className={`absolute flex flex-col items-stretch border text-left transition-shadow ${
        person.isEmperor ? "bg-ink-50/95" : "border-dashed bg-ink-100/70"
      } ${
        isFocus
          ? "border-cinnabar shadow-[0_0_0_3px_rgba(196,60,44,0.2)]"
          : inPath
            ? "border-ink-700/40"
            : "border-ink-800/15"
      } ${dimmed ? "opacity-40" : ""}`}
      style={{
        left: x * scale,
        top: y * scale,
        width: NODE_W * scale,
        height: (dual ? NODE_H + 14 : NODE_H) * scale,
        transformOrigin: "top left",
      }}
      animate={{ scale: isFocus ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="h-1 shrink-0" style={{ background: person.accent }} />
      <div className="flex min-h-0 flex-1 flex-col justify-center px-1.5 py-1">
        <p
          className="truncate font-display font-bold text-ink-900"
          style={{ fontSize: Math.max(10, 12 * scale) }}
        >
          {person.name}
        </p>
        {person.templeName && (
          <p
            className="truncate text-ink-500"
            style={{ fontSize: Math.max(8, 10 * scale) }}
          >
            {person.templeName}
          </p>
        )}
        {!person.isEmperor && (
          <p
            className="truncate text-ink-400"
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
                className="border border-ink-800/15 bg-ink-100/80 px-1 font-display text-ink-700"
                style={{ fontSize: Math.max(8, 9 * scale) }}
              >
                {r.title}
              </span>
            ))}
          </div>
        )}
        {person.throneOrder != null && (
          <p
            className="mt-0.5 text-ink-400"
            style={{ fontSize: Math.max(7, 8 * scale) }}
          >
            第 {person.throneOrder} 任 · {reignTitlesLabel(person)}
          </p>
        )}
      </div>
    </motion.button>
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
    <div className="hidden flex-wrap items-center gap-3 text-[10px] text-ink-500 sm:flex">
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
