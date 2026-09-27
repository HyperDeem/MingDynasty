"use client";

import { useState } from "react";
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
}

/**
 * 帝王御容头像；优先南薰殿坐像面部区域，无公开画像时回退为首字
 */
export function EmperorPortrait({
  emperorId,
  name,
  className = "",
  size = "md",
}: EmperorPortraitProps) {
  const src = getEmperorPortraitSrc(emperorId);
  const [failed, setFailed] = useState(false);
  const later = isLaterCopyPortrait(emperorId);
  const box =
    size === "sm"
      ? "h-16 w-12"
      : "h-24 w-[4.5rem] md:h-[6.5rem] md:w-[5rem]";

  if (!src || failed) {
    return (
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
    );
  }

  // 半身/追绘偏中部构图；全幅坐像取上部脸面
  const objectPos = later ? "object-[50%_35%]" : "object-[50%_12%]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-ink-800/15 bg-ink-100 ${box} ${className}`}
      title={later ? `${name}（后世追绘示意）` : `${name}标准坐像`}
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
}
