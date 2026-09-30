import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  UserRound,
  Stethoscope,
  Cpu,
  Layers,
  FileText,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  Printer,
  Box,
  Scan,
} from "lucide-react";
import { Card, Badge, Reveal, Avatar } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { CaseActionBar } from "@/components/case-action-bar";
import { db } from "@/db";
import { hardwareOrders, packageTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  fetchGuideCases,
  fetchCaseHistory,
  fetchExtraDoctors,
  getCatalogs,
  getDoctors,
  getPatients,
  getStuckThreshold,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { ageDays, ageVerbose, daysBetween, fmtDate, fmtDateTime, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseId = parseInt(id, 10);
  if (Number.isNaN(caseId)) notFound();

  const [allCases, history, extraDocs, catalogs, doctors, patients, threshold, user, linkedOrders] = await Promise.all([
    fetchGuideCases(),
    fetchCaseHistory(caseId),
    fetchExtraDoctors(caseId),
    getCatalogs(),
    getDoctors(),
    getPatients(),
    getStuckThreshold(),
    getCurrentUser(),
    db
      .select({
        id: hardwareOrders.id,
        displayId: hardwareOrders.displayId,
        orderDate: hardwareOrders.orderDate,
        delivered: hardwareOrders.delivered,
        tier: packageTiers.name,
      })
      .from(hardwareOrders)
      .leftJoin(packageTiers, eq(hardwareOrders.packageTierId, packageTiers.id))
      .where(eq(hardwareOrders.linkedCaseId, caseId)),
  ]);

  const kase = allCases.find((c) => c.id === caseId);
  if (!kase) notFound();

  const stuck = kase.statusKind !== "terminal" && ageDays(kase.statusSince) > threshold;
  const turnaround =
    kase.statusKey === "delivered" && history.length > 0
      ? daysBetween(kase.createdAt, history[history.length - 1].createdAt)
      : null;

  const jointDoctors = extraDocs.filter((d) => d.id !== kase.doctorId);

  const flags = [
    { icon: Scan, label: "STL received", value: kase.stlReceived },
    { icon: Box, label: "Model received", value: kase.modelReceived },
    { icon: CircleDot, label: "Physio-dispenser", value: kase.physioDispenser },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <Link href="/cases" className="group inline-flex items-center gap-1.5 text-[12px] font-medium text-mute transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to cases
        </Link>
      </Reveal>

      {/* Header */}
      <Reveal delay={0.04}>
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[34px] font-light leading-none tracking-tight text-ink font-num">
                  {kase.displayId}
                </h1>
                <StatusBadge status={{ name: kase.statusName, color: kase.statusColor }} />
                <Badge tone="blue">{kase.typeName}</Badge>
                {jointDoctors.length > 0 && <Badge tone="violet">joint case</Badge>}
              </div>
              <p className="mt-2 text-[13px] text-mute">
                Created {fmtDate(kase.createdAt)} · {monthLabel(kase.monthKey)} sequence #{kase.seqNo}
                {turnaround !== null && (
                  <>
                    {" "}· <span className="font-semibold text-ink-soft">turnaround {turnaround}d to delivery</span>
                  </>
                )}
              </p>
              {stuck && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-[12px] font-semibold text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Stuck in {kase.statusName} for {ageDays(kase.statusSince)} days — threshold is {threshold}d
                </div>
              )}
            </div>
            <CaseActionBar
              kase={{
                id: kase.id,
                displayId: kase.displayId,
                doctorId: kase.doctorId,
                patientId: kase.patientId,
                caseTypeId: kase.caseTypeId,
                systemId: kase.systemId,
                sleeveId: kase.sleeveId,
                plannerId: kase.plannerId,
                statusId: kase.statusId,
                statusKey: kase.statusKey,
                statusName: kase.statusName,
                statusKind: kase.statusKind,
                teeth: kase.teeth,
                centre: kase.centre,
                address: kase.address,
                remarks: kase.remarks,
                kitNote: kase.kitNote,
                guideReport: kase.guideReport,
                stlReceived: kase.stlReceived,
                modelReceived: kase.modelReceived,
                physioDispenser: kase.physioDispenser,
              }}
              catalogs={catalogs}
              doctors={doctors}
              patients={patients}
              isAdmin={user?.role === "admin"}
              userRole={user?.role}
              userAbilities={user?.abilities}
              currentUserId={user?.id}
            />
          </div>
        </Card>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Details */}
          <Reveal delay={0.08}>
            <Card>
              <div className="border-b border-line-soft px-6 py-4">
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Case details</h2>
              </div>
              <dl className="grid gap-x-6 gap-y-5 px-6 py-5 sm:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <UserRound className="h-3 w-3" /> Patient
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-ink">{kase.patient}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <Stethoscope className="h-3 w-3" /> Doctor
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-ink">
                    <Link href={`/doctors/${kase.doctorId}`} className="hover:text-accent hover:underline">
                      {kase.doctor}
                    </Link>
                    {jointDoctors.map((d) => (
                      <span key={d.id}>
                        {" + "}
                        <Link href={`/doctors/${d.id}`} className="hover:text-accent hover:underline">
                          {d.name}
                        </Link>
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <Cpu className="h-3 w-3" /> Implant system
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-ink">{kase.system ?? "—"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <Layers className="h-3 w-3" /> Sleeve / kit
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-ink">{kase.sleeve ?? "—"}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <Printer className="h-3 w-3" /> Planner
                  </dt>
                  <dd className="mt-1 flex items-center gap-2 text-[14px] font-medium text-ink">
                    {kase.planner ? (
                      <>
                        <Avatar name={kase.plannerInitials ?? kase.planner} size={24} />
                        <Link href="/team" className="hover:text-accent hover:underline">{kase.planner}</Link>
                      </>
                    ) : (
                      <span className="text-mute">Unassigned</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <Clock className="h-3 w-3" /> In current status
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-ink">
                    {ageVerbose(kase.statusSince)}{" "}
                    <span className="text-mute">· since {fmtDateShortSafe(kase.statusSince)}</span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Region / tooth map</dt>
                  <dd className="mt-1.5">
                    {kase.teeth ? (
                      <span className="inline-block rounded-lg border border-line bg-paper/70 px-3 py-1.5 font-mono text-[13px] tracking-wide text-ink">
                        {kase.teeth}
                      </span>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                    <MapPin className="h-3 w-3" /> Centre & delivery address
                  </dt>
                  <dd className="mt-1 text-[14px] text-ink">
                    {kase.centre ?? "—"}
                    {kase.address && <span className="text-mute"> · {kase.address}</span>}
                  </dd>
                </div>
              </dl>
            </Card>
          </Reveal>

          {/* Remarks */}
          <Reveal delay={0.12}>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-mute" strokeWidth={1.8} />
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Remarks</h2>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-paper/60 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                {kase.remarks || "No remarks recorded."}
              </p>
              {(kase.kitNote || kase.guideReport) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {kase.kitNote && (
                    <div className="rounded-xl border border-line-soft bg-paper/40 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Kit note</p>
                      <p className="mt-1 text-[13px] text-ink-soft">{kase.kitNote}</p>
                    </div>
                  )}
                  {kase.guideReport && (
                    <div className="rounded-xl border border-line-soft bg-paper/40 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Guide report</p>
                      <p className="mt-1 text-[13px] text-ink-soft">{kase.guideReport}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Reveal>

          {/* History timeline */}
          <Reveal delay={0.16}>
            <Card>
              <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
                <h2 className="font-display text-lg font-light tracking-tight text-ink">Status history</h2>
                <Badge tone="gray" className="font-num">{history.length} transitions</Badge>
              </div>
              <ol className="relative px-6 py-5">
                {history.length === 0 && <p className="py-6 text-center text-[13px] text-mute">No transitions recorded.</p>}
                {history.map((h, i) => (
                  <li key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < history.length - 1 && (
                      <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />
                    )}
                    <span
                      className="relative z-10 mt-1 size-[15px] shrink-0 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: h.toColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[13px] font-medium text-ink">
                          {h.fromName ? (
                            <>
                              <span className="text-mute">{h.fromName}</span>
                              <span className="mx-1.5 text-mute">→</span>
                              <span className="font-semibold">{h.toName}</span>
                            </>
                          ) : (
                            <span className="font-semibold">{h.toName}</span>
                          )}
                        </p>
                        <span className="text-[11px] text-mute font-num">{fmtDateTime(h.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-mute">
                        {h.staffInitials && <Avatar name={h.staffInitials} size={18} />}
                        <span>{h.staff ?? "System"}</span>
                        {h.remark && (
                          <>
                            <span className="text-line">·</span>
                            <span className="text-ink-soft">“{h.remark}”</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Reveal delay={0.1}>
            <Card className="p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">Checklist</h2>
              <ul className="mt-3 space-y-2.5">
                {flags.map((f) => (
                  <li key={f.label} className="flex items-center justify-between rounded-lg border border-line-soft bg-paper/50 px-3 py-2">
                    <span className="flex items-center gap-2 text-[13px] text-ink-soft">
                      <f.icon className="h-3.5 w-3.5 text-mute" strokeWidth={1.9} />
                      {f.label}
                    </span>
                    {f.value ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" strokeWidth={2.2} />
                    ) : (
                      <span className="h-4 w-4 rounded-full border-2 border-line" />
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
                <h2 className="font-display text-base font-light tracking-tight text-ink">Linked hardware orders</h2>
                <Package className="h-4 w-4 text-mute" strokeWidth={1.8} />
              </div>
              <div className="divide-y divide-line-soft">
                {linkedOrders.length === 0 && (
                  <p className="px-5 py-6 text-center text-[12px] text-mute">
                    No hardware order linked to this guide case yet.
                  </p>
                )}
                {linkedOrders.map((o) => (
                  <Link key={o.id} href={`/orders/${o.id}`} className="group flex items-center justify-between px-5 py-3.5 transition hover:bg-paper/70">
                    <div>
                      <p className="text-[13px] font-semibold text-accent font-num group-hover:underline">{o.displayId}</p>
                      <p className="text-[11px] text-mute">{fmtDate(o.orderDate)} · {o.tier ?? "—"}</p>
                    </div>
                    {o.delivered ? <Badge tone="green">Delivered</Badge> : <Badge tone="amber">Pending</Badge>}
                  </Link>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.18}>
            <Card className="p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">Permanent record</h2>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-mute">Case ID</dt>
                  <dd className="font-mono text-ink-soft">G-{String(kase.id).padStart(5, "0")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mute">Month sequence</dt>
                  <dd className="font-num text-ink-soft">#{kase.seqNo} of {monthLabel(kase.monthKey)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mute">Last updated</dt>
                  <dd className="text-ink-soft">{fmtDateTime(kase.updatedAt)}</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-lg bg-paper/70 px-3 py-2 text-[11px] leading-relaxed text-mute">
                The display number resets each month for readability; the permanent ID is never reused.
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function fmtDateShortSafe(d: Date | string): string {
  return fmtDate(d);
}
