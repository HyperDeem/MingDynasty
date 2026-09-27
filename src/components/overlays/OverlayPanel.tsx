"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface OverlayPanelProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  /** 靠左或靠右 */
  side?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

/**
 * 地图舞台上的轻量浮层：Esc / 关闭按钮收起
 */
export function OverlayPanel({
  open,
  title,
  eyebrow,
  onClose,
  side = "right",
  children,
  className = "",
}: OverlayPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const fromX = side === "right" ? 28 : -28;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key={`overlay-${side}-${title}`}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          initial={{ opacity: 0, x: fromX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: fromX * 0.6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute bottom-3 top-3 z-30 flex w-[min(100%-1.5rem,26rem)] flex-col overflow-hidden rounded-md border border-ink-800/12 bg-[rgba(251,249,243,0.96)] shadow-[0_12px_40px_-16px_rgba(48,42,28,0.35)] backdrop-blur-md md:w-[min(42vw,28rem)] ${
            side === "right" ? "right-3" : "left-3"
          } ${className}`}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-800/10 px-4 py-3">
            <div className="min-w-0">
              {eyebrow && (
                <p className="font-display text-[10px] tracking-[0.28em] text-cinnabar">
                  {eyebrow}
                </p>
              )}
              <h2 className="mt-0.5 font-display text-lg font-bold text-ink-900">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 border border-ink-800/15 px-2.5 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
            >
              关闭
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-timeline">
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
