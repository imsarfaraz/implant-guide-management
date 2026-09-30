import Link from "next/link";
import { Search, RotateCcw, ArrowLeft, ArrowRight, ChevronRight, StickyNote, Package } from "lucide-react";
import { Card, Badge, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { FilterForm } from "@/components/forms";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import {
  fetchGuideCases,
  fetchOrders,
  getCatalogs,
  getDoctors,
  type GuideCaseRow,
  type OrderRow,
} from "@/lib/data";
import { db } from "@/db";
import { hardwareItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { ageLabel, fmtDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Row =
  | (GuideCaseRow & { kind: "guide" })
  | (OrderRow & { kind: "order" });

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [guideCases, orders, { statusList, systems, staffList }, doctors, allItems, currentUser] = await Promise.all([
    fetchGuideCases(),
    fetchOrders(),
    getCatalogs(),
    getDoctors(),
    db.select().from(hardwareItems),
    getCurrentUser(),
  ]);

  const q = (sp.q ?? "").toLowerCase();
  const type = sp.type ?? "all";
  const statusKey = sp.status ?? "";
  const doctorId = sp.doctorId ?? "";
  const systemId = sp.systemId ?? "";
  const plannerId = sp.plannerId ?? "";
  const centre = (sp.centre ?? "").toLowerCase();
  const from = sp.from ?? "";
  const to = sp.to ?? "";

  const orderSystemMap = new Map<number, Set<number>>();
  for (const it of allItems) {
    if (!it.systemId) continue;
    const set = orderSystemMap.get(it.orderId) ?? new Set<number>();
    set.add(it.systemId);
    orderSystemMap.set(it.orderId, set);
  }

  const rows: Row[] = [];

  if (type !== "order") {
    for (const c of guideCases) {
      if (currentUser?.role === "planner" && !currentUser?.globalAccess && c.plannerId !== currentUser.id) continue;
      if (statusKey && c.statusKey !== statusKey) continue;
      if (doctorId && c.doctorId !== parseInt(doctorId, 10)) continue;
      if (systemId && c.systemId !== parseInt(systemId, 10)) continue;
      if (plannerId && c.plannerId !== parseInt(plannerId, 10)) continue;
      if (centre && !(c.centre ?? "").toLowerCase().includes(centre)) continue;
      if (from && c.createdAt.toISOString().slice(0, 10) < from) continue;
      if (to && c.createdAt.toISOString().slice(0, 10) > to) continue;
      if (q) {
        const hay = [c.displayId, c.doctor, c.patient, c.teeth, c.remarks, c.system, c.typeName, c.planner]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({ ...c, kind: "guide" });
    }
  }

  if (type !== "guide") {
    for (const o of orders) {
      if (doctorId && o.doctorId !== parseInt(doctorId, 10)) continue;
      if (systemId && !(orderSystemMap.get(o.id)?.has(parseInt(systemId, 10)) ?? false)) continue;
      // A guide-pipeline status filter (e.g. TO PRINT) shouldn't surface orders
      if (statusKey && statusKey !== "delivered" && statusKey !== "pending") continue;
      if (statusKey === "delivered" && !o.delivered) continue;
      if (statusKey === "pending" && o.delivered) continue;
      if (plannerId) continue; // orders have no planner
      if (from && (o.orderDate ?? "") < from) continue;
      if (to && (o.orderDate ?? "") > to) continue;
      if (q) {
        const hay = [o.displayId, o.doctor, o.patient, o.remarks, o.tier]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({ ...o, kind: "order" });
    }
  }

  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const countGuide = rows.filter((r) => r.kind === "guide").length;
  const countOrder = rows.filter((r) => r.kind === "order").length;

  const planners = staffList.filter((s) => s.role === "planner" || s.role === "admin");

  const qs = (over: Record<string, string | undefined>) => {
    const merged = new URLSearchParams();
    const base: Record<string, string | undefined> = { ...sp, page: undefined, ...over };
    for (const [k, v] of Object.entries(base)) {
      if (v !== undefined && v !== "" && k !== "page") merged.set(k, v);
    }
    const s = merged.toString();
    return s ? `/cases?${s}` : "/cases";
  };

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle="One continuous dataset — guide cases and hardware orders, filterable instead of forked every month."
      />

      <PageHelpGuide
        title="Unified Case & Order Directory"
        description="Search, filter, and trace both surgical guide cases and hardware orders in a single searchable table. Each record maintains an immutable permanent ID while displaying the familiar monthly sequence number."
        tips={[
          {
            title: "Multi-Filter Search",
            desc: "Combine Doctor, Implant Brand, Planner, and Centre to pinpoint specific case clusters without jumping between Excel sheets.",
          },
          {
            title: "Type Toggle Tabs",
            desc: "Switch between All Records, Guide Cases (with CAD planning), and Hardware Orders (implant fixtures & components).",
          },
          {
            title: "Permanent vs Month IDs",
            desc: "Display numbers (e.g. G-2026-03-012) reset each month for clinic readability, while database IDs are never reused.",
          },
        ]}
      />

      {/* Type tabs */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        {[
          { key: "all", label: "All", count: rows.length },
          { key: "guide", label: "Guide cases", count: countGuide, icon: StickyNote },
          { key: "order", label: "Hardware orders", count: countOrder, icon: Package },
        ].map((t) => (
          <Link
            key={t.key}
            href={qs({ type: t.key })}
            className={cn(
              "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
              (sp.type ?? "all") === t.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
            <span className={cn("font-num", (sp.type ?? "all") === t.key ? "text-paper/60" : "text-mute")}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <FilterForm className="mb-5">
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
              <input
                type="text"
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Search id, doctor, patient, teeth…"
                className="w-full rounded-lg border border-line bg-paper/50 py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-accent focus:bg-white"
              />
            </div>
            <select name="status" defaultValue={statusKey} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent">
              <option value="">Any status</option>
              {type === "order" ? (
                <>
                  <option value="pending">Pending delivery</option>
                  <option value="delivered">Delivered</option>
                </>
              ) : (
                statusList.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))
              )}
            </select>
            <select name="doctorId" defaultValue={doctorId} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent">
              <option value="">Any doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select name="systemId" defaultValue={systemId} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent">
              <option value="">Any implant system</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select name="plannerId" defaultValue={plannerId} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent">
              <option value="">Any planner</option>
              {planners.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="centre"
              defaultValue={sp.centre ?? ""}
              placeholder="Centre / area (e.g. Mulund)"
              className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="from" defaultValue={from} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent" />
              <input type="date" name="to" defaultValue={to} className="rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] outline-none focus:border-accent" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-paper transition hover:bg-black">
                Filter
              </button>
              <Link href="/cases" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] text-ink-soft transition hover:border-ink/40">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Link>
            </div>
          </div>
        </Card>
      </FilterForm>

      {/* Table */}
      <Card className="overflow-hidden">
        {pageRows.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No cases match these filters"
            hint="Try widening the date range or clearing the search — everything lives in one continuous dataset."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                  <th className="px-5 py-3.5">Case</th>
                  <th className="px-4 py-3.5">Doctor</th>
                  <th className="px-4 py-3.5">Patient</th>
                  <th className="px-4 py-3.5">Detail</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Planner / Tier</th>
                  <th className="px-4 py-3.5">Centre</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {pageRows.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="group transition-colors hover:bg-paper/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {r.kind === "guide" ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e8effc] text-[#2b5cb8]">
                            <StickyNote className="h-3.5 w-3.5" strokeWidth={1.9} />
                          </span>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-soft text-amber">
                            <Package className="h-3.5 w-3.5" strokeWidth={1.9} />
                          </span>
                        )}
                        <span className="text-[13px] font-semibold text-accent font-num">{r.displayId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-ink">{r.doctor}</td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-soft">{r.patient}</td>
                    <td className="max-w-[220px] px-4 py-3.5 text-[12px] text-ink-soft">
                      {r.kind === "guide" ? (
                        <span className="truncate">{r.teeth || r.typeName}</span>
                      ) : (
                        <span>
                          {r.totalQty} implant{r.totalQty === 1 ? "" : "s"} · {r.itemCount} line{r.itemCount === 1 ? "" : "s"}
                          {r.accCount > 0 && ` · ${r.accCount} acc.`}
                          {r.failedCount > 0 && <span className="font-semibold text-danger"> · {r.failedCount} failed</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.kind === "guide" ? (
                        <StatusBadge status={{ name: r.statusName, color: r.statusColor }} size="sm" />
                      ) : r.delivered ? (
                        <Badge tone="green">Delivered</Badge>
                      ) : (
                        <Badge tone="amber">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-ink-soft">
                      {r.kind === "guide" ? (r.planner ?? <span className="text-mute">unassigned</span>) : (r.tier ?? "—")}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-ink-soft">{r.kind === "guide" ? r.centre ?? "—" : "—"}</td>
                    <td className="px-4 py-3.5 text-right text-[12px] text-mute font-num whitespace-nowrap">
                      {r.kind === "guide" ? fmtDate(r.createdAt) : fmtDate(r.orderDate)}
                      {r.kind === "guide" && r.statusKind !== "terminal" && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-mute">{ageLabel(r.statusSince)}</span>
                      )}
                    </td>
                    <td className="pr-5 py-3.5 text-right">
                      <Link
                        href={r.kind === "guide" ? `/cases/${r.id}` : `/orders/${r.id}`}
                        className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-accent opacity-0 transition group-hover:opacity-100"
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-line-soft px-5 py-3.5">
            <p className="text-[12px] text-mute font-num">
              {rows.length} record{rows.length === 1 ? "" : "s"} · page {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {safePage > 1 ? (
                <Link href={qs({ page: String(safePage - 1) })} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium transition hover:border-ink/40">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-[12px] text-mute">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Prev
                </span>
              )}
              {safePage < totalPages ? (
                <Link href={qs({ page: String(safePage + 1) })} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium transition hover:border-ink/40">
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-[12px] text-mute">
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
