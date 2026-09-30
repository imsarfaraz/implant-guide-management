import Link from "next/link";
import { Search, RotateCcw, UserRound, ChevronRight, StickyNote, Package, MapPin } from "lucide-react";
import { Card, EmptyState, PageHeader, Avatar, Badge } from "@/components/ui";
import { FilterForm } from "@/components/forms";
import { AddDoctorButton } from "@/components/people-modals";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { fetchGuideCases, fetchOrders, getDoctors } from "@/lib/data";
import { db } from "@/db";
import { doctorClinics } from "@/db/schema";
import { ageVerbose } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [doctors, guideCases, orders, clinics] = await Promise.all([
    getDoctors(),
    fetchGuideCases(),
    fetchOrders(),
    db.select().from(doctorClinics),
  ]);

  const q = (sp.q ?? "").toLowerCase();

  const rows = doctors
    .map((d) => {
      const dCases = guideCases.filter((c) => c.doctorId === d.id);
      const dOrders = orders.filter((o) => o.doctorId === d.id);
      const sysFreq = new Map<string, number>();
      for (const c of dCases) if (c.system) sysFreq.set(c.system, (sysFreq.get(c.system) ?? 0) + 1);
      const topSystems = [...sysFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
      const lastActivity = [
        ...dCases.map((c) => c.createdAt.getTime()),
        ...dOrders.map((o) => o.createdAt.getTime()),
      ].sort((a, b) => b - a)[0];
      return {
        ...d,
        clinics: clinics.filter((c) => c.doctorId === d.id),
        guideCount: dCases.length,
        orderCount: dOrders.length,
        topSystems,
        lastActivity: lastActivity ? new Date(lastActivity) : null,
      };
    })
    .filter((d) => !q || d.name.toLowerCase().includes(q) || d.clinics.some((c) => c.area.toLowerCase().includes(q)))
    .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Every referring dentist with their full case history, preferred systems and known clinic addresses."
        actions={<AddDoctorButton />}
      />

      <PageHelpGuide
        title="Clinician Directory & Multi-Clinic Mapping"
        description="Dentists in Mumbai often practice across multiple clinics (e.g. Mulund, Vile Parle, Kharghar). The platform tracks all operating centres for each doctor and maps preferred implant systems."
        tips={[
          {
            title: "Adding Clinicians",
            desc: "Click 'Add doctor' to register a new dentist with their primary clinic area. Additional clinic locations can be attached per case.",
          },
          {
            title: "Clinician Profiles",
            desc: "Click any doctor to inspect total historical cases, orders placed, average turnaround time to delivery, and top implant systems.",
          },
          {
            title: "Joint Cases",
            desc: "When two surgeons collaborate on an All-on-4 case, both doctors can be linked to the same surgical guide.",
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
              placeholder="Search doctor or area (e.g. Mulund)…"
              className="w-full rounded-lg border border-line bg-paper/50 py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-accent focus:bg-white"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-paper transition hover:bg-black">
            Search
          </button>
          <Link href="/doctors" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] text-ink-soft transition hover:border-ink/40">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Link>
        </Card>
      </FilterForm>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((d, i) => (
          <Link key={d.id} href={`/doctors/${d.id}`} className="group">
            <Card hover className="h-full p-5">
              <div className="flex items-start gap-3.5">
                <Avatar name={d.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink group-hover:text-accent">{d.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-mute">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {d.clinics.map((c) => c.area).join(" · ") || "—"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge tone="blue" className="gap-1">
                  <StickyNote className="h-3 w-3" />
                  {d.guideCount} cases
                </Badge>
                <Badge tone="amber" className="gap-1">
                  <Package className="h-3 w-3" />
                  {d.orderCount} orders
                </Badge>
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {d.topSystems.length === 0 && <span className="text-[11px] text-mute">No systems yet</span>}
                {d.topSystems.map((s) => (
                  <span key={s} className="rounded-full bg-paper-deep px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-3 border-t border-line-soft pt-3 text-[11px] text-mute">
                {d.lastActivity ? `Last activity ${ageVerbose(d.lastActivity)}` : "No activity yet"}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <EmptyState icon={<UserRound />} title="No doctors found" hint="Try a different search, or add a doctor when creating the first case." />
      )}
    </div>
  );
}
