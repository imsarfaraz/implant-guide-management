"use client";

import * as React from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  Layers,
  Package,
  Terminal,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Printer,
  Sparkles,
  Workflow,
  Copy,
  Check,
  Lock,
  ServerCog,
  UserCircle2,
  LayoutDashboard,
  StickyNote,
  Plus,
  UserRound,
  Settings,
  UsersRound
} from "lucide-react";
import { Card, Badge, PageHeader, Button } from "@/components/ui";
import { ALL_ABILITIES, ROLE_PRESETS } from "@/lib/permissions";

const SECTIONS = [
  { id: "my-role", label: "My Role & Workflows", icon: UserCircle2 },
  { id: "overview", label: "General Overview", icon: Workflow },
  { id: "guide-pipeline", label: "Guide Cases Pipeline", icon: Layers },
  { id: "hardware-orders", label: "Hardware & Accessories", icon: Package },
  { id: "fdi-anatomy", label: "FDI Tooth Chart", icon: BookOpen },
  { id: "roles-abilities", label: "Team Roles & Auth", icon: ShieldCheck },
  { id: "security-arch", label: "Security & Architecture", icon: Lock },
  { id: "excel-diff", label: "Excel vs Continuous System", icon: Sparkles },
];

export function HelpClient({ role }: { role: string }) {
  const [activeTab, setActiveTab] = React.useState("my-role");
  const [search, setSearch] = React.useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guide & Help Center"
        subtitle="Complete operating manual, feature explanations, workflow documentation, and local setup guide for the lab platform."
      />

      {/* Search Header */}
      <Card className="p-6 bg-gradient-to-br from-white via-paper/40 to-white">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
              <BookOpen className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Documentation & Knowledge Base
            </span>
          </div>
          <h2 className="text-2xl font-display font-light text-ink mb-2">
            How can we help you operate the lab?
          </h2>
          <p className="text-xs text-ink-soft leading-relaxed mb-4">
            Search across workflow definitions, status transition rules, hardware line items, tooth numbering conventions, and local PostgreSQL deployment instructions.
          </p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guide (e.g. 'FDI', 'sleeve', 'failure', 'terminal', 'local setup')..."
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-accent shadow-xs"
            />
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line-soft">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-ink text-paper shadow-xs"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: MY ROLE */}
      {activeTab === "my-role" && (
        <div className="space-y-5 animate-fade-in">
          {role === "admin" && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-soft text-violet font-bold text-sm">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <h3 className="font-display text-lg font-light text-ink">
                  Lab Director / Admin Quick Start
                </h3>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed mb-4">
                As an Admin, your primary role is overseeing the lab's operations, configuring system settings, and managing the team. Here is what you should focus on:
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><Settings className="h-3.5 w-3.5" /> Catalog Management</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Navigate to the <strong>Admin</strong> tab on the sidebar. Here you can add new Implant Systems (e.g. Osstem, Straumann), map which Surgical Sleeves fit which systems, and configure the Pipeline Statuses. Changes here instantly update dropdowns for the rest of your team.
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" /> Team & Permissions</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Navigate to the <strong>Team</strong> tab. You have exclusive access to add new Planners and Frontdesk staff, reset passwords, and toggle specific abilities (like who can delete cases or view reports).
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Thresholds & Analytics</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    In the Admin settings, you can adjust the "Stuck Case Threshold" (default 3 days). Cases sitting longer than this will turn red on the Kanban board. You can also view advanced Turnaround Time (TAT) metrics on the <strong>Reports</strong> page.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {role === "planner" && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-soft text-blue font-bold text-sm">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <h3 className="font-display text-lg font-light text-ink">
                  Surgical Guide Planner Quick Start
                </h3>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed mb-4">
                As a Planner, your focus is designing the surgical guides and executing CAD work. Here is how to use the platform effectively:
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><LayoutDashboard className="h-3.5 w-3.5" /> Using the Kanban Board</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    The <strong>Dashboard</strong> is your home base. Click the "My Cases" button at the top to instantly filter the board to cases assigned to you. Drag and drop cards to move them from <em>To Plan</em> to <em>Planning</em> to <em>To Approve</em>.
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><StickyNote className="h-3.5 w-3.5" /> Case Details & Instructions</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Click any case card to open its details. Here you can read the doctor's specific prescription, view the FDI Tooth Chart they selected, and access links to the optical scans (STL) and CBCT (DICOM) files uploaded by the front desk.
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><Printer className="h-3.5 w-3.5" /> Production Handoff</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Once a doctor approves your design, move the case to <em>To Print</em>. Make sure you upload or link your final guide STL and the drill protocol PDF in the case remarks so the manufacturing team can slice and print it.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {role === "frontdesk" && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-bold text-sm">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <h3 className="font-display text-lg font-light text-ink">
                  Frontdesk / Coordination Quick Start
                </h3>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed mb-4">
                As a coordinator, you are the bridge between the doctors and the lab. Your role revolves around intake, tracking, and dispatch:
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> Intake: Logging New Cases</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Click "New Case" on the <strong>Cases</strong> page when a doctor sends a request. Select the doctor, patient, and implant system, and input the links to their STL/DICOM files. The case will automatically land in the <em>To Check</em> column for verification.
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><UserRound className="h-3.5 w-3.5" /> Managing Doctors & Patients</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    Use the <strong>Doctors</strong> and <strong>Patients</strong> tabs to register new clinics. Always ensure patients are strictly linked to their referring doctor to maintain a clean medical audit trail.
                  </p>
                </div>
                <div className="rounded-xl border border-line-soft bg-paper/40 p-4">
                  <h4 className="text-[13px] font-semibold text-ink mb-1.5 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Dispatch & Hardware Orders</h4>
                  <p className="text-xs text-mute leading-relaxed">
                    When a case hits <em>To Dispatch</em>, you can log courier details in the remarks. If the doctor requested physical implant fixtures or accessories, log them under the <strong>Orders</strong> section. Once the guide or hardware reaches the clinic, mark the case as <em>Delivered</em> to stop the TAT clock.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 1: OVERVIEW & WORKFLOWS */}
      {activeTab === "overview" && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
                  1
                </span>
                <h3 className="font-display text-lg font-light text-ink">
                  Surgical Guide Planning Service
                </h3>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed mb-3">
                The lab designs and 3D-prints custom implant surgical guides for dentists across Mumbai and other cities based on optical STL scans and CBCT dicom data.
              </p>
              <ul className="space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Intake:</strong> Patient scan/STL received, doctor chooses case type & implant system.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Planning:</strong> Internal planner designs surgical sleeve placement with CAD software.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Approval & Print:</strong> Doctor approves plan via phone/email; 3D printed with medical resin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Dispatch:</strong> Delivered with compatible sleeve kit and surgical drill report.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-soft text-amber font-bold text-sm">
                  2
                </span>
                <h3 className="font-display text-lg font-light text-ink">
                  Implant Hardware Supply
                </h3>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed mb-3">
                The lab stocks and delivers physical dental implant fixtures, prosthetic abutments, healing caps, cover screws, and physio-dispensers.
              </p>
              <ul className="space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <span><strong>Line Items:</strong> Orders can have multiple fixtures with specific sizes (e.g. 4/8, 3.5/11.5).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <span><strong>Accessories:</strong> Straight & angled abutments (17°, 30°), healing collars, and prosthetic screws.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <span><strong>Case Linking:</strong> Hardware orders can link to the surgical guide case to trace treatment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                  <span><strong>Failure Logging:</strong> If a fixture fails to osseointegrate, failures are recorded for replacement warranty.</span>
                </li>
              </ul>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-display text-base font-light text-ink mb-3">
              Interactive Help (i) Marks Across the App
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-4">
              Look for the small <span className="inline-flex items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-[10px] h-4 w-4 mx-1">i</span> icons beside fields, table columns, metrics, and tooth charts. Hovering or tapping them opens an instant contextual popup explaining:
            </p>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg border border-line-soft bg-paper/40 p-3">
                <p className="font-semibold text-ink mb-1">Form Input Hints</p>
                <p className="text-[11px] text-mute">Explains sleeve kit compatibility, package tiers, physio-dispenser requirements, and FDI maps.</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-paper/40 p-3">
                <p className="font-semibold text-ink mb-1">Status Rules</p>
                <p className="text-[11px] text-mute">Clarifies terminal stages, hold reasons, and who has permission to reopen cases.</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-paper/40 p-3">
                <p className="font-semibold text-ink mb-1">Analytics & Metrics</p>
                <p className="text-[11px] text-mute">Explains how Turnaround Time (TAT), Planner Load Limit (10), and Stuck Threshold (3d) are calculated.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: GUIDE CASES PIPELINE */}
      {activeTab === "guide-pipeline" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              The 11 Pipeline Stages
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-5">
              Every guide case moves through a standardized sequence. Unlike the old Excel sheet where statuses were typed arbitrarily, the platform enforces strict stages while allowing lateral transitions to HOLD or FOLLOW UP.
            </p>

            <div className="space-y-3">
              {[
                { stage: "TO CHECK", color: "#64748b", kind: "Initial Intake", desc: "New case logged. Front desk verifies CBCT dicom files, optical scan (STL), and doctor's prescription." },
                { stage: "TO APPROVE", color: "#d97706", kind: "Clinical Verification", desc: "Scan quality and anatomical limits verified. Ready for doctor sign-off before design begins." },
                { stage: "PLANNING", color: "#2563eb", kind: "CAD/CAM Work", desc: "Planner designs implant position, angulation, and sleeve guide geometry in planning software." },
                { stage: "TO MODIFY", color: "#7c3aed", kind: "Revision Request", desc: "Doctor requested modification to fixture angle, depth, or sleeve window." },
                { stage: "REPLAN", color: "#9333ea", kind: "Major Redesign", desc: "CBCT re-aligned or treatment plan changed (e.g. converted from Pilot to Full Guided)." },
                { stage: "TO PRINT", color: "#0891b2", kind: "Manufacturing", desc: "Surgical guide sliced and queued on 3D printer with medical-grade autoclavable resin." },
                { stage: "TO DISPATCH", color: "#0d9488", kind: "Logistics", desc: "Guide post-cured, inspected, packed with drill protocol report, and courier assigned." },
                { stage: "DELIVERED", color: "#16a34a", kind: "Terminal Stage", desc: "Guide delivered to doctor's clinic. Case turnaround time is recorded permanently." },
                { stage: "ON HOLD", color: "#dc2626", kind: "Exception", desc: "Case paused due to missing CBCT, doctor out of town, or payment confirmation." },
                { stage: "FOLLOW UP", color: "#ea580c", kind: "Clinic Pending", desc: "Awaiting clinical feedback or scan re-take from clinic." },
                { stage: "CANCELLED", color: "#475569", kind: "Terminal Stage", desc: "Case cancelled prior to manufacture. Reason recorded in status history." },
              ].map((s, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border border-line-soft bg-paper/40 p-3.5">
                  <span
                    className="flex h-6 w-24 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.stage}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">{s.kind}</span>
                      {["DELIVERED", "CANCELLED"].includes(s.stage) && (
                        <Badge tone="gray">Terminal</Badge>
                      )}
                    </div>
                    <p className="text-xs text-mute mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-light text-ink mb-2">
              Stuck Case Alerting
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Cases that remain in a non-terminal state (e.g. TO APPROVE, PLANNING, ON HOLD) longer than the configured threshold (default: 3 days) automatically show a <span className="text-danger font-semibold">stuck alert</span> on the Kanban board and Dashboard. Lab managers can adjust this threshold in the Admin section.
            </p>
          </Card>
        </div>
      )}

      {/* TAB 3: HARDWARE ORDERS & ACCESSORIES */}
      {activeTab === "hardware-orders" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              Structured Multi-Line Orders
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-4">
              In the old spreadsheet, accessories and multiple implant sizes were jammed into single cells like <em>"3.75/13 x 2 + 1 straight abutment + 2 healing"</em>. The platform separates hardware into structured rows while maintaining clean reporting.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <h4 className="text-xs font-semibold text-ink mb-2">Implant Fixtures</h4>
                <ul className="text-xs text-ink-soft space-y-1.5">
                  <li>• <strong>Brand / System:</strong> Osstem, Neodent, Alfagate, Straumann, etc.</li>
                  <li>• <strong>Size:</strong> Diameter and Length (e.g. 4/8, 3.5/11.5, 5/10).</li>
                  <li>• <strong>Quantity:</strong> Number of sterile fixtures supplied.</li>
                  <li>• <strong>Cover Screws:</strong> Dedicated count per fixture line.</li>
                  <li>• <strong>Physio-dispenser:</strong> Handpiece/motor supply flag.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <h4 className="text-xs font-semibold text-ink mb-2">Structured Accessories</h4>
                <ul className="text-xs text-ink-soft space-y-1.5">
                  <li>• <strong>Abutments:</strong> Straight, 15° angled, 17° angled, Multi-Unit 30°.</li>
                  <li>• <strong>Healing Caps:</strong> Standard or wide emergence profile collars.</li>
                  <li>• <strong>Cover Screws:</strong> Replacement titanium sealing screws.</li>
                  <li>• <strong>Prosthetic Screws:</strong> Standard or long lab screws.</li>
                  <li>• <strong>Physio / Surgical Consumables:</strong> Tubing and accessories.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-light text-ink mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <span>Implant Failure Tracking</span>
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-3">
              When a dentist reports a failed implant fixture (loss of osseointegration or surgical complication), mark the item as <strong>Failed</strong> directly on the Order Detail page.
            </p>
            <div className="rounded-xl border border-danger/30 bg-danger-soft/30 p-3 text-xs text-ink">
              <p className="font-semibold text-danger mb-1">Failure Rollup Intelligence</p>
              <p className="text-[11px] text-ink-soft leading-relaxed">
                Failure notes automatically aggregate in the Reports tab by Brand, Diameter/Length, and Doctor. This reveals if specific batch sizes or implant designs have higher failure rates across clinics.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: FDI TOOTH CHART */}
      {activeTab === "fdi-anatomy" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              FDI Two-Digit Tooth Numbering System
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-5">
              The platform supports both quick free-text tooth entry (e.g. <em>"15 to 25"</em> or <em>"ALL ON 4 - MAXILLA"</em>) and visual interactive selection on the 32-tooth arch.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <p className="font-bold text-accent mb-1 uppercase tracking-wider text-[11px]">Quadrant 1 (Upper Right)</p>
                <p className="text-ink-soft mb-2">18 (3rd Molar) down to 11 (Central Incisor)</p>
                <p className="font-bold text-accent mb-1 uppercase tracking-wider text-[11px]">Quadrant 4 (Lower Right)</p>
                <p className="text-ink-soft">48 (3rd Molar) down to 41 (Central Incisor)</p>
              </div>

              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <p className="font-bold text-accent mb-1 uppercase tracking-wider text-[11px]">Quadrant 2 (Upper Left)</p>
                <p className="text-ink-soft mb-2">21 (Central Incisor) up to 28 (3rd Molar)</p>
                <p className="font-bold text-accent mb-1 uppercase tracking-wider text-[11px]">Quadrant 3 (Lower Left)</p>
                <p className="text-ink-soft">31 (Central Incisor) up to 38 (3rd Molar)</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line-soft bg-paper/30 p-4 text-xs">
              <p className="font-semibold text-ink mb-1">Common Full-Arch Conventions</p>
              <div className="grid gap-2 sm:grid-cols-3 mt-2 text-[11px]">
                <div className="rounded bg-white p-2 border border-line">
                  <span className="font-bold text-ink">ALL ON 4 - MAXILLA</span>
                  <p className="text-mute mt-0.5">Sites 15, 12, 22, 25</p>
                </div>
                <div className="rounded bg-white p-2 border border-line">
                  <span className="font-bold text-ink">ALL ON 4 - MANDIBLE</span>
                  <p className="text-mute mt-0.5">Sites 45, 42, 32, 35</p>
                </div>
                <div className="rounded bg-white p-2 border border-line">
                  <span className="font-bold text-ink">ALL ON 6</span>
                  <p className="text-mute mt-0.5">Full edentulous arch with 6 fixtures</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: TEAM ROLES & ABILITIES */}
      {activeTab === "roles-abilities" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              Granular Role & Ability Matrix
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-5">
              Team members can now be added and edited from the Team page (Admins only). Each member has a primary operational role and individual ability flags controlling permissions across the platform. Members also have individual login credentials.
            </p>

            <div className="rounded-xl border border-line-soft bg-paper/40 p-4 mb-5 text-xs">
              <h4 className="font-semibold text-ink mb-1 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5"/> Password Management</h4>
              <p className="text-mute leading-relaxed">
                The application uses secure credential-based login. Regular team members can update their passwords securely at any time by clicking the <strong className="text-ink font-medium">Key icon</strong> in the top navigation bar. Administrators can reset passwords directly from the Team workload dashboard.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(ROLE_PRESETS).map(([key, role]) => (
                <div key={key} className="rounded-xl border border-line bg-paper/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink">{role.label}</span>
                    <Badge tone="teal">{role.abilities.length} abilities</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {role.abilities.map((abKey) => {
                      const ab = ALL_ABILITIES.find((a) => a.key === abKey);
                      return (
                        <span
                          key={abKey}
                          className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-ink-soft border border-line-soft"
                        >
                          {ab?.label || abKey}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5b: SECURITY & ARCHITECTURE */}
      {activeTab === "security-arch" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              Modern Full-Stack Architecture
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-5">
              The application underwent a complete architectural overhaul to transition from an unprotected prototype to a production-ready, secure enterprise tool.
            </p>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <h4 className="font-semibold text-ink mb-2 flex items-center gap-1.5"><Lock className="h-4 w-4 text-accent"/> JWT Authentication & Passwords</h4>
                <p className="text-ink-soft leading-relaxed">
                  Route protection is enforced at the Edge using Next.js Middleware. Authentication state is tracked using stateless, cryptographically signed JSON Web Tokens (JWT) powered by <code className="bg-paper border border-line rounded px-1">jose</code>. All passwords are automatically salted and securely hashed using <code className="bg-paper border border-line rounded px-1">bcryptjs</code> before storage.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <h4 className="font-semibold text-ink mb-2 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success"/> Zod Form Validation</h4>
                <p className="text-ink-soft leading-relaxed">
                  The frontend forms are directly backed by strict backend validation using <code className="bg-paper border border-line rounded px-1">zod</code>. Every mutation (e.g., adding a case, creating an order, registering staff) parses the incoming payload against a schema, preventing malformed data, empty fields, or malicious payloads from reaching the Postgres database.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-paper/50 p-4">
                <h4 className="font-semibold text-ink mb-2 flex items-center gap-1.5"><ServerCog className="h-4 w-4 text-amber"/> React Server Actions</h4>
                <p className="text-ink-soft leading-relaxed">
                  We deprecated the monolithic API route (<code className="bg-paper border border-line rounded px-1">/api/action/route.ts</code>) in favor of individual, strictly-typed React Server Actions. This guarantees perfect end-to-end type safety across the network boundary, eliminates RPC client wrappers, and significantly improves code maintainability.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: EXCEL DIFF */}
      {activeTab === "excel-diff" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-display text-lg font-light text-ink mb-2">
              What Changed from the Old Excel Sheets
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-5">
              The platform replaces the manual monthly workbook duplication while preserving every clinical detail currently captured by hand.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-mute uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-4 font-bold">Old Excel Process</th>
                    <th className="pb-3 pl-4 font-bold text-accent">New Platform Capability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">Duplicated entire sheet at month-end; SR NO resets manually</td>
                    <td className="py-3 pl-4 font-semibold text-accent">One continuous database; month is simply a live filter</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">Guide cases and hardware orders in disconnected tabs</td>
                    <td className="py-3 pl-4 font-semibold text-accent">Unified case list; orders link to guide cases for patient timeline</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">Status is just a colored word in a cell; no timestamps</td>
                    <td className="py-3 pl-4 font-semibold text-accent">Every status transition timestamped with planner attribution</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">Brand names typed freely (e.g. OSTTEM vs OSSTEM)</td>
                    <td className="py-3 pl-4 font-semibold text-accent">Standardized implant catalogs with sleeve compatibility lookup</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">No visibility into how long cases sit in a status</td>
                    <td className="py-3 pl-4 font-semibold text-accent">Stuck-case alerts and automated turnaround time (TAT) metrics</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-ink-soft">Failed implants scattered in unstructured remark cells</td>
                    <td className="py-3 pl-4 font-semibold text-accent">Structured failure tracking with rollup reporting by brand & doctor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
