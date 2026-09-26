"use client";

import { useEffect, useRef } from "react";
import type { ChronicleEvent } from "@/data/chronicle-events";
import { EventTag } from "@/components/EventTag";

interface EventsCardProps {
  events: ChronicleEvent[];
  periodLabel: string;
  highlightEventId?: string | null;
}

export function EventsCard({
  events,
  periodLabel,
  highlightEventId,
}: EventsCardProps) {
  const highlightRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!highlightEventId || !highlightRef.current) return;
    highlightRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [highlightEventId]);

  return (
    <article className="flex h-full flex-col border border-ink-800/10 bg-ink-50/60 p-5 backdrop-blur-sm md:p-6">
      <p className="font-display text-[10px] tracking-[0.3em] text-cinnabar">
        大事件
      </p>
      <h3 className="mt-1 font-display text-lg font-bold text-ink-900">
        {periodLabel}纪事
      </h3>

      <ul className="mt-5 flex-1 space-y-0">
        {events.length === 0 && (
          <li className="text-sm text-ink-400">本时期暂无收录事件</li>
        )}
        {events.map((event, index) => {
          const highlighted = highlightEventId === event.id;
          return (
            <li
              key={event.id}
              id={`event-${event.id}`}
              ref={highlighted ? highlightRef : undefined}
              className={`py-4 transition-colors ${
                index > 0 ? "border-t border-ink-800/10" : ""
              } ${
                highlighted ? "-mx-2 rounded bg-cinnabar/[0.06] px-2" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-display text-base font-semibold text-ink-800">
                  {event.title}
                  {event.weight === "turning" && (
                    <span className="ml-2 align-middle text-[10px] font-normal tracking-wider text-cinnabar">
                      转折点
                    </span>
                  )}
                </h4>
                <time className="shrink-0 text-xs tabular-nums text-ink-400">
                  {event.yearLabel}
                </time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {event.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {event.categories.map((c) => (
                  <EventTag key={c} category={c} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
