import { UsersRound, CheckCircle2, Clock, Flame, StickyNote, ShieldCheck, Phone, Mail } from "lucide-react";
import { Card, Badge, PageHeader, Reveal, Avatar, Stat } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { AddTeamMemberButton, EditTeamMemberButton } from "@/components/team-modals";
import { fetchGuideCases, getCatalogs } from "@/lib/data";
import { parseAbilities, ALL_ABILITIES } from "@/lib/permissions";
import { ageDays, ageLabel, currentMonthKey } from "@/lib/utils";

import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const LOAD_LIMIT = 10;

export default async function TeamPage() {
  const [guideCases, { staffList }, user] = await Promise.all([fetchGuideCases(), getCatalogs(), getCurrentUser()]);
  const isAdmin = user?.role === "admin";

  const mk = currentMonthKey();

  const plannerStats = staffList
    .filter((s) => s.role === "planner" || s.role === "admin")
    .map((s) => {
      const mine = guideCases.filter((c) => c.plannerId === s.id);
      const activeCases = mine.filter((c) => c.statusKind !== "terminal");
      const byStatus = new Map<string, { name: string; color: string; count: number }>();
      for (const c of activeCases) {
        const cur = byStatus.get(c.statusKey) ?? { name: c.statusName, color: c.statusColor, count: 0 };
        cur.count += 1;
        byStatus.set(c.statusKey, cur);
      }
      const deliveredMonth = mine.filter((c) => c.statusKey === "delivered" && c.monthKey === mk).length;
      const avgAge = activeCases.length
        ? Math.round(activeCases.reduce((a, c) => a + ageDays(c.statusSince), 0) / activeCases.length)
        : 0;
      const abilitiesList = parseAbilities(s.abilities);
      return {
        ...s,
        activeCases,
        total: mine.length,
        deliveredMonth,
        avgAge,
        abilitiesList,
        byStatus: [...byStatus.values()].sort((a, b) => b.count - a.count),
        overloaded: activeCases.length >= LOAD_LIMIT,
      };
    })
    .sort((a, b) => b.activeCases.length - a.activeCases.length);

  const nonPlanners = staffList.filter((s) => s.role !== "planner" && s.role !== "admin");
  const unassigned = guideCases.filter((c) => !c.plannerId && c.statusKind !== "terminal");

  const totalActive = guideCases.filter((c) => c.statusKind !== "terminal").length;
  const totalDeliveredMonth = guideCases.filter((c) => c.statusKey === "delivered" && c.monthKey === mk).length;
  const avgLoad = plannerStats.length ? (totalActive / plannerStats.length).toFixed(1) : "0";

  return (
    <div>
      <PageHeader
        title="Team & Planner Workload"
        subtitle="Manage staff profiles, assign operational roles & abilities, and monitor live planning workload across the lab."
        actions={isAdmin ? <AddTeamMemberButton /> : undefined}
      />

      <PageHelpGuide
        title="Team Workload & Role Assignment Guide"
        description="Every surgical guide case needs an assigned planner for CAD/CAM implant planning. Team members can be assigned granular abilities controlling what operations they are authorized to perform."
        tips={[
          {
            title: "Workload Balancing",
            desc: "Planners carrying over 10 active cases are flagged as High Load. Reassign cases from the Case Detail screen.",
          },
          {
            title: "Roles & Abilities",
            desc: "Click 'Edit' on any member to grant abilities like Case Planning, 3D Printing dispatch, or Catalog management.",
          },
          {
            title: "Case Accountability",
            desc: "Every status transition, order edit, and failure note is permanently timestamped with the acting team member's initials.",
          },
        ]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Planners"
          value={plannerStats.length}
          icon={<UsersRound />}
          sub={
            <span className="flex items-center gap-1">
              <span>with planning responsibility</span>
              <HelpTip title="Planners" content="Staff with 'cases:plan' ability eligible to be assigned as primary case designers." />
            </span>
          }
          tone="#6d4bbf"
        />
        <Stat
          label="Active cases"
          value={totalActive}
          icon={<StickyNote />}
          sub={
            <span className="flex items-center gap-1">
              <span>across the lab floor</span>
              <HelpTip title="Active Cases" content="All guide cases currently in non-terminal stages (excluding Delivered and Cancelled)." />
            </span>
          }
          tone="#2563eb"
        />
        <Stat
          label="Delivered this month"
          value={totalDeliveredMonth}
          icon={<CheckCircle2 />}
          sub="guide cases closed"
          tone="#16a34a"
        />
        <Stat
          label="Average load"
          value={avgLoad}
          icon={<Clock />}
          sub={
            <span className="flex items-center gap-1">
              <span>active cases per planner</span>
              <HelpTip title="Load Threshold" content="Calculated as (Total Active Cases / Available Planners). Over 10 indicates bottleneck." />
            </span>
          }
          tone="#d97706"
        />
      </div>

      {unassigned.length > 0 && (
        <Reveal className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber/40 bg-amber-soft px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 text-amber" />
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  {unassigned.length} active {unassigned.length === 1 ? "case is" : "cases are"} unassigned
                </p>
                <p className="text-[12px] text-ink-soft">
                  Cases sitting in TO CHECK without an assigned planner may delay turnaround.
                </p>
              </div>
            </div>
            <a
              href="/cases?plannerId="
              className="text-xs font-semibold text-amber hover:underline"
            >
              View unassigned cases →
            </a>
          </div>
        </Reveal>
      )}

      {/* Planners Grid */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-light text-ink">Active Planners & Workload</h2>
          <span className="text-xs text-mute font-num">{plannerStats.length} members</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plannerStats.map((p, i) => (
            <Reveal key={p.id} delay={0.05 * Math.min(i, 6)}>
              <Card hover className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={p.initials ?? p.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-ink">{p.name}</p>
                      {!p.active && <Badge tone="gray">Inactive</Badge>}
                    </div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-accent">{p.role}</p>
                    {(p.email || p.phone) && (
                      <p className="text-[11px] text-mute truncate mt-0.5">
                        {p.email || p.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isAdmin && <EditTeamMemberButton staff={p} />}
                    {p.overloaded && (
                      <Badge tone="red" className="gap-1">
                        <Flame className="h-3 w-3" />
                        high load
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-y border-line-soft py-3 text-center">
                  <div>
                    <p className="font-display text-xl font-light text-ink font-num">{p.activeCases.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-mute">active</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-light text-ink font-num">{p.deliveredMonth}</p>
                    <p className="text-[10px] uppercase tracking-wide text-mute">this month</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-light text-ink font-num">{p.avgAge}d</p>
                    <p className="text-[10px] uppercase tracking-wide text-mute">avg age</p>
                  </div>
                </div>

                {/* Abilities tags */}
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mute mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-accent" />
                    Abilities ({p.abilitiesList.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {p.abilitiesList.slice(0, 4).map((abKey) => {
                      const ab = ALL_ABILITIES.find((a) => a.key === abKey);
                      return (
                        <span
                          key={abKey}
                          className="rounded-md bg-paper-deep px-1.5 py-0.5 text-[10px] font-medium text-ink-soft"
                          title={ab?.description}
                        >
                          {ab?.label.split(" ")[0] || abKey}
                        </span>
                      );
                    })}
                    {p.abilitiesList.length > 4 && (
                      <span className="rounded-md bg-paper-deep px-1.5 py-0.5 text-[10px] text-mute">
                        +{p.abilitiesList.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex-1 space-y-1.5 border-t border-line-soft pt-3">
                  {p.byStatus.length === 0 && <p className="py-2 text-[12px] text-mute">No active cases — capacity available.</p>}
                  {p.byStatus.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] text-ink-soft">{s.name}</span>
                      <span className="ml-auto font-num text-[11px] font-semibold text-ink">{s.count}</span>
                    </div>
                  ))}
                </div>

                {p.activeCases.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-line-soft pt-2.5">
                    {p.activeCases
                      .sort((a, b) => a.statusSince.getTime() - b.statusSince.getTime())
                      .slice(0, 3)
                      .map((c) => (
                        <a
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px] transition hover:bg-paper"
                        >
                          <StatusBadge status={{ name: c.statusName, color: c.statusColor }} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-ink-soft">{c.doctor}</span>
                          <span className="text-[10px] uppercase tracking-wide text-mute font-num">{ageLabel(c.statusSince)}</span>
                        </a>
                      ))}
                    {p.activeCases.length > 3 && (
                      <p className="px-1.5 pt-0.5 text-[10px] font-semibold text-accent">+{p.activeCases.length - 3} more assigned cases</p>
                    )}
                  </div>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Other Team Members (Tech, Frontdesk) */}
      {nonPlanners.length > 0 && (
        <Reveal className="mt-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-light text-ink">Lab Techs & Front Desk Support</h2>
                <p className="text-xs text-mute">Logistics, 3D printing, dispatch, and receiving specialists</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nonPlanners.map((s) => {
                const abilities = parseAbilities(s.abilities);
                return (
                  <div key={s.id} className="flex items-start justify-between rounded-xl border border-line bg-paper/50 p-3.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Avatar name={s.initials ?? s.name} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                          {!s.active && <Badge tone="gray" className="text-[9px]">Inactive</Badge>}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{s.role}</p>
                        {s.email && <p className="text-[11px] text-mute truncate">{s.email}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {abilities.slice(0, 3).map((a) => (
                            <span key={a} className="rounded bg-white px-1.5 py-0.5 text-[9px] text-ink-soft border border-line-soft">
                              {a.split(":")[1] || a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isAdmin && <EditTeamMemberButton staff={s} />}
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
