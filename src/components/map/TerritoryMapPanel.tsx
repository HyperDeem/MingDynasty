"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMingTerritory } from "@/hooks/useMingTerritory";
import type { TerritoryData } from "@/data/ming-dynasty";
import { REGION_STYLE, type CapitalMarker } from "@/data/ming-map-layers";
import type { GeoMapApi } from "@/components/map/GeoMap";
import {
  MING_TERRITORY_SNAPSHOTS,
  type MingTerritoryRegionId,
} from "@/data/ming-territory";

const GeoMap = dynamic(
  () => import("@/components/map/GeoMap").then((m) => m.GeoMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 bg-[#f3efe4] text-[#898d80]">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4cab2] border-t-[#3f6f64]" />
        <p className="text-xs">时空数据正在准备</p>
        <p className="text-[10px] text-[#898d80]/80">省界与疆域叠层加载中…</p>
      </div>
    ),
  }
);

interface TerritoryMapPanelProps {
  currentYear: number;
  territory?: TerritoryData;
  className?: string;
  onSelectYear?: (year: number) => void;
  /** 全屏舞台：去边框页眉，控件浮动在地图上 */
  variant?: "card" | "stage";
}

/**
 * 交互疆域图
 * stage：全幅背景舞台；card：卡片式（兼容旧布局）
 */
export function TerritoryMapPanel({
  currentYear,
  territory,
  className,
  onSelectYear,
  variant = "card",
}: TerritoryMapPanelProps) {
  const {
    snapshot,
    coreProvinces,
    previousCoreProvinces,
    extras,
    previousExtras,
    capitals,
    crossfade,
    loading,
    error,
  } = useMingTerritory(currentYear);

  const [hoverName, setHoverName] = useState<string | null>(null);
  const [mapApi, setMapApi] = useState<GeoMapApi | null>(null);
  const isStage = variant === "stage";

  const legendItems = useMemo(() => {
    const items: { id: string; label: string; color: string }[] = [
      {
        id: "core",
        label: REGION_STYLE.core.label,
        color: REGION_STYLE.core.fill,
      },
    ];
    const seen = new Set<string>(["core"]);
    for (const f of extras.features) {
      const region = String(
        (f.properties as { region?: string })?.region ?? ""
      );
      if (!region || seen.has(region)) continue;
      const style = REGION_STYLE[region as MingTerritoryRegionId];
      if (!style) continue;
      seen.add(region);
      items.push({ id: region, label: style.label, color: style.fill });
    }
    return items;
  }, [extras]);

  const shellClass =
    className ??
    (isStage
      ? "absolute inset-0 flex flex-col overflow-hidden bg-[#f3efe4]"
      : "flex min-h-[360px] flex-col overflow-hidden border border-[#e3dcca] bg-[#fbf9f3]");

  return (
    <section className={shellClass}>
      {!isStage && (
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e3dcca] px-4 py-3 md:px-5">
          <div>
            <p className="font-display text-[10px] tracking-[0.28em] text-[#b6584f]">
              交互疆域
            </p>
            <h3 className="mt-0.5 font-display text-lg font-bold text-[#222621]">
              {snapshot.label}
              <span className="ml-2 text-sm font-normal tabular-nums text-[#898d80]">
                约 {currentYear} 年
              </span>
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-[#4f544c]">
              {snapshot.description}
            </p>
          </div>
          <div className="text-right text-[10px] text-[#898d80]">
            <p>拖拽平移 · 滚轮缩放 · 悬停识别</p>
            {hoverName && (
              <p className="mt-0.5 font-display text-xs text-[#b6584f]">
                {hoverName}
              </p>
            )}
            {loading && <p className="mt-0.5">切换中…</p>}
          </div>
        </header>
      )}

      <div
        className={`territory-canvas-wrap relative flex-1 ${
          isStage ? "min-h-0" : "min-h-[420px] md:min-h-[520px]"
        }`}
      >
        {error ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#b6584f]">
            {error}
          </div>
        ) : (
          <GeoMap
            coreProvinces={coreProvinces}
            previousCoreProvinces={previousCoreProvinces}
            extras={extras}
            previousExtras={previousExtras}
            capitals={capitals}
            crossfade={crossfade}
            className="absolute inset-0 h-full w-full min-h-[320px]"
            onFeatureHover={(name) => setHoverName(name)}
            onReady={setMapApi}
          />
        )}

        {/* 摘要 */}
        <div
          className={`pointer-events-none absolute z-10 min-w-[168px] rounded-[7px] border border-[#e3dcca] bg-[rgba(251,249,243,0.9)] px-3 py-2.5 shadow-[0_1px_2px_rgba(48,42,28,0.06)] backdrop-blur-[8px] ${
            isStage
              ? "left-3 top-16 md:left-5 md:top-[4.75rem]"
              : "left-3 top-3 md:left-4 md:top-3.5"
          }`}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[10.5px] text-[#898d80]">疆域快照</span>
            <b className="font-display text-[17px] leading-none text-[#222621]">
              {snapshot.label}
            </b>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-[#4f544c]">
            <span className="tabular-nums">{currentYear} 年</span>
            <span>{coreProvinces.length} 省区</span>
            <span>{extras.features.length} 外延</span>
            {capitals.length > 0 && (
              <span>
                都城 {capitals.map((c: CapitalMarker) => c.name).join("、")}
              </span>
            )}
          </div>
          {isStage && (
            <p className="mt-1.5 max-w-[220px] text-[10px] leading-snug text-[#898d80]">
              {snapshot.description}
            </p>
          )}
          {hoverName && (
            <p className="mt-1 font-display text-xs text-[#b6584f]">
              {hoverName}
            </p>
          )}
          {loading && (
            <p className="mt-1 text-[10px] text-[#898d80]">切换中…</p>
          )}
        </div>

        {/* 图例 */}
        <div
          className={`pointer-events-none absolute z-10 flex max-w-[min(48%,420px)] flex-wrap justify-end gap-x-2.5 gap-y-1 rounded-[7px] border border-[#e3dcca] bg-[rgba(251,249,243,0.88)] px-2.5 py-2 shadow-[0_1px_2px_rgba(48,42,28,0.06)] backdrop-blur-[8px] ${
            isStage
              ? "right-3 top-16 md:right-5 md:top-[4.75rem]"
              : "right-3 top-3 md:right-4 md:top-3.5"
          }`}
        >
          {legendItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 font-display text-[11px] text-[#4f544c]"
            >
              <i
                className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[rgba(251,250,246,0.9)]"
                style={{
                  background: item.color,
                  boxShadow: `0 0 0 1px ${item.color}`,
                }}
              />
              {item.label}
            </span>
          ))}
        </div>

        {/* 缩放 */}
        <div
          className={`absolute z-10 grid gap-[5px] ${
            isStage
              ? "right-3 top-[9.5rem] md:right-5"
              : "right-3 top-[5.25rem] md:right-4"
          }`}
        >
          {(
            [
              { label: "放大地图", symbol: "+", action: () => mapApi?.zoomIn() },
              {
                label: "缩小地图",
                symbol: "−",
                action: () => mapApi?.zoomOut(),
              },
              {
                label: "重置地图视域",
                symbol: "↺",
                action: () => mapApi?.reset(),
              },
            ] as const
          ).map((btn) => (
            <button
              key={btn.label}
              type="button"
              aria-label={btn.label}
              title={btn.label}
              onClick={btn.action}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d4cab2] bg-[rgba(251,249,243,0.92)] text-[17px] leading-none text-[#4f544c] shadow-[0_1px_2px_rgba(48,42,28,0.06)] transition hover:border-[#6f9a8e] hover:text-[#2f554d]"
            >
              {btn.symbol}
            </button>
          ))}
        </div>

        {crossfade < 0.99 && previousCoreProvinces && (
          <div className="pointer-events-none absolute left-3 right-14 top-[calc(100%-5.75rem)] z-10 h-0.5 overflow-hidden rounded bg-[#e3dcca] md:left-4">
            <div
              className="h-full bg-[#3f6f64]/70 transition-[width] duration-75"
              style={{ width: `${crossfade * 100}%` }}
            />
          </div>
        )}

        <p className="pointer-events-none absolute bottom-[5.35rem] right-3 z-10 text-[9.5px] text-[rgba(79,84,76,0.62)] md:right-4">
          中国省级边界本地加载 · 历史疆域空间示意
          {territory && (
            <span className="ml-2 tabular-nums">
              · 约 {territory.areaWanKm2} 万 km²
            </span>
          )}
        </p>

        {/* 底部快照轴 */}
        <div className="absolute bottom-3 left-1/2 z-20 w-[min(980px,calc(100%-28px))] -translate-x-1/2 rounded-[7px] border border-[#d4cab2] bg-[rgba(251,249,243,0.94)] px-3 py-2 shadow-[0_4px_18px_-8px_rgba(48,42,28,0.22)] backdrop-blur-[10px]">
          <div className="flex items-end gap-1 overflow-x-auto pb-0.5">
            {MING_TERRITORY_SNAPSHOTS.map((s) => {
              const active = s.id === snapshot.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectYear?.(s.year)}
                  className={`group flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-1 py-0.5 transition ${
                    onSelectYear ? "cursor-pointer" : "cursor-default"
                  }`}
                  disabled={!onSelectYear}
                >
                  <span
                    className={`font-display text-[12px] leading-none ${
                      active
                        ? "font-semibold text-[#222621]"
                        : "text-[#898d80] group-hover:text-[#4f544c]"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[9px] tabular-nums text-[#898d80]">
                    {s.yearFrom}–{s.yearTo}
                  </span>
                  <span
                    className={`mt-0.5 h-[3px] w-full rounded-full transition ${
                      active ? "bg-[#3f6f64]" : "bg-[#e3dcca]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isStage && (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e3dcca] px-4 py-2 text-[10px] text-[#898d80] md:px-5">
          <p>
            省界底图示意 · 概念参考谭其骧《中国历史地图集》/ CHGIS ·
            核心区按现代省级近似着色
          </p>
          {territory && (
            <p className="tabular-nums">
              约 {territory.areaWanKm2} 万 km² · 都城{" "}
              {territory.capitals.join("、")}
            </p>
          )}
        </footer>
      )}
    </section>
  );
}
