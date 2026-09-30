"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Pencil, Loader2, ShieldCheck, Check, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, Modal, Field, Input, Select, Checkbox } from "@/components/ui";
import { ALL_ABILITIES, ROLE_PRESETS, parseAbilities, formatAbilities } from "@/lib/permissions";
import { addStaff, updateStaff, deleteStaff } from "@/lib/actions";

export interface StaffData {
  id: number;
  name: string;
  username: string | null;
  role: string;
  initials: string | null;
  email: string | null;
  phone: string | null;
  abilities: string | null;
  globalAccess: boolean;
  active: boolean;
}

export function AddTeamMemberButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [role, setRole] = React.useState<string>("planner");
  const [selectedAbilities, setSelectedAbilities] = React.useState<string[]>(
    ROLE_PRESETS.planner.abilities
  );
  const [globalAccess, setGlobalAccess] = React.useState(false);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    if (ROLE_PRESETS[newRole]) {
      setSelectedAbilities(ROLE_PRESETS[newRole].abilities);
    }
  }

  function toggleAbility(key: string) {
    setSelectedAbilities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);

    const payload = {
      name: (fd.get("name") as string)?.trim(),
      username: (fd.get("username") as string)?.trim() || undefined,
      password: (fd.get("password") as string)?.trim() || undefined,
      role,
      initials: (fd.get("initials") as string)?.trim() || undefined,
      email: (fd.get("email") as string)?.trim() || undefined,
      phone: (fd.get("phone") as string)?.trim() || undefined,
      abilities: formatAbilities(selectedAbilities),
      globalAccess,
      active: true,
    };

    try {
      const res = await addStaff(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not add team member");
      } else {
        toast.success("Team member added");
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  const categories = ["Cases", "Orders", "Admin", "Analytics"] as const;

  return (
    <>
      <Button
        variant="accent"
        onClick={() => {
          setRole("planner");
          setSelectedAbilities(ROLE_PRESETS.planner.abilities);
          setOpen(true);
        }}
      >
        <UserPlus className="h-4 w-4" />
        Add team member
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add team member"
        subtitle="Create staff profile and assign roles & operational abilities."
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">


          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input name="name" required placeholder="e.g. Sanjeevini Patil" autoFocus />
            </Field>
            <Field label="Role" required>
              <Select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="admin">Lab Director / Admin</option>
                <option value="planner">Surgical Guide Planner</option>
                <option value="tech">3D Printing & Lab Tech</option>
                <option value="frontdesk">Front Desk & Logistics</option>
              </Select>
            </Field>
            <Field label="Username">
              <Input name="username" placeholder="Login username" />
            </Field>
            <Field label="Password">
              <Input type="password" name="password" placeholder="Set password" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Initials" hint="e.g. SP">
              <Input name="initials" placeholder="Auto-generated if empty" maxLength={4} />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" placeholder="staff@lab.com" />
            </Field>
            <Field label="Phone">
              <Input type="tel" name="phone" placeholder="+91 98..." />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-paper/50 px-4 py-2.5">
            <Checkbox
              label="Global Case Access"
              checked={globalAccess}
              onChange={(e) => setGlobalAccess(e.target.checked)}
            />
            <span className="text-[11px] text-mute">
              {globalAccess ? "Can view and manage entire lab floor" : "Can only see assigned cases"}
            </span>
          </div>

          <div className="border-t border-line-soft pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Assigned Operational Abilities
                </span>
                <p className="text-[11px] text-mute">
                  Select permissions granted to this team member ({selectedAbilities.length} active)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAbilities(ALL_ABILITIES.map((a) => a.key))}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                Grant all
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat} className="rounded-xl border border-line-soft bg-paper/40 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mute mb-2">{cat}</p>
                  <div className="space-y-2">
                    {ALL_ABILITIES.filter((a) => a.category === cat).map((ab) => {
                      const checked = selectedAbilities.includes(ab.key);
                      return (
                        <label
                          key={ab.key}
                          className="flex items-start gap-2 text-[12px] text-ink cursor-pointer hover:text-accent select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAbility(ab.key)}
                            className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                          />
                          <div className="min-w-0">
                            <span className="font-medium block leading-tight">{ab.label}</span>
                            <span className="text-[10px] text-mute block leading-tight mt-0.5">{ab.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-line-soft">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Save member
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditTeamMemberButton({ staff }: { staff: StaffData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [role, setRole] = React.useState(staff.role);
  const [active, setActive] = React.useState(staff.active);
  const [globalAccess, setGlobalAccess] = React.useState(staff.globalAccess ?? false);
  const [selectedAbilities, setSelectedAbilities] = React.useState<string[]>(
    parseAbilities(staff.abilities)
  );

  React.useEffect(() => {
    setRole(staff.role);
    setActive(staff.active);
    setSelectedAbilities(parseAbilities(staff.abilities));
  }, [staff]);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    if (ROLE_PRESETS[newRole]) {
      setSelectedAbilities(ROLE_PRESETS[newRole].abilities);
    }
  }

  function toggleAbility(key: string) {
    setSelectedAbilities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);

    const payload = {
      id: staff.id,
      name: (fd.get("name") as string)?.trim(),
      username: (fd.get("username") as string)?.trim() || undefined,
      password: (fd.get("password") as string)?.trim() || undefined,
      role,
      initials: (fd.get("initials") as string)?.trim() || undefined,
      email: (fd.get("email") as string)?.trim() || undefined,
      phone: (fd.get("phone") as string)?.trim() || undefined,
      abilities: formatAbilities(selectedAbilities),
      globalAccess,
      active,
    };

    try {
      const res = await updateStaff(payload as any);
      if (!res.ok) {
        toast.error(res.error || "Could not update team member");
      } else {
        toast.success("Team member updated");
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
      const res = await deleteStaff({ id: staff.id });
      if (!res.ok) {
        toast.error(res.error || "Could not delete staff member");
      } else {
        toast.success("Team member deleted");
        setDeleteOpen(false);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete staff");
    } finally {
      setPending(false);
    }
  }

  const categories = ["Cases", "Orders", "Admin", "Analytics"] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink-soft transition hover:border-accent hover:text-accent shadow-xs"
        title="Edit profile & abilities"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Edit ${staff.name}`}
        subtitle="Update role, contact details, and assign specific abilities."
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input name="name" defaultValue={staff.name} required />
            </Field>
            <Field label="Role" required>
              <Select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
                <option value="admin">Lab Director / Admin</option>
                <option value="planner">Surgical Guide Planner</option>
                <option value="tech">3D Printing & Lab Tech</option>
                <option value="frontdesk">Front Desk & Logistics</option>
              </Select>
            </Field>
            <Field label="Username">
              <Input name="username" defaultValue={staff.username ?? ""} placeholder="Login username" />
            </Field>
            <Field label="Password">
              <Input type="password" name="password" placeholder="Leave empty to keep unchanged" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Initials">
              <Input name="initials" defaultValue={staff.initials ?? ""} maxLength={4} />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" defaultValue={staff.email ?? ""} placeholder="staff@lab.com" />
            </Field>
            <Field label="Phone">
              <Input type="tel" name="phone" defaultValue={staff.phone ?? ""} placeholder="+91..." />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-paper/50 px-4 py-2.5">
            <Checkbox
              label="Active team member (can be assigned new cases)"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="text-[11px] text-mute">
              {active ? "Eligible for case assignment" : "Inactive / suspended"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-paper/50 px-4 py-2.5">
            <Checkbox
              label="Global Case Access"
              checked={globalAccess}
              onChange={(e) => setGlobalAccess(e.target.checked)}
            />
            <span className="text-[11px] text-mute">
              {globalAccess ? "Can view and manage entire lab floor" : "Can only see assigned cases"}
            </span>
          </div>

          <div className="border-t border-line-soft pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Assigned Operational Abilities
                </span>
                <p className="text-[11px] text-mute">
                  {selectedAbilities.length} of {ALL_ABILITIES.length} abilities granted
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => ROLE_PRESETS[role] && setSelectedAbilities(ROLE_PRESETS[role].abilities)}
                  className="text-[11px] font-medium text-mute hover:text-ink hover:underline"
                >
                  Reset to role defaults
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAbilities(ALL_ABILITIES.map((a) => a.key))}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Grant all
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat} className="rounded-xl border border-line-soft bg-paper/40 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mute mb-2">{cat}</p>
                  <div className="space-y-2">
                    {ALL_ABILITIES.filter((a) => a.category === cat).map((ab) => {
                      const checked = selectedAbilities.includes(ab.key);
                      return (
                        <label
                          key={ab.key}
                          className="flex items-start gap-2 text-[12px] text-ink cursor-pointer hover:text-accent select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAbility(ab.key)}
                            className="mt-0.5 rounded border-line text-accent focus:ring-accent"
                          />
                          <div className="min-w-0">
                            <span className="font-medium block leading-tight">{ab.label}</span>
                            <span className="text-[10px] text-mute block leading-tight mt-0.5">{ab.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-line-soft">
            <Button
              variant="ghost"
              type="button"
              className="text-danger hover:bg-danger-soft hover:text-danger text-xs"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove member
            </Button>

            <div className="flex gap-2.5">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Remove Team Member"
        subtitle={`Confirm removal of ${staff.name}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft/40 p-4">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs text-ink leading-relaxed">
              <p className="font-semibold text-danger mb-1">Team member removal</p>
              <p>
                If <strong>{staff.name}</strong> has cases or historical activity assigned, their account will be deactivated to preserve case logs. If there is no history, they will be removed permanently.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Confirm removal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
