"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EmperorId } from "@/data/emperors";
import {
  getDefaultPeriodForEmperor,
  getEmperorPerson,
  getSuccessionNeighbors,
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
type ArchiveSection = "card" | "chain" | "inherit";

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
  const [archiveOpen, setArchiveOpen] = useState<ArchiveSection | null>(
    "card"
  );
  /** 血缘页一旦打开过则保持挂载，避免反复进出会重绘抽搐 */
  const [lineageMounted, setLineageMounted] = useState(false);
  /** 仅从关闭→打开时重置到简介；血缘内切换帝王不切页签 */
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (emperorId) {
      setFocusId(emperorId);
      if (!wasOpenRef.current) {
        setTab("bio");
        setPanoramaOpen(false);
        setArchiveOpen("card");
        setLineageMounted(false);
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
      setPanoramaOpen(false);
      setLineageMounted(false);
    }
  }, [emperorId]);

  useEffect(() => {
    if (tab === "lineage") setLineageMounted(true);
  }, [tab]);

  const handleSelectNode = useCallback(
    (id: LineageNodeId) => {
      setFocusId(id);
      if (isEmperorId(id)) onSelectEmperor(id);
    },
    [onSelectEmperor]
  );

  const toggleArchive = useCallback((id: ArchiveSection) => {
    setArchiveOpen((prev) => (prev === id ? null : id));
  }, []);

  const activeEmperor: EmperorId | null =
    focusId && isEmperorId(focusId) ? focusId : emperorId;

  const neighbors = useMemo(
    () => (activeEmperor ? getSuccessionNeighbors(activeEmperor) : null),
    [activeEmperor]
  );
  const prevEmperor = neighbors?.prev
    ? getEmperorPerson(neighbors.prev.emperorId)
    : null;
  const nextEmperor = neighbors?.next
    ? getEmperorPerson(neighbors.next.emperorId)
    : null;
  const archivePerson = activeEmperor
    ? getEmperorPerson(activeEmperor)
    : null;

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
        size="wide"
      >
        {activeEmperor && emperor && archivePerson && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="museum-emp-tabs flex shrink-0 gap-1 border-b border-ink-800/10 bg-[rgba(251,249,243,0.25)] px-2 py-1.5 md:px-3 md:py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-sm px-1.5 py-1.5 font-display text-[11px] transition md:px-2.5 md:text-xs ${
                    tab === t.id
                      ? "museum-emp-tab-active bg-ink-800/85 text-ink-50"
                      : "museum-emp-tab bg-[rgba(251,249,243,0.35)] text-ink-500 hover:bg-ink-800/[0.08] hover:text-ink-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 页签用显隐而非 AnimatePresence：半透明浮窗上 opacity 进出会透出地图造成闪烁 */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={`flex min-h-0 flex-1 flex-col ${
                  tab === "bio" ? "" : "hidden"
                }`}
                aria-hidden={tab !== "bio"}
              >
                  <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5">
                      <div className="flex shrink-0 gap-3 md:gap-4">
                        <EmperorPortrait
                          emperorId={activeEmperor}
                          name={emperor.name}
                          enlargeOnClick
                          className="!h-28 !w-[5.25rem] md:!h-32 md:!w-24 lg:!h-36 lg:!w-[6.5rem]"
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <h3 className="museum-emp-title font-serif text-lg font-bold tracking-wide text-ink-900 md:text-xl md:tracking-wider lg:text-2xl">
                            {emperor.name}
                          </h3>
                          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] md:mt-3 md:gap-y-2 md:text-xs">
                            <div>
                              <dt className="museum-emp-dt font-mono tracking-wider text-ink-400">
                                生卒
                              </dt>
                              <dd className="museum-emp-dd mt-0.5 font-mono tabular-nums tracking-wide text-ink-700">
                                {emperor.lifespan}
                              </dd>
                            </div>
                            <div>
                              <dt className="museum-emp-dt font-mono tracking-wider text-ink-400">
                                在位
                              </dt>
                              <dd className="museum-emp-dd mt-0.5 font-mono tabular-nums tracking-wide text-ink-700">
                                {emperor.reignYears}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      <p className="museum-emp-body mt-4 min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed tracking-wide text-ink-600 scrollbar-timeline md:mt-5 md:tracking-[0.04em] lg:mt-6 lg:text-[15px] lg:leading-relaxed lg:tracking-[0.055em]">
                        {emperor.summary}
                      </p>
                    </div>

                    <div className="museum-emp-nav flex shrink-0 items-stretch gap-2 border-t border-ink-800/10 px-2 py-2 md:px-3">
                      <button
                        type="button"
                        disabled={!neighbors?.prev}
                        onClick={() =>
                          neighbors?.prev &&
                          onSelectEmperor(neighbors.prev.emperorId)
                        }
                        className="museum-emp-nav-btn flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-ink-800/12 bg-ink-50/80 px-2.5 py-2 text-left transition enabled:hover:border-cinnabar/35 enabled:hover:text-cinnabar disabled:cursor-default disabled:opacity-35"
                        aria-label={
                          prevEmperor
                            ? `上一任 ${prevEmperor.templeName ?? prevEmperor.name}`
                            : "已无上一任"
                        }
                      >
                        <span className="museum-emp-muted shrink-0 font-display text-base text-ink-400">
                          ←
                        </span>
                        <span className="min-w-0">
                          <span className="museum-emp-dt block text-[9px] tracking-wider text-ink-400">
                            上一任
                          </span>
                          <span className="museum-emp-nav-name block truncate font-display text-[12px] font-semibold text-ink-800 md:text-[13px]">
                            {prevEmperor
                              ? prevEmperor.reigns[0]?.title ??
                                prevEmperor.templeName ??
                                prevEmperor.name
                              : "开国"}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={!neighbors?.next}
                        onClick={() =>
                          neighbors?.next &&
                          onSelectEmperor(neighbors.next.emperorId)
                        }
                        className="museum-emp-nav-btn flex min-w-0 flex-1 items-center justify-end gap-2 rounded-sm border border-ink-800/12 bg-ink-50/80 px-2.5 py-2 text-right transition enabled:hover:border-cinnabar/35 enabled:hover:text-cinnabar disabled:cursor-default disabled:opacity-35"
                        aria-label={
                          nextEmperor
                            ? `下一任 ${nextEmperor.templeName ?? nextEmperor.name}`
                            : "已无下一任"
                        }
                      >
                        <span className="min-w-0">
                          <span className="museum-emp-dt block text-[9px] tracking-wider text-ink-400">
                            下一任
                          </span>
                          <span className="museum-emp-nav-name block truncate font-display text-[12px] font-semibold text-ink-800 md:text-[13px]">
                            {nextEmperor
                              ? nextEmperor.reigns[0]?.title ??
                                nextEmperor.templeName ??
                                nextEmperor.name
                              : "终祚"}
                          </span>
                        </span>
                        <span className="museum-emp-muted shrink-0 font-display text-base text-ink-400">
                          →
                        </span>
                      </button>
                    </div>
              </div>

              {lineageMounted && focusId && (
                <div
                  className={`min-h-0 flex-1 flex-col ${
                    tab === "lineage" ? "flex" : "hidden"
                  }`}
                  aria-hidden={tab !== "lineage"}
                >
                  <GenealogyGraph
                    focusId={focusId}
                    onSelect={handleSelectNode}
                    mode="ego"
                    onRequestFullscreen={() => setPanoramaOpen(true)}
                    className="min-h-0 flex-1"
                  />
                </div>
              )}

              <div
                className={`min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-timeline md:p-3 ${
                  tab === "archive" ? "flex" : "hidden"
                }`}
                aria-hidden={tab !== "archive"}
              >
                    <ArchiveThumb
                      eyebrow="身份档"
                      title={archivePerson.name}
                      open={archiveOpen === "card"}
                      onToggle={() => toggleArchive("card")}
                      thumb={
                        <EmperorPortrait
                          emperorId={activeEmperor}
                          name={archivePerson.name}
                          size="sm"
                          className="!h-10 !w-8"
                        />
                      }
                    >
                      <EmperorArchiveCard emperorId={activeEmperor} />
                    </ArchiveThumb>

                    <ArchiveThumb
                      eyebrow="承袭链"
                      title="明朝十六帝"
                      open={archiveOpen === "chain"}
                      onToggle={() => toggleArchive("chain")}
                    >
                      <SuccessionChain
                        activeId={activeEmperor}
                        onSelect={(id) => handleSelectNode(id)}
                      />
                    </ArchiveThumb>

                    <ArchiveThumb
                      eyebrow="继承"
                      title="前后任对比"
                      open={archiveOpen === "inherit"}
                      onToggle={() => toggleArchive("inherit")}
                    >
                      <InheritanceBar
                        emperorId={activeEmperor}
                        onNavigate={handleSelectNode}
                      />
                    </ArchiveThumb>
              </div>
            </div>
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

function ArchiveThumb({
  eyebrow,
  title,
  open,
  onToggle,
  thumb,
  children,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  thumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="museum-emp-archive overflow-hidden rounded-sm border border-ink-800/12 bg-[rgba(251,249,243,0.4)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-ink-800/[0.04] md:px-3.5"
      >
        {thumb ?? (
          <span className="museum-emp-card flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-ink-800/10 bg-[rgba(251,249,243,0.55)]">
            <span className="font-display text-[9px] tracking-wider text-cinnabar">
              {eyebrow.slice(0, 2)}
            </span>
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="museum-emp-dt block font-display text-[10px] tracking-[0.22em] text-ink-400">
            {eyebrow}
          </span>
          <span className="museum-emp-title mt-0.5 block truncate font-serif text-sm font-semibold text-ink-900">
            {title}
          </span>
        </span>
        <span
          className={`museum-emp-muted museum-emp-dt shrink-0 font-display text-xs text-ink-400 transition ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden
        >
          ›
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="museum-glass-rule overflow-hidden border-t border-ink-800/10"
          >
            <div className="min-h-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
