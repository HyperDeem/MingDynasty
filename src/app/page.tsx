"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DYNASTY_META,
  getPeriodById,
  type PeriodId,
} from "@/data/ming-dynasty";
import {
  type ChronicleEvent,
  type TimelineMode,
} from "@/data/chronicle-events";
import type { EmperorBand, EmperorId } from "@/data/emperors";
import { getDefaultPeriodForEmperor } from "@/data/lineage";
import { Timeline } from "@/components/Timeline";
import { PeriodPanel } from "@/components/PeriodPanel";
import { GenealogyPanel } from "@/components/genealogy/GenealogyPanel";

type RightView =
  | { kind: "period"; periodId: PeriodId; eventId: string | null }
  | { kind: "genealogy"; emperorId: EmperorId };

function yearFromPeriod(periodId: PeriodId): number {
  const p = getPeriodById(periodId);
  if (p.startYear === p.endYear) return p.startYear;
  // 取时期中段，便于落在对应疆域快照区间
  return Math.round((p.startYear + p.endYear) / 2);
}

export default function HomePage() {
  const [mode, setMode] = useState<TimelineMode>("core");
  const [detailLevel, setDetailLevel] = useState(0.35);
  const [rightView, setRightView] = useState<RightView>({
    kind: "period",
    periodId: DYNASTY_META.defaultPeriodId,
    eventId: null,
  });
  /** 显式年份状态：驱动疆域图；可由事件点击覆盖 */
  const [currentYear, setCurrentYear] = useState(() =>
    yearFromPeriod(DYNASTY_META.defaultPeriodId)
  );

  const handleSelectEvent = useCallback((event: ChronicleEvent) => {
    setRightView({
      kind: "period",
      periodId: event.periodId,
      eventId: event.id,
    });
    setCurrentYear(event.year);
  }, []);

  const handleSelectEmperor = useCallback((band: EmperorBand) => {
    setRightView({ kind: "genealogy", emperorId: band.id });
  }, []);

  const handleGenealogyEmperor = useCallback((id: EmperorId) => {
    setRightView({ kind: "genealogy", emperorId: id });
  }, []);

  const handleCloseGenealogy = useCallback(() => {
    setRightView((prev) => {
      if (prev.kind !== "genealogy") return prev;
      const periodId = getDefaultPeriodForEmperor(prev.emperorId);
      setCurrentYear(yearFromPeriod(periodId));
      return {
        kind: "period",
        periodId,
        eventId: null,
      };
    });
  }, []);

  const handleModeChange = useCallback(
    (next: TimelineMode) => {
      setMode(next);
      if (next === "chronicle" && detailLevel < 0.2) {
        setDetailLevel(0.35);
      }
    },
    [detailLevel]
  );

  const activeEventId =
    rightView.kind === "period" ? rightView.eventId : null;
  const activeEmperorId =
    rightView.kind === "genealogy" ? rightView.emperorId : null;

  const panelKey =
    rightView.kind === "genealogy"
      ? `gen-${rightView.emperorId}`
      : `per-${rightView.periodId}`;

  const handleSelectMapYear = useCallback((year: number) => {
    setCurrentYear(year);
    setRightView((prev) =>
      prev.kind === "period" ? { ...prev, eventId: null } : prev
    );
  }, []);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <header className="relative z-20 flex shrink-0 items-end justify-between gap-4 border-b border-ink-800/10 px-5 py-4 md:px-8">
        <div>
          <p className="font-display text-xs tracking-[0.35em] text-ink-500 md:text-sm">
            INTERACTIVE CHRONICLE
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-ink-900 md:text-4xl">
            {DYNASTY_META.title}
          </h1>
        </div>
        <div className="pb-1 text-right">
          <p className="font-display text-sm text-ink-500 md:text-base">
            {DYNASTY_META.subtitle}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-ink-400">
            地图年份 · {currentYear}
          </p>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex max-h-[42vh] w-full shrink-0 flex-col border-b border-ink-800/10 md:max-h-none md:w-[340px] md:border-b-0 md:border-r lg:w-[380px]">
          <div className="px-5 pb-1 pt-4 md:px-6">
            <h2 className="font-display text-sm font-medium tracking-widest text-ink-500">
              朝代时间轴
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              点击事件切换疆域图 · 色带打开谱系
            </p>
          </div>
          <Timeline
            mode={mode}
            detailLevel={detailLevel}
            onModeChange={handleModeChange}
            onDetailChange={setDetailLevel}
            activeEventId={activeEventId}
            activeEmperorId={activeEmperorId}
            onSelectEvent={handleSelectEvent}
            onSelectEmperor={handleSelectEmperor}
          />
        </aside>

        <section className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={panelKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={
                rightView.kind === "genealogy"
                  ? "h-full min-h-0 overflow-hidden"
                  : "h-full min-h-0 overflow-y-auto scrollbar-timeline"
              }
            >
              {rightView.kind === "genealogy" ? (
                <GenealogyPanel
                  emperorId={rightView.emperorId}
                  onSelectEmperor={handleGenealogyEmperor}
                  onClose={handleCloseGenealogy}
                />
              ) : (
                <PeriodPanel
                  periodId={rightView.periodId}
                  highlightEventId={rightView.eventId}
                  currentYear={currentYear}
                  onSelectYear={handleSelectMapYear}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
