"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMingTerritory } from "@/hooks/useMingTerritory";
import type { TerritoryData } from "@/data/ming-dynasty";
import { REGION_STYLE, isGlowRegion } from "@/data/ming-map-layers";
import type { GeoMapApi } from "@/components/map/GeoMap";
import { SnapshotFloatCard } from "@/components/map/SnapshotFloatCard";
import {
  MING_TERRITORY_SNAPSHOTS,
  type MingTerritoryRegionId,
} from "@/data/ming-territory";

const GeoMap = dynamic(
  () => import("@/components/map/GeoMap").then((m) => m.GeoMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 bg-[#f3efe4] text-[#898d80] transition-colors duration-700">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4cab2] border-t-[#3f6f64]" />
        <p className="text-xs">时空数据正在准备</p>
        <p className="text-[10px] text-[#898d80]/80">省界与疆域叠层加载中…</p>
      </div>
    ),
  }
);

function LampIcon({ lit }: { lit: boolean }) {
  if (lit) {
    /* 开灯态：太阳 — 点击可关灯 */
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[15px] w-[15px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3.25" />
        <path d="M12 2.75v2.1M12 19.15v2.1M2.75 12h2.1M19.15 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5" />
      </svg>
    );
  }
  /* 关灯入口：月亮 */
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.2 14.1A7.6 7.6 0 0 1 9.9 3.8 7.85 7.85 0 1 0 20.2 14.1Z" />
    </svg>
  );
}

interface TerritoryMapPanelProps {
  currentYear: number;
  territory?: TerritoryData;
  className?: string;
  onSelectYear?: (year: number) => void;
  /** 全屏舞台：去边框页眉，控件浮动在地图上 */
  variant?: "card" | "stage";
  /** 展厅关灯 / 顶光模式 */
  museumMode?: boolean;
  onToggleMuseumMode?: () => void;
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
  museumMode = false,
  onToggleMuseumMode,
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
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);
  const [legendHoverRegion, setLegendHoverRegion] = useState<string | null>(
    null
  );
  const [mapApi, setMapApi] = useState<GeoMapApi | null>(null);
  const isStage = variant === "stage";

  const activeGlowRegion = hoverRegion ?? legendHoverRegion;

  const legendItems = useMemo(() => {
    const items: { id: string; label: string; color: string }[] = [
      {
        id: "core",
        label: snapshot.coreLegendLabel,
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
  }, [extras, snapshot.coreLegendLabel]);

  const shellClass =
    className ??
    (isStage
      ? `absolute inset-0 flex flex-col overflow-hidden transition-colors duration-700 ${
          museumMode ? "bg-[#090a0f]" : "bg-[#f3efe4]"
        }`
      : "flex min-h-[360px] flex-col overflow-hidden border border-[#e3dcca] bg-[#fbf9f3]");

  const glassChrome =
    "museum-glass border border-amber-900/10 bg-amber-50/50 shadow-[0_1px_2px_rgba(48,42,28,0.05)] backdrop-blur-md transition-colors duration-700";
  const ctrlBtn =
    "museum-ctrl grid h-9 w-9 place-items-center rounded-full border border-amber-900/25 bg-amber-50/40 text-[15px] leading-none text-[#4f544c] backdrop-blur-md transition duration-700 hover:border-amber-900/45 hover:bg-amber-50/65 hover:text-[#2f554d]";

  return (
    <section className={shellClass}>
      {!isStage && (
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e3dcca] px-4 py-3 md:px-5">
          <div>
            <p className="font-serif text-[10px] tracking-[0.28em] text-[#b6584f]">
              交互疆域
            </p>
            <h3 className="mt-0.5 font-serif text-lg font-bold tracking-[0.12em] text-[#222621]">
              {snapshot.label}
              <span className="ml-2 font-body text-sm font-normal tracking-normal tabular-nums text-[#898d80]">
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
              <p className="mt-0.5 font-serif text-xs tracking-wide text-[#b6584f]">
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
            highlightRegion={legendHoverRegion}
            museumMode={museumMode}
            className="absolute inset-0 h-full w-full min-h-[320px] overflow-hidden"
            onFeatureHover={(name, props) => {
              setHoverName(name);
              const region =
                typeof props?.region === "string" ? props.region : null;
              setHoverRegion(isGlowRegion(region) ? region : null);
            }}
            onReady={setMapApi}
          />
        )}

        <SnapshotFloatCard
          isStage={isStage}
          label={snapshot.label}
          description={snapshot.description}
          capitals={capitals}
          hoverName={hoverName}
          loading={loading}
        />

        {/* 右上：展厅关灯（非舞台布局；舞台模式由页头按钮控制） */}
        {!isStage && onToggleMuseumMode && (
          <div className="absolute right-3 top-3 z-10 md:right-4">
            <button
              type="button"
              aria-label={museumMode ? "展厅开灯" : "展厅关灯"}
              aria-pressed={museumMode}
              title={museumMode ? "开灯 · 退出展厅模式" : "关灯 · 展厅顶光模式"}
              onClick={onToggleMuseumMode}
              className={ctrlBtn}
            >
              <LampIcon lit={museumMode} />
            </button>
          </div>
        )}

        {/* 图例：外延区悬停发光抬升，对应复选框同步亮起；亦可悬停图例反亮地图 */}
        <div
          className={`absolute z-10 flex max-w-[min(48%,420px)] flex-wrap justify-end gap-x-1.5 gap-y-1 rounded-full px-2.5 py-1.5 ${glassChrome} ${
            isStage
              ? "right-3 top-14 md:right-5 md:top-16"
              : "right-14 top-3 md:right-[3.75rem] md:top-3.5"
          }`}
        >
          {legendItems.map((item) => {
            const interactive = isGlowRegion(item.id);
            const lit = interactive && activeGlowRegion === item.id;
            return (
              <span
                key={item.id}
                onMouseEnter={() => {
                  if (interactive) setLegendHoverRegion(item.id);
                }}
                onMouseLeave={() => {
                  if (interactive) setLegendHoverRegion(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-serif text-[11px] tracking-wide transition duration-200 ${
                  interactive ? "pointer-events-auto cursor-default" : ""
                } ${
                  lit
                    ? `museum-legend-lit bg-amber-100/85 text-[#222621] shadow-[0_0_14px_rgba(63,111,100,0.32)]`
                    : "museum-glass-muted text-[#4f544c]"
                }`}
              >
                {interactive ? (
                  <i
                    aria-hidden
                    className={`relative inline-grid h-3 w-3 shrink-0 place-items-center rounded-[3px] border transition duration-200 ${
                      lit
                        ? "scale-105 border-[#3f6f64] bg-[#3f6f64]/18"
                        : "border-amber-900/30 bg-amber-50/40"
                    }`}
                    style={{
                      boxShadow: lit
                        ? `0 0 0 1px ${item.color}55, 0 0 10px ${item.color}88`
                        : undefined,
                    }}
                  >
                    <svg
                      viewBox="0 0 12 12"
                      className={`h-2 w-2 transition duration-200 ${
                        lit
                          ? "scale-100 opacity-100"
                          : "scale-75 opacity-35"
                      }`}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.2 6.2 4.8 8.8 9.8 3.2" />
                    </svg>
                  </i>
                ) : (
                  <i
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-amber-900/15"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 0 1px ${item.color}`,
                    }}
                  />
                )}
                {item.label}
              </span>
            );
          })}
        </div>

        {/* 缩放控制 */}
        <div
          className={`absolute z-10 grid gap-2 ${
            isStage
              ? "right-3 top-[8.5rem] md:right-5"
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
              className={ctrlBtn}
            >
              {btn.symbol}
            </button>
          ))}
        </div>

        {/* 底部快照轴 */}
        <div
          className={`absolute left-1/2 z-20 w-[min(980px,calc(100%-28px))] -translate-x-1/2 rounded-[7px] px-3 py-2 ${glassChrome} shadow-[0_4px_18px_-8px_rgba(48,42,28,0.18)] ${
            isStage ? "bottom-[9.5rem] md:bottom-[10rem]" : "bottom-3"
          }`}
        >
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
                    className={`font-serif text-[12px] leading-none tracking-[0.08em] transition-colors duration-700 ${
                      active
                        ? "museum-snap-active font-semibold text-[#222621]"
                        : "museum-glass-muted text-[#898d80] group-hover:text-[#4f544c]"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="museum-glass-faint text-[9px] tabular-nums text-[#898d80]">
                    {s.yearFrom}–{s.yearTo}
                  </span>
                  <span
                    className={`mt-0.5 h-[3px] w-full rounded-full transition ${
                      active
                        ? "museum-snap-bar bg-[#3f6f64]"
                        : "museum-snap-idle bg-[#e3dcca]"
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
