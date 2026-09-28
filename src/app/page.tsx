"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DYNASTY_META,
  getPeriodById,
  getPeriodContent,
  type PeriodId,
} from "@/data/ming-dynasty";
import { type ChronicleEvent } from "@/data/chronicle-events";
import {
  findEmperorBandAtYear,
  type EmperorBand,
  type EmperorId,
} from "@/data/emperors";
import { getDefaultPeriodForEmperor } from "@/data/lineage";
import { resolveTerritorySnapshot } from "@/data/ming-territory";
import { Timeline } from "@/components/Timeline";
import { TerritoryMapPanel } from "@/components/map/TerritoryMapPanel";
import { EmperorDrawer } from "@/components/overlays/EmperorDrawer";
import { WorldEventsDrawer } from "@/components/overlays/WorldEventsDrawer";

function yearFromPeriod(periodId: PeriodId): number {
  const p = getPeriodById(periodId);
  if (p.startYear === p.endYear) return p.startYear;
  return Math.round((p.startYear + p.endYear) / 2);
}

export default function HomePage() {
  const [periodId, setPeriodId] = useState<PeriodId>(
    DYNASTY_META.defaultPeriodId
  );
  const [currentYear, setCurrentYear] = useState(() =>
    yearFromPeriod(DYNASTY_META.defaultPeriodId)
  );
  const [emperorId, setEmperorId] = useState<EmperorId | null>(null);
  const [worldOpen, setWorldOpen] = useState(false);
  const [highlightEventId, setHighlightEventId] = useState<string | null>(
    null
  );

  const territory = useMemo(
    () => getPeriodContent(periodId).territory,
    [periodId]
  );

  const territorySnapshot = useMemo(
    () => resolveTerritorySnapshot(currentYear),
    [currentYear]
  );

  const syncPeriodYear = useCallback((nextPeriod: PeriodId, year?: number) => {
    setPeriodId(nextPeriod);
    setCurrentYear(year ?? yearFromPeriod(nextPeriod));
  }, []);

  /** 年号簇：只跳疆域，不强制开浮层 */
  const handleSelectEra = useCallback(
    (nextPeriod: PeriodId) => {
      syncPeriodYear(nextPeriod);
      setHighlightEventId(null);
    },
    [syncPeriodYear]
  );

  /** 事件节点：开世界事件并高亮 */
  const handleSelectEvent = useCallback((event: ChronicleEvent) => {
    setPeriodId(event.periodId);
    setCurrentYear(event.year);
    setHighlightEventId(event.id);
    setWorldOpen(true);
    setEmperorId(null);
  }, []);

  /** 色带：开帝王浮层 + 同步疆域年份 */
  const handleSelectEmperor = useCallback(
    (band: EmperorBand) => {
      const nextPeriod = band.periodIds[0];
      syncPeriodYear(nextPeriod);
      setEmperorId(band.id);
      setWorldOpen(false);
      setHighlightEventId(null);
    },
    [syncPeriodYear]
  );

  const handleGenealogyEmperor = useCallback(
    (id: EmperorId) => {
      const nextPeriod = getDefaultPeriodForEmperor(id);
      syncPeriodYear(nextPeriod);
      setEmperorId(id);
    },
    [syncPeriodYear]
  );

  const handleSelectMapYear = useCallback((year: number) => {
    setCurrentYear(year);
    setHighlightEventId(null);
    const band = findEmperorBandAtYear(year);
    if (band?.periodIds[0]) setPeriodId(band.periodIds[0]);
  }, []);

  const handleWorldEventPick = useCallback(
    (year: number, eventId: string) => {
      setCurrentYear(year);
      setHighlightEventId(eventId);
    },
    []
  );

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#f3efe4]">
      {/* 全屏地图舞台 */}
      <div className="relative min-h-0 flex-1">
        <TerritoryMapPanel
          variant="stage"
          currentYear={currentYear}
          territory={territory}
          onSelectYear={handleSelectMapYear}
        />

        {/* 轻量顶栏 */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 pt-3 md:px-6 md:pt-4">
          <div className="pointer-events-auto rounded-md border border-ink-800/10 bg-[rgba(251,249,243,0.9)] px-3 py-2 shadow-[0_1px_2px_rgba(48,42,28,0.06)] backdrop-blur-md">
            <p className="font-display text-[10px] tracking-[0.32em] text-ink-500">
              INTERACTIVE CHRONICLE
            </p>
            <h1 className="font-display text-xl font-bold tracking-wide text-ink-900 md:text-2xl">
              {DYNASTY_META.title}
            </h1>
          </div>
          <div className="pointer-events-auto rounded-md border border-ink-800/10 bg-[rgba(251,249,243,0.9)] px-3 py-2 text-right shadow-[0_1px_2px_rgba(48,42,28,0.06)] backdrop-blur-md">
            <p className="font-display text-[11px] tabular-nums text-ink-700">
              {currentYear}
              <span className="ml-1 text-[10px] font-normal text-ink-400">
                年
              </span>
            </p>
            <p className="mt-0.5 text-[10px] text-ink-400">
              {getPeriodById(periodId).label}
            </p>
          </div>
        </header>

        <EmperorDrawer
          emperorId={emperorId}
          onClose={() => setEmperorId(null)}
          onSelectEmperor={handleGenealogyEmperor}
        />

        <WorldEventsDrawer
          open={worldOpen}
          periodId={periodId}
          highlightEventId={highlightEventId}
          currentYear={currentYear}
          onClose={() => {
            setWorldOpen(false);
            setHighlightEventId(null);
          }}
          onSelectEventYear={handleWorldEventPick}
        />
      </div>

      <footer className="relative z-40 shrink-0">
        <Timeline
          activeEventId={highlightEventId}
          activeEmperorId={emperorId}
          activePeriodId={periodId}
          highlightYearFrom={territorySnapshot.yearFrom}
          highlightYearTo={territorySnapshot.yearTo}
          interactionLocked={emperorId != null}
          onSelectEvent={handleSelectEvent}
          onSelectEmperor={handleSelectEmperor}
          onSelectEra={handleSelectEra}
        />
      </footer>
    </div>
  );
}
