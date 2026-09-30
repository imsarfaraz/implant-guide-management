"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, UserRound, Users, Pencil, Trash2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, Modal, Field, Input, Select, Textarea } from "@/components/ui";
import { createDoctor, updateDoctor, deleteDoctor, createPatient, updatePatient, deletePatient } from "@/lib/actions";

export function AddDoctorButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim() || "";
    const area = (fd.get("area") as string)?.trim() || "";
    const address = (fd.get("address") as string)?.trim() || "";

    try {
      const res = await createDoctor({ name, area, address });
      if (!res.ok) {
        toast.error(res.error || "Could not add doctor");
      } else {
        toast.success("Doctor added");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        Add doctor
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a referring doctor" subtitle="Their clinics and case history build up automatically from here.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Doctor name" required>
            <Input name="name" required placeholder="e.g. Dr. Asha Kamat" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clinic area" hint="e.g. Mulund">
              <Input name="area" placeholder="Area / locality" />
            </Field>
            <Field label="Clinic address">
              <Input name="address" placeholder="Street address" />
            </Field>
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRound className="h-3.5 w-3.5" />}
              Add doctor
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditDoctorButton({
  doctor,
  primaryClinic,
}: {
  doctor: { id: number; name: string };
  primaryClinic?: { area: string; address: string | null } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim() || "";
    const area = (fd.get("area") as string)?.trim() || "";
    const address = (fd.get("address") as string)?.trim() || "";

    try {
      const res = await updateDoctor({ id: doctor.id, name, area, address });
      if (!res.ok) {
        toast.error(res.error || "Could not update doctor");
      } else {
        toast.success("Doctor updated");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      const res = await deleteDoctor({ id: doctor.id });
      if (!res.ok) {
        toast.error(res.error || "Could not delete doctor");
      } else {
        toast.success("Doctor deleted");
        setDeleteOpen(false);
        router.push("/doctors");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit doctor
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => setDeleteOpen(true)}
          title="Delete doctor"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit doctor details" subtitle="Update name or primary clinic address.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Doctor name" required>
            <Input name="name" defaultValue={doctor.name} required autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary clinic area">
              <Input name="area" defaultValue={primaryClinic?.area ?? ""} placeholder="e.g. Mulund" />
            </Field>
            <Field label="Primary clinic address">
              <Input name="address" defaultValue={primaryClinic?.address ?? ""} placeholder="Street address" />
            </Field>
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete doctor" subtitle={`Confirm removal of ${doctor.name}`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-ink leading-relaxed">
              <p className="font-semibold text-danger mb-1">Delete clinician validation</p>
              <p>
                A doctor with active or historical guide cases or hardware orders cannot be deleted to preserve the medical audit trail.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Confirm delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function AddPatientButton({ doctors }: { doctors: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const doctorId = Number(fd.get("doctorId"));
    const name = (fd.get("name") as string)?.trim() || "";
    const notes = (fd.get("notes") as string)?.trim() || "";

    try {
      const res = await createPatient({ name, doctorId, notes });
      if (!res.ok) {
        toast.error(res.error || "Could not add patient");
      } else {
        toast.success("Patient added");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        Add patient
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Register a new patient" subtitle="Patients are strictly linked to their referring doctor.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Referring doctor" required>
            <Select name="doctorId" required defaultValue="">
              <option value="" disabled>
                Select doctor…
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Patient name" required>
            <Input name="name" required placeholder="e.g. Rakesh Sharma" />
          </Field>
          <Field label="Notes" hint="optional — e.g. maxilla, off emp, ALL ON 4 candidate">
            <Textarea name="notes" placeholder="Anything useful for the case context" />
          </Field>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
              Add patient
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditPatientButton({
  patient,
  doctors,
}: {
  patient: { id: number; name: string; doctorId: number; notes: string | null };
  doctors: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const doctorId = Number(fd.get("doctorId"));
    const name = (fd.get("name") as string)?.trim() || "";
    const notes = (fd.get("notes") as string)?.trim() || "";

    try {
      const res = await updatePatient({ id: patient.id, name, doctorId, notes });
      if (!res.ok) {
        toast.error(res.error || "Could not update patient");
      } else {
        toast.success("Patient updated");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      const res = await deletePatient({ id: patient.id });
      if (!res.ok) {
        toast.error(res.error || "Could not delete patient");
      } else {
        toast.success("Patient deleted");
        setDeleteOpen(false);
        router.push("/patients");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit patient
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => setDeleteOpen(true)}
          title="Delete patient"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit patient details" subtitle="Update name, primary doctor, or patient-specific clinical notes.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Referring doctor" required>
            <Select name="doctorId" defaultValue={String(patient.doctorId)} required>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Patient name" required>
            <Input name="name" defaultValue={patient.name} required />
          </Field>
          <Field label="Notes" hint="optional">
            <Textarea name="notes" defaultValue={patient.notes ?? ""} />
          </Field>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete patient" subtitle={`Confirm removal of ${patient.name}`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-ink leading-relaxed">
              <p className="font-semibold text-danger mb-1">Delete patient validation</p>
              <p>
                A patient with linked surgical guides or hardware orders cannot be deleted to preserve treatment history.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Confirm delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
