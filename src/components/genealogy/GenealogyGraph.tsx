"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BLOOD_EDGES,
  LINEAGE_CANVAS,
  LINEAGE_PERSONS,
  USURP_EDGES,
  getBloodPathIds,
  getHighlightedEdges,
  reignTitlesLabel,
  type LineageNodeId,
  type LineagePerson,
} from "@/data/lineage";

const NODE_W = 118;
const NODE_H = 72;

interface GenealogyGraphProps {
  focusId: LineageNodeId;
  onSelect: (id: LineageNodeId) => void;
}

export function GenealogyGraph({ focusId, onSelect }: GenealogyGraphProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.72);
  const pathIds = getBloodPathIds(focusId);
  const edgeIds = getHighlightedEdges(focusId);

  const scrollToFocus = useCallback(() => {
    const person = LINEAGE_PERSONS.find((p) => p.id === focusId);
    const vp = viewportRef.current;
    if (!person || !vp) return;
    const targetX = person.x * scale - vp.clientWidth / 2 + (NODE_W * scale) / 2;
    const targetY = person.y * scale - vp.clientHeight / 2 + (NODE_H * scale) / 2;
    vp.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  }, [focusId, scale]);

  useEffect(() => {
    const t = window.setTimeout(scrollToFocus, 80);
    return () => window.clearTimeout(t);
  }, [scrollToFocus]);

  const allEdges = [...BLOOD_EDGES, ...USURP_EDGES];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-800/10 px-4 py-2">
        <div>
          <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
            血缘树
          </p>
          <p className="text-[11px] text-ink-500">
            拖拽滚动 · 滚轮缩放 · 点击节点切换
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Legend />
          <div className="flex items-center gap-1 rounded bg-ink-800/[0.06] p-0.5">
            <button
              type="button"
              className="px-2 py-1 text-xs text-ink-600 hover:text-ink-900"
              onClick={() => setScale((s) => Math.max(0.45, s - 0.1))}
              aria-label="缩小"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center text-[10px] tabular-nums text-ink-500">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="px-2 py-1 text-xs text-ink-600 hover:text-ink-900"
              onClick={() => setScale((s) => Math.min(1.35, s + 0.1))}
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
            setScale((s) =>
              Math.min(1.35, Math.max(0.45, s - e.deltaY * 0.0015))
            );
          }
        }}
      >
        <div
          className="relative origin-top-left transition-transform duration-200"
          style={{
            width: LINEAGE_CANVAS.width * scale,
            height: LINEAGE_CANVAS.height * scale,
          }}
        >
          <svg
            width={LINEAGE_CANVAS.width * scale}
            height={LINEAGE_CANVAS.height * scale}
            viewBox={`0 0 ${LINEAGE_CANVAS.width} ${LINEAGE_CANVAS.height}`}
            className="absolute inset-0"
            aria-hidden
          >
            <defs>
              <marker
                id="arrow-usurp"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="#c43c2c" strokeWidth="1.2" />
              </marker>
              <filter id="glow-usurp">
                <feGaussianBlur stdDeviation="1.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {allEdges.map((edge) => {
              const from = LINEAGE_PERSONS.find((p) => p.id === edge.from)!;
              const to = LINEAGE_PERSONS.find((p) => p.id === edge.to)!;
              const x1 = from.x + NODE_W / 2;
              const y1 = from.y + NODE_H;
              const x2 = to.x + NODE_W / 2;
              const y2 = to.y;
              const midY = (y1 + y2) / 2;
              const active = edgeIds.has(edge.id);
              const dimmed = !active;

              if (edge.style === "usurp") {
                const path = lightningPath(x1, y1, x2, y2);
                return (
                  <g key={edge.id} opacity={dimmed ? 0.15 : 1}>
                    <path
                      d={path}
                      fill="none"
                      stroke="#c43c2c"
                      strokeWidth={2.4}
                      filter="url(#glow-usurp)"
                      markerEnd="url(#arrow-usurp)"
                    />
                    <text
                      x={(x1 + x2) / 2 + 8}
                      y={midY}
                      className="fill-cinnabar"
                      fontSize={10}
                      fontFamily="var(--font-display), serif"
                    >
                      {edge.label}
                    </text>
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
                    strokeDasharray={edge.style === "dashed" ? "6 4" : undefined}
                  />
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
                </g>
              );
            })}
          </svg>

          {LINEAGE_PERSONS.map((person) => (
            <PersonNode
              key={person.id}
              person={person}
              scale={scale}
              isFocus={person.id === focusId}
              inPath={pathIds.has(person.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonNode({
  person,
  scale,
  isFocus,
  inPath,
  onSelect,
}: {
  person: LineagePerson;
  scale: number;
  isFocus: boolean;
  inPath: boolean;
  onSelect: (id: LineageNodeId) => void;
}) {
  const dual = person.reigns.length > 1;

  return (
    <motion.button
      type="button"
      layout={false}
      onClick={() => onSelect(person.id)}
      className={`absolute flex flex-col items-stretch border text-left transition-shadow ${
        person.isEmperor
          ? "bg-ink-50/95"
          : "border-dashed bg-ink-100/70"
      } ${
        isFocus
          ? "border-cinnabar shadow-[0_0_0_3px_rgba(196,60,44,0.2)]"
          : inPath
            ? "border-ink-700/40"
            : "border-ink-800/15 opacity-40"
      }`}
      style={{
        left: person.x * scale,
        top: person.y * scale,
        width: NODE_W * scale,
        height: (dual ? NODE_H + 14 : NODE_H) * scale,
        transformOrigin: "top left",
      }}
      animate={{ scale: isFocus ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div
        className="h-1 shrink-0"
        style={{ background: person.accent }}
      />
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
    <div className="hidden flex-wrap items-center gap-3 text-[10px] text-ink-500 lg:flex">
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
