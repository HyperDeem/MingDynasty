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
    <div className="flex min-h-[18rem] flex-col bg-[rgba(243,239,228,0.28)] px-3 py-4 md:min-h-[22rem] md:px-5 md:py-5">
      <p className="mb-3 text-center font-display text-[10px] tracking-[0.28em] text-ink-400">
        继承逻辑
      </p>

      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_minmax(7.5rem,0.85fr)_1fr] md:gap-4">
        <SideCard
          side="prev"
          disabled={!prev}
          onClick={() => prev && onNavigate(prev.person.id)}
        >
          {prev ? (
            <NeighborBlock
              emperorId={
                isEmperorId(prev.person.id) ? prev.person.id : null
              }
              name={prev.person.name}
              honorific={displayReignHonorific(prev.person)}
              label="上一任"
              kinship={prev.kinship}
              modeLabel={prev.modeLabel}
            />
          ) : (
            <EmptySlot label="上一任" hint="开国 · 无上一任" />
          )}
        </SideCard>

        <motion.div
          layout
          className="flex flex-col items-center justify-center border border-cinnabar/35 bg-cinnabar/[0.07] px-3 py-4 text-center md:py-5"
        >
          <p className="font-display text-[10px] tracking-[0.22em] text-cinnabar">
            当前
          </p>
          <EmperorPortrait
            emperorId={emperorId}
            name={current.name}
            size="sm"
            className="mt-3 !h-[5.5rem] !w-[4.1rem] md:!h-[6.5rem] md:!w-[4.85rem]"
          />
          <p className="mt-3 font-display text-lg font-bold tracking-wide text-ink-900 md:text-xl">
            {displayReignHonorific(current)}
          </p>
          {current.throneOrder != null && (
            <p className="mt-1 text-[11px] text-ink-400">
              第 {current.throneOrder} 任
            </p>
          )}
        </motion.div>

        <SideCard
          side="next"
          disabled={!next}
          onClick={() => next && onNavigate(next.person.id)}
        >
          {next ? (
            <NeighborBlock
              emperorId={
                isEmperorId(next.person.id) ? next.person.id : null
              }
              name={next.person.name}
              honorific={displayReignHonorific(next.person)}
              label="下一任"
              kinship={next.kinship}
              modeLabel={next.modeLabel}
            />
          ) : (
            <EmptySlot label="下一任" hint="明祚终结 · 无下一任" />
          )}
        </SideCard>
      </div>
    </div>
  );
}

function NeighborBlock({
  emperorId,
  name,
  honorific,
  label,
  kinship,
  modeLabel,
}: {
  emperorId: EmperorId | null;
  name: string;
  honorific: string;
  label: string;
  kinship: string;
  modeLabel: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-1 py-1 text-center">
      <p className="font-display text-[10px] tracking-[0.2em] text-ink-400">
        {label}
      </p>
      {emperorId && (
        <EmperorPortrait
          emperorId={emperorId}
          name={name}
          size="sm"
          className="!h-[5.25rem] !w-[3.9rem] md:!h-[6.25rem] md:!w-[4.65rem]"
        />
      )}
      <p className="font-display text-base font-bold tracking-wide text-ink-900 md:text-lg">
        {honorific}
      </p>
      <dl className="mt-0.5 w-full max-w-[11rem] space-y-2 text-left text-[12px] md:text-[13px]">
        <div className="flex items-baseline justify-between gap-3 border-b border-ink-800/8 pb-1.5">
          <dt className="shrink-0 text-[10px] tracking-wider text-ink-400">
            血缘
          </dt>
          <dd className="text-right font-medium text-ink-800">{kinship}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-[10px] tracking-wider text-ink-400">
            继承
          </dt>
          <dd className="text-right font-medium text-ink-800">{modeLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

function EmptySlot({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
      <p className="font-display text-[10px] tracking-[0.2em] text-ink-400">
        {label}
      </p>
      <p className="text-sm text-ink-400">{hint}</p>
    </div>
  );
}

function SideCard({
  children,
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
      className={`min-h-[14rem] border border-ink-800/10 bg-[rgba(251,249,243,0.55)] px-3 py-4 transition-colors md:min-h-0 md:py-5 ${
        disabled
          ? "cursor-default opacity-55"
          : "hover:border-cinnabar/35 hover:bg-ink-50/75"
      }`}
    >
      {children}
    </button>
  );
}
