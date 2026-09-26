"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/**
 * 按年排序后做可读性排布：
 * - 过密时微调横向间距
 * - 邻近事件交替抬高标签行，避免互压与压到色带
 */
function layoutEventNodes(
  events: ChronicleEvent[],
  activeEmperorId: EmperorId | null
) {
  const sorted = [...events].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  const minGap = 3.2; // 百分比
  const items: {
    event: ChronicleEvent;
    leftPercent: number;
    labelRow: 0 | 1;
    dimmed: boolean;
  }[] = [];

  let lastLeft = -Infinity;
  let lastRow: 0 | 1 = 1;

  for (const event of sorted) {
    let left = yearToPercent(event.year);
    if (left - lastLeft < minGap) {
      left = Math.min(98.5, lastLeft + minGap);
    }
    const labelRow: 0 | 1 =
      left - lastLeft < minGap * 1.6 ? (((1 - lastRow) as 0 | 1)) : 0;
    items.push({
      event,
      leftPercent: left,
      labelRow,
      dimmed:
        activeEmperorId !== null && event.emperorId !== activeEmperorId,
    });
    lastLeft = left;
    lastRow = labelRow;
  }
  return items;
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
  const [expanded, setExpanded] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const events = useMemo(() => getVisibleEvents(mode), [mode]);

  /** 编年史 / 色带：等分槽位，保证每段年号都能显示 */
  const bandLayouts = useMemo(() => {
    const n = EMPEROR_BANDS.length;
    const size = 100 / n;
    return EMPEROR_BANDS.map((band, i) => ({
      band,
      offset: i * size,
      size,
    }));
  }, []);

  const positioned = useMemo(
    () => layoutEventNodes(events, activeEmperorId),
    [events, activeEmperorId]
  );

  const showEvents = mode === "core";

  const clearLeaveTimer = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearLeaveTimer();
    setExpanded(true);
  };

  const handleLeave = () => {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => setExpanded(false), 180);
  };

  useEffect(() => () => clearLeaveTimer(), []);

  return (
    <motion.div
      className="overflow-hidden border-t border-ink-800/10 bg-[rgba(251,249,243,0.94)] backdrop-blur-sm"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocusCapture={handleEnter}
      layout
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="px-4 md:px-6"
        animate={{
          paddingTop: expanded ? 10 : 6,
          paddingBottom: expanded ? 12 : 6,
        }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 展开区：模式切换 + 图例 + 事件轨 */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="timeline-detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mb-2 space-y-2">
                <ModeToggle mode={mode} onModeChange={onModeChange} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {showEvents ? (
                    <EventTagLegend />
                  ) : (
                    <p className="text-[11px] text-ink-400">
                      年号等分排列 · 点击色块打开谱系
                    </p>
                  )}
                  <p className="font-display text-[10px] tracking-widest text-ink-300">
                    1368 — 1644
                  </p>
                </div>
              </div>

              {showEvents && (
                <nav
                  className="relative mb-3 h-[7.75rem] w-full md:h-[8.5rem]"
                  aria-label="核心主线事件"
                >
                  {/* 轴线贴底，标签全部在上方，与下方色带分离 */}
                  <div
                    className="pointer-events-none absolute bottom-1.5 left-0 right-0 h-px bg-gradient-to-r from-cinnabar/35 via-ink-400/25 to-ink-300/20"
                    aria-hidden
                  />
                  <span className="pointer-events-none absolute bottom-0 left-0 text-[9px] tabular-nums text-ink-300">
                    1368
                  </span>
                  <span className="pointer-events-none absolute bottom-0 right-0 text-[9px] tabular-nums text-ink-300">
                    1644
                  </span>

                  <AnimatePresence mode="popLayout">
                    {positioned.map(({ event, leftPercent, labelRow, dimmed }) => (
                      <EventNode
                        key={event.id}
                        event={event}
                        leftPercent={leftPercent}
                        labelRow={labelRow}
                        isActive={activeEventId === event.id}
                        dimmed={dimmed}
                        onSelect={onSelectEvent}
                      />
                    ))}
                  </AnimatePresence>
                </nav>
              )}

              {!showEvents && (
                <p className="mb-2 text-center text-[10px] text-ink-400">
                  编年史 · 十六帝十七朝年号
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 色带：缩略/展开共用，高度与年号随状态变化 */}
        <EmperorStrip
          layouts={bandLayouts}
          compact={!expanded}
          showEraLabels={expanded}
          activeEmperorId={activeEmperorId}
          hoveredId={hoveredBand}
          onHover={setHoveredBand}
          onSelect={onSelectEmperor}
        />

        {!expanded && (
          <p className="pointer-events-none mt-1 text-center text-[9px] tracking-wider text-ink-300">
            悬停展开时间轴
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
