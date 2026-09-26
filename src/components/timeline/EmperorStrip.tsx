"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  getEmperorDisplayRange,
  type EmperorBand,
  type EmperorId,
} from "@/data/emperors";

export interface BandLayout {
  band: EmperorBand;
  /** 横向：距左百分比 0–100 */
  offset: number;
  /** 横向：宽度百分比 */
  size: number;
}

interface EmperorStripProps {
  layouts: BandLayout[];
  /** 缩略条更矮，仅色块 */
  compact?: boolean;
  /** 是否在色块上显示年号 */
  showEraLabels?: boolean;
  activeEmperorId: EmperorId | null;
  hoveredId: string | null;
  onHover: (bandKey: string | null) => void;
  onSelect: (band: EmperorBand) => void;
}

function bandKey(band: EmperorBand) {
  return `${band.id}-${band.startYear}`;
}

export function EmperorStrip({
  layouts,
  compact = false,
  showEraLabels = false,
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
      className={`relative w-full shrink-0 ${
        compact ? "h-5 md:h-6" : "h-9 md:h-10"
      }`}
      aria-label="在位皇帝色带（年号）"
    >
      <div className="absolute inset-0 overflow-hidden rounded-sm">
        {layouts.map(({ band, offset, size }, index) => {
          const key = bandKey(band);
          const isHovered = hoveredId === key;
          const isActive = activeEmperorId === band.id;
          const dimmed = activeEmperorId !== null && !isActive && !isHovered;

          return (
            <button
              key={key}
              type="button"
              title={`${band.displayName} · ${band.eraLabel}（${getEmperorDisplayRange(band)}）· 点击打开谱系`}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(key)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(band)}
              className="absolute top-0 bottom-0 transition-[opacity,filter] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cinnabar/50"
              style={{
                left: `${offset}%`,
                width: `${size}%`,
                background: `linear-gradient(90deg, ${band.accent}, ${band.color})`,
                opacity: dimmed ? 0.28 : isActive || isHovered ? 1 : 0.88,
                filter:
                  isActive || isHovered
                    ? "saturate(1.15) brightness(1.04)"
                    : "saturate(0.92)",
                zIndex: isHovered || isActive ? 2 : 1,
                boxShadow: isActive
                  ? "inset 0 0 0 2px rgba(255,255,255,0.55)"
                  : index > 0
                    ? "inset 1px 0 0 rgba(255,255,255,0.14)"
                    : undefined,
              }}
              aria-pressed={isActive}
            >
              {showEraLabels && (
                <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 truncate px-0.5 text-center font-display text-[10px] font-medium leading-none text-white/95 drop-shadow md:text-[11px]">
                  {band.eraLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <AnimatePresence>
          {(hovered || (activeLayouts.length > 0 && !hovered)) &&
            (() => {
              const layout = hovered ?? activeLayouts[0];
              const { band, offset, size } = layout;
              const mid = offset + size / 2;
              return (
                <motion.div
                  key={`tip-${bandKey(band)}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="pointer-events-none absolute bottom-full z-40 mb-2 max-w-[12rem] -translate-x-1/2"
                  style={{ left: `${mid}%` }}
                >
                  <div className="rounded border border-ink-800/10 bg-ink-900/92 px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
                    <p className="font-display text-[12px] font-medium text-ink-50">
                      {band.eraLabel}
                      <span className="ml-1.5 text-[11px] font-normal text-ink-300">
                        {band.displayName.replace(/（复位）/, "")}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] tabular-nums text-ink-300">
                      {getEmperorDisplayRange(band)}
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
      )}
    </div>
  );
}
