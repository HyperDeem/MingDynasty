"use client";

import { motion } from "framer-motion";
import type { ChronicleEvent } from "@/data/chronicle-events";
import { EVENT_CATEGORIES } from "@/data/categories";

interface EventNodeProps {
  event: ChronicleEvent;
  /** 横向位置：0–100% */
  leftPercent: number;
  /** 标签行：0 贴近轴，数字越大越靠上（重叠时错开） */
  labelRow: number;
  isActive: boolean;
  dimmed?: boolean;
  onSelect: (event: ChronicleEvent) => void;
  /** 深色浮层时间轴 */
  tone?: "light" | "dark";
}

/** 各行标签距点的上移量（px） */
const ROW_OFFSET_PX = [16, 44, 72, 100] as const;

export function EventNode({
  event,
  leftPercent,
  labelRow,
  isActive,
  dimmed = false,
  onSelect,
  tone = "light",
}: EventNodeProps) {
  const isTurning = event.weight === "turning";
  const primary = EVENT_CATEGORIES[event.categories[0]];
  const row = Math.min(Math.max(labelRow, 0), ROW_OFFSET_PX.length - 1);
  const stemH = ROW_OFFSET_PX[row] - 4;
  const dark = tone === "dark";

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: dimmed ? 0.28 : 1,
        y: 0,
        scale: dimmed ? 0.96 : 1,
      }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(event)}
      className={`absolute bottom-0 z-10 -translate-x-1/2 ${
        isActive ? "z-20" : ""
      }`}
      style={{ left: `${leftPercent}%` }}
      title={`${event.title} · ${event.yearLabel}`}
      aria-current={isActive ? "true" : undefined}
      disabled={dimmed}
    >
      <span className="relative flex flex-col items-center">
        <span
          className={`absolute bottom-full whitespace-nowrap text-center font-display leading-none ${
            dark
              ? isTurning
                ? "text-[10px] font-semibold text-amber-50 md:text-[11px]"
                : "text-[10px] font-medium text-slate-200 md:text-[11px]"
              : isTurning
                ? "text-[10px] font-semibold text-ink-900 md:text-[11px]"
                : "text-[10px] font-medium text-ink-700 md:text-[11px]"
          } ${isActive ? (dark ? "!text-amber-300" : "!text-cinnabar") : ""}`}
          style={{ marginBottom: ROW_OFFSET_PX[row] }}
        >
          {event.title}
          <span
            className={`mt-0.5 block text-[9px] font-normal tabular-nums ${
              dark ? "text-slate-500" : "text-ink-400"
            }`}
          >
            {event.yearLabel}
          </span>
        </span>

        <span
          className={`mb-0.5 block w-px ${
            dark ? "bg-slate-500/40" : "bg-ink-400/25"
          }`}
          style={{ height: stemH }}
          aria-hidden
        />

        <motion.span
          className={`relative block rounded-full border-2 ${
            dark
              ? "border-slate-800"
              : "border-[rgba(247,241,232,0.95)]"
          } ${isTurning ? "h-3 w-3" : "h-2.5 w-2.5"} ${
            isActive
              ? dark
                ? "bg-amber-400"
                : "bg-cinnabar"
              : primary.dot
          }`}
          animate={{
            boxShadow: isActive
              ? dark
                ? "0 0 0 4px rgba(251, 191, 36, 0.25)"
                : "0 0 0 4px rgba(196, 60, 44, 0.22)"
              : isTurning
                ? dark
                  ? "0 0 0 3px rgba(251, 191, 36, 0.12)"
                  : "0 0 0 3px rgba(42, 35, 26, 0.1)"
                : "0 0 0 0px rgba(0,0,0,0)",
          }}
        />
      </span>
    </motion.button>
  );
}
