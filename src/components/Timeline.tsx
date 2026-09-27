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
import { ChongzhenCluster } from "@/components/timeline/ChongzhenCluster";
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

const LAYOUT = {
  minGapPct: 5.6,
  edgePad: 3.0,
  maxRow: 2,
  /** 估算标签半宽（轨道百分比），用于重叠判定 */
  labelHalfPct: 3.4,
} as const;

const TRACK = {
  base: 108,
  perRow: 28,
  longTitleBonus: 22,
  overlapBonus: 26,
  clusterOpenBonus: 132,
} as const;

type LayoutItem = {
  event: ChronicleEvent;
  leftPercent: number;
  labelRow: number;
  dimmed: boolean;
};

function layoutEventNodes(
  events: ChronicleEvent[],
  activeEmperorId: EmperorId | null
): { items: LayoutItem[]; maxRow: number; overlapScore: number; longTitle: boolean } {
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.id.localeCompare(b.id)
  );
  const items: LayoutItem[] = [];

  let lastLeft = -Infinity;
  let nextRow = 0;
  let overlapScore = 0;
  let longTitle = false;

  for (const event of sorted) {
    if (event.title.length >= 6) longTitle = true;

    let left = yearToPercent(event.year);
    left = Math.max(LAYOUT.edgePad, Math.min(100 - LAYOUT.edgePad, left));

    const gap = left - lastLeft;
    const crowded = gap < LAYOUT.minGapPct;
    const visualOverlap =
      Number.isFinite(lastLeft) &&
      gap < LAYOUT.labelHalfPct * 2;

    if (crowded) {
      left = Math.min(100 - LAYOUT.edgePad, lastLeft + LAYOUT.minGapPct);
      overlapScore += 1;
    } else if (visualOverlap) {
      overlapScore += 1;
    }

    const labelRow = crowded || visualOverlap ? nextRow : 0;
    if (crowded || visualOverlap) {
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

  const last = items[items.length - 1];
  if (last && last.leftPercent > 100 - LAYOUT.edgePad) {
    const first = items[0]?.leftPercent ?? LAYOUT.edgePad;
    const span = Math.max(1, last.leftPercent - first);
    for (const item of items) {
      const t = (item.leftPercent - first) / span;
      item.leftPercent =
        LAYOUT.edgePad + t * (100 - LAYOUT.edgePad * 2 - 0.01);
    }
  }

  const maxRow = items.reduce((m, it) => Math.max(m, it.labelRow), 0);
  return { items, maxRow, overlapScore, longTitle };
}

function eventMatchesCategories(
  event: ChronicleEvent,
  visibility: CategoryVisibility
): boolean {
  return event.categories.some((c) => visibility[c]);
}

function computeTrackHeight(opts: {
  maxRow: number;
  overlapScore: number;
  longTitle: boolean;
  clusterOpen: boolean;
  eventCount: number;
}): number {
  let h = TRACK.base + opts.maxRow * TRACK.perRow;
  if (opts.longTitle) h += TRACK.longTitleBonus;
  if (opts.overlapScore >= 2 || opts.eventCount >= 12) h += TRACK.overlapBonus;
  if (opts.clusterOpen) h += TRACK.clusterOpenBonus;
  return h;
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
  const [clusterOpen, setClusterOpen] = useState(false);
  const [categoryVisibility, setCategoryVisibility] =
    useState<CategoryVisibility>(DEFAULT_CATEGORY_VISIBILITY);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseEvents = useMemo(() => getVisibleEvents(mode), [mode]);

  const filtered = useMemo(() => {
    if (mode !== "core") return baseEvents;
    return baseEvents.filter((e) =>
      eventMatchesCategories(e, categoryVisibility)
    );
  }, [mode, baseEvents, categoryVisibility]);

  /** 崇祯事件抽出为簇，减轻末段拥挤 */
  const { axisEvents, chongzhenEvents } = useMemo(() => {
    if (mode !== "core") {
      return { axisEvents: filtered, chongzhenEvents: [] as ChronicleEvent[] };
    }
    const chongzhen: ChronicleEvent[] = [];
    const rest: ChronicleEvent[] = [];
    for (const e of filtered) {
      if (e.periodId === "chongzhen") chongzhen.push(e);
      else rest.push(e);
    }
    return { axisEvents: rest, chongzhenEvents: chongzhen };
  }, [mode, filtered]);

  const bandLayouts = useMemo(() => {
    const n = EMPEROR_BANDS.length;
    const size = 100 / n;
    return EMPEROR_BANDS.map((band, i) => ({
      band,
      offset: i * size,
      size,
    }));
  }, []);

  const { items: positioned, maxRow, overlapScore, longTitle } = useMemo(
    () => layoutEventNodes(axisEvents, activeEmperorId),
    [axisEvents, activeEmperorId]
  );

  const trackHeight = useMemo(
    () =>
      computeTrackHeight({
        maxRow,
        overlapScore,
        longTitle,
        clusterOpen: clusterOpen && chongzhenEvents.length > 0,
        eventCount: axisEvents.length + (chongzhenEvents.length > 0 ? 1 : 0),
      }),
    [
      maxRow,
      overlapScore,
      longTitle,
      clusterOpen,
      chongzhenEvents.length,
      axisEvents.length,
    ]
  );

  const showEvents = mode === "core";
  const visibleCount = filtered.length;
  const clusterLeft =
    chongzhenEvents.length > 0
      ? yearToPercent(
          Math.round(
            chongzhenEvents.reduce((s, e) => s + e.year, 0) /
              chongzhenEvents.length
          )
        )
      : 94;

  const toggleCategory = (category: EventCategory) => {
    setCategoryVisibility((prev) => {
      const next = { ...prev, [category]: !prev[category] };
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
    leaveTimer.current = setTimeout(() => {
      setExpanded(false);
      setClusterOpen(false);
    }, 180);
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
                <motion.nav
                  className="relative mb-3 w-full"
                  aria-label="核心主线事件"
                  animate={{ height: trackHeight }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                    <>
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

                      {chongzhenEvents.length > 0 && (
                        <ChongzhenCluster
                          events={chongzhenEvents}
                          leftPercent={Math.max(88, Math.min(96, clusterLeft))}
                          activeEventId={activeEventId}
                          onSelect={onSelectEvent}
                          onOpenChange={setClusterOpen}
                        />
                      )}
                    </>
                  )}
                </motion.nav>
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
