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
import type { EventCategory } from "@/data/categories";
import { EmperorStrip } from "@/components/timeline/EmperorStrip";
import { EventNode } from "@/components/timeline/EventNode";
import { ModeToggle } from "@/components/timeline/ModeToggle";
import {
  CategoryFilter,
  DEFAULT_CATEGORY_VISIBILITY,
  type CategoryVisibility,
} from "@/components/EventTag";

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
 * 可读性排布参数：
 * - minGapPct：相邻节点最小横向间距（占轨道百分比）
 * - edgePad：左右边距，避免贴边裁切
 * - 邻近节点轮换 3 行标签高度，减少文字重叠
 */
const LAYOUT = {
  minGapPct: 5.2,
  edgePad: 2.8,
  maxRow: 2,
} as const;

function layoutEventNodes(
  events: ChronicleEvent[],
  activeEmperorId: EmperorId | null
) {
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.id.localeCompare(b.id)
  );
  const items: {
    event: ChronicleEvent;
    leftPercent: number;
    labelRow: number;
    dimmed: boolean;
  }[] = [];

  let lastLeft = -Infinity;
  let nextRow = 0;

  for (const event of sorted) {
    let left = yearToPercent(event.year);
    left = Math.max(LAYOUT.edgePad, Math.min(100 - LAYOUT.edgePad, left));

    const crowded = left - lastLeft < LAYOUT.minGapPct;
    if (crowded) {
      left = Math.min(100 - LAYOUT.edgePad, lastLeft + LAYOUT.minGapPct);
    }

    const labelRow = crowded ? nextRow : 0;
    if (crowded) {
      nextRow = (nextRow + 1) % (LAYOUT.maxRow + 1);
    } else {
      nextRow = 1;
    }

    items.push({
      event,
      leftPercent: left,
      labelRow,
      dimmed:
        activeEmperorId !== null && event.emperorId !== activeEmperorId,
    });
    lastLeft = left;
  }

  // 若整体被挤出右边界，整体略微压缩回可显示区间
  const last = items[items.length - 1];
  if (last && last.leftPercent > 100 - LAYOUT.edgePad) {
    const overflow = last.leftPercent - (100 - LAYOUT.edgePad);
    const first = items[0]?.leftPercent ?? LAYOUT.edgePad;
    const span = Math.max(1, last.leftPercent - first);
    for (const item of items) {
      const t = (item.leftPercent - first) / span;
      item.leftPercent =
        LAYOUT.edgePad + t * (100 - LAYOUT.edgePad * 2 - 0.01);
    }
  }

  return items;
}

function eventMatchesCategories(
  event: ChronicleEvent,
  visibility: CategoryVisibility
): boolean {
  return event.categories.some((c) => visibility[c]);
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
  const [categoryVisibility, setCategoryVisibility] =
    useState<CategoryVisibility>(DEFAULT_CATEGORY_VISIBILITY);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseEvents = useMemo(() => getVisibleEvents(mode), [mode]);

  const events = useMemo(() => {
    if (mode !== "core") return baseEvents;
    return baseEvents.filter((e) =>
      eventMatchesCategories(e, categoryVisibility)
    );
  }, [mode, baseEvents, categoryVisibility]);

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
  const visibleCount = events.length;

  const toggleCategory = (category: EventCategory) => {
    setCategoryVisibility((prev) => {
      const next = { ...prev, [category]: !prev[category] };
      // 至少保留一类开启，避免整条轴空白
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  };

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
                    <CategoryFilter
                      visibility={categoryVisibility}
                      onToggle={toggleCategory}
                    />
                  ) : (
                    <p className="text-[11px] text-ink-400">
                      年号等分排列 · 点击色块打开谱系
                    </p>
                  )}
                  <p className="font-display text-[10px] tracking-widest text-ink-300">
                    {showEvents
                      ? `显示 ${visibleCount} 节点 · 1368 — 1644`
                      : "1368 — 1644"}
                  </p>
                </div>
              </div>

              {showEvents && (
                <nav
                  className="relative mb-3 h-[9.5rem] w-full md:h-[10.5rem]"
                  aria-label="核心主线事件"
                >
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

                  {visibleCount === 0 ? (
                    <p className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-400">
                      请至少开启一类事件筛选
                    </p>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {positioned.map(
                        ({ event, leftPercent, labelRow, dimmed }) => (
                          <EventNode
                            key={event.id}
                            event={event}
                            leftPercent={leftPercent}
                            labelRow={labelRow}
                            isActive={activeEventId === event.id}
                            dimmed={dimmed}
                            onSelect={onSelectEvent}
                          />
                        )
                      )}
                    </AnimatePresence>
                  )}
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
