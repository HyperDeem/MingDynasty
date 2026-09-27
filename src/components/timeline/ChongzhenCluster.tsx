"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ChronicleEvent } from "@/data/chronicle-events";
import { EVENT_CATEGORIES } from "@/data/categories";

interface ChongzhenClusterProps {
  events: ChronicleEvent[];
  leftPercent: number;
  activeEventId: string | null;
  onSelect: (event: ChronicleEvent) => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * 崇祯密集事件缩略为单按钮，悬停平滑展开明细
 */
export function ChongzhenCluster({
  events,
  leftPercent,
  activeEventId,
  onSelect,
  onOpenChange,
}: ChongzhenClusterProps) {
  const [open, setOpen] = useState(false);
  if (!events.length) return null;

  const setOpenSafe = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const hasActive = events.some((e) => e.id === activeEventId);

  return (
    <div
      className="absolute bottom-0 z-20 -translate-x-1/2"
      style={{ left: `${leftPercent}%` }}
      onMouseEnter={() => setOpenSafe(true)}
      onMouseLeave={() => setOpenSafe(false)}
      onFocusCapture={() => setOpenSafe(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpenSafe(false);
        }
      }}
    >
      <motion.button
        type="button"
        layout
        className={`relative mb-0.5 flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] shadow-[0_1px_2px_rgba(48,42,28,0.08)] transition ${
          open || hasActive
            ? "border-cinnabar/40 bg-cinnabar/10 text-cinnabar"
            : "border-ink-800/15 bg-[rgba(251,249,243,0.95)] text-ink-700 hover:border-ink-800/25"
        }`}
        animate={{ scale: open ? 1.04 : 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        aria-expanded={open}
        aria-label={`崇祯时期 ${events.length} 条事件，悬停展开`}
      >
        <span className="h-2 w-2 rounded-full bg-cinnabar/80" aria-hidden />
        崇祯 · {events.length}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chongzhen-fan"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-1/2 mb-2 w-[9.5rem] -translate-x-1/2"
          >
            <div className="flex flex-col gap-1 rounded-md border border-[#e3dcca] bg-[rgba(251,249,243,0.97)] p-1.5 shadow-[0_8px_24px_-12px_rgba(48,42,28,0.35)] backdrop-blur-sm">
              {events
                .slice()
                .sort((a, b) => a.year - b.year)
                .map((event, i) => {
                  const primary = EVENT_CATEGORIES[event.categories[0]];
                  const active = activeEventId === event.id;
                  return (
                    <motion.button
                      key={event.id}
                      type="button"
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onClick={() => onSelect(event)}
                      className={`flex w-full items-start gap-1.5 rounded px-1.5 py-1 text-left transition ${
                        active
                          ? "bg-cinnabar/10"
                          : "hover:bg-ink-800/[0.05]"
                      }`}
                    >
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${primary.dot}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block font-display text-[11px] leading-snug ${
                            active
                              ? "font-semibold text-cinnabar"
                              : "font-medium text-ink-800"
                          }`}
                        >
                          {event.title}
                        </span>
                        <span className="mt-0.5 block text-[9px] tabular-nums text-ink-400">
                          {event.yearLabel}
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
