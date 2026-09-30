import Link from "next/link";
import {
  Layers,
  CheckCircle2,
  PackageOpen,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  ClipboardList,
  Clock,
  Users,
} from "lucide-react";
import { Card, Stat, EmptyState, Reveal, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { KanbanBoard, type KanbanCol } from "@/components/kanban";
import { TrendChart } from "@/components/charts";
import { fetchGuideCases, fetchOrders, getStuckThreshold, getCatalogs, fetchRecentActivity } from "@/lib/data";
import { moveCase } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { ageDays, ageLabel, ageVerbose, currentMonthKey, fmtDate, fmtDateShort, monthLabel, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [guideCases, orders, threshold, { statusList }, activity, user] = await Promise.all([
    fetchGuideCases(),
    fetchOrders(),
    getStuckThreshold(),
    getCatalogs(),
    fetchRecentActivity(9),
    getCurrentUser(),
  ]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const mk = currentMonthKey();

  const activeCases = guideCases.filter((c) => c.statusKind !== "terminal");
  const deliveredThisMonth = guideCases.filter((c) => c.statusKey === "delivered" && c.monthKey === mk);
  const openOrders = orders.filter((o) => !o.delivered);
  const stuck = activeCases
    .filter((c) => ageDays(c.statusSince) > threshold)
    .sort((a, b) => b.statusSince.getTime() - a.statusSince.getTime());

  const isStuck = (since: Date) => ageDays(since) > threshold;

  const tatDays = deliveredThisMonth.map((c) => Math.max(1, Math.round((c.statusSince.getTime() - c.createdAt.getTime()) / 86400_000)));
  const avgTat = tatDays.length > 0 ? (tatDays.reduce((a, b) => a + b, 0) / tatDays.length).toFixed(1) : "—";

  const plannerWorkload = activeCases.reduce((acc, c) => {
    const p = c.planner || "Unassigned";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const planners = Object.entries(plannerWorkload).sort((a, b) => b[1] - a[1]);

  const boardCols: KanbanCol[] = statusList
    .filter((s) => s.kind !== "terminal")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      key: s.key,
      name: s.name,
      color: s.color,
      kind: s.kind,
      cards: guideCases
        .filter((c) => c.statusKey === s.key)
        .sort((a, b) => a.statusSince.getTime() - b.statusSince.getTime())
        .slice(0, 24)
        .map((c) => ({
          id: c.id,
          displayId: c.displayId,
          doctor: c.doctor,
          patient: c.patient,
          system: c.system,
          plannerInitials: c.plannerInitials,
          age: ageLabel(c.statusSince),
          stuck: isStuck(c.statusSince),
        })),
    }));

  // 30-day trend (cases created per day)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400_000);
    return {
      label: fmtDateShort(d),
      value: guideCases.filter((c) => c.createdAt.toDateString() === d.toDateString()).length,
    };
  });

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <h1 className="mt-2 font-display text-[38px] font-light leading-none tracking-tight text-ink">
              {greeting}, {user?.name.split(" ")[0] || "User"}.
            </h1>
            <p className="mt-2 text-[13px] text-ink-soft">
              The lab floor has <span className="font-semibold text-ink">{activeCases.length} active cases</span>
              {stuck.length > 0 && (
                <>
                  {" "}and <span className="font-semibold text-danger">{stuck.length} stuck {stuck.length === 1 ? "case" : "cases"}</span>
                </>
              )}
              {" "}— drag cards across the board to move them.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cases/new">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-xs font-medium transition hover:border-ink/40">
                New guide case
              </span>
            </Link>
            <Link href="/orders/new">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-xs font-medium text-paper transition hover:bg-black">
                New hardware order
              </span>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Quick Interactive Guide */}
      <PageHelpGuide
        title="Dashboard & Pipeline Overview"
        description="The live command center for surgical guide operations and hardware orders across Mumbai dental clinics. Drag case cards across pipeline columns to update status, or click any card to inspect patient timelines."
        tips={[
          {
            title: "Live Drag & Drop",
            desc: "Drag any case card into another status column. Transitions are timestamped and attributed to your user profile.",
          },
          {
            title: "Stuck Case Alerts",
            desc: `Cases sitting longer than ${threshold} days without clinical progress are flagged in red to prevent dropped commitments.`,
          },
          {
            title: "Hardware Linkage",
            desc: "Implant fixture orders link directly to surgical guides, giving clinicians full prosthetic and surgical trace.",
          },
        ]}
      />

      {/* KPIs */}
      <Reveal delay={0.06}>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <Stat
            label="Active cases"
            value={activeCases.length}
            icon={<Layers />}
            sub={
              <span className="flex items-center gap-1">
                <span>{guideCases.length} total in dataset</span>
                <HelpTip title="Continuous Dataset" content="Unlike the old monthly Excel workbook, all historical cases live in one continuous database without manual cloning." />
              </span>
            }
            tone="#2563eb"
          />
          <Stat
            label={`Delivered · ${monthLabel(mk).split(" ")[0]}`}
            value={deliveredThisMonth.length}
            icon={<CheckCircle2 />}
            sub="guide cases closed this month"
            tone="#16a34a"
          />
          <Stat
            label="Average TAT"
            value={avgTat}
            icon={<Clock />}
            sub={
              <span className="flex items-center gap-1">
                <span>days from intake to delivery</span>
                <HelpTip title="Turnaround Time" content="Average time it takes for cases delivered this month to be completed." />
              </span>
            }
            tone="#7c3aed"
          />
          <Stat
            label="Open hardware orders"
            value={openOrders.length}
            icon={<PackageOpen />}
            sub={
              <span className="flex items-center gap-1">
                <span>{orders.length} orders total</span>
                <HelpTip title="Hardware Dispatch" content="Tracks pending fixture boxes, straight/angled abutments, and physio-dispensers." />
              </span>
            }
            tone="#d97706"
          />
          <Stat
            label="Stuck cases"
            value={stuck.length}
            icon={<AlertTriangle />}
            sub={
              <span className="flex items-center gap-1">
                <span>{stuck.length ? `sitting > ${threshold}d in non-terminal state` : "healthy pipeline"}</span>
                <HelpTip title="Alert Threshold" content={`Alerts trigger when a case sits in a non-terminal status longer than ${threshold} days. Threshold is editable in Admin.`} />
              </span>
            }
            tone={stuck.length ? "#c2402f" : "#0d6e63"}
          />
        </div>
      </Reveal>

      {/* Pipeline board */}
      <Reveal delay={0.1}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Pipeline board</h2>
              <p className="text-xs text-mute">
                Every guide case, live — age shown is time in current status
              </p>
            </div>
            <Link href="/cases" className="group flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-deep">
              Open full case list
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <div className="p-5">
            <KanbanBoard 
              columns={boardCols} 
              onMove={moveCase} 
              currentUserInitials={user?.name ? initials(user.name) : undefined} 
            />
          </div>
        </Card>
      </Reveal>

      {/* Bottom row */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Trend */}
        <Reveal delay={0.14} className="xl:col-span-1">
          <Card className="h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Case intake</h2>
                <p className="text-xs text-mute">Last 30 days</p>
              </div>
              <Badge tone="teal" className="font-num">
                {days.reduce((a, d) => a + d.value, 0)} cases
              </Badge>
            </div>
            <TrendChart data={days} />
          </Card>
        </Reveal>

        {/* Planner Workload */}
        <Reveal delay={0.16} className="xl:col-span-1">
          <Card className="h-full">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-6 py-4">
              <Users className="h-4 w-4 text-accent" strokeWidth={1.9} />
              <div>
                <h2 className="font-display text-base font-light tracking-tight text-ink">Workload</h2>
                <p className="text-[11px] text-mute">Active cases per planner</p>
              </div>
            </div>
            <div className="max-h-[300px] divide-y divide-line-soft overflow-y-auto p-4 space-y-3">
              {planners.map(([planner, count]) => (
                <div key={planner} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{planner}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 bg-line-soft rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${Math.min(100, (count / 20) * 100)}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs font-semibold text-ink font-num">{count}</span>
                  </div>
                </div>
              ))}
              {planners.length === 0 && (
                <div className="py-8 text-center text-xs text-mute">No active cases.</div>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Stuck */}
        <Reveal delay={0.18}>
          <Card className="h-full">
            <div className="flex items-center gap-2.5 border-b border-line-soft px-6 py-4">
              <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={1.9} />
              <div>
                <h2 className="font-display text-base font-light tracking-tight text-ink">Needs attention</h2>
                <p className="text-[11px] text-mute">non-terminal for &gt; {threshold} days</p>
              </div>
            </div>
            <div className="max-h-[300px] divide-y divide-line-soft overflow-y-auto">
              {stuck.slice(0, 10).map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-paper/70">
                  <span className="size-1.5 shrink-0 animate-pulse-soft rounded-full bg-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink group-hover:text-accent">{c.doctor}</p>
                    <p className="truncate text-[11px] text-mute">{c.displayId} · {c.patient}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={{ name: c.statusName, color: c.statusColor }} size="sm" />
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-danger font-num">
                      {ageDays(c.statusSince)}d
                    </p>
                  </div>
                </Link>
              ))}
              {stuck.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-accent" strokeWidth={1.6} />
                  <p className="text-xs text-mute">Nothing stuck — the board is healthy.</p>
                </div>
              )}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Activity */}
      <Reveal delay={0.22}>
        <Card>
          <div className="flex items-center gap-2.5 border-b border-line-soft px-6 py-4">
            <Activity className="h-4 w-4 text-accent" strokeWidth={1.9} />
            <h2 className="font-display text-lg font-light tracking-tight text-ink">Recent activity</h2>
          </div>
          <div className="divide-y divide-line-soft">
            {activity.length === 0 && (
              <EmptyState icon={<ClipboardList />} title="No activity yet" hint="Actions you take will be attributed here." />
            )}
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                <StatusBadge
                  status={{ name: a.action.replace(/_/g, " "), color: a.action.includes("fail") ? "#c2402f" : a.action.includes("status") ? "#2563eb" : "#0d6e63" }}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">
                    <span className="font-semibold">{a.staff ?? "System"}</span>{" "}
                    <span className="text-ink-soft">{a.detail ?? a.action}</span>
                  </p>
                </div>
                {a.entityType === "guide_case" && a.entityId && (
                  <Link href={`/cases/${a.entityId}`} className="text-[11px] font-semibold text-accent hover:underline">
                    view case
                  </Link>
                )}
                <span className="shrink-0 text-[11px] text-mute font-num">{ageVerbose(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
