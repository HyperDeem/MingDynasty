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
  /**
   * default：窄栏（世界事件）
   * wide：加宽半透明（帝王谱系等，可透见疆域）
   */
  size?: "default" | "wide";
  children: React.ReactNode;
  className?: string;
}

/**
 * 地图舞台上的轻量浮层：Esc / 关闭按钮收起；内容区撑满卡片高度
 */
export function OverlayPanel({
  open,
  title,
  eyebrow,
  onClose,
  side = "right",
  size = "default",
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

  const fromX = side === "right" ? 36 : -36;
  const wide = size === "wide";

  const sizeClass = wide
    ? // 明显透见疆域：低不透明度 + 适中模糊（过强 blur 会糊成不透）
      "w-[min(100%-1.25rem,34rem)] md:w-[min(54vw,40rem)] lg:w-[min(58vw,46rem)] bg-[rgba(251,249,243,0.48)] shadow-[0_16px_48px_-18px_rgba(48,42,28,0.28)] backdrop-blur-[6px]"
    : "w-[min(100%-1.5rem,26rem)] md:w-[min(44vw,30rem)] lg:w-[min(40vw,32rem)] bg-[rgba(251,249,243,0.94)] shadow-[0_12px_40px_-16px_rgba(48,42,28,0.35)] backdrop-blur-md";

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key={`overlay-${side}-${size}-${title}`}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          initial={{ opacity: 0, x: fromX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: fromX * 0.55 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto absolute bottom-3 top-3 z-30 flex flex-col overflow-hidden rounded-md border border-ink-800/10 ${sizeClass} ${
            side === "right" ? "right-3" : "left-3"
          } ${className}`}
        >
          <header
            className={`flex shrink-0 items-start justify-between gap-3 border-b border-ink-800/10 bg-[rgba(251,249,243,0.28)] px-3 py-2.5 md:px-4 md:py-3 ${
              wide ? "md:px-5" : ""
            }`}
          >
            <div className="min-w-0">
              {eyebrow && (
                <p className="font-display text-[10px] tracking-[0.28em] text-cinnabar md:tracking-[0.32em]">
                  {eyebrow}
                </p>
              )}
              <h2 className="mt-0.5 font-display text-base font-bold text-ink-900 md:text-lg lg:text-xl">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 border border-ink-800/15 bg-[rgba(251,249,243,0.55)] px-2.5 py-1 text-[11px] text-ink-600 transition hover:border-cinnabar/40 hover:text-cinnabar"
            >
              关闭
            </button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
