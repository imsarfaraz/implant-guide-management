"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, ArrowRightLeft, Loader2, Info, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button, Modal, Select, Textarea, Checkbox, Field, Input } from "@/components/ui";
import { DoctorPatientSelects, SystemSleeveSelects, ToothChart } from "@/components/forms";
import { HelpTip } from "@/components/help-tip";
import { moveCase, updateGuideCase, deleteGuideCase } from "@/lib/actions";
import { hasAbility } from "@/lib/permissions";

type Catalogs = {
  systems: { id: number; name: string }[];
  sleeves: { id: number; name: string }[];
  types: { id: number; code: string; name: string }[];
  statusList: { id: number; key: string; name: string; kind?: string; sortOrder?: number }[];
  staffList: { id: number; name: string; role: string }[];
  compat: { sleeveId: number; systemId: number }[];
};

type Doctors = { id: number; name: string }[];
type Patients = { id: number; name: string; doctorId: number; notes: string | null }[];

type Kase = {
  id: number;
  displayId?: string;
  doctorId: number;
  patientId: number;
  caseTypeId: number;
  systemId: number | null;
  sleeveId: number | null;
  plannerId: number | null;
  statusId: number;
  statusKey: string;
  statusName: string;
  statusKind: string;
  teeth: string | null;
  centre: string | null;
  address: string | null;
  remarks: string | null;
  kitNote: string | null;
  guideReport: string | null;
  stlReceived: boolean;
  modelReceived: boolean;
  physioDispenser: boolean;
};

export function CaseActionBar({
  kase,
  catalogs,
  doctors,
  patients,
  isAdmin,
  userRole,
  userAbilities,
  currentUserId,
}: {
  kase: Kase;
  catalogs: Catalogs;
  doctors: Doctors;
  patients: Patients;
  isAdmin: boolean;
  userRole?: string;
  userAbilities?: string | null;
  currentUserId?: number;
}) {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [target, setTarget] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [teeth, setTeeth] = React.useState(kase.teeth ?? "");

  const isTerminal = kase.statusKind === "terminal";
  const canMove = !isTerminal || isAdmin;

  async function handleMove() {
    if (!target) return;
    setPending(true);
    try {
      const res = await moveCase({
        caseId: kase.id,
        statusKey: target,
        remark: remark.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error || "Could not move case");
      } else {
        toast.success("Case status moved");
        setStatusOpen(false);
        setTarget("");
        setRemark("");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move the case — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);

    const payload = {
      caseId: kase.id,
      doctorId: fd.get("doctorId") ? Number(fd.get("doctorId")) : kase.doctorId,
      patientId: fd.get("patientId") ? Number(fd.get("patientId")) : kase.patientId,
      caseTypeId: fd.get("caseTypeId") ? Number(fd.get("caseTypeId")) : kase.caseTypeId,
      systemId: fd.get("systemId") ? Number(fd.get("systemId")) : null,
      sleeveId: fd.get("sleeveId") ? Number(fd.get("sleeveId")) : null,
      plannerId: fd.get("plannerId") ? Number(fd.get("plannerId")) : null,
      teeth: teeth.trim() || (fd.get("teeth") as string)?.trim() || null,
      centre: (fd.get("centre") as string)?.trim() || null,
      address: (fd.get("address") as string)?.trim() || null,
      remarks: (fd.get("remarks") as string)?.trim() || null,
      kitNote: (fd.get("kitNote") as string)?.trim() || null,
      guideReport: (fd.get("guideReport") as string)?.trim() || null,
      stlReceived: fd.get("stlReceived") === "on",
      modelReceived: fd.get("modelReceived") === "on",
      physioDispenser: fd.get("physioDispenser") === "on",
    };

    try {
      const res = await updateGuideCase(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not save changes");
      } else {
        toast.success("Case details updated");
        setEditOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteCase() {
    setPending(true);
    try {
      const res = await deleteGuideCase({ caseId: kase.id });
      if (!res.ok) {
        toast.error(res.error || "Could not delete case");
      } else {
        toast.success("Case deleted");
        setDeleteOpen(false);
        router.push("/cases");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete case");
    } finally {
      setPending(false);
    }
  }

  const planners = catalogs.staffList.filter((s) => s.role === "planner" || s.role === "admin");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {isTerminal && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/[0.05] px-3 py-2 text-[11px] font-medium text-ink-soft">
          <Info className="h-3.5 w-3.5 text-mute" />
          Terminal state — {isAdmin ? "you can reopen it as admin" : "admin can reopen it"}
        </span>
      )}
      
      {hasAbility(userAbilities, "cases:status", userRole) && (
        <Button
          variant="outline"
          onClick={() => {
            setStatusOpen(true);
          }}
          disabled={!canMove}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Move status
        </Button>
      )}

      {(isAdmin || (hasAbility(userAbilities, "cases:edit", userRole) && (userRole !== "planner" || kase.plannerId === currentUserId))) && (
        <Button
          variant="primary"
          onClick={() => {
            setTeeth(kase.teeth ?? "");
            setEditOpen(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          Edit details
        </Button>
      )}

      {hasAbility(userAbilities, "cases:delete", userRole) && (
        <Button
          variant="ghost"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => {
            setDeleteOpen(true);
          }}
          title="Delete case"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Move status modal */}
      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Move case to a new status" subtitle="Every transition is timestamped and attributed to you.">
        <div className="space-y-4">
          <Field label="New status" required>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs text-mute">Pick the destination pipeline stage:</span>
              <HelpTip
                title="Pipeline Transitions"
                content="Advancing a case automatically records who moved it and when. 'Delivered' and 'Cancelled' are terminal statuses."
              />
            </div>
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Select status…</option>
              {catalogs.statusList
                .filter((s) => s.key !== kase.statusKey)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name} {s.kind ? `(${s.kind})` : ""}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Remark" hint="optional, but expected for holds, replanning and cancellations">
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Why is the case moving (or being held)?"
            />
          </Field>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleMove} disabled={!target || pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Move case
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit details modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit case details"
        subtitle="Changes are saved immediately and updated on all reports."
        width="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input type="hidden" name="caseId" value={kase.id} />

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-ink-soft">Referring Doctor & Patient</span>
              <HelpTip
                title="Doctor & Patient Link"
                content="Patients are scoped to their doctor. Switching doctors will re-filter the available patient pool."
              />
            </div>
            <DoctorPatientSelects
              doctors={doctors}
              patients={patients}
              defaultDoctor={kase.doctorId}
              defaultPatient={kase.patientId}
              allowCreate
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Case type" required>
              <Select name="caseTypeId" defaultValue={String(kase.caseTypeId)}>
                {catalogs.types.map((t2) => (
                  <option key={t2.id} value={t2.id}>
                    {t2.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned Planner">
              <Select name="plannerId" defaultValue={kase.plannerId ? String(kase.plannerId) : ""}>
                <option value="">Unassigned</option>
                {planners.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-semibold text-ink-soft">Implant System & Compatible Sleeve</span>
              <HelpTip
                title="Sleeve/Kit Pairing"
                content="The sleeve dropdown automatically filters to only show kits compatible with the chosen implant brand."
              />
            </div>
            <SystemSleeveSelects
              systems={catalogs.systems}
              sleeves={catalogs.sleeves}
              compat={catalogs.compat}
              defaultSystem={kase.systemId ?? undefined}
              defaultSleeve={kase.sleeveId ?? undefined}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                <span>Region / tooth map</span>
                <HelpTip
                  title="Tooth Numbering (FDI)"
                  content="Enter tooth numbers like '15 to 25' or 'ALL ON 4 - MAXILLA', or tap teeth on the chart."
                />
              </label>
              <Textarea
                name="teeth"
                value={teeth}
                onChange={(e) => setTeeth(e.target.value)}
                placeholder="e.g. 15 to 25 or ALL ON 4 - MAXILLA"
              />
            </div>
            <ToothChart value={teeth} onChange={setTeeth} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Centre / area">
              <Input name="centre" defaultValue={kase.centre ?? ""} placeholder="e.g. Mulund, Kharghar" />
            </Field>
            <Field label="Delivery address">
              <Input name="address" defaultValue={kase.address ?? ""} placeholder="Clinic or centre address" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kit note">
              <Input name="kitNote" defaultValue={kase.kitNote ?? ""} placeholder="e.g. Kit to return with case" />
            </Field>
            <Field label="Guide report note">
              <Input name="guideReport" defaultValue={kase.guideReport ?? ""} placeholder="e.g. sent by email" />
            </Field>
          </div>

          <Field label="Remarks">
            <Textarea
              name="remarks"
              defaultValue={kase.remarks ?? ""}
              placeholder="Unstructured notes, special doctor instructions, attachments"
            />
          </Field>

          <div className="flex flex-wrap gap-5 rounded-xl border border-line bg-paper/50 px-4 py-3">
            <Checkbox label="STL received" name="stlReceived" defaultChecked={kase.stlReceived} />
            <Checkbox label="Model received" name="modelReceived" defaultChecked={kase.modelReceived} />
            <Checkbox label="Physio-dispenser involved" name="physioDispenser" defaultChecked={kase.physioDispenser} />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Guide Case"
        subtitle="Are you sure you want to delete this case?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-ink leading-relaxed">
              <p className="font-semibold text-danger mb-1">Permanent deletion warning</p>
              <p>
                You are about to delete case <strong className="font-mono">{kase.displayId}</strong> for{" "}
                <strong>{doctors.find((d) => d.id === kase.doctorId)?.name}</strong>. This will delete all status history and unlink any connected hardware orders.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCase} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
