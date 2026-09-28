"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EmperorId } from "@/data/emperors";
import {
  getDefaultPeriodForEmperor,
  isEmperorId,
  type LineageNodeId,
} from "@/data/lineage";
import { getPeriodContent } from "@/data/ming-dynasty";
import { OverlayPanel } from "@/components/overlays/OverlayPanel";
import {
  GenealogyFullscreen,
  GenealogyGraph,
} from "@/components/genealogy/GenealogyGraph";
import { InheritanceBar } from "@/components/genealogy/InheritanceBar";
import { SuccessionChain } from "@/components/genealogy/SuccessionChain";
import { EmperorArchiveCard } from "@/components/genealogy/EmperorArchiveCard";
import { EmperorPortrait } from "@/components/EmperorPortrait";

type EmpTab = "bio" | "lineage" | "archive";

const TABS: { id: EmpTab; label: string }[] = [
  { id: "bio", label: "简介" },
  { id: "lineage", label: "血缘" },
  { id: "archive", label: "档案" },
];

interface EmperorDrawerProps {
  emperorId: EmperorId | null;
  onClose: () => void;
  onSelectEmperor: (id: EmperorId) => void;
}

export function EmperorDrawer({
  emperorId,
  onClose,
  onSelectEmperor,
}: EmperorDrawerProps) {
  const [tab, setTab] = useState<EmpTab>("bio");
  const [focusId, setFocusId] = useState<LineageNodeId | null>(emperorId);
  const [panoramaOpen, setPanoramaOpen] = useState(false);

  useEffect(() => {
    if (emperorId) {
      setFocusId(emperorId);
      setTab("bio");
      setPanoramaOpen(false);
    } else {
      setPanoramaOpen(false);
    }
  }, [emperorId]);

  const handleSelectNode = useCallback(
    (id: LineageNodeId) => {
      setFocusId(id);
      if (isEmperorId(id)) onSelectEmperor(id);
    },
    [onSelectEmperor]
  );

  const activeEmperor: EmperorId | null =
    focusId && isEmperorId(focusId) ? focusId : emperorId;

  const periodId = activeEmperor
    ? getDefaultPeriodForEmperor(activeEmperor)
    : null;
  const content = periodId ? getPeriodContent(periodId) : null;
  const emperor = content?.emperor;

  return (
    <>
      <OverlayPanel
        open={emperorId != null}
        eyebrow="帝王"
        title={emperor?.templeName ?? emperor?.name ?? "帝王"}
        onClose={onClose}
        side="right"
      >
        {activeEmperor && emperor && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 gap-1 border-b border-ink-800/10 px-2 py-1.5 md:px-3 md:py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-sm px-1.5 py-1.5 font-display text-[11px] transition md:px-2.5 md:text-xs ${
                    tab === t.id
                      ? "bg-ink-800/90 text-ink-50"
                      : "text-ink-500 hover:bg-ink-800/[0.06] hover:text-ink-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeEmperor}-${tab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {tab === "bio" && (
                  <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5">
                    <div className="flex shrink-0 gap-3 md:gap-4">
                      <EmperorPortrait
                        emperorId={activeEmperor}
                        name={emperor.name}
                        enlargeOnClick
                        className="!h-28 !w-[5.25rem] md:!h-32 md:!w-24 lg:!h-36 lg:!w-[6.5rem]"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <h3 className="font-display text-lg font-bold tracking-wide text-ink-900 md:text-xl md:tracking-wider lg:text-2xl">
                          {emperor.name}
                        </h3>
                        <p className="mt-1 text-xs tracking-wide text-ink-500 md:mt-1.5 md:text-sm md:tracking-wider">
                          {emperor.templeName}
                          <span className="mx-1.5 text-ink-300">·</span>
                          年号 {emperor.reignTitle}
                        </p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-ink-500 md:mt-3 md:gap-y-2 md:text-xs">
                          <div>
                            <dt className="tracking-wider text-ink-400">
                              生卒
                            </dt>
                            <dd className="mt-0.5 tabular-nums tracking-wide text-ink-700">
                              {emperor.lifespan}
                            </dd>
                          </div>
                          <div>
                            <dt className="tracking-wider text-ink-400">
                              在位
                            </dt>
                            <dd className="mt-0.5 tabular-nums tracking-wide text-ink-700">
                              {emperor.reignYears}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <p className="mt-4 min-h-0 flex-1 overflow-y-auto text-[13px] leading-[1.9] tracking-wide text-ink-600 scrollbar-timeline md:mt-5 md:text-sm md:leading-[2.05] md:tracking-[0.04em] lg:mt-6 lg:text-[15px] lg:leading-[2.2] lg:tracking-[0.055em]">
                      {emperor.summary}
                    </p>
                  </div>
                )}

                {tab === "lineage" && focusId && (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <GenealogyGraph
                      focusId={focusId}
                      onSelect={handleSelectNode}
                      mode="ego"
                      onRequestFullscreen={() => setPanoramaOpen(true)}
                      className="min-h-0 flex-1"
                    />
                  </div>
                )}

                {tab === "archive" && (
                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-timeline">
                    {/* 身份档案 → 承袭链导航 → 前后任继承对比 */}
                    <EmperorArchiveCard emperorId={activeEmperor} />
                    <SuccessionChain
                      activeId={activeEmperor}
                      onSelect={(id) => handleSelectNode(id)}
                    />
                    <InheritanceBar
                      emperorId={activeEmperor}
                      onNavigate={handleSelectNode}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </OverlayPanel>

      {focusId && (
        <GenealogyFullscreen
          open={panoramaOpen}
          focusId={focusId}
          onSelect={handleSelectNode}
          onClose={() => setPanoramaOpen(false)}
        />
      )}
    </>
  );
}
