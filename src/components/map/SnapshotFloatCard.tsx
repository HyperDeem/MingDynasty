"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import type { CapitalMarker } from "@/data/ming-map-layers";

const EDGE_PAD = 14;
const BUBBLE = 56;
const SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.85 };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** 将矩形吸附到容器最近边（保持另一轴，必要时夹紧） */
function snapToEdge(
  x: number,
  y: number,
  sizeW: number,
  sizeH: number,
  cw: number,
  ch: number
): { x: number; y: number } {
  const maxX = Math.max(EDGE_PAD, cw - sizeW - EDGE_PAD);
  const maxY = Math.max(EDGE_PAD, ch - sizeH - EDGE_PAD);
  const cx = x + sizeW / 2;
  const cy = y + sizeH / 2;

  const distL = cx;
  const distR = cw - cx;
  const distT = cy;
  const distB = ch - cy;
  const nearest = Math.min(distL, distR, distT, distB);

  let nx = clamp(x, EDGE_PAD, maxX);
  let ny = clamp(y, EDGE_PAD, maxY);

  if (nearest === distL) nx = EDGE_PAD;
  else if (nearest === distR) nx = maxX;
  else if (nearest === distT) ny = EDGE_PAD;
  else ny = maxY;

  return { x: nx, y: ny };
}

function defaultCardPos(
  cw: number,
  ch: number,
  cardW: number,
  cardH: number,
  isStage: boolean
) {
  const left = isStage ? 20 : 12;
  const bottomClear = isStage ? 168 : 16;
  return {
    x: left,
    y: clamp(ch - bottomClear - cardH, EDGE_PAD, Math.max(EDGE_PAD, ch - cardH - EDGE_PAD)),
  };
}

interface SnapshotFloatCardProps {
  isStage: boolean;
  label: string;
  description: string;
  capitals: CapitalMarker[];
  hoverName: string | null;
  loading?: boolean;
}

/**
 * 疆域快照：可展开卡片 / 可拖圆形缩略，松手吸附边框
 */
export function SnapshotFloatCard({
  isStage,
  label,
  description,
  capitals,
  hoverName,
  loading,
}: SnapshotFloatCardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const dragging = useRef(false);
  const moved = useRef(false);
  const origin = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const x = useMotionValue(EDGE_PAD);
  const y = useMotionValue(EDGE_PAD);

  const measure = useCallback(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return { cw: 0, ch: 0 };
    const r = el.getBoundingClientRect();
    return { cw: r.width, ch: r.height };
  }, []);

  const cardSize = useCallback(() => {
    const { cw } = measure();
    const cardW = Math.min(cw > 0 ? cw * 0.88 : 296, cw >= 768 ? 296 : 264);
    const cardH = cw >= 768 ? 216 : 204;
    return { cardW, cardH };
  }, [measure]);

  const placeDefault = useCallback(() => {
    const { cw, ch } = measure();
    if (cw < 8 || ch < 8) return;
    const { cardW, cardH } = cardSize();
    const p = defaultCardPos(cw, ch, cardW, cardH, isStage);
    x.set(p.x);
    y.set(p.y);
    setReady(true);
  }, [cardSize, isStage, measure, x, y]);

  useLayoutEffect(() => {
    placeDefault();
  }, [placeDefault]);

  useEffect(() => {
    const parent = wrapRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (dragging.current) return;
      const { cw, ch } = measure();
      if (cw < 8 || ch < 8) return;
      const w = collapsed ? BUBBLE : cardSize().cardW;
      const h = collapsed ? BUBBLE : cardSize().cardH;
      const snapped = snapToEdge(x.get(), y.get(), w, h, cw, ch);
      x.set(snapped.x);
      y.set(snapped.y);
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [cardSize, collapsed, measure, x, y]);

  const animateTo = (nx: number, ny: number) => {
    animate(x, nx, SPRING);
    animate(y, ny, SPRING);
  };

  const collapse = () => {
    const { cw, ch } = measure();
    const { cardW, cardH } = cardSize();
    // 以卡片中心收成圆点，再吸附
    const cx = x.get() + cardW / 2 - BUBBLE / 2;
    const cy = y.get() + cardH / 2 - BUBBLE / 2;
    setCollapsed(true);
    const snapped = snapToEdge(cx, cy, BUBBLE, BUBBLE, cw, ch);
    animateTo(snapped.x, snapped.y);
  };

  const expand = () => {
    const { cw, ch } = measure();
    const { cardW, cardH } = cardSize();
    setCollapsed(false);
    const nx = clamp(x.get(), EDGE_PAD, Math.max(EDGE_PAD, cw - cardW - EDGE_PAD));
    const ny = clamp(y.get(), EDGE_PAD, Math.max(EDGE_PAD, ch - cardH - EDGE_PAD));
    const snapped = snapToEdge(nx, ny, cardW, cardH, cw, ch);
    animateTo(snapped.x, snapped.y);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!collapsed) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    moved.current = false;
    origin.current = {
      x: x.get(),
      y: y.get(),
      px: e.clientX,
      py: e.clientY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current || !collapsed) return;
    const dx = e.clientX - origin.current.px;
    const dy = e.clientY - origin.current.py;
    if (Math.hypot(dx, dy) > 3) moved.current = true;
    const { cw, ch } = measure();
    const nx = clamp(
      origin.current.x + dx,
      EDGE_PAD - 4,
      Math.max(EDGE_PAD, cw - BUBBLE - EDGE_PAD + 4)
    );
    const ny = clamp(
      origin.current.y + dy,
      EDGE_PAD - 4,
      Math.max(EDGE_PAD, ch - BUBBLE - EDGE_PAD + 4)
    );
    x.set(nx);
    y.set(ny);
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!collapsed) return;
    const { cw, ch } = measure();
    const snapped = snapToEdge(x.get(), y.get(), BUBBLE, BUBBLE, cw, ch);
    animateTo(snapped.x, snapped.y);
  };

  const shortLabel = label.replace(/[·\s]/g, "").slice(0, 2) || "疆";
  const glass =
    "border border-amber-900/10 bg-amber-50/50 shadow-[0_1px_2px_rgba(48,42,28,0.05)] backdrop-blur-md";

  return (
    <motion.div
      ref={wrapRef}
      className={`absolute z-10 ${ready ? "opacity-100" : "opacity-0"}`}
      style={{ left: 0, top: 0, x, y }}
      initial={false}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.button
            key="bubble"
            type="button"
            initial={{ scale: 0.72, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => {
              if (moved.current) return;
              expand();
            }}
            aria-label={`展开疆域快照：${label}`}
            title="拖动定位 · 点击展开"
            className={`flex h-14 w-14 cursor-grab touch-none flex-col items-center justify-center rounded-full active:cursor-grabbing ${glass}`}
          >
            <span className="font-serif text-[11px] font-semibold tracking-[0.14em] text-[#222621]">
              {shortLabel}
            </span>
            <span className="mt-0.5 text-[8px] tracking-wider text-[#898d80]">
              快照
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0.7, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.5, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto flex h-[12.75rem] w-[min(88vw,16.5rem)] flex-col rounded-md px-3 py-2.5 md:h-[13.5rem] md:w-[18.5rem] ${glass}`}
          >
            <header className="flex min-h-[2.85rem] shrink-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-serif text-[9px] tracking-[0.28em] text-[#b6584f]">
                  疆域快照
                </p>
                <h3 className="mt-1 truncate font-serif text-base font-bold leading-tight tracking-[0.14em] text-[#222621] md:text-lg md:tracking-[0.16em]">
                  {label}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {loading && (
                  <span className="text-[10px] text-[#898d80]">切换中…</span>
                )}
                <button
                  type="button"
                  onClick={collapse}
                  aria-label="缩略疆域快照"
                  title="缩略"
                  className="grid h-7 w-7 place-items-center rounded-full border border-amber-900/20 bg-transparent text-[13px] leading-none text-[#6a6558] transition hover:border-amber-900/35 hover:text-[#222621]"
                >
                  −
                </button>
              </div>
            </header>

            <p className="mt-1.5 flex min-h-[1.25rem] shrink-0 items-baseline gap-2 text-[11px] text-[#4f544c]">
              <span className="shrink-0 font-serif text-[9px] tracking-[0.2em] text-[#898d80]">
                都城
              </span>
              <span className="truncate font-serif text-[12px] font-semibold tracking-[0.1em] text-[#222621]">
                {capitals.length > 0
                  ? capitals.map((c) => c.name).join(" · ")
                  : "—"}
              </span>
            </p>

            <p className="mt-1.5 line-clamp-4 min-h-[4.125rem] flex-1 overflow-hidden text-[10px] leading-[1.65] tracking-wide text-[#4f544c] md:min-h-[4.675rem] md:text-[11px] md:leading-[1.7]">
              {description}
            </p>

            <p className="mt-1.5 min-h-[1.75rem] shrink-0 border-t border-dashed border-amber-900/10 pt-1.5 font-serif text-[11px] leading-none tracking-[0.12em] text-[#b6584f]">
              {hoverName ?? "\u00a0"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
