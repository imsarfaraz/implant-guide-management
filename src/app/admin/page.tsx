import {
  Cpu,
  Layers,
  StickyNote,
  ListOrdered,
  UsersRound,
  Package,
  Settings2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Card, PageHeader, Badge, EmptyState, Reveal } from "@/components/ui";
import { ToggleActive, SleeveCompatEditor, CatalogAddForm, ThresholdForm, LabNameForm } from "@/components/admin-controls";
import { HelpTip, PageHelpGuide } from "@/components/help-tip";
import { getCatalogs } from "@/lib/data";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { addCatalogEntry, updateThreshold, updateLabName } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";



function Section({
  icon: Icon,
  title,
  hint,
  children,
  footer,
}: {
  icon: typeof Cpu;
  title: string;
  hint: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line-soft px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <div>
          <h2 className="font-display text-base font-light tracking-tight text-ink">{title}</h2>
          <p className="text-[11px] text-mute">{hint}</p>
        </div>
      </div>
      {children}
      {footer}
    </Card>
  );
}

export default async function AdminPage() {
  const [user, catalogs, settingsRows] = await Promise.all([
    getCurrentUser(),
    getCatalogs(),
    db.select().from(appSettings),
  ]);

  if (!user || user.role !== "admin") {
    return (
      <div>
        <PageHeader title="Admin" subtitle="Catalog management" />
        <EmptyState
          icon={<ShieldAlert />}
          title="Admins only"
          hint={`You are signed in as ${user?.name || "a guest"} (${user?.role || "unknown"}). Switch to an admin user from the top bar to manage catalogs.`}
        />
      </div>
    );
  }

  const settings = new Map(settingsRows.map((s) => [s.key, s.value]));
  const staff = catalogs.staffList;

  return (
    <div>
      <PageHeader
        title="Catalogs & settings"
        subtitle="Managed lists stop the spelling drift — Osstem stays Osstem, and the pipeline stays one pipeline. Admin-only."
      />

      <PageHelpGuide
        title="Master Catalogs & Lab Governance"
        description="Standardized catalogs prevent historical spelling drift (e.g. Osstem vs Osttem). Modifying catalogs updates dropdowns across all case intake forms and preserves historical records."
        tips={[
          {
            title: "Sleeve Compatibility",
            desc: "Use the Sleeve & Kit matrix to tag which sleeve designs fit specific implant systems (e.g. Osstem Sleeveless fits only Osstem).",
          },
          {
            title: "Toggling Inactive",
            desc: "Instead of deleting brands or sleeves used in past cases, toggle them to Inactive to hide them from new intake forms without breaking historical reports.",
          },
          {
            title: "Stuck Threshold",
            desc: "Configure how many days a case can sit in non-terminal stages before being flagged in red on the floor board (default: 3 days).",
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Systems */}
        <Reveal>
          <Section icon={Cpu} title="Implant systems" hint="The standardized brand catalog" footer={<CatalogAddForm kind="systems" fields={[]} placeholder="New system name (e.g. Southern Implants)" buttonLabel="Add system" />}>
            <ul className="divide-y divide-line-soft">
              {catalogs.systems.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    {s.name}
                    {!s.active && <Badge tone="gray">inactive</Badge>}
                  </span>
                  <ToggleActive kind="systems" id={s.id} active={s.active} />
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        {/* Sleeves + compat */}
        <Reveal delay={0.05}>
          <Section icon={Layers} title="Sleeves & kits" hint="Compatibility matrix — click a system chip to link/unlink" footer={<CatalogAddForm kind="sleeves" fields={[]} placeholder="New sleeve / kit name" buttonLabel="Add sleeve" />}>
            <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
              <SleeveCompatEditor sleeves={catalogs.sleeves} systems={catalogs.systems} compat={catalogs.compat} />
              {catalogs.sleeves.filter((s) => !s.active).length > 0 && (
                <p className="text-[11px] text-mute">
                  {catalogs.sleeves.filter((s) => !s.active).length} inactive sleeves hidden above
                </p>
              )}
            </div>
          </Section>
        </Reveal>

        {/* Case types */}
        <Reveal delay={0.08}>
          <Section icon={StickyNote} title="Case types" hint="The service products the lab sells" footer={<CatalogAddForm kind="types" fields={[{ name: "code", placeholder: "CODE" }]} placeholder="New case type name" buttonLabel="Add type" />}>
            <ul className="divide-y divide-line-soft">
              {catalogs.types.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-3 text-[13px] text-ink">
                    <code className="rounded bg-paper-deep px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">{t.code}</code>
                    <span className="font-medium">{t.name}</span>
                    {!t.active && <Badge tone="gray">inactive</Badge>}
                  </span>
                  <ToggleActive kind="types" id={t.id} active={t.active} />
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        {/* Statuses */}
        <Reveal delay={0.12}>
          <Section icon={ListOrdered} title="Pipeline statuses" hint="The one true pipeline — no free-text drift" footer={<CatalogAddForm kind="statuses" fields={[{ name: "color", placeholder: "#hex color", type: "color" }]} placeholder="New status name" buttonLabel="Add status" />}>
            <ul className="divide-y divide-line-soft">
              {catalogs.statusList.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                    <Badge tone="outline" className="text-[10px]">{s.kind}</Badge>
                  </span>
                  <span className="text-[11px] text-mute font-num">#{s.sortOrder}</span>
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        {/* Staff */}
        <Reveal delay={0.15}>
          <Section icon={UsersRound} title="Staff / planners" hint="Attribution for every action" footer={<CatalogAddForm kind="staff" fields={[{ name: "role", placeholder: "planner | frontdesk | admin" }]} placeholder="Staff member name" buttonLabel="Add staff" />}>
            <ul className="divide-y divide-line-soft">
              {staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-3 text-[13px] text-ink">
                    <span className="font-medium">{s.name}</span>
                    <Badge tone={s.role === "admin" ? "violet" : s.role === "planner" ? "blue" : "gray"}>{s.role}</Badge>
                    {!s.active && <Badge tone="gray">inactive</Badge>}
                  </span>
                  <ToggleActive kind="staff" id={s.id} active={s.active} />
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        {/* Tiers */}
        <Reveal delay={0.18}>
          <Section icon={Package} title="Package tiers" hint="Hardware order service levels" footer={<CatalogAddForm kind="tiers" fields={[]} placeholder="New tier name" buttonLabel="Add tier" />}>
            <ul className="divide-y divide-line-soft">
              {catalogs.tiers.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <span className="flex items-center gap-2.5 text-[13px] font-medium text-ink">
                    {t.name}
                    {!t.active && <Badge tone="gray">inactive</Badge>}
                  </span>
                  <ToggleActive kind="tiers" id={t.id} active={t.active} />
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        {/* Settings */}
        <Reveal delay={0.22} className="xl:col-span-2">
          <Section icon={Settings2} title="System settings" hint="Thresholds and lab identity">
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              <ThresholdForm defaultValue={settings.get("stuck_threshold_days") ?? "3"} />
              <LabNameForm defaultValue={settings.get("lab_name") ?? ""} />
            </div>
          </Section>
        </Reveal>
      </div>
    </div>
  );
}
