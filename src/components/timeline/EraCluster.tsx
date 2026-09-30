"use client";

import { motion } from "framer-motion";

interface EraClusterProps {
  eraLabel: string;
  count: number;
  /** 示意点中心（色带中点，0–100%） */
  leftPercent: number;
  bandStart: number;
  bandEnd: number;
  /** 0 贴轴，1 上抬一层（仅标签错落） */
  stackRow?: 0 | 1;
  accent?: string;
  isActive?: boolean;
  dimmed?: boolean;
  onSelect: () => void;
  tone?: "light" | "dark";
}

/**
 * 各朝事件缩略：示意点锚定色带内，标签可略伸出；点击放大至全轴
 */
export function EraCluster({
  eraLabel,
  count,
  leftPercent,
  bandStart,
  bandEnd,
  stackRow = 0,
  accent,
  isActive = false,
  dimmed = false,
  onSelect,
  tone = "light",
}: EraClusterProps) {
  const dark = tone === "dark";
  // 示意点限制在色带内（相对整轴百分比）
  const dotLeft = Math.min(bandEnd - 0.15, Math.max(bandStart + 0.15, leftPercent));

  return (
    <motion.div
      className="absolute z-20 flex -translate-x-1/2 flex-col items-center"
      style={{
        left: `${dotLeft}%`,
        bottom: 0,
      }}
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{
        opacity: dimmed ? 0.22 : 1,
        y: 0,
        scale: dimmed ? 0.92 : 1,
      }}
      exit={{ opacity: 0, y: 4, scale: 0.94 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        type="button"
        layout={false}
        onClick={onSelect}
        className={`mb-1 flex shrink-0 flex-col items-center gap-1 ${
          stackRow === 1 ? "pb-6" : "pb-0"
        }`}
        animate={{ scale: isActive ? 1.04 : 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        aria-label={`${eraLabel}时期 ${count} 条事件，点击展开`}
      >
        <span
          className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 font-display text-[10px] transition md:gap-1.5 md:px-2.5 md:py-1 md:text-[11px] ${
            dark
              ? isActive
                ? "border-amber-400/45 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                : "border-white/10 bg-slate-900/80 text-slate-200 hover:border-amber-500/30"
              : isActive
                ? "border-cinnabar/40 bg-cinnabar/10 text-cinnabar shadow-[0_1px_2px_rgba(48,42,28,0.08)]"
                : "border-ink-800/15 bg-[rgba(251,249,243,0.95)] text-ink-700 shadow-[0_1px_2px_rgba(48,42,28,0.08)] hover:border-ink-800/25"
          }`}
        >
          {eraLabel}
          <span
            className={`tabular-nums ${
              dark ? "text-slate-500" : "text-ink-400"
            }`}
          >
            · {count}
          </span>
        </span>

        <span
          className={`block h-2 w-2 shrink-0 rounded-full border-2 ${
            dark ? "border-slate-800" : "border-[rgba(247,241,232,0.95)]"
          } ${isActive ? (dark ? "bg-amber-400" : "bg-cinnabar") : ""}`}
          style={
            isActive
              ? undefined
              : {
                  backgroundColor:
                    accent ??
                    (dark
                      ? "rgba(251, 191, 36, 0.7)"
                      : "rgba(196, 60, 44, 0.8)"),
                }
          }
          aria-hidden
        />
      </motion.button>
    </motion.div>
  );
}
