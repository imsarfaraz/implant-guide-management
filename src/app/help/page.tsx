import { HelpClient } from "@/components/help-client";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <HelpClient role={user.role} />;
}
