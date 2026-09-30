"use client";

import * as React from "react";
import { Select, Checkbox, Field } from "@/components/ui";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Auto-submitting GET filter form — selects submit instantly, text debounced
// ---------------------------------------------------------------------------

export function FilterForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLFormElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return (
    <form
      ref={ref}
      method="get"
      className={className}
      onChange={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" && (t as HTMLInputElement).type === "text") {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => ref.current?.requestSubmit(), 420);
        } else if (t.tagName !== "FORM") {
          ref.current?.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Linked selects
// ---------------------------------------------------------------------------

export function DoctorPatientSelects({
  doctors,
  patients,
  defaultDoctor,
  defaultPatient,
  required = true,
  allowCreate = false,
}: {
  doctors: { id: number; name: string }[];
  patients: { id: number; name: string; doctorId: number; notes: string | null }[];
  defaultDoctor?: number;
  defaultPatient?: number;
  required?: boolean;
  allowCreate?: boolean;
}) {
  const [doctorId, setDoctorId] = React.useState(defaultDoctor ? String(defaultDoctor) : "");
  const [patientId, setPatientId] = React.useState(defaultPatient ? String(defaultPatient) : "");

  const newDoctor = doctorId === "__new";
  const newPatient = newDoctor || patientId === "__new";

  const pool = React.useMemo(
    () => patients.filter((p) => p.doctorId === Number(doctorId)),
    [patients, doctorId]
  );

  const patientValue = newPatient
    ? "__new"
    : pool.some((p) => p.id === Number(patientId))
      ? patientId
      : "";

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Referring Doctor" required={required}>
          <Select
            name="doctorId"
            required={required}
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setPatientId(e.target.value === "__new" ? "__new" : "");
            }}
          >
            <option value="">Select doctor…</option>
            {allowCreate && <option value="__new">＋ Add a new doctor…</option>}
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Patient Name" required={required && !newPatient}>
          <Select
            name="patientId"
            required={required && !newPatient}
            value={patientValue}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={!doctorId || newDoctor}
          >
            <option value="">{doctorId ? "Select patient…" : "Choose a doctor first"}</option>
            {allowCreate && doctorId && <option value="__new">＋ Add a new patient…</option>}
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.notes ? ` — ${p.notes}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {allowCreate && newDoctor && (
        <div className="grid gap-3 rounded-xl border border-dashed border-accent/40 bg-accent-soft/40 p-3.5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-accent">New doctor name *</span>
            <input
              name="newDoctorName"
              required
              placeholder="e.g. Dr. Asha Kamat"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-accent">Clinic area (optional)</span>
            <input
              name="newDoctorArea"
              placeholder="e.g. Mulund"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
        </div>
      )}

      {allowCreate && newPatient && !!doctorId && (
        <div className="grid gap-3 rounded-xl border border-dashed border-accent/40 bg-accent-soft/40 p-3.5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-accent">New patient name *</span>
            <input
              name="newPatientName"
              required
              placeholder="e.g. Rakesh Sharma"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-accent">Patient note (optional)</span>
            <input
              name="newPatientNotes"
              placeholder="e.g. maxilla, off emp"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function SystemSleeveSelects({
  systems,
  sleeves,
  compat,
  defaultSystem,
  defaultSleeve,
}: {
  systems: { id: number; name: string }[];
  sleeves: { id: number; name: string }[];
  compat: { sleeveId: number; systemId: number }[];
  defaultSystem?: number;
  defaultSleeve?: number;
}) {
  const [systemId, setSystemId] = React.useState(defaultSystem ? String(defaultSystem) : "");
  const [sleeveId, setSleeveId] = React.useState(defaultSleeve ? String(defaultSleeve) : "");

  const allowed = React.useMemo(
    () =>
      sleeves.filter((s) =>
        compat.some((c) => c.systemId === Number(systemId) && c.sleeveId === s.id)
      ),
    [sleeves, compat, systemId]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Implant System">
        <Select
          name="systemId"
          value={systemId}
          onChange={(e) => {
            setSystemId(e.target.value);
            setSleeveId("");
          }}
        >
          <option value="">Select system…</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Sleeve / Kit">
        <Select
          name="sleeveId"
          value={allowed.some((s) => s.id === Number(sleeveId)) ? sleeveId : ""}
          onChange={(e) => setSleeveId(e.target.value)}
          disabled={!systemId}
        >
          <option value="">{systemId ? "Select compatible sleeve/kit…" : "Choose a system first"}</option>
          {allowed.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FDI tooth chart (32 teeth, upper + lower arch)
// ---------------------------------------------------------------------------

const FDI_ORDER = [
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
];
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function ToothChart({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = React.useMemo(() => {
    const nums = (value.match(/\d{2}/g) ?? []).map(Number);
    return new Set(nums.filter((n) => FDI_ORDER.includes(n)));
  }, [value]);

  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    const sorted = FDI_ORDER.filter((f) => next.has(f));
    onChange(sorted.join(", "));
  };

  const row = (teeth: number[]) => (
    <div className="flex justify-center gap-1.5">
      {teeth.map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => toggle(n)}
          className={cn(
            "size-9 rounded-lg border text-[11px] font-semibold transition-all duration-150 active:scale-95",
            selected.has(n)
              ? "scale-105 border-accent bg-accent text-white shadow-[0_6px_14px_-6px_rgba(13,110,99,0.6)]"
              : "border-line bg-white text-ink-soft hover:border-accent/50 hover:text-accent"
          )}
          aria-pressed={selected.has(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-xl border border-line bg-paper/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
          FDI tooth chart
        </p>
        <p className="text-[10px] text-mute">
          {selected.size} selected
        </p>
      </div>
      <div className="space-y-2.5">
        {row(UPPER)}
        <div className="mx-auto h-7 w-[72%] rounded-b-[56px] border-b-2 border-x-2 border-line/70" />
        {row(LOWER)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic line-item rows (used by the hardware order form)
// ---------------------------------------------------------------------------

export type ItemRowDraft = {
  id: number;
  systemId: string;
  size: string;
  qty: number;
  cover: number;
  physio: number;
  failed: boolean;
  failNote: string;
};

export type AccRowDraft = {
  id: number;
  kind: string;
  detail: string;
  qty: number;
  note: string;
};

export function ItemRowsEditor({
  rows,
  onChange,
  systems,
}: {
  rows: ItemRowDraft[];
  onChange: (rows: ItemRowDraft[]) => void;
  systems: { id: number; name: string }[];
}) {
  const update = (id: number, patch: Partial<ItemRowDraft>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));
  const add = () =>
    onChange([
      ...rows,
      { id: Date.now(), systemId: "", size: "", qty: 1, cover: 0, physio: 0, failed: false, failNote: "" },
    ]);

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="rounded-xl border border-line bg-paper/50 p-3.5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Select value={r.systemId} onChange={(e) => update(r.id, { systemId: e.target.value })}>
              <option value="">System…</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <input
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder="e.g. 4/8"
              value={r.size}
              onChange={(e) => update(r.id, { size: e.target.value })}
            />
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
              value={r.qty}
              onChange={(e) => update(r.id, { qty: parseInt(e.target.value || "1", 10) })}
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="text-[11px] font-semibold text-danger hover:underline"
              >
                Remove
              </button>
              <Checkbox
                label="failed"
                checked={r.failed}
                onChange={(e) => update(r.id, { failed: e.target.checked })}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="block text-[11px] text-mute">
              Cover screws
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] outline-none focus:border-accent"
                value={r.cover}
                onChange={(e) => update(r.id, { cover: parseInt(e.target.value || "0", 10) })}
              />
            </label>
            <label className="block text-[11px] text-mute">
              Physio-dispenser
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] outline-none focus:border-accent"
                value={r.physio}
                onChange={(e) => update(r.id, { physio: parseInt(e.target.value || "0", 10) })}
              />
            </label>
            {r.failed && (
              <label className="block text-[11px] text-mute">
                Failure note
                <input
                  className="mt-1 w-full rounded-lg border border-danger/40 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-danger"
                  placeholder="e.g. 1 fail remaining"
                  value={r.failNote}
                  onChange={(e) => update(r.id, { failNote: e.target.value })}
                />
              </label>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-line py-2.5 text-[12px] font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
      >
        + Add implant line
      </button>
    </div>
  );
}

export function AccRowsEditor({
  rows,
  onChange,
}: {
  rows: AccRowDraft[];
  onChange: (rows: AccRowDraft[]) => void;
}) {
  const KINDS = [
    ["healing_cap", "Healing cap"],
    ["abutment", "Abutment"],
    ["cover_screw", "Cover screw"],
    ["prosthetic_screw", "Prosthetic screw"],
    ["physio", "Physio-dispenser"],
    ["other", "Other"],
  ] as const;

  const update = (id: number, patch: Partial<AccRowDraft>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: number) => onChange(rows.filter((r) => r.id !== id));
  const add = () =>
    onChange([...rows, { id: Date.now(), kind: "healing_cap", detail: "", qty: 1, note: "" }]);

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-line bg-paper/50 p-3.5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Select value={r.kind} onChange={(e) => update(r.id, { kind: e.target.value })}>
              {KINDS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
            <input
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder={r.kind === "abutment" ? "e.g. 17 degree" : "Detail…"}
              value={r.detail}
              onChange={(e) => update(r.id, { detail: e.target.value })}
            />
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
              value={r.qty}
              onChange={(e) => update(r.id, { qty: parseInt(e.target.value || "1", 10) })}
            />
            <button
              type="button"
              onClick={() => remove(r.id)}
              className="self-center text-left text-[11px] font-semibold text-danger hover:underline"
            >
              Remove
            </button>
          </div>
          <input
            className="mt-2.5 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] outline-none focus:border-accent"
            placeholder="Note (optional)"
            value={r.note}
            onChange={(e) => update(r.id, { note: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-line py-2.5 text-[12px] font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
      >
        + Add accessory line
      </button>
    </div>
  );
}

export const ACCESSORY_KIND_LABEL: Record<string, string> = {
  healing_cap: "Healing cap",
  abutment: "Abutment",
  cover_screw: "Cover screw",
  prosthetic_screw: "Prosthetic screw",
  physio: "Physio-dispenser",
  other: "Other",
};
