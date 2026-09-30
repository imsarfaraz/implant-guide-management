import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  UserRound,
  Stethoscope,
  AlertTriangle,
  Link2,
  FileText,
  Boxes,
  CircleDot,
  Truck,
  CalendarClock,
} from "lucide-react";
import { Card, Badge, EmptyState, Reveal, Avatar } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { OrderActionBar, ItemFailureButton } from "@/components/order-action-bar";
import { ACCESSORY_KIND_LABEL } from "@/components/forms";
import {
  fetchOrders,
  fetchOrderItems,
  fetchOrderAccessories,
  fetchGuideCases,
  getCatalogs,
} from "@/lib/data";
import { fmtDate, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (Number.isNaN(orderId)) notFound();

  const [allOrders, items, accessories, guideCasesAll, { tiers, statusList }] = await Promise.all([
    fetchOrders(),
    fetchOrderItems(orderId),
    fetchOrderAccessories(orderId),
    fetchGuideCases(),
    getCatalogs(),
  ]);

  const order = allOrders.find((o) => o.id === orderId);
  if (!order) notFound();

  const caseOptions = guideCasesAll
    .filter((c) => c.patientId === order.patientId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12)
    .map((c) => ({ id: c.id, displayId: c.displayId, doctor: c.doctor, patient: c.patient }));

  const linkedCase = order.linkedCaseId
    ? guideCasesAll.find((c) => c.id === order.linkedCaseId)
    : undefined;

  const totalImplants = items.reduce((a, i) => a + i.qty, 0);
  const failedItems = items.filter((i) => i.failed);
  const totalAccessories = accessories.reduce((a, x) => a + x.qty, 0);

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
                  {order.displayId}
                </h1>
                {order.delivered ? <Badge tone="green">Delivered</Badge> : <Badge tone="amber">Pending delivery</Badge>}
                {order.tier && <Badge tone="outline">{order.tier}</Badge>}
                {failedItems.length > 0 && <Badge tone="red">{failedItems.length} failed</Badge>}
              </div>
              <p className="mt-2 text-[13px] text-mute">
                Placed {fmtDate(order.orderDate)} · {monthLabel(order.monthKey)} sequence #{order.seqNo}
                {order.deliveryDate && <> · delivered {fmtDate(order.deliveryDate)}</>}
              </p>
            </div>
            <OrderActionBar
              order={{
                id: order.id,
                displayId: order.displayId,
                packageTierId: order.packageTierId,
                orderDate: order.orderDate,
                deliveryDate: order.deliveryDate,
                delivered: order.delivered,
                remarks: order.remarks,
                linkedCaseId: order.linkedCaseId,
              }}
              tiers={tiers}
              caseOptions={caseOptions}
            />
          </div>
        </Card>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Implant lines */}
          <Reveal delay={0.08}>
            <Card>
              <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-mute" strokeWidth={1.8} />
                  <h2 className="font-display text-lg font-light tracking-tight text-ink">Implant lines</h2>
                </div>
                <Badge tone="gray" className="font-num">{items.length} line{items.length === 1 ? "" : "s"} · {totalImplants} implant{totalImplants === 1 ? "" : "s"}</Badge>
              </div>
              {items.length === 0 ? (
                <EmptyState icon={<Package />} title="No implant lines" hint="Edit the order to add structured line items." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                        <th className="px-6 py-3">System</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Cover screws</th>
                        <th className="px-4 py-3 text-right">Physio</th>
                        <th className="px-4 py-3">Failure</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {items.map((it) => (
                        <tr key={it.id} className="transition-colors hover:bg-paper/60">
                          <td className="px-6 py-3.5 text-[13px] font-medium text-ink">{it.system ?? "—"}</td>
                          <td className="px-4 py-3.5 font-mono text-[13px] text-ink-soft">{it.size ?? "—"}</td>
                          <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-ink font-num">{it.qty}</td>
                          <td className="px-4 py-3.5 text-right text-[13px] text-ink-soft font-num">{it.coverScrewQty || "—"}</td>
                          <td className="px-4 py-3.5 text-right text-[13px] text-ink-soft font-num">{it.physioQty || "—"}</td>
                          <td className="px-4 py-3.5">
                            {it.failed ? (
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-danger">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {it.failNote ?? "Failed"}
                              </span>
                            ) : (
                              <span className="text-[12px] text-mute">ok</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <ItemFailureButton item={it} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </Reveal>

          {/* Accessories */}
          <Reveal delay={0.12}>
            <Card>
              <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
                <div className="flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-mute" strokeWidth={1.8} />
                  <h2 className="font-display text-lg font-light tracking-tight text-ink">Accessories</h2>
                </div>
                <Badge tone="gray" className="font-num">{accessories.length} line{accessories.length === 1 ? "" : "s"} · {totalAccessories} unit{totalAccessories === 1 ? "" : "s"}</Badge>
              </div>
              {accessories.length === 0 ? (
                <p className="px-6 py-8 text-center text-[13px] text-mute">
                  No structured accessory lines — healing caps, abutments and screws live here instead of a free-text cell.
                </p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {accessories.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
                      <Badge tone="teal">{ACCESSORY_KIND_LABEL[a.kind] ?? a.kind}</Badge>
                      <span className="text-[13px] font-medium text-ink">{a.detail ?? "—"}</span>
                      <span className="ml-auto text-[13px] font-semibold text-ink-soft font-num">×{a.qty}</span>
                      {a.note && <span className="w-full text-[12px] italic text-mute">“{a.note}”</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Reveal delay={0.1}>
            <Card className="p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">Doctor & patient</h2>
              <div className="mt-3 space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={order.doctor} size={32} />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-mute">Doctor</p>
                    <Link href={`/doctors/${order.doctorId}`} className="text-[13px] font-semibold text-ink hover:text-accent hover:underline">
                      {order.doctor}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar name={order.patient} size={32} />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-mute">Patient</p>
                    <Link href={`/patients/${order.patientId}`} className="text-[13px] font-semibold text-ink hover:text-accent hover:underline">
                      {order.patient}
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card className="p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">Delivery</h2>
              <div className="mt-3 space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <CalendarClock className="h-3.5 w-3.5 text-mute" /> Ordered
                  </span>
                  <span className="font-medium text-ink font-num">{fmtDate(order.orderDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <Truck className="h-3.5 w-3.5 text-mute" /> Delivered
                  </span>
                  <span className="font-medium text-ink font-num">
                    {order.delivered ? fmtDate(order.deliveryDate) : order.deliveryDate ? `due ${fmtDate(order.deliveryDate)}` : "unconfirmed"}
                  </span>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.18}>
            <Card>
              <div className="border-b border-line-soft px-5 py-4">
                <h2 className="font-display text-base font-light tracking-tight text-ink">Linked guide case</h2>
              </div>
              <div className="px-5 py-4">
                {linkedCase ? (
                  <Link href={`/cases/${linkedCase.id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3 transition hover:border-accent/50">
                    <div>
                      <p className="text-[13px] font-semibold text-accent font-num">{linkedCase.displayId}</p>
                      <p className="mt-0.5 text-[11px] text-mute">{linkedCase.doctor} · {linkedCase.patient}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={{ name: linkedCase.statusName, color: linkedCase.statusColor }} size="sm" />
                      <Link2 className="h-3.5 w-3.5 text-mute transition group-hover:text-accent" />
                    </div>
                  </Link>
                ) : (
                  <p className="text-[12px] leading-relaxed text-mute">
                    Not linked. When an order follows a guide case, link it from Edit order to build the patient's treatment timeline.
                  </p>
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.22}>
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-mute" strokeWidth={1.8} />
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">Remarks</h2>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-paper/60 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                {order.remarks || "No remarks recorded."}
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
