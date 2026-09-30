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
  const [isMuseumMode, setIsMuseumMode] = useState(false);

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
    <div
      className={`relative h-dvh overflow-hidden transition-colors duration-700 ${
        isMuseumMode ? "museum-mode bg-[#090a0f]" : "bg-[#f3efe4]"
      }`}
    >
      {/* 地图铺满视口：时间轴改为浮层，切朝/展开时不再挤矮画布，从根源消除抖动 */}
      <div className="absolute inset-0 z-[2]">
        <TerritoryMapPanel
          variant="stage"
          currentYear={currentYear}
          territory={territory}
          onSelectYear={handleSelectMapYear}
          museumMode={isMuseumMode}
        />
      </div>

      {/* 展厅顶光 + 四角暗影：叠在地图之上，不拦截交互 */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-700 ${
          isMuseumMode ? "opacity-100" : "opacity-0"
        } bg-[radial-gradient(ellipse_100%_50%_at_50%_-10%,rgba(245,158,11,0.18),transparent_70%)] shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]`}
      />

      {/* 轻量顶栏 · 策展式衬线标题（高于光影层） */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-3 md:px-6 md:pt-4">
        <div className="museum-glass pointer-events-auto rounded-md border border-amber-900/10 bg-amber-50/50 px-3.5 py-2.5 shadow-[0_1px_2px_rgba(48,42,28,0.05)] backdrop-blur-md transition-colors duration-700">
          <p
            className={`font-serif text-[9px] font-medium uppercase tracking-[0.42em] transition-colors duration-700 md:text-[10px] md:tracking-[0.48em] ${
              isMuseumMode ? "museum-glass-muted" : "text-ink-500"
            }`}
          >
            INTERACTIVE CHRONICLE
          </p>
          <h1
            className={`mt-1.5 font-serif text-xl font-bold tracking-[0.2em] transition-colors duration-700 md:text-2xl md:tracking-[0.22em] ${
              isMuseumMode ? "museum-glass-text" : "text-ink-900"
            }`}
          >
            {DYNASTY_META.title}
          </h1>
        </div>

        <button
          type="button"
          aria-label={isMuseumMode ? "展厅开灯" : "展厅关灯"}
          aria-pressed={isMuseumMode}
          title={isMuseumMode ? "开灯 · 退出展厅模式" : "关灯 · 展厅顶光模式"}
          onClick={() => setIsMuseumMode((v) => !v)}
          className="museum-ctrl pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-amber-900/25 bg-amber-50/40 text-[#4f544c] backdrop-blur-md transition duration-700 hover:border-amber-900/45 hover:bg-amber-50/65 hover:text-[#2f554d]"
        >
          {isMuseumMode ? (
            <svg
              viewBox="0 0 24 24"
              className="h-[15px] w-[15px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3.25" />
              <path d="M12 2.75v2.1M12 19.15v2.1M2.75 12h2.1M19.15 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-[15px] w-[15px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20.2 14.1A7.6 7.6 0 0 1 9.9 3.8 7.85 7.85 0 1 0 20.2 14.1Z" />
            </svg>
          )}
        </button>
      </header>

      <div className="pointer-events-none absolute inset-0 z-30">
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

      {/* 时间轴自带 fixed 底部居中悬浮，不再占满底栏 */}
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
    </div>
  );
}
