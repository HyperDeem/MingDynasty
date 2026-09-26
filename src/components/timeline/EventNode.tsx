"use client";

import { motion } from "framer-motion";
import type { ChronicleEvent } from "@/data/chronicle-events";
import { EVENT_CATEGORIES } from "@/data/categories";

interface EventNodeProps {
  event: ChronicleEvent;
  /** 横向位置：0–100% */
  leftPercent: number;
  /** 标签上下交错，减轻重叠 */
  labelAbove: boolean;
  isActive: boolean;
  dimmed?: boolean;
  onSelect: (event: ChronicleEvent) => void;
}

export function EventNode({
  event,
  leftPercent,
  labelAbove,
  isActive,
  dimmed = false,
  onSelect,
}: EventNodeProps) {
  const isTurning = event.weight === "turning";
  const primary = EVENT_CATEGORIES[event.categories[0]];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: dimmed ? 0.28 : 1,
        y: 0,
        scale: dimmed ? 0.96 : 1,
      }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(event)}
      className={`absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 ${
        isActive ? "z-20" : ""
      }`}
      style={{ left: `${leftPercent}%` }}
      title={`${event.title} · ${event.yearLabel}`}
      aria-current={isActive ? "true" : undefined}
      disabled={dimmed}
    >
      <span className="relative flex flex-col items-center">
        {labelAbove && (
          <span
            className={`absolute bottom-full mb-2 max-w-[5.5rem] text-center font-display text-[10px] leading-tight md:max-w-[7rem] md:text-[11px] ${
              isTurning ? "font-semibold text-ink-900" : "font-medium text-ink-700"
            } ${isActive ? "!text-cinnabar" : ""}`}
          >
            {event.title}
            <span className="mt-0.5 block text-[9px] font-normal tabular-nums text-ink-400">
              {event.yearLabel}
            </span>
          </span>
        )}

        <motion.span
          className={`relative block rounded-full border-2 border-[rgba(247,241,232,0.95)] ${
            isTurning ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
          } ${isActive ? "bg-cinnabar" : primary.dot}`}
          animate={{
            boxShadow: isActive
              ? "0 0 0 4px rgba(196, 60, 44, 0.22)"
              : isTurning
                ? "0 0 0 3px rgba(42, 35, 26, 0.1)"
                : "0 0 0 0px rgba(0,0,0,0)",
          }}
        />

        {!labelAbove && (
          <span
            className={`absolute top-full mt-2 max-w-[5.5rem] text-center font-display text-[10px] leading-tight md:max-w-[7rem] md:text-[11px] ${
              isTurning ? "font-semibold text-ink-900" : "font-medium text-ink-700"
            } ${isActive ? "!text-cinnabar" : ""}`}
          >
            {event.title}
            <span className="mt-0.5 block text-[9px] font-normal tabular-nums text-ink-400">
              {event.yearLabel}
            </span>
          </span>
        )}
      </span>
    </motion.button>
  );
}
