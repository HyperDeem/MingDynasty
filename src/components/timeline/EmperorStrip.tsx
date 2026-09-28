"use client";

import { motion } from "framer-motion";
import { type EmperorBand, type EmperorId } from "@/data/emperors";
import type { PeriodId } from "@/data/ming-dynasty";

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
  /** 当前年号（组内焦点，略强于区间高亮） */
  activePeriodId?: PeriodId | null;
  /** 疆域快照覆盖年份 → 高亮所有与之相交的色带 */
  highlightYearFrom?: number | null;
  highlightYearTo?: number | null;
  hoveredId: string | null;
  onHover: (bandKey: string | null) => void;
  onSelect: (band: EmperorBand) => void;
}

function bandKey(band: EmperorBand) {
  return `${band.id}-${band.startYear}`;
}

function overlapsYearRange(
  band: EmperorBand,
  from: number | null | undefined,
  to: number | null | undefined
) {
  if (from == null || to == null) return false;
  return band.startYear <= to && band.endYear >= from;
}

export function EmperorStrip({
  layouts,
  compact = false,
  showEraLabels = false,
  activeEmperorId,
  activePeriodId = null,
  highlightYearFrom = null,
  highlightYearTo = null,
  hoveredId,
  onHover,
  onSelect,
}: EmperorStripProps) {
  const inRangeLayouts = layouts.filter((l) =>
    overlapsYearRange(l.band, highlightYearFrom, highlightYearTo)
  );
  const hasRange = inRangeLayouts.length > 0;

  /** 组内「当前」年号：优先 period，其次帝王抽屉 */
  const isFocusBand = (band: EmperorBand) => {
    if (activePeriodId && band.periodIds.includes(activePeriodId)) return true;
    if (
      !hasRange &&
      activeEmperorId &&
      band.id === activeEmperorId
    ) {
      return true;
    }
    return false;
  };

  const focusLayouts = layouts.filter((l) => isFocusBand(l.band));

  /** 连续区间托底：从第一个到最后一个相交色带 */
  const rangeBracket =
    inRangeLayouts.length > 0
      ? {
          left: inRangeLayouts[0]!.offset,
          right:
            inRangeLayouts[inRangeLayouts.length - 1]!.offset +
            inRangeLayouts[inRangeLayouts.length - 1]!.size,
        }
      : null;

  return (
    <div
      className={`relative w-full shrink-0 ${
        compact ? "h-6 md:h-7" : "h-9 md:h-10"
      }`}
      aria-label="在位皇帝色带（年号）"
    >
      {/* 区间柔光托底 */}
      {rangeBracket && (
        <motion.div
          className="pointer-events-none absolute -inset-y-1 rounded-sm"
          initial={false}
          animate={{
            left: `${rangeBracket.left}%`,
            width: `${rangeBracket.right - rangeBracket.left}%`,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              "linear-gradient(180deg, rgba(255,252,245,0.55) 0%, rgba(255,248,235,0.2) 45%, rgba(196,60,44,0.08) 100%)",
            boxShadow:
              "0 0 0 1px rgba(48,42,28,0.06), 0 6px 18px -12px rgba(48,42,28,0.28)",
          }}
          aria-hidden
        />
      )}

      <div className="absolute inset-0 overflow-hidden rounded-sm ring-1 ring-ink-800/[0.06]">
        {layouts.map(({ band, offset, size }, index) => {
          const key = bandKey(band);
          const isHovered = hoveredId === key;
          const inRange = overlapsYearRange(
            band,
            highlightYearFrom,
            highlightYearTo
          );
          const isFocus = isFocusBand(band);
          const lit = inRange || isFocus || isHovered;
          const dimmed = (hasRange || focusLayouts.length > 0) && !lit;

          return (
            <button
              key={key}
              type="button"
              aria-label={`${band.eraLabel} · ${band.displayName}`}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(key)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(band)}
              className="absolute top-0 bottom-0 transition-[opacity,filter] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cinnabar/40"
              style={{
                left: `${offset}%`,
                width: `${size}%`,
                background: lit
                  ? `linear-gradient(165deg, ${band.accent} 0%, ${band.color} 72%)`
                  : `linear-gradient(180deg, ${band.accent}99, ${band.color}aa)`,
                opacity: dimmed ? 0.22 : lit ? 1 : 0.72,
                filter: dimmed
                  ? "saturate(0.55) brightness(0.96)"
                  : isFocus
                    ? "saturate(1.12) brightness(1.05)"
                    : inRange
                      ? "saturate(1.05) brightness(1.02)"
                      : "saturate(0.85)",
                zIndex: isHovered || isFocus ? 3 : inRange ? 2 : 1,
              }}
              aria-pressed={inRange || isFocus}
            >
              {/* 丝质高光 */}
              {lit && (
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  aria-hidden
                />
              )}
              {/* 焦点年号：底部细金线，避免粗描边 */}
              {isFocus && (
                <span
                  className="pointer-events-none absolute inset-x-[12%] bottom-0 h-[2px] rounded-full bg-[rgba(251,249,243,0.85)]"
                  style={{
                    boxShadow: `0 0 8px 0 ${band.accent}88`,
                  }}
                  aria-hidden
                />
              )}
              {(isHovered ||
                isFocus ||
                (showEraLabels && size >= 1.2)) && (
                <span
                  className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-0.5 text-center font-display font-medium leading-none drop-shadow ${
                    isHovered || size >= 2.5 ? "truncate" : ""
                  } ${
                    compact
                      ? "text-[9px] md:text-[10px]"
                      : "text-[10px] md:text-[11px]"
                  } ${
                    isHovered || isFocus
                      ? "text-white"
                      : lit
                        ? "text-white/95"
                        : "text-white/55"
                  }`}
                >
                  {band.eraLabel}
                </span>
              )}
              {index > 0 && (
                <span
                  className="pointer-events-none absolute inset-y-[18%] left-0 w-px bg-white/15"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 区间两端竖饰 */}
      {rangeBracket && (
        <div
          className="pointer-events-none absolute -bottom-1.5 h-1"
          style={{
            left: `${rangeBracket.left}%`,
            width: `${rangeBracket.right - rangeBracket.left}%`,
          }}
          aria-hidden
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-800/25 to-transparent" />
          <div className="absolute left-0 top-0 h-1.5 w-px bg-ink-800/30" />
          <div className="absolute right-0 top-0 h-1.5 w-px bg-ink-800/30" />
        </div>
      )}
    </div>
  );
}
