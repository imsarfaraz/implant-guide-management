"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui";
import { toggleCatalogActive, setSleeveCompat, addCatalogEntry, updateThreshold, updateLabName } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ToggleActive({
  kind,
  id,
  active,
}: {
  kind: "systems" | "sleeves" | "types" | "tiers" | "staff";
  id: number;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      {busy && <Loader2 className="h-3 w-3 animate-spin text-mute" />}
      <Switch
        checked={active}
        onChange={async (v) => {
          setBusy(true);
          try {
            await toggleCatalogActive({ kind, id });
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      />
    </span>
  );
}

export function SleeveCompatEditor({
  sleeves,
  systems,
  compat,
}: {
  sleeves: { id: number; name: string; active: boolean }[];
  systems: { id: number; name: string; active: boolean }[];
  compat: { sleeveId: number; systemId: number }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const activeSleeves = sleeves.filter((s) => s.active);
  const activeSystems = systems.filter((s) => s.active);

  async function toggle(sleeveId: number, systemId: number, enabled: boolean) {
    const key = `${sleeveId}-${systemId}`;
    setBusy(key);
    try {
      await setSleeveCompat({ sleeveId, systemId, enabled });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {activeSleeves.map((sleeve) => {
        const linked = compat.filter((c) => c.sleeveId === sleeve.id).map((c) => c.systemId);
        return (
          <div key={sleeve.id} className="rounded-xl border border-line bg-paper/50 p-4">
            <p className="text-[13px] font-semibold text-ink">{sleeve.name}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeSystems.map((sys) => {
                const on = linked.includes(sys.id);
                const key = `${sleeve.id}-${sys.id}`;
                return (
                  <button
                    key={sys.id}
                    type="button"
                    disabled={busy === key}
                    onClick={() => toggle(sleeve.id, sys.id, !on)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95",
                      on
                        ? "border-accent bg-accent-soft text-accent hover:bg-accent hover:text-white"
                        : "border-line bg-white text-mute hover:border-accent/50 hover:text-accent"
                    )}
                  >
                    {on ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {sys.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {activeSleeves.length === 0 && <p className="text-[13px] text-mute">No active sleeves.</p>}
    </div>
  );
}

export function CatalogAddForm({
  kind,
  fields,
  placeholder,
  buttonLabel,
}: {
  kind: string;
  fields: { name: string; placeholder: string; type?: string }[];
  placeholder: string;
  buttonLabel: string;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    try {
      await addCatalogEntry(kind, formData);
      toast.success(`${buttonLabel} successful`);
      formRef.current?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setPending(false);
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-center gap-2.5 border-t border-line-soft px-5 py-4">
      {fields.map((f) => (
        <input
          key={f.name}
          name={f.name}
          type={f.type ?? "text"}
          placeholder={f.placeholder}
          className="h-9 rounded-lg border border-line bg-paper/50 px-3 text-[13px] outline-none transition focus:border-accent focus:bg-white"
        />
      ))}
      <input
        name="name"
        placeholder={placeholder}
        required
        className="h-9 min-w-[220px] flex-1 rounded-lg border border-line bg-paper/50 px-3 text-[13px] outline-none transition focus:border-accent focus:bg-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper transition hover:bg-black disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />}
        {buttonLabel}
      </button>
    </form>
  );
}

export function ThresholdForm({ defaultValue }: { defaultValue: string }) {
  const [pending, setPending] = React.useState(false);
  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    try {
      await updateThreshold(formData);
      toast.success("Threshold updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update threshold");
    } finally {
      setPending(false);
    }
  };
  return (
    <form action={handleSubmit} className="rounded-xl border border-line bg-paper/50 p-4">
      <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
        Stuck-case threshold (days)
      </label>
      <div className="mt-3 flex items-center gap-2.5">
        <input
          type="number"
          name="value"
          min={1}
          max={30}
          defaultValue={defaultValue}
          className="h-9 w-24 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-accent"
        />
        <button type="submit" disabled={pending} className="h-9 flex items-center justify-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper transition hover:bg-black disabled:opacity-50">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-mute">Cases sitting longer than this in a non-terminal status get flagged on the dashboard.</p>
    </form>
  );
}

export function LabNameForm({ defaultValue }: { defaultValue: string }) {
  const [pending, setPending] = React.useState(false);
  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    try {
      await updateLabName(formData);
      toast.success("Lab name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update lab name");
    } finally {
      setPending(false);
    }
  };
  return (
    <form action={handleSubmit} className="rounded-xl border border-line bg-paper/50 p-4">
      <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
        Lab name (shown in sidebar)
      </label>
      <div className="mt-3 flex items-center gap-2.5">
        <input
          type="text"
          name="value"
          defaultValue={defaultValue}
          className="h-9 min-w-[240px] flex-1 rounded-lg border border-line bg-white px-3 text-[13px] outline-none focus:border-accent"
        />
        <button type="submit" disabled={pending} className="h-9 flex items-center justify-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-paper transition hover:bg-black disabled:opacity-50">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </button>
      </div>
    </form>
  );
}
