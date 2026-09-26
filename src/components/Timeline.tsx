"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
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
  detailLevel: number;
  onModeChange: (mode: TimelineMode) => void;
  onDetailChange: (level: number) => void;
  activeEventId: string | null;
  activeEmperorId: EmperorId | null;
  onSelectEvent: (event: ChronicleEvent) => void;
  onSelectEmperor: (band: EmperorBand) => void;
}

/** 按内容可读性分配槽位高度，避免文字重叠 */
function slotHeight(
  weight: ChronicleEvent["weight"],
  mode: TimelineMode,
  detailLevel: number
) {
  const base = weight === "turning" ? 92 : weight === "major" ? 70 : 52;
  if (mode === "core") return base + 8;
  return base + detailLevel * 18;
}

export function Timeline({
  mode,
  detailLevel,
  onModeChange,
  onDetailChange,
  activeEventId,
  activeEmperorId,
  onSelectEvent,
  onSelectEmperor,
}: TimelineProps) {
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  const events = useMemo(
    () => getVisibleEvents(mode, detailLevel),
    [mode, detailLevel]
  );

  /**
   * 事件按年排序后「堆叠排版」：
   * 不拘泥严格年份比例，保证相邻节点可读间距
   */
  const { positioned, trackHeight } = useMemo(() => {
    const padTop = 12;
    const padBottom = 28;
    let cursor = padTop;
    const items = events.map((event) => {
      const h = slotHeight(event.weight, mode, detailLevel);
      const top = cursor;
      cursor += h;
      return {
        event,
        top,
        dimmed:
          activeEmperorId !== null && event.emperorId !== activeEmperorId,
      };
    });
    return {
      positioned: items,
      trackHeight: Math.max(cursor + padBottom, 480),
    };
  }, [events, mode, detailLevel, activeEmperorId]);

  /** 色带：相对年跨度 + 短年号保底，归一化到 trackHeight */
  const bandLayouts = useMemo(() => {
    const start = 1368;
    const end = 1644;
    const span = end - start + 1;
    const raw = EMPEROR_BANDS.map((band) => {
      const years = Math.max(band.endYear - band.startYear + 1, 1);
      return {
        band,
        weight: Math.max(years / span, 0.022),
      };
    });
    const sum = raw.reduce((s, r) => s + r.weight, 0);
    let y = 0;
    return raw.map(({ band, weight }) => {
      const height = (weight / sum) * trackHeight;
      const top = y;
      y += height;
      return { band, top, height };
    });
  }, [trackHeight]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ModeToggle
        mode={mode}
        detailLevel={detailLevel}
        onModeChange={onModeChange}
        onDetailChange={onDetailChange}
      />

      <div className="px-5 pb-2 pt-2 md:px-6">
        <EventTagLegend />
      </div>

      <nav
        className="scrollbar-timeline relative min-h-0 flex-1 overflow-y-auto px-3 pb-10 pt-2 md:px-4"
        aria-label="明朝编年时间轴"
      >
        <motion.div
          className="relative flex gap-3 md:gap-4"
          animate={{ height: trackHeight }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmperorStrip
            layouts={bandLayouts}
            trackHeight={trackHeight}
            activeEmperorId={activeEmperorId}
            hoveredId={hoveredBand}
            onHover={setHoveredBand}
            onSelect={onSelectEmperor}
          />

          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute bottom-0 left-[9px] top-0 w-px bg-gradient-to-b from-cinnabar/40 via-ink-400/25 to-ink-300/15"
              aria-hidden
            />

            <AnimatePresence mode="popLayout">
              {positioned.map(({ event, top, dimmed }) => (
                <EventNode
                  key={event.id}
                  event={event}
                  top={top}
                  isActive={activeEventId === event.id}
                  dimmed={dimmed}
                  onSelect={onSelectEvent}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="mt-4 text-center font-display text-[10px] tracking-widest text-ink-300">
          明 · 终 · 1644 · 节点已按可读性排布
        </p>
      </nav>
    </div>
  );
}
