"use client";

import {
  getPeriodById,
  getPeriodContent,
  type PeriodId,
} from "@/data/ming-dynasty";
import { getEventsByPeriod } from "@/data/chronicle-events";
import { EmperorCard } from "@/components/cards/EmperorCard";
import { EventsCard } from "@/components/cards/EventsCard";
import { TerritoryCard } from "@/components/cards/TerritoryCard";
import { TerritoryMapPanel } from "@/components/map/TerritoryMapPanel";

interface PeriodPanelProps {
  periodId: PeriodId;
  highlightEventId?: string | null;
  /** 当前选中年份，驱动疆域图 Cross-fade */
  currentYear: number;
  onSelectYear?: (year: number) => void;
}

export function PeriodPanel({
  periodId,
  highlightEventId,
  currentYear,
  onSelectYear,
}: PeriodPanelProps) {
  const period = getPeriodById(periodId);
  const content = getPeriodContent(periodId);
  const chronicleEvents = getEventsByPeriod(periodId);

  return (
    <div className="px-5 py-6 md:px-8 md:py-8 lg:px-10">
      <header className="mb-6">
        <p className="font-display text-xs tracking-[0.3em] text-ink-400">
          {period.startYear === period.endYear
            ? `${period.startYear} 年`
            : `${period.startYear} — ${period.endYear}`}
          <span className="ml-3 tabular-nums text-cinnabar/80">
            地图年份 {currentYear}
          </span>
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink-900 md:text-3xl">
          {period.label}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500 md:text-base">
          {content.emperor.summary}
        </p>
      </header>

      {/* 中央交互疆域图 */}
      <TerritoryMapPanel
        currentYear={currentYear}
        territory={content.territory}
        onSelectYear={onSelectYear}
        className="mb-6 flex min-h-[440px] flex-col overflow-hidden border border-[#e3dcca] bg-[#fbf9f3] shadow-[0_1px_2px_rgba(48,42,28,0.04)] md:min-h-[560px]"
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div className="lg:col-span-1">
          <EmperorCard emperor={content.emperor} />
        </div>
        <div className="lg:col-span-1">
          <EventsCard
            events={chronicleEvents}
            periodLabel={period.label}
            highlightEventId={highlightEventId}
          />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <TerritoryCard territory={content.territory} />
        </div>
      </div>
    </div>
  );
}
