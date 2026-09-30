import Link from "next/link";
import { Search, RotateCcw, Users, ChevronRight, StickyNote, Package, AlertTriangle } from "lucide-react";
import { Card, EmptyState, PageHeader, Avatar, Badge } from "@/components/ui";
import { FilterForm } from "@/components/forms";
import { AddPatientButton } from "@/components/people-modals";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { fetchGuideCases, fetchOrders, getPatients, getDoctors } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [patients, guideCases, orders, doctors] = await Promise.all([
    getPatients(),
    fetchGuideCases(),
    fetchOrders(),
    getDoctors(),
  ]);

  const q = (sp.q ?? "").toLowerCase();

  const rows = patients
    .map((p) => {
      const pCases = guideCases.filter((c) => c.patientId === p.id);
      const pOrders = orders.filter((o) => o.patientId === p.id);
      const failed = pOrders.reduce((a, o) => a + o.failedCount, 0);
      const lastActivity = [
        ...pCases.map((c) => c.createdAt.getTime()),
        ...pOrders.map((o) => o.createdAt.getTime()),
      ].sort((a, b) => b - a)[0];
      const doctor = guideCases.find((c) => c.patientId === p.id)?.doctor
        ?? orders.find((o) => o.patientId === p.id)?.doctor;
      return {
        ...p,
        doctor,
        guideCount: pCases.length,
        orderCount: pOrders.length,
        failed,
        lastActivity: lastActivity ? new Date(lastActivity) : null,
      };
    })
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.doctor ?? "").toLowerCase().includes(q))
    .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="A patient is always scoped to the doctor who referred them — their timeline shows guide cases and hardware orders together."
        actions={<AddPatientButton doctors={doctors.map((d) => ({ id: d.id, name: d.name }))} />}
      />

      <PageHelpGuide
        title="Patient Master & Unified Surgical Timelines"
        description="Patients are scoped to their referring doctor. Their master profile brings together every surgical guide planned and every hardware component ordered across all stages of treatment."
        tips={[
          {
            title: "Doctor Scoping",
            desc: "Patient identity is linked directly to the referring dentist. A patient cannot accidentally be assigned across unrelated doctors.",
          },
          {
            title: "Integrated Timeline",
            desc: "Click 'Timeline' on any patient to see their guide cases, fixture shipments, and failure history in chronological sequence.",
          },
          {
            title: "Failure Tracking",
            desc: "Any failed fixtures recorded on hardware orders appear in red with failure notes, ensuring replacement claims are tracked.",
          },
        ]}
      />

      <FilterForm className="mb-5">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search patient or doctor…"
              className="w-full rounded-lg border border-line bg-paper/50 py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-accent focus:bg-white"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-paper transition hover:bg-black">
            Search
          </button>
          <Link href="/patients" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] text-ink-soft transition hover:border-ink/40">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        </Card>
      </FilterForm>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<Users />} title="No patients found" hint="Patients are created when their first case or order is logged." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-4 py-3.5">Referred by</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Guide cases</th>
                  <th className="px-4 py-3.5 text-right">Hardware orders</th>
                  <th className="px-4 py-3.5 text-right">Failures</th>
                  <th className="px-4 py-3.5 text-right">Last activity</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {rows.map((p) => (
                  <tr key={p.id} className="group transition-colors hover:bg-paper/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.name} size={32} />
                        <span className="text-[13px] font-semibold text-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-soft">{p.doctor ?? "—"}</td>
                    <td className="max-w-[220px] px-4 py-3.5 text-[12px] italic text-mute">{p.notes ?? "—"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge tone="blue">{p.guideCount}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge tone="amber">{p.orderCount}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.failed > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-danger">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {p.failed}
                        </span>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[12px] text-mute whitespace-nowrap">
                      {p.lastActivity ? p.lastActivity.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="pr-5 py-3.5 text-right">
                      <Link href={`/patients/${p.id}`} className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-accent opacity-0 transition group-hover:opacity-100">
                        Timeline
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
