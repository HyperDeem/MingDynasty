"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { EmperorId } from "@/data/emperors";
import {
  getEmperorPortraitSrc,
  isLaterCopyPortrait,
} from "@/data/emperor-portraits";

interface EmperorPortraitProps {
  emperorId: EmperorId;
  /** 姓名首字，无画像时回退 */
  name: string;
  className?: string;
  size?: "sm" | "md";
  /** 点击后悬浮放大（简介等场景） */
  enlargeOnClick?: boolean;
}

/**
 * 帝王御容头像；优先南薰殿坐像面部区域，无公开画像时回退为首字
 */
export function EmperorPortrait({
  emperorId,
  name,
  className = "",
  size = "md",
  enlargeOnClick = false,
}: EmperorPortraitProps) {
  const src = getEmperorPortraitSrc(emperorId);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const later = isLaterCopyPortrait(emperorId);
  const box =
    size === "sm"
      ? "h-16 w-12"
      : "h-24 w-[4.5rem] md:h-[6.5rem] md:w-[5rem]";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 切换帝王时关闭放大层并重置加载失败态
  useEffect(() => {
    setOpen(false);
    setFailed(false);
  }, [emperorId]);

  // 半身/追绘偏中部构图；全幅坐像取上部脸面
  const objectPos = later ? "object-[50%_35%]" : "object-[50%_12%]";
  const canEnlarge = enlargeOnClick && Boolean(src) && !failed;

  const thumb = !src || failed ? (
    <div
      className={`flex shrink-0 flex-col items-center justify-center border border-ink-800/15 bg-gradient-to-b from-ink-100 to-ink-200/80 ${box} ${className}`}
      aria-hidden
    >
      <span className="font-display text-xl font-bold text-ink-700 md:text-2xl">
        {name.slice(0, 1)}
      </span>
      <span className="mt-0.5 text-[8px] tracking-widest text-ink-400">
        御像
      </span>
    </div>
  ) : (
    <div
      className={`relative shrink-0 overflow-hidden border border-ink-800/15 bg-ink-100 ${box} ${className} ${
        canEnlarge
          ? "cursor-zoom-in transition hover:border-cinnabar/40"
          : ""
      }`}
      title={
        canEnlarge
          ? `点击放大 · ${later ? `${name}（后世追绘示意）` : `${name}标准坐像`}`
          : later
            ? `${name}（后世追绘示意）`
            : `${name}标准坐像`
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={later ? `${name}追绘御容` : `${name}标准坐像`}
        className={`h-full w-full object-cover ${objectPos}`}
        onError={() => setFailed(true)}
      />
      {later && (
        <span className="pointer-events-none absolute bottom-0 inset-x-0 bg-ink-900/55 py-px text-center text-[8px] tracking-wider text-ink-50">
          追绘
        </span>
      )}
    </div>
  );

  return (
    <>
      {canEnlarge ? (
        <button
          type="button"
          className="shrink-0 appearance-none border-0 bg-transparent p-0 text-left"
          onClick={() => setOpen(true)}
          aria-label={`放大查看${name}御像`}
        >
          {thumb}
        </button>
      ) : (
        thumb
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && src && !failed && (
              <motion.div
                data-overlay-portal
                className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(48,42,28,0.55)] p-4 backdrop-blur-[3px] md:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label={`${name}御像放大`}
              >
                <motion.figure
                  className="relative max-h-[min(88vh,52rem)] max-w-[min(92vw,28rem)] overflow-hidden border border-ink-50/20 bg-ink-100 shadow-[0_24px_80px_-24px_rgba(20,16,10,0.65)]"
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={later ? `${name}追绘御容` : `${name}标准坐像`}
                    className="max-h-[min(82vh,48rem)] w-auto max-w-full object-contain"
                  />
                  {(later || name) && (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent px-4 pb-3 pt-8 text-center pointer-events-none">
                      <p className="font-display text-sm tracking-wider text-ink-50">
                        {name}
                        {later && (
                          <span className="ml-2 text-[11px] text-ink-200">
                            后世追绘
                          </span>
                        )}
                      </p>
                    </figcaption>
                  )}
                </motion.figure>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
