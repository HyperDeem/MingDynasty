"use client";

import {
  getEmperorPerson,
  getEventsByEmperorSafe,
} from "@/data/lineage-helpers";
import type { EmperorId } from "@/data/emperors";
import { EventTag } from "@/components/EventTag";
import { EmperorPortrait } from "@/components/EmperorPortrait";
import { motion } from "framer-motion";

interface EmperorArchiveCardProps {
  emperorId: EmperorId;
}

/** 档案身份卡：画像 + 姓名 / 年号 / 庙谥 */
export function EmperorArchiveCard({ emperorId }: EmperorArchiveCardProps) {
  const person = getEmperorPerson(emperorId);
  const events = getEventsByEmperorSafe(emperorId);

  return (
    <motion.article
      key={emperorId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="museum-emp-surface flex max-h-[min(62vh,34rem)] flex-col bg-[rgba(251,249,243,0.42)] px-3 py-3 md:px-4 md:py-4"
    >
      <div className="flex shrink-0 gap-3 md:gap-4">
        <EmperorPortrait
          emperorId={emperorId}
          name={person.name}
          enlargeOnClick
          className="!h-24 !w-[4.5rem] md:!h-28 md:!w-[5.25rem]"
        />
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-1 md:gap-2.5">
          <NameBlock label="姓名" value={person.name} emphasize />
          <NameBlock
            label="年号"
            value={
              person.reigns.length > 1
                ? person.reigns.map((r) => r.title).join(" / ")
                : person.reigns[0]?.title ?? "—"
            }
            sub={
              person.reigns.length > 1
                ? person.reigns
                    .map((r) => `${r.title} ${r.startYear}–${r.endYear}`)
                    .join(" · ")
                : person.reigns[0]
                  ? `${person.reigns[0].startYear}–${person.reigns[0].endYear}`
                  : undefined
            }
            emphasize
          />
          <NameBlock
            label="庙号 / 谥号"
            value={person.templeName ?? "—"}
            sub={person.posthumousName}
            emphasize
          />
        </div>
      </div>

      {emperorId === "yingzong" && (
        <div className="museum-emp-note museum-emp-body mt-3 shrink-0 border border-cinnabar/20 bg-cinnabar/[0.04] px-3 py-2 text-sm leading-relaxed text-ink-600">
          <span className="font-display font-medium text-cinnabar">
            一人双年号
          </span>
          ：主体为「明英宗」，内部裂变为
          <span className="mx-1 font-medium">正统</span>
          与
          <span className="mx-1 font-medium">天顺</span>
          ，中间穿插代宗
          <span className="mx-1 font-medium">景泰</span>
          。谱系图上只绘一个英宗节点，色带上仍分两段年号。
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-baseline justify-between gap-2">
            <p className="museum-emp-dt font-display text-[10px] tracking-[0.2em] text-ink-400">
              在位相关事件
            </p>
            <p className="museum-emp-dt text-[10px] tabular-nums text-ink-300">
              共 {events.length} 条
            </p>
          </div>
          <ul className="scrollbar-timeline mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="museum-glass-rule flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-800/5 pb-2 text-sm last:border-b-0"
              >
                <span className="museum-emp-title font-medium text-ink-800">
                  {ev.title}
                </span>
                <span className="museum-emp-dd font-mono text-xs tabular-nums text-ink-400">
                  {ev.yearLabel}
                </span>
                <div className="flex w-full flex-wrap gap-1">
                  {ev.categories.map((c) => (
                    <EventTag key={c} category={c} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.article>
  );
}

function NameBlock({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`museum-emp-card border px-2.5 py-2 ${
        emphasize
          ? "border-ink-800/12 bg-[rgba(251,249,243,0.55)]"
          : "border-ink-800/10"
      }`}
    >
      <p className="museum-emp-dt font-mono text-[10px] tracking-[0.2em] text-ink-400">
        {label}
      </p>
      <p className="museum-emp-title mt-1 font-serif text-lg font-bold tracking-wide text-ink-900">
        {value}
      </p>
      {sub && (
        <p className="museum-emp-dd mt-0.5 font-mono text-xs text-ink-500">
          {sub}
        </p>
      )}
    </div>
  );
}
