"use client";

import { motion } from "framer-motion";
import {
  displayReignHonorific,
  getEmperorPerson,
  getInheritanceComparison,
  isEmperorId,
  type LineageNodeId,
} from "@/data/lineage";
import type { EmperorId } from "@/data/emperors";
import { EmperorPortrait } from "@/components/EmperorPortrait";

interface InheritanceBarProps {
  emperorId: EmperorId;
  onNavigate: (id: LineageNodeId) => void;
}

export function InheritanceBar({ emperorId, onNavigate }: InheritanceBarProps) {
  const current = getEmperorPerson(emperorId);
  const { prev, next } = getInheritanceComparison(emperorId);

  return (
    <div className="border-t border-ink-800/10 bg-[rgba(243,239,228,0.35)] px-4 py-3 md:px-6">
      <p className="mb-2 font-display text-[10px] tracking-[0.25em] text-ink-400">
        继承逻辑对比
      </p>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <SideCard
          side="prev"
          disabled={!prev}
          onClick={() => prev && onNavigate(prev.person.id)}
        >
          {prev ? (
            <PersonBlock
              emperorId={
                isEmperorId(prev.person.id) ? prev.person.id : null
              }
              name={prev.person.name}
              honorific={displayReignHonorific(prev.person)}
              label="上一任"
              kinship={prev.kinship}
              modeLabel={prev.modeLabel}
              note={prev.link.note}
              align="left"
            />
          ) : (
            <p className="text-sm text-ink-400">开国 · 无上一任</p>
          )}
        </SideCard>

        <motion.div
          layout
          className="flex min-w-[9rem] flex-col items-center justify-center border border-cinnabar/30 bg-cinnabar/[0.06] px-3 py-3 text-center"
        >
          <p className="text-[10px] tracking-wider text-cinnabar">当前选中</p>
          <EmperorPortrait
            emperorId={emperorId}
            name={current.name}
            size="sm"
            className="mt-2 !h-[4.5rem] !w-[3.4rem]"
          />
          <p className="mt-2 font-display text-base font-bold text-ink-900">
            {displayReignHonorific(current)}
          </p>
          <p className="text-sm text-ink-600">{current.name}</p>
          <p className="mt-1 text-[10px] text-ink-400">
            {current.templeName}
            {current.throneOrder != null && ` · 第 ${current.throneOrder} 任`}
          </p>
          {current.reigns.length > 1 && (
            <p className="mt-1 text-[10px] text-cinnabar">一人双年号</p>
          )}
        </motion.div>

        <SideCard
          side="next"
          disabled={!next}
          onClick={() => next && onNavigate(next.person.id)}
        >
          {next ? (
            <PersonBlock
              emperorId={
                isEmperorId(next.person.id) ? next.person.id : null
              }
              name={next.person.name}
              honorific={displayReignHonorific(next.person)}
              label="下一任"
              kinship={next.kinship}
              modeLabel={next.modeLabel}
              note={next.link.note}
              align="right"
            />
          ) : (
            <p className="text-sm text-ink-400">明祚终结 · 无下一任</p>
          )}
        </SideCard>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-display text-xs text-ink-600">
        {prev && isEmperorId(prev.person.id) && (
          <button
            type="button"
            onClick={() => onNavigate(prev.person.id)}
            className="inline-flex items-center gap-1.5 border border-ink-800/10 bg-ink-50/80 px-2 py-1 transition-colors hover:border-cinnabar/30 hover:text-cinnabar"
          >
            <EmperorPortrait
              emperorId={prev.person.id}
              name={prev.person.name}
              size="sm"
              className="!h-7 !w-5"
            />
            {displayReignHonorific(prev.person)}
            <span className="text-[10px] text-ink-400">
              [{shortKinship(prev.kinship)}]
            </span>
          </button>
        )}
        <span className="text-ink-300">◄─────</span>
        <span className="inline-flex items-center gap-1.5 border border-cinnabar/25 bg-cinnabar/[0.07] px-2.5 py-1 font-bold text-cinnabar">
          <EmperorPortrait
            emperorId={emperorId}
            name={current.name}
            size="sm"
            className="!h-7 !w-5"
          />
          当前：{displayReignHonorific(current)}
        </span>
        <span className="text-ink-300">─────►</span>
        {next && isEmperorId(next.person.id) && (
          <button
            type="button"
            onClick={() => onNavigate(next.person.id)}
            className="inline-flex items-center gap-1.5 border border-ink-800/10 bg-ink-50/80 px-2 py-1 transition-colors hover:border-cinnabar/30 hover:text-cinnabar"
          >
            <EmperorPortrait
              emperorId={next.person.id}
              name={next.person.name}
              size="sm"
              className="!h-7 !w-5"
            />
            {displayReignHonorific(next.person)}
            <span className="text-[10px] text-ink-400">
              [{shortKinship(next.kinship)}]
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function PersonBlock({
  emperorId,
  name,
  honorific,
  label,
  kinship,
  modeLabel,
  note,
  align,
}: {
  emperorId: EmperorId | null;
  name: string;
  honorific: string;
  label: string;
  kinship: string;
  modeLabel: string;
  note?: string;
  align: "left" | "right";
}) {
  const row =
    align === "right"
      ? "flex flex-row-reverse items-start gap-2.5"
      : "flex items-start gap-2.5";

  return (
    <div className={row}>
      {emperorId && (
        <EmperorPortrait
          emperorId={emperorId}
          name={name}
          size="sm"
          className="!h-16 !w-12 shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-wider text-ink-400">{label}</p>
        <p className="mt-1 font-display text-sm font-bold text-ink-800">
          {honorific}
          <span className="ml-1 font-normal text-ink-500">（{name}）</span>
        </p>
        <dl className="mt-2 space-y-1 text-[11px]">
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-400">血缘关系</dt>
            <dd className="text-ink-700">{kinship}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-ink-400">继承方式</dt>
            <dd className="text-ink-700">{modeLabel}</dd>
          </div>
        </dl>
        {note && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-ink-400">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function shortKinship(k: string) {
  if (k.includes("堂兄")) return "堂兄";
  if (k.includes("嫡长")) return "父子";
  if (k.includes("第三子") || k.includes("长子") || k.includes("第五子"))
    return "父子";
  if (k.includes("弟")) return "兄弟";
  if (k.includes("叔侄")) return "叔侄";
  if (k.includes("太孙")) return "祖孙";
  return k.slice(0, 4);
}

function SideCard({
  children,
  side,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  side: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`border border-ink-800/10 bg-[rgba(251,249,243,0.55)] px-3 py-3 text-left transition-colors ${
        disabled
          ? "cursor-default opacity-60"
          : "hover:border-cinnabar/30 hover:bg-ink-50/80"
      } ${side === "next" ? "md:text-right" : ""}`}
    >
      {children}
    </button>
  );
}
