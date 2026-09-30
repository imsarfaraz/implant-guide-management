"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, StickyNote, HelpCircle } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea, Checkbox } from "@/components/ui";
import { toast } from "sonner";
import { DoctorPatientSelects, SystemSleeveSelects, ToothChart } from "@/components/forms";
import { HelpTip } from "@/components/help-tip";
import { createGuideCase } from "@/lib/actions";

type Option = { id: number; name: string };

export function NewGuideCaseForm({
  doctors,
  patients,
  systems,
  sleeves,
  compat,
  types,
  staffList,
}: {
  doctors: Option[];
  patients: { id: number; name: string; doctorId: number; notes: string | null }[];
  systems: Option[];
  sleeves: Option[];
  compat: { sleeveId: number; systemId: number }[];
  types: Option[];
  staffList: (Option & { role: string })[];
}) {
  const router = useRouter();
  const [teeth, setTeeth] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const planners = staffList.filter((s) => s.role === "planner" || s.role === "admin");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);

    const docVal = fd.get("doctorId");
    const patVal = fd.get("patientId");

    const payload = {
      doctorId: docVal === "__new" ? null : docVal,
      newDoctorName: fd.get("newDoctorName"),
      newDoctorArea: fd.get("newDoctorArea"),
      patientId: patVal === "__new" ? null : patVal,
      newPatientName: fd.get("newPatientName"),
      newPatientNotes: fd.get("newPatientNotes"),
      caseTypeId: fd.get("caseTypeId"),
      systemId: fd.get("systemId"),
      sleeveId: fd.get("sleeveId"),
      plannerId: fd.get("plannerId"),
      teeth: teeth.trim() || (fd.get("teeth") as string)?.trim() || null,
      centre: fd.get("centre"),
      address: fd.get("address"),
      kitNote: fd.get("kitNote"),
      physioDispenser: fd.get("physioDispenser") === "on",
      stlReceived: fd.get("stlReceived") === "on",
      modelReceived: fd.get("modelReceived") === "on",
      remarks: fd.get("remarks"),
    };

    try {
      const res = await createGuideCase(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not create the case. Please verify the fields.");
        setPending(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.id) {
        router.push(`/cases/${res.id}`);
      } else {
        router.push("/cases");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the case — please try again");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
            <span>1 · Referral</span>
            <HelpTip
              title="Referring Doctor & Patient"
              content="Select an existing doctor and patient, or use '＋ Add new' to register a new doctor or patient right inside this form without leaving."
            />
          </h2>
          <span className="text-[11px] text-mute">Pick existing, or add inline</span>
        </div>
        <DoctorPatientSelects doctors={doctors} patients={patients} allowCreate />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
          <span>2 · Service product & materials</span>
          <HelpTip
            title="Service Product Catalog"
            content="Distinct surgical guide products (e.g. Standard Guide, Pilot Guide, Guide+Package). Sleeve options filter to compatible kits for the chosen implant brand."
          />
        </h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Case type" required>
              <Select name="caseTypeId" required defaultValue="">
                <option value="" disabled>
                  Select case type…
                </option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned Planner">
              <Select name="plannerId" defaultValue="">
                <option value="">Unassigned (assign later)</option>
                {planners.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <SystemSleeveSelects systems={systems} sleeves={sleeves} compat={compat} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
          <span>3 · Region & delivery</span>
          <HelpTip
            title="Region / Tooth Map"
            content="Click on the FDI tooth arch below to automatically toggle tooth numbers, or type descriptions like '15 to 25' or 'ALL ON 4 - MAXILLA'."
          />
        </h2>
        <div className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Field label="Region / tooth map" hint="free text or select on chart">
                <Textarea
                  name="teeth"
                  value={teeth}
                  onChange={(e) => setTeeth(e.target.value)}
                  placeholder='e.g. 15 to 25, or "ALL ON 4 - MAXILLA"'
                />
              </Field>
            </div>
            <ToothChart value={teeth} onChange={setTeeth} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Centre / area">
              <Input name="centre" placeholder="e.g. Mulund, Kharghar, Andheri" />
            </Field>
            <Field label="Delivery address">
              <Input name="address" placeholder="Clinic address for courier dispatch" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kit note">
              <Input name="kitNote" placeholder="e.g. Pilot kit sent separately, clinic has none" />
            </Field>
            <div className="flex items-end pb-1.5">
              <Checkbox label="Physio-dispenser involved" name="physioDispenser" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
          <span>4 · Intake & notes</span>
          <HelpTip
            title="Intake Verification"
            content="Record if the optical scan (STL) or physical plaster model is in hand before printing."
          />
        </h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-5 rounded-xl border border-line bg-paper/50 px-4 py-3">
            <Checkbox label="STL received" name="stlReceived" defaultChecked />
            <Checkbox label="Model received" name="modelReceived" />
          </div>
          <Field label="Remarks">
            <Textarea
              name="remarks"
              placeholder="Anything unstructured — doctor approvals over phone, expedited priority, case notes"
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[12px] text-mute">
          The case enters the pipeline as <span className="font-semibold text-ink-soft">TO CHECK</span> with a permanent ID and a per-month sequence.
        </p>
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
          Create guide case
        </Button>
      </div>
    </form>
  );
}
