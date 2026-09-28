"use client";

import { motion } from "framer-motion";
import {
  displayReignHonorific,
  getEmperorPerson,
  getInheritanceComparison,
  type LineageNodeId,
} from "@/data/lineage";
import type { EmperorId } from "@/data/emperors";

interface InheritanceBarProps {
  emperorId: EmperorId;
  onNavigate: (id: LineageNodeId) => void;
}

export function InheritanceBar({ emperorId, onNavigate }: InheritanceBarProps) {
  const current = getEmperorPerson(emperorId);
  const { prev, next } = getInheritanceComparison(emperorId);

  return (
    <div className="border-t border-ink-800/10 bg-ink-100/50 px-4 py-3 md:px-6">
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
            <>
              <p className="text-[10px] tracking-wider text-ink-400">
                ⬅️ 上一任
              </p>
              <p className="mt-1 font-display text-sm font-bold text-ink-800">
                {displayReignHonorific(prev.person)}
                <span className="ml-1 font-normal text-ink-500">
                  （{prev.person.name}）
                </span>
              </p>
              <dl className="mt-2 space-y-1 text-[11px]">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-400">血缘关系</dt>
                  <dd className="text-ink-700">{prev.kinship}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-400">继承方式</dt>
                  <dd className="text-ink-700">{prev.modeLabel}</dd>
                </div>
              </dl>
              {prev.link.note && (
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink-400">
                  {prev.link.note}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-400">开国 · 无上一任</p>
          )}
        </SideCard>

        <motion.div
          layout
          className="flex min-w-[9rem] flex-col items-center justify-center border border-cinnabar/30 bg-cinnabar/[0.06] px-4 py-3 text-center"
        >
          <p className="text-[10px] tracking-wider text-cinnabar">当前选中</p>
          <p className="mt-1 font-display text-lg font-bold text-ink-900">
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
            <>
              <p className="text-[10px] tracking-wider text-ink-400">
                下一任 ➡️
              </p>
              <p className="mt-1 font-display text-sm font-bold text-ink-800">
                {displayReignHonorific(next.person)}
                <span className="ml-1 font-normal text-ink-500">
                  （{next.person.name}）
                </span>
              </p>
              <dl className="mt-2 space-y-1 text-[11px]">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-400">血缘关系</dt>
                  <dd className="text-ink-700">{next.kinship}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-ink-400">继承方式</dt>
                  <dd className="text-ink-700">{next.modeLabel}</dd>
                </div>
              </dl>
              {next.link.note && (
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink-400">
                  {next.link.note}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-400">明祚终结 · 无下一任</p>
          )}
        </SideCard>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 font-display text-xs text-ink-600">
        {prev && (
          <button
            type="button"
            onClick={() => onNavigate(prev.person.id)}
            className="border border-ink-800/10 bg-ink-50/80 px-2 py-1 transition-colors hover:border-cinnabar/30 hover:text-cinnabar"
          >
            {displayReignHonorific(prev.person)}
            <span className="ml-1 text-[10px] text-ink-400">
              [{shortKinship(prev.kinship)}]
            </span>
          </button>
        )}
        <span className="text-ink-300">◄─────</span>
        <span className="border border-cinnabar/25 bg-cinnabar/[0.07] px-2.5 py-1 font-bold text-cinnabar">
          当前：{displayReignHonorific(current)}
        </span>
        <span className="text-ink-300">─────►</span>
        {next && (
          <button
            type="button"
            onClick={() => onNavigate(next.person.id)}
            className="border border-ink-800/10 bg-ink-50/80 px-2 py-1 transition-colors hover:border-cinnabar/30 hover:text-cinnabar"
          >
            {displayReignHonorific(next.person)}
            <span className="ml-1 text-[10px] text-ink-400">
              [{shortKinship(next.kinship)}]
            </span>
          </button>
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
      className={`border border-ink-800/10 bg-ink-50/70 px-3 py-3 text-left transition-colors ${
        disabled
          ? "cursor-default opacity-60"
          : "hover:border-cinnabar/30 hover:bg-ink-50"
      } ${side === "next" ? "md:text-right" : ""}`}
    >
      {children}
    </button>
  );
}
