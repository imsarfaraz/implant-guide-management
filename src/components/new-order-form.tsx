"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea, Checkbox } from "@/components/ui";
import { toast } from "sonner";
import { DoctorPatientSelects, ItemRowsEditor, AccRowsEditor, type ItemRowDraft, type AccRowDraft } from "@/components/forms";
import { HelpTip } from "@/components/help-tip";
import { createHardwareOrder } from "@/lib/actions";
import { todayISO } from "@/lib/utils";

type Option = { id: number; name: string };
type CaseOption = {
  id: number;
  displayId: string;
  doctor: string;
  patient: string;
  doctorId: number;
  patientId: number;
};

export function NewOrderForm({
  doctors,
  patients,
  systems,
  tiers,
  caseOptions,
}: {
  doctors: Option[];
  patients: { id: number; name: string; doctorId: number; notes: string | null }[];
  systems: Option[];
  tiers: Option[];
  caseOptions: CaseOption[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<ItemRowDraft[]>([
    { id: 1, systemId: "", size: "", qty: 1, cover: 0, physio: 0, failed: false, failNote: "" },
  ]);
  const [accs, setAccs] = React.useState<AccRowDraft[]>([]);
  const [doctorId, setDoctorId] = React.useState(0);
  const [patientId, setPatientId] = React.useState(0);
  const [pending, setPending] = React.useState(false);

  const linkable = caseOptions.filter(
    (c) => (doctorId === 0 || c.doctorId === doctorId) && (patientId === 0 || c.patientId === patientId)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Add at least one implant line, or leave the order for later.");
      return;
    }
    setPending(true);
    const fd = new FormData(e.currentTarget);

    const payload = {
      doctorId: fd.get("doctorId"),
      newDoctorName: fd.get("newDoctorName"),
      newDoctorArea: fd.get("newDoctorArea"),
      patientId: fd.get("patientId"),
      newPatientName: fd.get("newPatientName"),
      newPatientNotes: fd.get("newPatientNotes"),
      tierId: fd.get("tierId"),
      orderDate: fd.get("orderDate"),
      deliveryDate: fd.get("deliveryDate"),
      delivered: fd.get("delivered") === "on",
      remarks: fd.get("remarks"),
      linkedCaseId: fd.get("linkedCaseId"),
      items: items.map((it) => ({
        systemId: it.systemId || null,
        size: it.size || null,
        qty: it.qty,
        coverScrewQty: it.cover,
        physioQty: it.physio,
        failed: it.failed,
        failNote: it.failNote,
      })),
      accessories: accs.map((a) => ({
        kind: a.kind,
        detail: a.detail,
        qty: a.qty,
        note: a.note,
      })),
    };

    try {
      const res = await createHardwareOrder(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not create the order. Please check your fields.");
        setPending(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.id) {
        router.push(`/orders/${res.id}`);
      } else {
        router.push("/cases");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the order — please try again");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
            <span>1 · Referral & tier</span>
            <HelpTip
              title="Order Package Tier"
              content="Basic, Advance, or Advance+ service tiers indicate hardware packaging and warranty coverage levels."
            />
          </h2>
          <span className="text-[11px] text-mute">Pick existing, or add inline</span>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4">
            <DoctorPatientWrap
              doctors={doctors}
              patients={patients}
              onDoctor={(id) => setDoctorId(id)}
              onPatient={(id) => setPatientId(id)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Package tier" required>
              <Select name="tierId" required defaultValue="">
                <option value="" disabled>
                  Select tier…
                </option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order date" required>
              <Input type="date" name="orderDate" required defaultValue={todayISO()} />
            </Field>
            <Field label="Delivery date" hint="blank = pending/TBC">
              <Input type="date" name="deliveryDate" />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
            <span>2 · Implant lines</span>
            <HelpTip
              title="Multi-Line Implant Hardware"
              content="Add individual lines for each fixture diameter/length (e.g. 4/8, 3.5/11.5) with their respective cover screws and physio-dispensers."
            />
          </h2>
          <span className="text-[11px] text-mute font-num">
            {items.reduce((a, i) => a + i.qty, 0)} implants
          </span>
        </div>
        <ItemRowsEditor rows={items} onChange={setItems} systems={systems} />
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
            <span>3 · Accessories</span>
            <HelpTip
              title="Structured Accessories"
              content="Instead of cramming accessories into free-text, log straight/angled abutments, healing caps, and multi-units as structured lines."
            />
          </h2>
          <span className="text-[11px] text-mute font-num">
            {accs.reduce((a, x) => a + x.qty, 0)} items
          </span>
        </div>
        <AccRowsEditor rows={accs} onChange={setAccs} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute flex items-center gap-1.5">
          <span>4 · Linkage & notes</span>
          <HelpTip
            title="Link to Surgical Guide"
            content="Connecting an order to a guide case creates a unified treatment timeline for the patient."
          />
        </h2>
        <div className="space-y-4">
          <Field label="Link to guide case" hint="optional — builds patient surgical timeline">
            <Select name="linkedCaseId" defaultValue="">
              <option value="">Not linked</option>
              {linkable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayId} — {c.doctor} / {c.patient}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Remarks">
            <Textarea name="remarks" placeholder="e.g. Delivery date TBC — confirm with clinic, pickup by courier" />
          </Field>
          <Checkbox label="Already delivered / dispatched" name="delivered" />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[12px] text-mute">
          Orders get a permanent ID with a per-month sequence, matching guide cases.
        </p>
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          Create hardware order
        </Button>
      </div>
    </form>
  );
}

function DoctorPatientWrap({
  doctors,
  patients,
  onDoctor,
  onPatient,
}: {
  doctors: Option[];
  patients: { id: number; name: string; doctorId: number; notes: string | null }[];
  onDoctor: (id: number) => void;
  onPatient: (id: number) => void;
}) {
  return (
    <div
      onChangeCapture={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "SELECT") {
          const name = (t as HTMLSelectElement).name;
          const raw = (t as HTMLSelectElement).value;
          const parsed = parseInt(raw || "0", 10);
          const val = Number.isNaN(parsed) ? 0 : parsed;
          if (name === "doctorId") onDoctor(val);
          if (name === "patientId") onPatient(val);
        }
      }}
    >
      <DoctorPatientSelects doctors={doctors} patients={patients} allowCreate />
    </div>
  );
}
