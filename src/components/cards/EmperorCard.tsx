import type { EmperorInfo } from "@/data/ming-dynasty";

interface EmperorCardProps {
  emperor: EmperorInfo;
}

export function EmperorCard({ emperor }: EmperorCardProps) {
  return (
    <article className="flex h-full flex-col border border-ink-800/10 bg-ink-50/60 p-5 backdrop-blur-sm md:p-6">
      <p className="font-display text-[10px] tracking-[0.3em] text-cinnabar">
        皇帝简介
      </p>

      <div className="mt-4 flex gap-4">
        <div
          className="flex h-24 w-20 shrink-0 flex-col items-center justify-center border border-ink-800/15 bg-gradient-to-b from-ink-100 to-ink-200/80"
          aria-hidden
        >
          <span className="font-display text-2xl font-bold text-ink-700">
            {emperor.name.slice(0, 1)}
          </span>
          <span className="mt-1 text-[9px] tracking-widest text-ink-400">
            御像
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-ink-900">
            {emperor.name}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            {emperor.templeName}
            <span className="mx-1.5 text-ink-300">·</span>
            年号 {emperor.reignTitle}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-500">
            <div>
              <dt className="text-ink-400">生卒</dt>
              <dd className="tabular-nums text-ink-700">{emperor.lifespan}</dd>
            </div>
            <div>
              <dt className="text-ink-400">在位</dt>
              <dd className="tabular-nums text-ink-700">{emperor.reignYears}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-ink-600">
        {emperor.summary}
      </p>
    </article>
  );
}
