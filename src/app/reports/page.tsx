import Link from "next/link";
import {
  BarChart3,
  Layers,
  CheckCircle2,
  Hourglass,
  Timer,
  AlertTriangle,
  Trophy,
  UsersRound,
  CalendarRange,
} from "lucide-react";
import { Card, Badge, PageHeader, Reveal, Stat, EmptyState } from "@/components/ui";
import { TrendChart } from "@/components/charts";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { fetchGuideCases, fetchOrders, getCatalogs } from "@/lib/data";
import { db } from "@/db";
import { statusHistory, statuses, hardwareItems, implantSystems, hardwareOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cn, daysBetween, fmtDate, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRESETS = [
  { key: "this-month", label: "This month" },
  { key: "last-month", label: "Last month" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "all", label: "All time" },
] as const;

function presetRange(key: string, customFrom?: string, customTo?: string): { from: Date | null; to: Date | null; label: string } {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  switch (key) {
    case "this-month":
      return { from: firstOfMonth, to: null, label: monthLabel(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`) };
    case "last-month": {
      const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: firstPrev, to: firstOfMonth, label: monthLabel(`${firstPrev.getFullYear()}-${String(firstPrev.getMonth() + 1).padStart(2, "0")}`) };
    }
    case "3m":
      return { from: new Date(now.getTime() - 91 * 86400_000), to: null, label: "last 90 days" };
    case "6m":
      return { from: new Date(now.getTime() - 182 * 86400_000), to: null, label: "last 6 months" };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom + "T00:00:00") : null,
        to: customTo ? new Date(customTo + "T23:59:59") : null,
        label: customFrom && customTo ? `${fmtDate(customFrom)} → ${fmtDate(customTo)}` : "custom range",
      };
    default:
      return { from: null, to: null, label: "all time" };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const preset = sp.preset ?? "this-month";
  const { from, to, label: rangeLabel } = presetRange(preset, sp.from, sp.to);

  const [guideCases, orders, { statusList, staffList }, deliveredHist, failedItems] = await Promise.all([
    fetchGuideCases(),
    fetchOrders(),
    getCatalogs(),
    db
      .select({ caseId: statusHistory.caseId, at: statusHistory.createdAt })
      .from(statusHistory)
      .innerJoin(statuses, eq(statusHistory.toStatusId, statuses.id))
      .where(eq(statuses.key, "delivered")),
    db
      .select({
        id: hardwareItems.id,
        orderId: hardwareItems.orderId,
        system: implantSystems.name,
        size: hardwareItems.size,
        qty: hardwareItems.qty,
        failNote: hardwareItems.failNote,
        orderDisplay: hardwareOrders.displayId,
        orderCreatedAt: hardwareOrders.createdAt,
        doctor: hardwareOrders.doctorId,
      })
      .from(hardwareItems)
      .leftJoin(implantSystems, eq(hardwareItems.systemId, implantSystems.id))
      .leftJoin(hardwareOrders, eq(hardwareItems.orderId, hardwareOrders.id))
      .where(eq(hardwareItems.failed, true)),
  ]);

  const inPeriod = (d: Date) => {
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };

  const deliveredAt = new Map(deliveredHist.map((r) => [r.caseId, r.at]));
  const periodCases = guideCases.filter((c) => inPeriod(c.createdAt));
  const periodOrders = orders.filter((o) => inPeriod(o.createdAt));
  const activeNow = guideCases.filter((c) => c.statusKind !== "terminal");

  // Distributions
  const countBy = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = key(r) ?? "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const byType = countBy(periodCases, (c) => c.typeName);
  const bySystem = countBy(periodCases, (c) => c.system).slice(0, 10);
  const maxType = Math.max(1, ...byType.map(([, n]) => n));
  const maxSystem = Math.max(1, ...bySystem.map(([, n]) => n));

  // Turnaround
  const turnaroundOf = (caseId: number, createdAt: Date): number | null => {
    const end = deliveredAt.get(caseId);
    return end ? daysBetween(createdAt, end) : null;
  };
  const periodDelivered = periodCases
    .map((c) => ({ c, span: turnaroundOf(c.id, c.createdAt) }))
    .filter((x): x is { c: (typeof periodCases)[number]; span: number } => x.span !== null);
  const avgTurnaround = periodDelivered.length
    ? Math.round((periodDelivered.reduce((a, x) => a + x.span, 0) / periodDelivered.length) * 10) / 10
    : null;

  // Doctor leaderboard
  const doctorRows = [...new Map(periodCases.map((c) => [c.doctorId, c.doctor])).entries()]
    .map(([id, name]) => {
      const mine = periodCases.filter((c) => c.doctorId === id);
      const delivered = mine.filter((c) => c.statusKey === "delivered");
      const spans = delivered
        .map((c) => turnaroundOf(c.id, c.createdAt))
        .filter((s): s is number => s !== null);
      const avg = spans.length ? Math.round((spans.reduce((a, b) => a + b, 0) / spans.length) * 10) / 10 : null;
      return { id, name, cases: mine.length, delivered: delivered.length, avg, orders: periodOrders.filter((o) => o.doctorId === id).length };
    })
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 12);

  // Planner leaderboard
  const plannerRows = staffList
    .filter((s) => s.role === "planner" || s.role === "admin")
    .map((s) => {
      const active = activeNow.filter((c) => c.plannerId === s.id);
      const deliveredPeriod = periodCases.filter((c) => c.plannerId === s.id && c.statusKey === "delivered").length;
      return { id: s.id, name: s.name, active: active.length, deliveredPeriod };
    })
    .sort((a, b) => b.deliveredPeriod - a.deliveredPeriod);

  // Failure rollup
  const periodFailed = failedItems.filter((f) => f.orderCreatedAt != null && inPeriod(f.orderCreatedAt));
  const failGroups = new Map<string, { system: string | null; size: string | null; count: number; notes: string[]; doctors: string[] }>();
  for (const f of periodFailed) {
    const key = `${f.system ?? "?"} / ${f.size ?? "?"}`;
    const g = failGroups.get(key) ?? { system: f.system, size: f.size, count: 0, notes: [], doctors: [] };
    g.count += f.qty;
    if (f.failNote) g.notes.push(`${f.orderDisplay}: ${f.failNote}`);
    const doctorName = orders.find((o) => o.id === f.orderId)?.doctor;
    if (doctorName && !g.doctors.includes(doctorName)) g.doctors.push(doctorName);
    failGroups.set(key, g);
  }
  const failList = [...failGroups.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // 6-month trend
  const now = new Date();
  const trend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      value: guideCases.filter((c) => c.monthKey === key).length + orders.filter((o) => o.monthKey === key).length,
    };
  });

  const statusSnapshot = statusList
    .map((s) => ({ ...s, count: guideCases.filter((c) => c.statusKey === s.key).length }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <PageHeader
        title="Reports & insights"
        subtitle={`Period: ${rangeLabel}. Volume, turnaround, failures and leaderboards — computed live from the continuous dataset.`}
      />

      <PageHelpGuide
        title="Operational Intelligence & Clinical Reports"
        description="Live reporting computed dynamically from all case histories and hardware orders. Slices volume by doctor, brand, turnaround duration, and tracks implant failure patterns."
        tips={[
          {
            title: "Turnaround Time (TAT)",
            desc: "Measured in days from case creation timestamp until the status transition to DELIVERED. Helps track whether 3D printing or doctor approval is the bottleneck.",
          },
          {
            title: "Failure Rollups",
            desc: "Aggregates failed implants by brand and diameter/length to identify batch issues and owed warranty replacements across clinics.",
          },
          {
            title: "Leaderboards",
            desc: "Tracks case distribution per referring clinician for relationship management and per planner for fair workload allocation.",
          },
        ]}
      />

      {/* Period selector */}
      <Reveal className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-white p-1">
            {PRESETS.map((p) => (
              <Link
                key={p.key}
                href={`/reports?preset=${p.key}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  preset === p.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="preset" value="custom" />
            <CalendarRange className="h-4 w-4 text-mute" />
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="h-9 rounded-lg border border-line bg-paper/50 px-3 text-[13px] outline-none focus:border-accent" />
            <span className="text-mute">→</span>
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="h-9 rounded-lg border border-line bg-paper/50 px-3 text-[13px] outline-none focus:border-accent" />
            <button type="submit" className="h-9 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper transition hover:bg-black">
              Apply
            </button>
          </form>
        </div>
      </Reveal>

      {/* KPIs */}
      <Reveal delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Cases in period" value={periodCases.length} icon={<Layers />} sub={`${periodOrders.length} hardware orders`} tone="#2563eb" />
          <Stat label="Delivered" value={periodDelivered.length} icon={<CheckCircle2 />} sub="reaching DELIVERED" tone="#16a34a" />
          <Stat label="Active now" value={activeNow.length} icon={<Hourglass />} sub="non-terminal right now" tone="#d97706" />
          <Stat label="Avg turnaround" value={avgTurnaround !== null ? `${avgTurnaround}d` : "—"} icon={<Timer />} sub="creation → delivered" tone="#0d6e63" />
          <Stat label="Failed implants" value={periodFailed.reduce((a, f) => a + f.qty, 0)} icon={<AlertTriangle />} sub={`${periodFailed.length} failed line${periodFailed.length === 1 ? "" : "s"}`} tone={periodFailed.length ? "#c2402f" : "#0d6e63"} />
        </div>
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Trend */}
        <Reveal delay={0.09} className="lg:col-span-2">
          <Card className="h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Monthly volume</h2>
                <p className="text-xs text-mute">Guide cases + hardware orders, last 6 months</p>
              </div>
              <Badge tone="teal" className="font-num">{trend.reduce((a, t) => a + t.value, 0)} total</Badge>
            </div>
            <TrendChart data={trend} height={240} />
          </Card>
        </Reveal>

        {/* Status snapshot */}
        <Reveal delay={0.13}>
          <Card className="h-full p-6">
            <h2 className="font-display text-lg font-light tracking-tight text-ink">Pipeline snapshot</h2>
            <p className="text-xs text-mute">Current state of all guide cases</p>
            <div className="mt-4 space-y-2.5">
              {statusSnapshot.map((s) => (
                <div key={s.key} className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-[13px] text-ink-soft">{s.name}</span>
                      <span className="font-num text-[13px] font-semibold text-ink">{s.count}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, (s.count / Math.max(1, guideCases.length)) * 100)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* By type */}
        <Reveal delay={0.16}>
          <Card className="h-full p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-mute" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Volume by case type</h2>
            </div>
            <div className="mt-5 space-y-3.5">
              {byType.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink-soft">{name}</span>
                    <span className="font-num font-semibold text-ink">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-[#2b5cb8] transition-all duration-500" style={{ width: `${(count / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
              {byType.length === 0 && <p className="text-[13px] text-mute">No cases in this period.</p>}
            </div>
          </Card>
        </Reveal>

        {/* By system */}
        <Reveal delay={0.2}>
          <Card className="h-full p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-mute" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Volume by implant system</h2>
            </div>
            <div className="mt-5 space-y-3.5">
              {bySystem.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink-soft">{name}</span>
                    <span className="font-num font-semibold text-ink">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(count / maxSystem) * 100}%` }} />
                  </div>
                </div>
              ))}
              {bySystem.length === 0 && <p className="text-[13px] text-mute">No cases in this period.</p>}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Failure rollup */}
      <Reveal delay={0.24} className="mt-5">
        <Card>
          <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
            <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={1.8} />
            <h2 className="font-display text-lg font-light tracking-tight text-ink">Failure rollup</h2>
            <Badge tone="gray" className="ml-2 font-num">{periodFailed.length} lines</Badge>
          </div>
          {failList.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState title="No failed implants in this period" hint="Failure notes captured on hardware orders aggregate here automatically." />
            </div>
          ) : (
            <div className="divide-y divide-line-soft">
              {failList.map((g, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="red" className="font-num">×{g.count}</Badge>
                    <span className="text-[14px] font-semibold text-ink">{g.system ?? "Unknown system"}</span>
                    <span className="font-mono text-[12px] text-ink-soft">{g.size}</span>
                    <span className="text-[11px] text-mute">{g.doctors.join(", ")}</span>
                  </div>
                  {g.notes.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {g.notes.slice(0, 3).map((n, j) => (
                        <li key={j} className="text-[12px] italic text-ink-soft">“{n}”</li>
                      ))}
                      {g.notes.length > 3 && <li className="text-[11px] text-mute">+{g.notes.length - 3} more notes</li>}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      {/* Leaderboards */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal delay={0.28}>
          <Card className="h-full overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
              <Trophy className="h-4 w-4 text-amber" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Doctor leaderboard</h2>
              <span className="text-[11px] text-mute">· {rangeLabel}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3 text-right">Cases</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Delivered</th>
                  <th className="px-4 py-3 text-right">Avg TAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {doctorRows.map((d, i) => (
                  <tr key={d.id} className="transition hover:bg-paper/70">
                    <td className="px-6 py-3 font-display text-[15px] font-light text-mute font-num">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/doctors/${d.id}`} className="text-[13px] font-semibold text-ink hover:text-accent hover:underline">
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink">{d.cases}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink-soft">{d.orders}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink-soft">{d.delivered}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink-soft">{d.avg !== null ? `${d.avg}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>

        <Reveal delay={0.32}>
          <Card className="h-full overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
              <UsersRound className="h-4 w-4 text-mute" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Planner leaderboard</h2>
              <span className="text-[11px] text-mute">· delivered {rangeLabel}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Planner</th>
                  <th className="px-4 py-3 text-right">Delivered</th>
                  <th className="px-4 py-3 text-right">Active now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {plannerRows.map((p, i) => (
                  <tr key={p.id} className="transition hover:bg-paper/70">
                    <td className="px-6 py-3 font-display text-[15px] font-light text-mute font-num">{i + 1}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink">{p.deliveredPeriod}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-num text-ink-soft">{p.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
