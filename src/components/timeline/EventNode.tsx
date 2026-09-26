"use client";

import { motion } from "framer-motion";
import type { ChronicleEvent } from "@/data/chronicle-events";
import { EVENT_CATEGORIES } from "@/data/categories";
import { EventTag } from "@/components/EventTag";

interface EventNodeProps {
  event: ChronicleEvent;
  top: number;
  isActive: boolean;
  dimmed?: boolean;
  onSelect: (event: ChronicleEvent) => void;
}

const NODE_SIZE = {
  turning: "h-4 w-4",
  major: "h-2.5 w-2.5",
  minor: "h-1.5 w-1.5",
} as const;

export function EventNode({
  event,
  top,
  isActive,
  dimmed = false,
  onSelect,
}: EventNodeProps) {
  const isTurning = event.weight === "turning";
  const primary = EVENT_CATEGORIES[event.categories[0]];
  const showTags = event.weight !== "minor";

  return (
    <motion.button
      layout
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: dimmed ? 0.28 : 1,
        x: 0,
        scale: dimmed ? 0.98 : 1,
      }}
      exit={{ opacity: 0, x: 10, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(event)}
      className={`absolute left-0 right-1 flex items-start gap-2.5 text-left md:right-2 ${
        isActive ? "z-20" : "z-10"
      }`}
      style={{ top }}
      aria-current={isActive ? "true" : undefined}
      disabled={dimmed}
    >
      {/* 节点：转折点大 · 重要中 · 细节小；颜色取主分类 */}
      <span className="relative mt-0.5 flex w-5 shrink-0 justify-center">
        <motion.span
          layout
          className={`relative block rounded-full border-2 border-ink-50/90 ${NODE_SIZE[event.weight]} ${
            isActive ? "bg-cinnabar" : primary.dot
          }`}
          animate={{
            boxShadow: isActive
              ? "0 0 0 4px rgba(196, 60, 44, 0.22)"
              : isTurning
                ? "0 0 0 3px rgba(42, 35, 26, 0.1)"
                : "0 0 0 0px rgba(0,0,0,0)",
          }}
        />
      </span>

      <span
        className={`min-w-0 flex-1 rounded-r-md px-2 py-1 transition-colors ${
          isActive ? "bg-cinnabar/[0.08]" : "hover:bg-ink-800/[0.04]"
        }`}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`font-display leading-snug ${
              isTurning
                ? "text-sm font-bold text-ink-900"
                : event.weight === "major"
                  ? "text-[13px] font-medium text-ink-800"
                  : "text-xs font-medium text-ink-600"
            } ${isActive ? "!text-cinnabar" : ""}`}
          >
            {event.title}
          </span>
          <time className="shrink-0 text-[10px] tabular-nums text-ink-400">
            {event.yearLabel}
          </time>
        </span>

        {showTags && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {event.categories.map((c) => (
              <EventTag key={c} category={c} />
            ))}
          </span>
        )}

        {!showTags && (
          <span className="mt-1 flex gap-1" aria-hidden>
            {event.categories.map((c) => (
              <span
                key={c}
                className={`h-1.5 w-1.5 rounded-full ${EVENT_CATEGORIES[c].dot}`}
              />
            ))}
          </span>
        )}
      </span>
    </motion.button>
  );
}
