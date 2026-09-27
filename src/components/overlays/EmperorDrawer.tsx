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

type EmpTab = "bio" | "lineage" | "succession" | "archive";

const TABS: { id: EmpTab; label: string }[] = [
  { id: "bio", label: "简介" },
  { id: "lineage", label: "血缘" },
  { id: "succession", label: "继承" },
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
          <>
            <div className="flex gap-1 border-b border-ink-800/10 px-3 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-sm px-2.5 py-1 font-display text-[11px] transition ${
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="min-h-0"
              >
                {tab === "bio" && (
                  <div className="px-4 py-4">
                    <div className="flex gap-3">
                      <div
                        className="flex h-20 w-16 shrink-0 flex-col items-center justify-center border border-ink-800/15 bg-gradient-to-b from-ink-100 to-ink-200/80"
                        aria-hidden
                      >
                        <span className="font-display text-xl font-bold text-ink-700">
                          {emperor.name.slice(0, 1)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold text-ink-900">
                          {emperor.name}
                        </h3>
                        <p className="mt-1 text-sm text-ink-500">
                          {emperor.templeName}
                          <span className="mx-1.5 text-ink-300">·</span>
                          年号 {emperor.reignTitle}
                        </p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-500">
                          <div>
                            <dt className="text-ink-400">生卒</dt>
                            <dd className="tabular-nums text-ink-700">
                              {emperor.lifespan}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-ink-400">在位</dt>
                            <dd className="tabular-nums text-ink-700">
                              {emperor.reignYears}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-600">
                      {emperor.summary}
                    </p>
                  </div>
                )}

                {tab === "lineage" && focusId && (
                  <div className="flex h-[min(56vh,460px)] flex-col border-b border-ink-800/10">
                    <GenealogyGraph
                      focusId={focusId}
                      onSelect={handleSelectNode}
                      mode="ego"
                      onRequestFullscreen={() => setPanoramaOpen(true)}
                    />
                  </div>
                )}

                {tab === "succession" && (
                  <div>
                    <InheritanceBar
                      emperorId={activeEmperor}
                      onNavigate={handleSelectNode}
                    />
                    <SuccessionChain
                      activeId={activeEmperor}
                      onSelect={(id) => handleSelectNode(id)}
                    />
                  </div>
                )}

                {tab === "archive" && (
                  <EmperorArchiveCard emperorId={activeEmperor} />
                )}
              </motion.div>
            </AnimatePresence>
          </>
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
