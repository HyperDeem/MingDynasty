"use client";

import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LIST,
  type EventCategory,
} from "@/data/categories";

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

export type CategoryVisibility = Record<EventCategory, boolean>;

export const DEFAULT_CATEGORY_VISIBILITY: CategoryVisibility = {
  military: true,
  political: true,
  culture: true,
  foreign: true,
};

interface CategoryFilterProps {
  visibility: CategoryVisibility;
  onToggle: (category: EventCategory) => void;
  tone?: "light" | "dark";
}

/** 核心主线四大类开关：军事 / 政治 / 文化 / 对外 */
export function CategoryFilter({
  visibility,
  onToggle,
  tone = "light",
}: CategoryFilterProps) {
  const dark = tone === "dark";
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="事件分类筛选"
    >
      {EVENT_CATEGORY_LIST.map((meta) => {
        const on = visibility[meta.id];
        return (
          <button
            key={meta.id}
            type="button"
            aria-pressed={on}
            title={on ? `隐藏${meta.label}` : `显示${meta.label}`}
            onClick={() => onToggle(meta.id)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
              dark
                ? on
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                  : "border-white/10 bg-white/[0.04] text-slate-500 opacity-75 hover:opacity-100"
                : on
                  ? `${meta.border} ${meta.bg} ${meta.text} shadow-[0_1px_0_rgba(48,42,28,0.04)]`
                  : "border-ink-800/10 bg-ink-800/[0.03] text-ink-400 opacity-70 hover:opacity-90"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${meta.dot} ${
                on ? "" : "opacity-40 grayscale"
              }`}
              aria-hidden
            />
            <span className="hidden sm:inline">{meta.label}</span>
            <span className="sm:hidden">{meta.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
