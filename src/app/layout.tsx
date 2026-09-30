import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/session";
import { getCatalogs, getLabName } from "@/lib/data";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Surgical Guide Lab — Case Console",
  description: "Continuous case management for implant surgical guides and hardware orders",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, { staffList }, labName] = await Promise.all([
    getCurrentUser(),
    getCatalogs(),
    getLabName(),
  ]);

  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";

  if (!user) {
    return (
      <html lang="en">
        <body className="grain bg-paper font-sans text-ink antialiased">
          {children}
          <Toaster position="bottom-right" richColors />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="grain bg-paper font-sans text-ink antialiased">
        <div className="flex min-h-screen">
          <Sidebar isAdmin={user.role === "admin"} labName={labName} defaultCollapsed={sidebarCollapsed} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              users={staffList.map((s) => ({ id: s.id, name: s.name, role: s.role, abilities: s.abilities }))}
              currentId={user.id}
            />
            <main className="mx-auto w-full flex-1 px-8 py-7">{children}</main>
          </div>
        </div>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
