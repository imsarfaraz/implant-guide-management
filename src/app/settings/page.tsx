import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import { ROLE_PRESETS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Ensure role is mapped correctly or default to empty abilities array
  const rolePreset = ROLE_PRESETS[user.role] || { label: user.role, abilities: [] };

  return <SettingsClient user={{ id: user.id, name: user.name, role: user.role, roleLabel: rolePreset.label, abilities: rolePreset.abilities }} />;
}
