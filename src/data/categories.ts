/** 事件分类标签：军事 / 政治 / 文化 / 对外 */

export type EventCategory = "military" | "political" | "culture" | "foreign";

export interface EventCategoryMeta {
  id: EventCategory;
  label: string;
  shortLabel: string;
  /** 色点 emoji，用于文案示意 */
  emoji: string;
  /** Tailwind 相关色值 */
  dot: string;
  bg: string;
  text: string;
  border: string;
}

export const EVENT_CATEGORIES: Record<EventCategory, EventCategoryMeta> = {
  military: {
    id: "military",
    label: "军事 / 战争",
    shortLabel: "军事",
    emoji: "🔴",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-500/25",
  },
  political: {
    id: "political",
    label: "政治 / 制度",
    shortLabel: "政治",
    emoji: "🔵",
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-800",
    border: "border-sky-500/25",
  },
  culture: {
    id: "culture",
    label: "文化 / 科技",
    shortLabel: "文化",
    emoji: "🟢",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-800",
    border: "border-emerald-500/25",
  },
  foreign: {
    id: "foreign",
    label: "对外 / 贸易",
    shortLabel: "对外",
    emoji: "🟡",
    dot: "bg-amber-400",
    bg: "bg-amber-400/15",
    text: "text-amber-800",
    border: "border-amber-500/30",
  },
};

export const EVENT_CATEGORY_LIST = Object.values(EVENT_CATEGORIES);
