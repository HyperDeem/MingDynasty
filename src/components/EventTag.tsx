"use client";

import { EVENT_CATEGORIES, type EventCategory } from "@/data/categories";

interface EventTagProps {
  category: EventCategory;
  size?: "sm" | "md";
}

export function EventTag({ category, size = "sm" }: EventTagProps) {
  const meta = EVENT_CATEGORIES[category];
  return (
    <span
      className={`inline-flex items-center gap-1 border ${meta.border} ${meta.bg} ${meta.text} ${
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-[11px]"
      } tracking-wider`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
      {meta.shortLabel}
    </span>
  );
}

export function EventTagLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map((id) => {
        const meta = EVENT_CATEGORIES[id];
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 text-[10px] text-ink-500"
            title={meta.label}
          >
            <span className="text-[11px] leading-none" aria-hidden>
              {meta.emoji}
            </span>
            <span className="hidden sm:inline">{meta.label}</span>
            <span className="sm:hidden">{meta.shortLabel}</span>
          </span>
        );
      })}
    </div>
  );
}
