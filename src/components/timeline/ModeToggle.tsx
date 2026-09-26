"use client";

import { motion } from "framer-motion";
import type { TimelineMode } from "@/data/chronicle-events";
import { countCoreEvents, CHRONICLE_EVENTS } from "@/data/chronicle-events";

interface ModeToggleProps {
  mode: TimelineMode;
  detailLevel: number;
  onModeChange: (mode: TimelineMode) => void;
  onDetailChange: (level: number) => void;
}

export function ModeToggle({
  mode,
  detailLevel,
  onModeChange,
  onDetailChange,
}: ModeToggleProps) {
  const coreCount = countCoreEvents();
  const majorCount = CHRONICLE_EVENTS.filter((e) => e.weight !== "minor").length;
  const totalCount = CHRONICLE_EVENTS.length;
  const chronicleCount = detailLevel < 0.45 ? majorCount : totalCount;

  return (
    <div className="space-y-3 border-b border-ink-800/10 px-5 pb-4 pt-3 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
          全景 / 细节
        </p>
        <p className="text-[10px] tabular-nums text-ink-400">
          {mode === "core"
            ? `核心主线 · ${coreCount} 转折点`
            : `编年史 · ${chronicleCount} 条`}
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-1 rounded-md bg-ink-800/[0.06] p-1">
        <motion.div
          className="absolute bottom-1 top-1 w-[calc(50%-2px)] rounded-sm bg-ink-50 shadow-sm"
          animate={{ left: mode === "core" ? 4 : "calc(50% + 2px)" }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
        <button
          type="button"
          onClick={() => onModeChange("core")}
          className={`relative z-10 rounded-sm px-2 py-1.5 text-center text-xs transition-colors ${
            mode === "core"
              ? "font-medium text-ink-900"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          核心主线
        </button>
        <button
          type="button"
          onClick={() => onModeChange("chronicle")}
          className={`relative z-10 rounded-sm px-2 py-1.5 text-center text-xs transition-colors ${
            mode === "chronicle"
              ? "font-medium text-ink-900"
              : "text-ink-500 hover:text-ink-700"
          }`}
        >
          编年史
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: mode === "chronicle" ? "auto" : 0,
          opacity: mode === "chronicle" ? 1 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <label className="block pt-1">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <MagnifierIcon />
              细节放大镜
            </span>
            <span className="text-[10px] text-ink-400">
              {detailLevel < 0.45 ? "重要事件" : "含细节年份"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={detailLevel}
            onChange={(e) => onDetailChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-800/10 accent-cinnabar [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cinnabar"
            aria-label="编年史细节放大"
          />
        </label>
      </motion.div>
    </div>
  );
}

function MagnifierIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
