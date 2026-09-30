"use client";

import dynamic from "next/dynamic";

// Recharts v3's ResponsiveContainer breaks during SSR — load it client-only.
const TrendChartInner = dynamic(
  () => import("./chart-inner").then((m) => m.TrendChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-end justify-around gap-2 overflow-hidden px-2">
        {[34, 58, 42, 70, 52, 88, 64, 96, 60, 78].map((h, i) => (
          <div
            key={i}
            className="w-full max-w-9 animate-pulse rounded-t-md bg-accent-soft"
            style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    ),
  }
);

export function TrendChart(props: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return <TrendChartInner {...props} />;
}
