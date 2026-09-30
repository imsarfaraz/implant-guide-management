import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, StickyNote, Package, CheckCircle2, Timer, ChevronRight, Layers, Activity } from "lucide-react";
import { Card, Badge, EmptyState, Reveal, Avatar, Stat } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { fetchGuideCases, fetchOrders, getDoctors, fetchDoctorClinics } from "@/lib/data";
import { EditDoctorButton } from "@/components/people-modals";
import { db } from "@/db";
import { statusHistory, statuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ageVerbose, daysBetween, fmtDate, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctorId = parseInt(id, 10);
  if (Number.isNaN(doctorId)) notFound();

  const [doctors, guideCases, orders, clinics] = await Promise.all([
    getDoctors(),
    fetchGuideCases(),
    fetchOrders(),
    fetchDoctorClinics(doctorId),
  ]);

  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) notFound();

  const dCases = guideCases.filter((c) => c.doctorId === doctorId);
  const dOrders = orders.filter((o) => o.doctorId === doctorId);

  // Turnaround for delivered cases
  const deliveredCaseIds = dCases.filter((c) => c.statusKey === "delivered").map((c) => c.id);
  let avgTurnaround: number | null = null;
  if (deliveredCaseIds.length > 0) {
    const deliveredAt = await db
      .select({ caseId: statusHistory.caseId, at: statusHistory.createdAt })
      .from(statusHistory)
      .innerJoin(statuses, eq(statusHistory.toStatusId, statuses.id))
      .where(eq(statuses.key, "delivered"));
    const map = new Map(deliveredAt.map((r) => [r.caseId, r.at]));
    const spans = deliveredCaseIds
      .map((cid) => {
        const c = dCases.find((x) => x.id === cid)!;
        const end = map.get(cid);
        return end ? daysBetween(c.createdAt, end) : null;
      })
      .filter((s): s is number => s !== null);
    if (spans.length) avgTurnaround = Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);
  }

  // System preference
  const sysFreq = new Map<string, number>();
  for (const c of dCases) if (c.system) sysFreq.set(c.system, (sysFreq.get(c.system) ?? 0) + 1);
  const sysMax = Math.max(1, ...sysFreq.values());
  const topSystems = [...sysFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Case type distribution
  const typeFreq = new Map<string, number>();
  for (const c of dCases) typeFreq.set(c.typeName, (typeFreq.get(c.typeName) ?? 0) + 1);
  const topTypes = [...typeFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Monthly volume (last 6 months)
  const months: { key: string; label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      count: dCases.filter((c) => c.monthKey === key).length + dOrders.filter((o) => o.monthKey === key).length,
    });
  }
  const monthMax = Math.max(1, ...months.map((m) => m.count));

  // Timeline
  type TimelineRow =
    | { kind: "guide"; at: Date; id: number; displayId: string; label: string; statusName: string; color: string }
    | { kind: "order"; at: Date; id: number; displayId: string; label: string; delivered: boolean };
  const timeline: TimelineRow[] = [
    ...dCases.map((c) => ({
      kind: "guide" as const,
      at: c.createdAt,
      id: c.id,
      displayId: c.displayId,
      label: c.teeth ?? c.typeName,
      statusName: c.statusName,
      color: c.statusColor,
    })),
    ...dOrders.map((o) => ({
      kind: "order" as const,
      at: o.createdAt,
      id: o.id,
      displayId: o.displayId,
      label: `${o.totalQty} implants · ${o.itemCount} lines`,
      delivered: o.delivered,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const lastActivity = timeline[0]?.at;

  return (
    <div className="space-y-5">
      <Reveal>
        <Link href="/doctors" className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-mute transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to doctors
        </Link>
      </Reveal>

      <Reveal delay={0.04}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={doctor.name} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[30px] font-light leading-tight tracking-tight text-ink">{doctor.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-mute" />
                  {clinics.map((c) => c.area).join(" · ") || "No clinic on file"}
                </span>
                {lastActivity && <span className="text-mute">Last activity {ageVerbose(lastActivity)}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EditDoctorButton doctor={doctor} primaryClinic={clinics[0]} />
              <Link
                href={`/cases?doctorId=${doctor.id}`}
                className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink transition hover:border-ink/40"
              >
                View all cases
              </Link>
            </div>
          </div>
          {clinics.length > 0 && (
            <div className="mt-4 grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-2">
              {clinics.map((c) => (
                <div key={c.id} className="rounded-xl border border-line-soft bg-paper/50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-ink">
                    {c.area} {c.isPrimary && <Badge tone="teal" className="ml-1">primary</Badge>}
                  </p>
                  <p className="mt-0.5 text-[12px] text-mute">{c.address ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Guide cases" value={dCases.length} icon={<StickyNote />} sub={`${dCases.filter((c) => c.statusKind !== "terminal").length} still active`} tone="#2563eb" />
          <Stat label="Hardware orders" value={dOrders.length} icon={<Package />} sub={`${dOrders.filter((o) => !o.delivered).length} pending delivery`} tone="#d97706" />
          <Stat label="Delivered cases" value={deliveredCaseIds.length} icon={<CheckCircle2 />} sub="guide cases reaching DELIVERED" tone="#16a34a" />
          <Stat
            label="Avg turnaround"
            value={avgTurnaround !== null ? `${avgTurnaround}d` : "—"}
            icon={<Timer />}
            sub={avgTurnaround !== null ? "creation → delivered" : "no delivered cases yet"}
            tone="#0d6e63"
          />
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal delay={0.12} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-mute" strokeWidth={1.8} />
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Activity timeline</h2>
              </div>
              <Badge tone="gray" className="font-num">{timeline.length} records</Badge>
            </div>
            {timeline.length === 0 ? (
              <EmptyState icon={<StickyNote />} title="No history yet" hint="Cases and orders for this doctor will appear here." />
            ) : (
              <ul className="divide-y divide-line-soft">
                {timeline.slice(0, 30).map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <Link
                      href={r.kind === "guide" ? `/cases/${r.id}` : `/orders/${r.id}`}
                      className="group flex items-center gap-4 px-6 py-3 transition hover:bg-paper/70"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          r.kind === "guide" ? "bg-[#e8effc] text-[#2b5cb8]" : "bg-amber-soft text-amber"
                        }`}
                      >
                        {r.kind === "guide" ? <StickyNote className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">{r.displayId}</p>
                        <p className="truncate text-[12px] text-mute">{r.label}</p>
                      </div>
                      <div className="shrink-0">
                        {r.kind === "guide" ? (
                          <StatusBadge status={{ name: r.statusName, color: r.color }} size="sm" />
                        ) : r.delivered ? (
                          <Badge tone="green">Delivered</Badge>
                        ) : (
                          <Badge tone="amber">Pending</Badge>
                        )}
                      </div>
                      <span className="w-20 shrink-0 text-right text-[11px] text-mute font-num">{fmtDate(r.at)}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-mute transition group-hover:text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        <div className="space-y-5">
          <Reveal delay={0.16}>
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-mute" strokeWidth={1.8} />
                <h2 className="font-display text-base font-light tracking-tight text-ink">Preferred systems</h2>
              </div>
              <div className="mt-4 space-y-3">
                {topSystems.map(([name, count]) => (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink-soft">{name}</span>
                      <span className="font-num text-mute">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${(count / sysMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {topSystems.length === 0 && <p className="text-[12px] text-mute">No cases yet.</p>}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="p-5">
              <h2 className="font-display text-base font-light tracking-tight text-ink">Case mix</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topTypes.map(([name, count]) => (
                  <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                    {name}
                    <span className="font-num text-mute">{count}</span>
                  </span>
                ))}
                {topTypes.length === 0 && <p className="text-[12px] text-mute">No cases yet.</p>}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.24}>
            <Card className="p-5">
              <h2 className="font-display text-base font-light tracking-tight text-ink">Monthly volume</h2>
              <div className="mt-4 flex items-end justify-between gap-2">
                {months.map((m) => (
                  <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink font-num">{m.count}</span>
                    <div
                      className="w-full rounded-t-md bg-ink/80 transition-all duration-500"
                      style={{ height: `${Math.max(3, (m.count / monthMax) * 56)}px`, opacity: m.key === months[5].key ? 1 : 0.35 }}
                    />
                    <span className="text-[10px] uppercase tracking-wide text-mute">{m.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-line-soft pt-3 text-[10px] uppercase tracking-[0.12em] text-mute">
                {monthLabel(months[0].key)} — {monthLabel(months[5].key)}
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
