import type { EmperorId } from "@/data/emperors";

/**
 * 明代帝王画像（本地缓存自 Wikimedia Commons）。
 * 多数为台北故宫南薰殿帝后像系宫廷坐像的二维复刻（PD-Art / PD-old）。
 * 建文无南薰殿坐像，使用清人追绘；崇祯暂无可靠公开御容文件。
 */
export const EMPEROR_PORTRAITS: Partial<Record<EmperorId, string>> = {
  taizu: "/portraits/taizu.jpg",
  huizong: "/portraits/huizong.jpg",
  chengzu: "/portraits/chengzu.jpg",
  renzong: "/portraits/renzong.jpg",
  xuanzong: "/portraits/xuanzong.jpg",
  yingzong: "/portraits/yingzong.jpg",
  daizong: "/portraits/daizong.jpg",
  xianzong: "/portraits/xianzong.jpg",
  xiaozong: "/portraits/xiaozong.jpg",
  wuzong: "/portraits/wuzong.jpg",
  shizong: "/portraits/shizong.jpg",
  muzong: "/portraits/muzong.jpg",
  shenzong: "/portraits/shenzong.jpg",
  guangzong: "/portraits/guangzong.jpg",
  xizong: "/portraits/xizong.jpg",
};

/** 非南薰殿标准坐像（后世追绘） */
export const PORTRAIT_IS_LATER_COPY: Partial<Record<EmperorId, true>> = {
  huizong: true,
};

export function getEmperorPortraitSrc(
  emperorId: EmperorId | null | undefined
): string | null {
  if (!emperorId) return null;
  return EMPEROR_PORTRAITS[emperorId] ?? null;
}

export function isLaterCopyPortrait(emperorId: EmperorId): boolean {
  return PORTRAIT_IS_LATER_COPY[emperorId] === true;
}
