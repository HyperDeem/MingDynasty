"use client";

import type { TerritoryData } from "@/data/ming-dynasty";
import { resolveTerritorySnapshot } from "@/data/ming-territory";

interface TerritoryCardProps {
  territory: TerritoryData;
}

/** 疆域数据摘要卡（主交互地图见上方 TerritoryMapPanel） */
export function TerritoryCard({ territory }: TerritoryCardProps) {
  const coreLabel = resolveTerritorySnapshot(
    Number(territory.peakYear)
  ).coreLegendLabel;

  return (
    <article className="flex h-full flex-col border border-ink-800/10 bg-ink-50/60 p-5 backdrop-blur-sm md:p-6">
      <p className="font-display text-[10px] tracking-[0.3em] text-cinnabar">
        疆域数据
      </p>
      <h3 className="mt-1 font-display text-lg font-bold text-ink-900">
        版图概况
        <span className="ml-2 text-sm font-normal text-ink-400">
          约 {territory.peakYear} 年
        </span>
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label="约略面积"
          value={`${territory.areaWanKm2}`}
          unit="万 km²"
        />
        <Stat label={coreLabel} value={`${territory.provinces}`} unit="省" />
      </div>

      <p className="mt-3 text-xs text-ink-500">
        都城：{territory.capitals.join("、")}
      </p>

      <ul className="mt-3 flex-1 space-y-1.5">
        {territory.highlights.map((h) => (
          <li
            key={h.label}
            className="flex items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-ink-400">{h.label}</span>
            <span className="text-right text-ink-700">{h.value}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[10px] leading-relaxed text-ink-400">
        交互地图见本页上方中央区域；切换时间轴事件可观察交趾 / 奴儿干淡出与北疆内缩。
      </p>
    </article>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="border border-ink-800/10 bg-ink-100/50 px-3 py-2.5">
      <p className="text-[10px] tracking-wider text-ink-400">{label}</p>
      <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-ink-800">
        {value}
        <span className="ml-1 text-xs font-normal text-ink-400">{unit}</span>
      </p>
    </div>
  );
}
