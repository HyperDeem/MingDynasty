"use client";

import { useEffect, useRef } from "react";
import {
  getPeriodById,
  getPeriodContent,
  type PeriodId,
} from "@/data/ming-dynasty";
import { getEventsByPeriod } from "@/data/chronicle-events";
import { EventTag } from "@/components/EventTag";
import { OverlayPanel } from "@/components/overlays/OverlayPanel";

interface WorldEventsDrawerProps {
  open: boolean;
  periodId: PeriodId;
  highlightEventId: string | null;
  currentYear: number;
  onClose: () => void;
  onSelectEventYear?: (year: number, eventId: string) => void;
}

export function WorldEventsDrawer({
  open,
  periodId,
  highlightEventId,
  currentYear,
  onClose,
  onSelectEventYear,
}: WorldEventsDrawerProps) {
  const period = getPeriodById(periodId);
  const content = getPeriodContent(periodId);
  const events = getEventsByPeriod(periodId);
  const territory = content.territory;
  const highlightRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!open || !highlightEventId || !highlightRef.current) return;
    highlightRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [open, highlightEventId, periodId]);

  return (
    <OverlayPanel
      open={open}
      eyebrow="世界事件"
      title={`${period.label}纪事`}
      onClose={onClose}
      side="left"
    >
      {/* 同时期疆域要点 */}
      <section className="border-b border-ink-800/10 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-[10px] tracking-[0.22em] text-ink-400">
            疆域要点
          </p>
          <p className="text-[10px] tabular-nums text-ink-400">
            地图 {currentYear} · 峰值约 {territory.peakYear}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
          <span>
            约{" "}
            <strong className="font-display tabular-nums text-ink-800">
              {territory.areaWanKm2}
            </strong>{" "}
            万 km²
          </span>
          <span>
            两京十三省{" "}
            <strong className="tabular-nums text-ink-800">
              {territory.provinces}
            </strong>
          </span>
          <span>都城 {territory.capitals.join("、")}</span>
        </div>
        <ul className="mt-2 space-y-1">
          {territory.highlights.slice(0, 4).map((h) => (
            <li
              key={h.label}
              className="flex items-baseline justify-between gap-2 text-[11px]"
            >
              <span className="text-ink-400">{h.label}</span>
              <span className="text-right text-ink-700">{h.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <ul className="px-4 py-2">
        {events.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-400">
            本时期暂无收录事件
          </li>
        )}
        {events.map((event, index) => {
          const highlighted = highlightEventId === event.id;
          return (
            <li
              key={event.id}
              ref={highlighted ? highlightRef : undefined}
              className={`py-3.5 transition-colors ${
                index > 0 ? "border-t border-ink-800/10" : ""
              } ${highlighted ? "-mx-2 rounded bg-cinnabar/[0.07] px-2" : ""}`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onSelectEventYear?.(event.year, event.id)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-[15px] font-semibold text-ink-800">
                    {event.title}
                    {event.weight === "turning" && (
                      <span className="ml-2 align-middle text-[10px] font-normal tracking-wider text-cinnabar">
                        转折点
                      </span>
                    )}
                  </h3>
                  <time className="shrink-0 text-[11px] tabular-nums text-ink-400">
                    {event.yearLabel}
                  </time>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
                  {event.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.categories.map((c) => (
                    <EventTag key={c} category={c} />
                  ))}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </OverlayPanel>
  );
}
