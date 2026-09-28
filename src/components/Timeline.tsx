"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DYNASTY_YEAR_SPAN,
  getVisibleEvents,
  type ChronicleEvent,
} from "@/data/chronicle-events";
import {
  EMPEROR_BANDS,
  type EmperorBand,
  type EmperorId,
} from "@/data/emperors";
import type { PeriodId } from "@/data/ming-dynasty";
import type { EventCategory } from "@/data/categories";
import { EmperorStrip } from "@/components/timeline/EmperorStrip";
import { EventNode } from "@/components/timeline/EventNode";
import { EraCluster } from "@/components/timeline/EraCluster";
import {
  CategoryFilter,
  DEFAULT_CATEGORY_VISIBILITY,
  type CategoryVisibility,
} from "@/components/EventTag";

interface TimelineProps {
  activeEventId: string | null;
  activeEmperorId: EmperorId | null;
  /** 当前年号（组内焦点） */
  activePeriodId?: PeriodId | null;
  /** 疆域快照覆盖年份，高亮所有相交色带 */
  highlightYearFrom?: number | null;
  highlightYearTo?: number | null;
  onSelectEvent: (event: ChronicleEvent) => void;
  onSelectEmperor: (band: EmperorBand) => void;
  /** 点击年号簇：同步时期/年份到地图，不强制开浮层 */
  onSelectEra?: (periodId: PeriodId) => void;
  /** 帝王浮层打开时收起并禁用时间轴互动 */
  interactionLocked?: boolean;
}

const LAYOUT = {
  edgePad: 3.0,
  /** 标签最多错落行数（0 起算） */
  maxRow: 3,
} as const;

const TRACK = {
  /** 含底部年份预留 + 双层簇按钮错落 */
  collapsed: 108,
  base: 128,
  perRow: 30,
  longTitleBonus: 18,
  overlapBonus: 20,
} as const;

/** 聚焦各朝时用固定高度，避免切朝时轨道忽高忽低牵动地图舞台 */
const FOCUSED_TRACK_HEIGHT =
  TRACK.base +
  LAYOUT.maxRow * TRACK.perRow +
  TRACK.longTitleBonus +
  TRACK.overlapBonus;

type LayoutItem = {
  event: ChronicleEvent;
  leftPercent: number;
  labelRow: number;
};

type EraGroup = {
  periodId: PeriodId;
  eraLabel: string;
  accent: string;
  /** 示意点位置：色带中点（百分比） */
  leftPercent: number;
  /** 色带左右边界，用于约束示意点 */
  bandStart: number;
  bandEnd: number;
  /** 过密时交替抬高标签，示意点仍落在色带内 */
  stackRow: 0 | 1;
  events: ChronicleEvent[];
};

function bandKey(band: EmperorBand) {
  return `${band.id}-${band.startYear}`;
}

function eventMatchesCategories(
  event: ChronicleEvent,
  visibility: CategoryVisibility
): boolean {
  return event.categories.some((c) => visibility[c]);
}

/** 横向单行标题半宽（轨道百分比），按字数估算 */
function estimateLabelHalfPct(title: string): number {
  return Math.min(14, Math.max(3.2, title.length * 0.78));
}

/** 将所选朝事件放大铺满整条轨道；标题重叠则上下错行 */
function layoutZoomedEvents(events: ChronicleEvent[]): {
  items: LayoutItem[];
  maxRow: number;
  overlapScore: number;
  longTitle: boolean;
} {
  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.id.localeCompare(b.id)
  );
  if (!sorted.length) {
    return { items: [], maxRow: 0, overlapScore: 0, longTitle: false };
  }

  const years = sorted.map((e) => e.year);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const span = Math.max(1, maxY - minY);

  const placed: LayoutItem[] = [];
  const bands: { left: number; right: number; row: number }[] = [];
  let overlapScore = 0;
  let longTitle = false;

  for (const event of sorted) {
    if (event.title.length >= 6) longTitle = true;

    const leftPercent =
      sorted.length === 1
        ? 50
        : LAYOUT.edgePad +
          ((event.year - minY) / span) * (100 - LAYOUT.edgePad * 2);

    const half = estimateLabelHalfPct(event.title);
    const L = leftPercent - half;
    const R = leftPercent + half;

    let labelRow = 0;
    while (labelRow <= LAYOUT.maxRow) {
      const hit = bands.some(
        (b) => b.row === labelRow && L < b.right && R > b.left
      );
      if (!hit) break;
      labelRow += 1;
    }
    if (labelRow > LAYOUT.maxRow) {
      labelRow = labelRow % (LAYOUT.maxRow + 1);
      overlapScore += 2;
    } else if (labelRow > 0) {
      overlapScore += 1;
    }

    bands.push({ left: L, right: R, row: labelRow });
    placed.push({ event, leftPercent, labelRow });
  }

  const maxRow = placed.reduce((m, it) => Math.max(m, it.labelRow), 0);
  return { items: placed, maxRow, overlapScore, longTitle };
}

function computeTrackHeight(opts: {
  focused: boolean;
  maxRow: number;
  overlapScore: number;
  longTitle: boolean;
  eventCount: number;
}): number {
  if (!opts.focused) return TRACK.collapsed;
  let h = TRACK.base + opts.maxRow * TRACK.perRow;
  if (opts.longTitle) h += TRACK.longTitleBonus;
  if (opts.overlapScore >= 2 || opts.eventCount >= 6) h += TRACK.overlapBonus;
  return h;
}

export function Timeline({
  activeEventId,
  activeEmperorId,
  activePeriodId = null,
  highlightYearFrom = null,
  highlightYearTo = null,
  onSelectEvent,
  onSelectEmperor,
  onSelectEra,
  interactionLocked = false,
}: TimelineProps) {
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);
  /** 悬停提示（不展开）；点击后才真正展开 */
  const [hinted, setHinted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focusedPeriodId, setFocusedPeriodId] = useState<PeriodId | null>(null);
  const [categoryVisibility, setCategoryVisibility] =
    useState<CategoryVisibility>(DEFAULT_CATEGORY_VISIBILITY);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 展开增高后锁定，忽略因高度变化产生的伪离开 */
  const expandLockUntil = useRef(0);
  const pointerPos = useRef({ x: 0, y: 0 });
  /** 最近一次展开态顶边，用于高度骤降后的邻近判定 */
  const lastExpandedTop = useRef<number | null>(null);

  const baseEvents = useMemo(() => getVisibleEvents(), []);

  const filtered = useMemo(() => {
    return baseEvents.filter((e) =>
      eventMatchesCategories(e, categoryVisibility)
    );
  }, [baseEvents, categoryVisibility]);

  const bandLayouts = useMemo(() => {
    const n = EMPEROR_BANDS.length;
    const size = 100 / n;
    return EMPEROR_BANDS.map((band, i) => ({
      band,
      offset: i * size,
      size,
    }));
  }, []);

  /** 按年号建簇：示意点严格落在对应色带内（取色带中点） */
  const eraGroups = useMemo((): EraGroup[] => {
    const byPeriod = new Map<PeriodId, ChronicleEvent[]>();
    for (const e of filtered) {
      const list = byPeriod.get(e.periodId) ?? [];
      list.push(e);
      byPeriod.set(e.periodId, list);
    }

    const groups: EraGroup[] = [];
    for (const { band, offset, size } of bandLayouts) {
      const periodId = band.periodIds[0];
      const events = byPeriod.get(periodId);
      if (!events?.length) continue;
      const bandStart = offset;
      const bandEnd = offset + size;
      // 示意点锚定色带中点，绝不挪出色带
      const leftPercent = (bandStart + bandEnd) / 2;
      groups.push({
        periodId,
        eraLabel: band.eraLabel,
        accent: band.accent,
        leftPercent,
        bandStart,
        bandEnd,
        stackRow: 0,
        events: events.slice().sort((a, b) => a.year - b.year),
      });
    }

    // 相邻过近时仅错落标签高度，不改动横向（保证点仍在色带内）
    const overlapThresh = 6.5;
    for (let i = 1; i < groups.length; i++) {
      if (groups[i]!.leftPercent - groups[i - 1]!.leftPercent < overlapThresh) {
        groups[i]!.stackRow = groups[i - 1]!.stackRow === 0 ? 1 : 0;
      }
    }
    return groups;
  }, [filtered, bandLayouts]);

  const focusedGroup = useMemo(
    () => eraGroups.find((g) => g.periodId === focusedPeriodId) ?? null,
    [eraGroups, focusedPeriodId]
  );

  const { items: zoomedItems, maxRow, overlapScore, longTitle } = useMemo(
    () =>
      focusedGroup
        ? layoutZoomedEvents(focusedGroup.events)
        : { items: [], maxRow: 0, overlapScore: 0, longTitle: false },
    [focusedGroup]
  );

  const trackHeight = useMemo(
    () =>
      computeTrackHeight({
        focused: Boolean(focusedGroup),
        maxRow,
        overlapScore,
        longTitle,
        eventCount: focusedGroup?.events.length ?? 0,
      }),
    [focusedGroup, maxRow, overlapScore, longTitle]
  );

  const visibleCount = filtered.length;
  const yearHint = focusedGroup
    ? `${focusedGroup.events[0]?.year ?? DYNASTY_YEAR_SPAN.start} — ${
        focusedGroup.events[focusedGroup.events.length - 1]?.year ??
        DYNASTY_YEAR_SPAN.end
      }`
    : "1368 — 1644";

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

  const clearFocusLeave = () => {
    if (focusLeaveTimer.current) {
      clearTimeout(focusLeaveTimer.current);
      focusLeaveTimer.current = null;
    }
  };

  const lockExpanded = (ms = 700) => {
    expandLockUntil.current = Date.now() + ms;
    clearLeaveTimer();
    setHinted(false);
    setExpanded(true);
  };

  const expandTimeline = () => {
    clearLeaveTimer();
    setHinted(false);
    setExpanded(true);
    requestAnimationFrame(() => {
      const top = rootRef.current?.getBoundingClientRect().top;
      if (top != null) lastExpandedTop.current = top;
    });
  };

  const collapseTimeline = () => {
    clearLeaveTimer();
    clearFocusLeave();
    expandLockUntil.current = 0;
    setExpanded(false);
    setHinted(false);
    setFocusedPeriodId(null);
    lastExpandedTop.current = null;
  };

  const tryCollapse = () => {
    if (!expanded) {
      setHinted(false);
      return;
    }
    if (Date.now() < expandLockUntil.current) {
      leaveTimer.current = setTimeout(tryCollapse, 100);
      return;
    }

    const el = rootRef.current;
    const { x, y } = pointerPos.current;
    const under = document.elementFromPoint(x, y);
    if (el && under && el.contains(under)) return;

    const rect = el?.getBoundingClientRect();
    const ghostTop = lastExpandedTop.current;
    if (
      rect &&
      ghostTop != null &&
      Date.now() <= expandLockUntil.current + 500
    ) {
      const pad = 8;
      const inGhost =
        x >= rect.left - pad &&
        x <= rect.right + pad &&
        y >= ghostTop - 8 &&
        y <= rect.bottom + pad;
      if (inGhost) {
        leaveTimer.current = setTimeout(tryCollapse, 160);
        return;
      }
    }

    collapseTimeline();
  };

  const handleEnter = () => {
    clearLeaveTimer();
    if (!expanded) setHinted(true);
  };

  const handleLeave = () => {
    clearLeaveTimer();
    if (!expanded) {
      setHinted(false);
      return;
    }
    leaveTimer.current = setTimeout(tryCollapse, 3000);
  };

  /** 仅负责进入某朝；离开由轨道/整轴统一处理，避免簇卸载误清焦点 */
  const focusEra = (periodId: PeriodId) => {
    clearFocusLeave();
    lockExpanded(500);
    setFocusedPeriodId(periodId);
    onSelectEra?.(periodId);
    requestAnimationFrame(() => {
      const top = rootRef.current?.getBoundingClientRect().top;
      if (top != null) lastExpandedTop.current = top;
    });
  };

  const scheduleClearEraFocus = () => {
    clearFocusLeave();
    focusLeaveTimer.current = setTimeout(() => {
      setFocusedPeriodId(null);
    }, 320);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerPos.current = { x: e.clientX, y: e.clientY };
      if (!expanded) return;
      const top = rootRef.current?.getBoundingClientRect().top;
      if (top == null) return;
      // 只在变高（顶边上移）时更新，保留切模式前的较高顶边作邻近区
      if (
        lastExpandedTop.current == null ||
        top < lastExpandedTop.current
      ) {
        lastExpandedTop.current = top;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [expanded]);

  /** 在时间轴外点击：立刻收回（不等待悬停离开延迟） */
  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;
      collapseTimeline();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [expanded]);

  useEffect(
    () => () => {
      clearLeaveTimer();
      clearFocusLeave();
    },
    []
  );

  /** 帝王浮层打开：收起时间轴并停用互动 */
  useEffect(() => {
    if (!interactionLocked) return;
    collapseTimeline();
    setHoveredBand(null);
  }, [interactionLocked]);

  return (
    <motion.div
      ref={rootRef}
      role="region"
      tabIndex={interactionLocked ? -1 : 0}
      aria-expanded={expanded}
      aria-disabled={interactionLocked || undefined}
      aria-label={
        interactionLocked
          ? "时间轴已暂停（请先关闭帝王简介）"
          : expanded
            ? "时间轴已展开"
            : "时间轴，点击此浅色区域展开"
      }
      className={`relative overflow-hidden border-t border-ink-800/10 bg-[rgba(251,249,243,0.94)] backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cinnabar/35 ${
        interactionLocked
          ? "pointer-events-none cursor-default opacity-55"
          : "cursor-pointer"
      }`}
      onMouseEnter={() => {
        if (!interactionLocked) handleEnter();
      }}
      onMouseLeave={() => {
        if (!interactionLocked) handleLeave();
      }}
      onClick={(e) => {
        if (interactionLocked || expanded) return;
        // 仅本浅色底区域内的点击可展开；色带按钮另有逻辑
        const t = e.target as HTMLElement;
        if (t.closest("button, a, input, select, textarea")) return;
        expandTimeline();
      }}
      onKeyDown={(e) => {
        if (interactionLocked) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!expanded) expandTimeline();
        }
      }}
      animate={{
        // 不用位移/缩放做悬停提示，避免分割线附近进出自激抽搐
        boxShadow:
          !interactionLocked && !expanded && hinted
            ? "0 -4px 18px -10px rgba(48,42,28,0.16)"
            : "0 0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="px-4 md:px-6"
        animate={{
          paddingTop: expanded ? 10 : 6,
          paddingBottom: expanded ? 12 : 6,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
              <div className="mb-2 flex min-h-10 flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
                    核心主线
                  </p>
                  <CategoryFilter
                    visibility={categoryVisibility}
                    onToggle={toggleCategory}
                  />
                </div>
                <p className="font-display text-[10px] tracking-widest text-ink-300">
                  {focusedGroup
                    ? `${focusedGroup.eraLabel} · ${focusedGroup.events.length} 事 · ${yearHint}`
                    : `各朝缩略 · ${visibleCount} 事 · 点击年号展开`}
                </p>
              </div>

              <motion.nav
                className="relative mb-3 w-full"
                aria-label="核心主线事件"
                animate={{ height: trackHeight }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={clearFocusLeave}
                onMouseLeave={scheduleClearEraFocus}
              >
                <div
                  className="pointer-events-none absolute bottom-4 left-0 right-0 h-px bg-gradient-to-r from-cinnabar/35 via-ink-400/25 to-ink-300/20"
                  aria-hidden
                />
                <span className="pointer-events-none absolute bottom-0 left-0 text-[9px] leading-none tabular-nums text-ink-300">
                  {focusedGroup
                    ? focusedGroup.events[0]?.year ?? 1368
                    : 1368}
                </span>
                <span className="pointer-events-none absolute bottom-0 right-0 text-[9px] leading-none tabular-nums text-ink-300">
                  {focusedGroup
                    ? focusedGroup.events[focusedGroup.events.length - 1]
                        ?.year ?? 1644
                    : 1644}
                </span>

                <div className="absolute inset-x-0 top-0 bottom-4">
                  {visibleCount === 0 ? (
                    <p className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-400">
                      请至少开启一类事件筛选
                    </p>
                  ) : (
                    <AnimatePresence mode="wait">
                      {focusedGroup ? (
                        <motion.div
                          key={`zoom-${focusedGroup.periodId}`}
                          className="absolute inset-0"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{
                            duration: 0.36,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <AnimatePresence mode="popLayout">
                            {zoomedItems.map(
                              ({ event, leftPercent, labelRow }) => (
                                <EventNode
                                  key={event.id}
                                  event={event}
                                  leftPercent={leftPercent}
                                  labelRow={labelRow}
                                  isActive={activeEventId === event.id}
                                  onSelect={onSelectEvent}
                                />
                              )
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="era-clusters"
                          className="absolute inset-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          {eraGroups.map((group) => {
                            const hasActive = group.events.some(
                              (e) => e.id === activeEventId
                            );
                            return (
                              <EraCluster
                                key={group.periodId}
                                eraLabel={group.eraLabel}
                                count={group.events.length}
                                leftPercent={group.leftPercent}
                                bandStart={group.bandStart}
                                bandEnd={group.bandEnd}
                                stackRow={group.stackRow}
                                accent={group.accent}
                                isActive={hasActive}
                                onSelect={() => focusEra(group.periodId)}
                              />
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={
            !expanded && hinted
              ? "brightness-[1.03] saturate-[1.06] transition-[filter] duration-300"
              : "transition-[filter] duration-300"
          }
        >
          <EmperorStrip
            layouts={bandLayouts}
            compact={!expanded}
            showEraLabels={expanded}
            activeEmperorId={activeEmperorId}
            activePeriodId={activePeriodId}
            highlightYearFrom={highlightYearFrom}
            highlightYearTo={highlightYearTo}
            hoveredId={hoveredBand}
            onHover={setHoveredBand}
            onSelect={(band) => {
              if (!expanded) expandTimeline();
              onSelectEmperor(band);
            }}
          />
        </div>

        {!expanded && (
          <motion.p
            className="pointer-events-none mt-1 text-center text-[9px] tracking-wider"
            animate={{
              color: hinted ? "rgba(196, 60, 44, 0.85)" : "rgba(143, 133, 112, 1)",
              letterSpacing: hinted ? "0.22em" : "0.12em",
            }}
            transition={{ duration: 0.28 }}
          >
            {hinted ? "点击展开时间轴" : "朝代时间轴"}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
