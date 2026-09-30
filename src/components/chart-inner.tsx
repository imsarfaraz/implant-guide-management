"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">{label}</p>
      <p className="font-display text-lg font-light text-ink font-num">{payload[0].value}</p>
    </div>
  );
}

export function TrendChartInner({
  data,
  color = "#0d6e63",
  height = 220,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="#e3e0d7" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: "#8b8f98" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 10.5, fill: "#8b8f98" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={40}
        />
        <Tooltip content={<ChartTip />} cursor={{ stroke: color, strokeOpacity: 0.25 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#trendFill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
