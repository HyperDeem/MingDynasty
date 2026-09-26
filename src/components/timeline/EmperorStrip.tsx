"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  getEmperorDisplayRange,
  type EmperorBand,
  type EmperorId,
} from "@/data/emperors";

export interface BandLayout {
  band: EmperorBand;
  top: number;
  height: number;
}

interface EmperorStripProps {
  layouts: BandLayout[];
  trackHeight: number;
  activeEmperorId: EmperorId | null;
  hoveredId: string | null;
  onHover: (bandKey: string | null) => void;
  onSelect: (band: EmperorBand) => void;
}

function bandKey(band: EmperorBand) {
  return `${band.id}-${band.startYear}`;
}

function yingzongReignTag(band: EmperorBand): string | null {
  if (band.id !== "yingzong") return null;
  if (band.periodIds.includes("zhengtong")) return "正统";
  if (band.periodIds.includes("tianshun")) return "天顺";
  return null;
}

export function EmperorStrip({
  layouts,
  trackHeight,
  activeEmperorId,
  hoveredId,
  onHover,
  onSelect,
}: EmperorStripProps) {
  const hovered =
    hoveredId != null
      ? layouts.find((l) => bandKey(l.band) === hoveredId)
      : undefined;

  const activeLayouts = activeEmperorId
    ? layouts.filter((l) => l.band.id === activeEmperorId)
    : [];

  return (
    <div
      className="relative w-11 shrink-0 md:w-14"
      style={{ height: trackHeight }}
      aria-label="在位皇帝色带（年号）"
    >
      <div className="absolute inset-y-0 left-1 right-1 overflow-hidden rounded-sm md:left-1.5 md:right-1.5">
        {layouts.map(({ band, top, height }, index) => {
          const key = bandKey(band);
          const isHovered = hoveredId === key;
          const isActive = activeEmperorId === band.id;
          const dimmed = activeEmperorId !== null && !isActive && !isHovered;
          const reignTag = yingzongReignTag(band);

          return (
            <button
              key={key}
              type="button"
              title={`${band.displayName}（${getEmperorDisplayRange(band)}）· 点击打开谱系`}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(key)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(band)}
              className="absolute left-0 right-0 transition-[opacity,filter] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cinnabar/50"
              style={{
                top,
                height,
                background: `linear-gradient(180deg, ${band.accent}, ${band.color})`,
                opacity: dimmed ? 0.25 : isActive || isHovered ? 1 : 0.8,
                filter:
                  isActive || isHovered
                    ? "saturate(1.2) brightness(1.05)"
                    : "saturate(0.9)",
                zIndex: isHovered || isActive ? 2 : 1,
                boxShadow: isActive
                  ? "inset 0 0 0 2px rgba(255,255,255,0.55)"
                  : index > 0
                    ? "inset 0 1px 0 rgba(255,255,255,0.12)"
                    : undefined,
              }}
              aria-pressed={isActive}
            >
              {reignTag && height > 22 && (
                <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-[9px] font-medium text-white/95 drop-shadow">
                  {reignTag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {(hovered || (activeLayouts.length > 0 && !hovered)) &&
          (() => {
            const layout = hovered ?? activeLayouts[0];
            const { band, top, height } = layout;
            const mid = top + height / 2;
            const isDual = band.id === "yingzong";
            return (
              <motion.div
                key={`tip-${bandKey(band)}`}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute left-full z-40 ml-2 max-w-[11rem]"
                style={{ top: mid, transform: "translateY(-50%)" }}
              >
                <div className="rounded border border-ink-800/10 bg-ink-900/92 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
                  <p className="font-display text-[12px] font-medium text-ink-50">
                    {isDual ? "明英宗 朱祁镇" : band.displayName}
                  </p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-ink-300">
                    {isDual
                      ? "正统 / 天顺 · 一人双年号"
                      : getEmperorDisplayRange(band)}
                  </p>
                  {hovered && (
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      点击查看血缘树与帝位链
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>
    </div>
  );
}
