import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, StickyNote, Package, AlertTriangle, ChevronRight, Stethoscope, UserRound } from "lucide-react";
import { Card, Badge, EmptyState, Reveal, Avatar, Stat } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { fetchGuideCases, fetchOrders, getPatients, getDoctors } from "@/lib/data";
import { EditPatientButton } from "@/components/people-modals";
import { db } from "@/db";
import { hardwareItems, hardwareOrders, implantSystems } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { fmtDate, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patientId = parseInt(id, 10);
  if (Number.isNaN(patientId)) notFound();

  const [patients, guideCases, orders, doctors] = await Promise.all([
    getPatients(),
    fetchGuideCases(),
    fetchOrders(),
    getDoctors(),
  ]);

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) notFound();

  const pCases = guideCases.filter((c) => c.patientId === patientId);
  const pOrders = orders.filter((o) => o.patientId === patientId);
  const doctorName = pCases[0]?.doctor ?? pOrders[0]?.doctor ?? null;
  const doctorId = pCases[0]?.doctorId ?? pOrders[0]?.doctorId ?? null;

  const totalFailed = pOrders.reduce((a, o) => a + o.failedCount, 0);

  // Failure detail — join items → orders → this patient
  const orderIds = pOrders.map((o) => o.id);
  const failedItems =
    totalFailed > 0 && orderIds.length > 0
      ? await db
          .select({
            id: hardwareItems.id,
            orderId: hardwareItems.orderId,
            size: hardwareItems.size,
            qty: hardwareItems.qty,
            failNote: hardwareItems.failNote,
            orderDisplay: hardwareOrders.displayId,
            system: implantSystems.name,
          })
          .from(hardwareItems)
          .leftJoin(implantSystems, eq(hardwareItems.systemId, implantSystems.id))
          .leftJoin(hardwareOrders, eq(hardwareItems.orderId, hardwareOrders.id))
          .where(and(eq(hardwareItems.failed, true), inArray(hardwareItems.orderId, orderIds)))
      : [];

  type TimelineRow =
    | { kind: "guide"; at: Date; id: number; displayId: string; label: string; statusName: string; color: string }
    | { kind: "order"; at: Date; id: number; displayId: string; label: string; delivered: boolean };
  const timeline: TimelineRow[] = [
    ...pCases.map((c) => ({
      kind: "guide" as const,
      at: c.createdAt,
      id: c.id,
      displayId: c.displayId,
      label: `${c.typeName} · ${c.teeth ?? ""}`.trim(),
      statusName: c.statusName,
      color: c.statusColor,
    })),
    ...pOrders.map((o) => ({
      kind: "order" as const,
      at: o.createdAt,
      id: o.id,
      displayId: o.displayId,
      label: `${o.totalQty} implants · ${o.itemCount} lines${o.failedCount ? ` · ${o.failedCount} failed` : ""}`,
      delivered: o.delivered,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-5">
      <Reveal>
        <Link href="/patients" className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-mute transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to patients
        </Link>
      </Reveal>

      <Reveal delay={0.04}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={patient.name} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[30px] font-light leading-tight tracking-tight text-ink">{patient.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                {doctorName && doctorId && (
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-mute" />
                    <Link href={`/doctors/${doctorId}`} className="hover:text-accent hover:underline">{doctorName}</Link>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-mute" />
                  Patient #{patient.id}
                </span>
              </p>
            </div>
            <EditPatientButton patient={patient} doctors={doctors} />
          </div>
          {patient.notes && (
            <p className="mt-4 border-t border-line-soft pt-4 text-[13px] italic text-ink-soft">
              “{patient.notes}”
            </p>
          )}
        </Card>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Guide cases" value={pCases.length} icon={<StickyNote />} sub={`${pCases.filter((c) => c.statusKind !== "terminal").length} still active`} tone="#2563eb" />
          <Stat label="Hardware orders" value={pOrders.length} icon={<Package />} sub={`${pOrders.filter((o) => !o.delivered).length} pending delivery`} tone="#d97706" />
          <Stat label="Failed implants" value={totalFailed} icon={<AlertTriangle />} sub="across all orders" tone={totalFailed ? "#c2402f" : "#0d6e63"} />
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <Card>
          <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
            <h2 className="font-display text-lg font-light tracking-tight text-ink">Treatment timeline</h2>
            <Badge tone="gray" className="font-num">{timeline.length} records</Badge>
          </div>
          {timeline.length === 0 ? (
            <EmptyState icon={<UserRound />} title="No history yet" hint="Guide cases and hardware orders for this patient will appear here." />
          ) : (
            <ul className="divide-y divide-line-soft">
              {timeline.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={r.kind === "guide" ? `/cases/${r.id}` : `/orders/${r.id}`}
                    className="group flex items-center gap-4 px-6 py-3.5 transition hover:bg-paper/70"
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

      {totalFailed > 0 && (
        <Reveal delay={0.16}>
          <Card>
            <div className="flex items-center gap-2 border-b border-line-soft px-6 py-4">
              <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={1.8} />
              <h2 className="font-display text-lg font-light tracking-tight text-ink">Failure history</h2>
            </div>
            <ul className="divide-y divide-line-soft">
              {failedItems.map((f) => (
                <li key={f.id} className="px-6 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="red" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Failed
                    </Badge>
                    <span className="text-[13px] font-semibold text-ink">{f.system ?? "Unknown system"}</span>
                    {f.size && <span className="font-mono text-[12px] text-ink-soft">{f.size}</span>}
                    <span className="text-[12px] text-mute font-num">×{f.qty}</span>
                    <Link href={`/orders/${f.orderId}`} className="ml-auto text-[12px] font-semibold text-accent hover:underline">
                      {f.orderDisplay}
                    </Link>
                  </div>
                  {f.failNote && <p className="mt-1.5 text-[12px] italic text-ink-soft">“{f.failNote}”</p>}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
