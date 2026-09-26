"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EmperorId } from "@/data/emperors";
import { isEmperorId, type LineageNodeId } from "@/data/lineage";
import { GenealogyGraph } from "@/components/genealogy/GenealogyGraph";
import { InheritanceBar } from "@/components/genealogy/InheritanceBar";
import { SuccessionChain } from "@/components/genealogy/SuccessionChain";
import { EmperorArchiveCard } from "@/components/genealogy/EmperorArchiveCard";

interface GenealogyPanelProps {
  emperorId: EmperorId;
  onSelectEmperor: (id: EmperorId) => void;
  onClose: () => void;
}

export function GenealogyPanel({
  emperorId,
  onSelectEmperor,
  onClose,
}: GenealogyPanelProps) {
  const [focusId, setFocusId] = useState<LineageNodeId>(emperorId);

  useEffect(() => {
    setFocusId(emperorId);
  }, [emperorId]);

  const handleSelectNode = useCallback(
    (id: LineageNodeId) => {
      setFocusId(id);
      if (isEmperorId(id)) {
        onSelectEmperor(id);
      }
    },
    [onSelectEmperor]
  );

  const activeEmperor: EmperorId = isEmperorId(focusId) ? focusId : emperorId;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-800/10 px-4 py-3 md:px-6">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900 md:text-xl">
            帝王谱系
          </h2>
          <p className="text-xs text-ink-500">
            上方血缘树 · 下方档案卡与继承对比 · 帝位链可跳转
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-ink-800/15 px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-cinnabar/40 hover:text-cinnabar"
        >
          关闭谱系
        </button>
      </div>

      <div className="min-h-[40vh] flex-1 border-b border-ink-800/10 md:min-h-0">
        <GenealogyGraph focusId={focusId} onSelect={handleSelectNode} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeEmperor}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="max-h-[50vh] shrink-0 overflow-y-auto scrollbar-timeline md:max-h-[48%]"
        >
          <InheritanceBar
            emperorId={activeEmperor}
            onNavigate={handleSelectNode}
          />
          <EmperorArchiveCard emperorId={activeEmperor} />
          <SuccessionChain
            activeId={activeEmperor}
            onSelect={(id) => handleSelectNode(id)}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
