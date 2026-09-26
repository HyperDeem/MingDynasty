"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DYNASTY_YEAR_SPAN,
  getVisibleEvents,
  type ChronicleEvent,
  type TimelineMode,
} from "@/data/chronicle-events";
import {
  EMPEROR_BANDS,
  type EmperorBand,
  type EmperorId,
} from "@/data/emperors";
import { EmperorStrip } from "@/components/timeline/EmperorStrip";
import { EventNode } from "@/components/timeline/EventNode";
import { ModeToggle } from "@/components/timeline/ModeToggle";
import { EventTagLegend } from "@/components/EventTag";

interface TimelineProps {
  mode: TimelineMode;
  onModeChange: (mode: TimelineMode) => void;
  activeEventId: string | null;
  activeEmperorId: EmperorId | null;
  onSelectEvent: (event: ChronicleEvent) => void;
  onSelectEmperor: (band: EmperorBand) => void;
}

function yearToPercent(year: number) {
  const { start, total } = DYNASTY_YEAR_SPAN;
  return ((year - start) / (total - 1)) * 100;
}

export function Timeline({
  mode,
  onModeChange,
  activeEventId,
  activeEmperorId,
  onSelectEvent,
  onSelectEmperor,
}: TimelineProps) {
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  const events = useMemo(() => getVisibleEvents(mode), [mode]);

  /** 皇帝色带：按在位年跨度横向铺满 */
  const bandLayouts = useMemo(() => {
    const start = DYNASTY_YEAR_SPAN.start;
    const end = DYNASTY_YEAR_SPAN.end;
    const span = end - start + 1;
    const raw = EMPEROR_BANDS.map((band) => {
      const years = Math.max(band.endYear - band.startYear + 1, 1);
      return { band, weight: Math.max(years / span, 0.018) };
    });
    const sum = raw.reduce((s, r) => s + r.weight, 0);
    let x = 0;
    return raw.map(({ band, weight }) => {
      const size = (weight / sum) * 100;
      const offset = x;
      x += size;
      return { band, offset, size };
    });
  }, []);

  /** 事件按年定位；同邻年份交替上下标签 */
  const positioned = useMemo(() => {
    return events.map((event, index) => ({
      event,
      leftPercent: yearToPercent(event.year),
      labelAbove: index % 2 === 0,
      dimmed:
        activeEmperorId !== null && event.emperorId !== activeEmperorId,
    }));
  }, [events, activeEmperorId]);

  const showEvents = mode === "core";

  return (
    <div className="flex flex-col gap-2 px-4 pb-3 pt-2 md:px-6 md:pb-4 md:pt-3">
      <ModeToggle mode={mode} onModeChange={onModeChange} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {showEvents ? (
          <EventTagLegend />
        ) : (
          <p className="text-[11px] text-ink-400">
            仅展示皇帝更替色带 · 点击色块打开谱系
          </p>
        )}
        <p className="font-display text-[10px] tracking-widest text-ink-300">
          1368 — 1644
        </p>
      </div>

      <nav
        className="relative w-full"
        aria-label="明朝编年时间轴"
      >
        <AnimatePresence mode="wait">
          {showEvents ? (
            <motion.div
              key="core-track"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.28 }}
              className="relative mb-2 h-[7.5rem] w-full md:h-[8.25rem]"
            >
              {/* 年轴线 */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-cinnabar/35 via-ink-400/25 to-ink-300/20"
                aria-hidden
              />

              {/* 起止刻度 */}
              <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[9px] tabular-nums text-ink-300">
                1368
              </span>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[9px] tabular-nums text-ink-300">
                1644
              </span>

              <AnimatePresence mode="popLayout">
                {positioned.map(({ event, leftPercent, labelAbove, dimmed }) => (
                  <EventNode
                    key={event.id}
                    event={event}
                    leftPercent={leftPercent}
                    labelAbove={labelAbove}
                    isActive={activeEventId === event.id}
                    dimmed={dimmed}
                    onSelect={onSelectEvent}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="chronicle-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-1 flex h-8 items-end justify-between px-0.5 text-[10px] tabular-nums text-ink-400"
            >
              <span>洪武</span>
              <span>永乐</span>
              <span>嘉靖</span>
              <span>万历</span>
              <span>崇祯</span>
            </motion.div>
          )}
        </AnimatePresence>

        <EmperorStrip
          layouts={bandLayouts}
          orientation="horizontal"
          trackExtent={100}
          activeEmperorId={activeEmperorId}
          hoveredId={hoveredBand}
          onHover={setHoveredBand}
          onSelect={onSelectEmperor}
        />
      </nav>
    </div>
  );
}
