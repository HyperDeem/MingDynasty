"use client";

import { type EmperorBand, type EmperorId } from "@/data/emperors";
import type { PeriodId } from "@/data/ming-dynasty";
import {
  resolveTimelineColorChapter,
  type TimelineColorChapterId,
} from "@/data/timeline-palette";

export interface BandLayout {
  band: EmperorBand;
  /** 横向：距左百分比 0–100（事件簇对齐用） */
  offset: number;
  /** 横向：宽度百分比 */
  size: number;
}

interface EmperorStripProps {
  layouts: BandLayout[];
  /** 缩略条更矮 */
  compact?: boolean;
  /** @deprecated 年号与年份始终显示 */
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

/** 六段国色：低饱和半透明玻璃底 */
const CHAPTER_PILL: Record<TimelineColorChapterId, string> = {
  founding: "bg-amber-900/40 hover:bg-amber-800/50",
  apex: "bg-teal-950/45 hover:bg-teal-900/55",
  consolidation: "bg-emerald-950/40 hover:bg-emerald-900/50",
  contraction: "bg-orange-950/40 hover:bg-orange-900/50",
  mid: "bg-sky-950/40 hover:bg-sky-900/50",
  fall: "bg-rose-950/40 hover:bg-rose-900/50",
};

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

function yearLabel(band: EmperorBand) {
  return band.startYear === band.endYear
    ? `${band.startYear}`
    : `${band.startYear}-${band.endYear}`;
}

function durationYears(band: EmperorBand) {
  return Math.max(1, band.endYear - band.startYear + 1);
}

function pillTone(band: EmperorBand) {
  return CHAPTER_PILL[resolveTimelineColorChapter(band.startYear).id];
}

export function EmperorStrip({
  layouts,
  compact = false,
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

  const isFocusBand = (band: EmperorBand) => {
    if (activePeriodId && band.periodIds.includes(activePeriodId)) return true;
    if (!hasRange && activeEmperorId && band.id === activeEmperorId) {
      return true;
    }
    return false;
  };

  const focusLayouts = layouts.filter((l) => isFocusBand(l.band));
  const hasFocus = focusLayouts.length > 0;

  return (
    <div
      className={`relative flex w-full items-stretch gap-[2px] ${
        compact ? "min-h-[2.75rem]" : "min-h-[3.25rem]"
      }`}
      aria-label="明朝年号时间轴"
    >
      {layouts.map(({ band }) => {
        const key = bandKey(band);
        const isHovered = hoveredId === key;
        const inRange = overlapsYearRange(
          band,
          highlightYearFrom,
          highlightYearTo
        );
        const isFocus = isFocusBand(band);
        const lit = inRange || isFocus || isHovered;
        const dimmed = (hasRange || hasFocus) && !lit;

        return (
          <button
            key={key}
            type="button"
            aria-label={`${band.eraLabel} · ${band.displayName} · ${yearLabel(band)}`}
            aria-pressed={inRange || isFocus}
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(key)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(band)}
            className={[
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-white/5 px-0.5 transition-all duration-300 ease-out",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50",
              pillTone(band),
              compact ? "py-1.5" : "py-2",
              isFocus
                ? "z-10 -translate-y-1 border-t-2 border-t-amber-400 border-x-amber-500/25 border-b-amber-500/10 bg-amber-900/55 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                : "",
              isHovered && !isFocus
                ? "z-[9] -translate-y-0.5 border-amber-500/35 shadow-[0_0_10px_rgba(251,191,36,0.15)]"
                : "",
              dimmed ? "opacity-30 saturate-50" : "",
              !dimmed && !isFocus && !isHovered ? "opacity-90" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className={[
                "max-w-full truncate font-serif tracking-widest leading-none",
                compact ? "text-[10px] md:text-[11px]" : "text-[11px] md:text-xs",
                isFocus || isHovered
                  ? "text-amber-50"
                  : "text-amber-50/85",
              ].join(" ")}
            >
              {band.eraLabel}
            </span>
            <span
              className={[
                "mt-1 max-w-full truncate font-mono tabular-nums leading-none",
                "text-[9px] md:text-[10px]",
                isFocus ? "text-amber-200/80" : "text-slate-400",
              ].join(" ")}
            >
              {yearLabel(band)}
            </span>

            {/* 悬浮提示：持续时间 */}
            <span
              role="tooltip"
              className={[
                "pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-max max-w-[11rem] -translate-x-1/2",
                "rounded-lg border border-amber-500/25 bg-slate-950/95 px-2.5 py-2 shadow-xl backdrop-blur-md",
                "origin-bottom scale-95 opacity-0 transition-all duration-200 ease-out",
                "group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100",
              ].join(" ")}
            >
              <span className="block font-serif text-[11px] tracking-wider text-amber-100">
                {band.templeName}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                {band.displayName}
              </span>
              <span className="mt-1.5 block border-t border-amber-500/15 pt-1.5 font-mono text-[10px] tabular-nums text-amber-400/90">
                {yearLabel(band)}
                <span className="mx-1 text-slate-600">·</span>
                持续 {durationYears(band)} 年
              </span>
              {/* 小三角 */}
              <span
                className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-950/95"
                aria-hidden
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
