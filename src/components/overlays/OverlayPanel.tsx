"use client";

import { useEffect, useRef } from "react";
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

const CLICK_MOVE_PX = 8;

function hitInsidePanel(panel: HTMLElement, x: number, y: number): boolean {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    // 全景 / 画像放大等门户层：不据此关闭帝王浮窗
    if (el.closest("[data-overlay-portal]")) return true;
    if (panel.contains(el)) return true;
  }
  return false;
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
  const panelRef = useRef<HTMLElement>(null);
  const outsideDownRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /**
   * 点浮窗外关闭；拖地图（位移超阈值）不关闭。
   * 用坐标 + elementsFromPoint，避免血缘树 setPointerCapture 改写 event.target
   * 后被误判为「点在面板内」。
   */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (hitInsidePanel(panel, e.clientX, e.clientY)) {
        outsideDownRef.current = null;
        return;
      }
      outsideDownRef.current = {
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
        moved: false,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const down = outsideDownRef.current;
      if (!down || down.pointerId !== e.pointerId || down.moved) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_MOVE_PX) {
        down.moved = true;
      }
    };

    const finish = (e: PointerEvent) => {
      const down = outsideDownRef.current;
      if (!down || down.pointerId !== e.pointerId) return;
      outsideDownRef.current = null;
      if (down.moved) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (hitInsidePanel(panel, e.clientX, e.clientY)) return;
      onClose();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", finish, true);
    document.addEventListener("pointercancel", finish, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", finish, true);
      document.removeEventListener("pointercancel", finish, true);
      outsideDownRef.current = null;
    };
  }, [open, onClose]);

  const fromX = side === "right" ? 36 : -36;
  const wide = size === "wide";

  const sizeClass = wide
    ? "museum-panel w-[min(100%-1.25rem,34rem)] md:w-[min(54vw,40rem)] lg:w-[min(58vw,46rem)] bg-[rgba(251,249,243,0.48)] shadow-[0_16px_48px_-18px_rgba(48,42,28,0.28)] backdrop-blur-[6px] transition-colors duration-700"
    : "museum-panel w-[min(100%-1.5rem,26rem)] md:w-[min(44vw,30rem)] lg:w-[min(40vw,32rem)] bg-[rgba(251,249,243,0.94)] shadow-[0_12px_40px_-16px_rgba(48,42,28,0.35)] backdrop-blur-md transition-colors duration-700";

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          ref={panelRef}
          key={`overlay-${side}-${size}`}
          role="dialog"
          aria-modal="false"
          aria-label={title}
          initial={{ opacity: 0, x: fromX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: fromX * 0.55 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto absolute bottom-3 top-3 z-50 flex flex-col overflow-hidden rounded-md border border-ink-800/10 ${sizeClass} ${
            side === "right" ? "right-3" : "left-3"
          } ${className}`}
        >
          <header
            data-museum-chrome
            className={`flex shrink-0 items-start justify-between gap-3 border-b border-ink-800/10 bg-[rgba(251,249,243,0.28)] px-3 py-2.5 transition-colors duration-700 md:px-4 md:py-3 ${
              wide ? "md:px-5" : ""
            }`}
          >
            <div className="min-w-0">
              {eyebrow && (
                <p className="museum-glass-accent font-display text-[10px] tracking-[0.28em] text-cinnabar md:tracking-[0.32em]">
                  {eyebrow}
                </p>
              )}
              <h2 className="museum-glass-text mt-0.5 font-display text-base font-bold text-ink-900 md:text-lg lg:text-xl">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="museum-ctrl shrink-0 border border-ink-800/15 bg-[rgba(251,249,243,0.55)] px-2.5 py-1 text-[11px] text-ink-600 transition duration-700 hover:border-cinnabar/40 hover:text-cinnabar"
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
