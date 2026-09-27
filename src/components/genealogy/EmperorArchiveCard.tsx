"use client";

import {
  getEmperorPerson,
  getEventsByEmperorSafe,
} from "@/data/lineage-helpers";
import type { EmperorId } from "@/data/emperors";
import { EventTag } from "@/components/EventTag";
import { motion } from "framer-motion";

interface EmperorArchiveCardProps {
  emperorId: EmperorId;
  /** 在浮层内撑满剩余高度 */
  fill?: boolean;
}

export function EmperorArchiveCard({
  emperorId,
  fill = false,
}: EmperorArchiveCardProps) {
  const person = getEmperorPerson(emperorId);
  const events = getEventsByEmperorSafe(emperorId);

  return (
    <motion.article
      key={emperorId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-ink-50/80 px-3 py-4 md:px-5 md:py-5 ${
        fill
          ? "flex min-h-0 flex-1 flex-col"
          : "border-t border-ink-800/10"
      }`}
    >
      <p className="shrink-0 font-display text-[10px] tracking-[0.3em] text-cinnabar md:tracking-[0.35em]">
        帝王档案卡
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3 md:mt-4 md:gap-3">
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

      {person.birthDeath && (
        <p className="mt-3 text-xs tabular-nums text-ink-400">
          生卒 {person.birthDeath}
          {person.throneOrder != null && (
            <span className="ml-3">帝位第 {person.throneOrder} 任</span>
          )}
        </p>
      )}

      <p
        className={`mt-3 text-[13px] text-ink-600 md:mt-4 md:text-sm ${
          fill
            ? "min-h-0 flex-1 leading-[1.95] tracking-wide md:leading-[2.1] md:tracking-[0.04em] lg:leading-[2.25]"
            : "max-w-3xl leading-relaxed"
        }`}
      >
        {person.summary}
      </p>

      {emperorId === "yingzong" && (
        <div className="mt-4 border border-cinnabar/20 bg-cinnabar/[0.04] px-3 py-2 text-xs leading-relaxed text-ink-600">
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
        <div className="mt-5">
          <p className="font-display text-[10px] tracking-[0.2em] text-ink-400">
            在位相关事件
          </p>
          <ul className="mt-2 space-y-2">
            {events.slice(0, 5).map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-800/5 pb-2 text-sm"
              >
                <span className="font-medium text-ink-800">{ev.title}</span>
                <span className="text-xs tabular-nums text-ink-400">
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
      className={`border px-3 py-2.5 ${
        emphasize
          ? "border-ink-800/15 bg-gradient-to-b from-ink-50 to-ink-100/60"
          : "border-ink-800/10"
      }`}
    >
      <p className="text-[10px] tracking-[0.2em] text-ink-400">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tracking-wide text-ink-900">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}
