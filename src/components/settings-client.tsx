"use client";

import * as React from "react";
import { UserCircle2, Key, ShieldCheck, Loader2 } from "lucide-react";
import { Card, PageHeader, Button, Field, Input } from "@/components/ui";
import { toast } from "sonner";
import { changePassword, updateProfileName } from "@/lib/auth-actions";
import { ALL_ABILITIES } from "@/lib/permissions";

interface UserProp {
  id: number;
  name: string;
  role: string;
  roleLabel: string;
  abilities: string[];
}

export function SettingsClient({ user }: { user: UserProp }) {
  const [namePending, setNamePending] = React.useState(false);
  const [pwPending, setPwPending] = React.useState(false);

  async function handleUpdateName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;

    setNamePending(true);
    try {
      const res = await updateProfileName({ name });
      if (!res.ok) {
        toast.error(res.error || "Could not update name");
      } else {
        toast.success("Profile name updated successfully!");
      }
    } finally {
      setNamePending(false);
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const cp = fd.get("currentPass") as string;
    const np = fd.get("newPass") as string;
    const np2 = fd.get("newPass2") as string;

    if (np !== np2) {
      toast.error("New passwords do not match.");
      return;
    }

    setPwPending(true);
    try {
      const res = await changePassword({ currentPassword: cp, newPassword: np });
      if (!res.ok) {
        toast.error(res.error || "Could not change password");
      } else {
        toast.success("Password updated successfully!");
        form.reset();
      }
    } finally {
      setPwPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Settings"
        subtitle="Manage your profile, security preferences, and view your account capabilities."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <UserCircle2 className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-light text-ink">Edit Profile</h2>
            </div>
            
            <form onSubmit={handleUpdateName} className="space-y-5">
              <Field label="Display Name">
                <Input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="Enter your name" 
                  defaultValue={user.name}
                  minLength={2} 
                />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={namePending}>
                  {namePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-mute">
                <Key className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-light text-ink">Change Password</h2>
            </div>
            
            <form onSubmit={handlePassword} className="space-y-5">
              <Field label="Current Password">
                <Input type="password" name="currentPass" required placeholder="Enter current password" />
              </Field>
              <Field label="New Password">
                <Input type="password" name="newPass" required placeholder="Enter new password" minLength={4} />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" name="newPass2" required placeholder="Confirm new password" minLength={4} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={pwPending}>
                  {pwPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Roles & Capabilities */}
        <div>
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-soft text-amber">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-light text-ink">My Capabilities</h2>
            </div>
            
            <p className="mb-5 text-sm text-ink-soft">
              You are assigned the role of <strong className="font-semibold text-ink">{user.roleLabel}</strong>. 
              Based on this role, you have the following permissions in the system:
            </p>

            <div className="space-y-2">
              {user.abilities.map((abilityKey) => {
                const abilityDef = ALL_ABILITIES.find((a) => a.key === abilityKey);
                return (
                  <div key={abilityKey} className="flex items-start gap-3 rounded-lg border border-line-soft bg-paper/40 p-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{abilityDef?.label || abilityKey}</p>
                      <p className="text-xs text-mute mt-0.5">{abilityDef?.description || "System permission flag"}</p>
                    </div>
                  </div>
                );
              })}
              
              {user.abilities.length === 0 && (
                <div className="rounded-lg border border-line-soft bg-paper/40 p-4 text-center text-xs text-mute">
                  No explicit abilities assigned to this role.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
