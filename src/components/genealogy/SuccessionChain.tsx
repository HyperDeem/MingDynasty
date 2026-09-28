"use client";

import { useEffect, useRef } from "react";
import {
  SUCCESSION_CHAIN,
  getEmperorPerson,
} from "@/data/lineage";
import type { EmperorId } from "@/data/emperors";

interface SuccessionChainProps {
  activeId: EmperorId;
  onSelect: (id: EmperorId) => void;
}

export function SuccessionChain({ activeId, onSelect }: SuccessionChainProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const item = activeRef.current;
    if (!list || !item) return;
    const target =
      item.offsetLeft - list.clientWidth / 2 + item.offsetWidth / 2;
    list.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [activeId]);

  return (
    <div className="border-t border-ink-800/10 px-4 py-3 md:px-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-display text-[10px] tracking-[0.25em] text-ink-400">
          帝位承袭链
        </p>
        <p className="text-[10px] text-ink-400">明朝十六帝</p>
      </div>

      <ol
        ref={listRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-timeline"
      >
        {SUCCESSION_CHAIN.map((step) => {
          const person = getEmperorPerson(step.emperorId);
          const active = step.emperorId === activeId;
          const reignLabel = person.reigns[0]?.title ?? "";
          return (
            <li
              key={step.order}
              ref={active ? activeRef : undefined}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => onSelect(step.emperorId)}
                className={`flex min-w-[4.5rem] flex-col items-center border px-2 py-2 transition-colors ${
                  active
                    ? "border-cinnabar/40 bg-cinnabar/[0.08]"
                    : "border-ink-800/10 bg-ink-50/60 hover:border-ink-800/25"
                }`}
              >
                <span className="text-[9px] tabular-nums text-ink-400">
                  {step.orderLabel}
                </span>
                <span
                  className={`mt-0.5 font-display text-xs font-bold ${
                    active ? "text-cinnabar" : "text-ink-800"
                  }`}
                >
                  {reignLabel}
                </span>
                <span className="mt-0.5 max-w-[4.2rem] truncate text-[9px] text-ink-500">
                  {person.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
