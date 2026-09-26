"use client";

import { motion } from "framer-motion";
import type { TimelineMode } from "@/data/chronicle-events";
import { countCoreEvents } from "@/data/chronicle-events";
import { EMPEROR_BANDS } from "@/data/emperors";

interface ModeToggleProps {
  mode: TimelineMode;
  onModeChange: (mode: TimelineMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const coreCount = countCoreEvents();
  const emperorCount = EMPEROR_BANDS.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
          朝代时间轴
        </p>
        <p className="text-[10px] tabular-nums text-ink-400">
          {mode === "core"
            ? `核心主线 · ${coreCount} 节点`
            : `编年史 · ${emperorCount} 帝更替`}
        </p>
      </div>

      <div className="relative grid w-[220px] grid-cols-2 gap-1 rounded-md bg-ink-800/[0.06] p-1">
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
    </div>
  );
}
