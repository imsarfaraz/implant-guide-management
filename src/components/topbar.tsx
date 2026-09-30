"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Package, CalendarDays, LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { logout } from "@/lib/auth-actions";
import { hasAbility } from "@/lib/permissions";

type StaffOption = { id: number; name: string; role: string; abilities?: string | null };

function UserSwitcher({ users, currentId }: { users: StaffOption[]; currentId: number }) {
  const currentUser = users.find(u => u.id === currentId);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5">
        <CalendarDays className="h-4 w-4 text-mute" strokeWidth={1.8} />
        <span className="hidden text-[13px] text-ink-soft md:block">{fmtDate(new Date())}</span>
      </div>
      <div className="h-5 w-px bg-line" />
      <div className="flex items-center gap-3">
        <Link href="/settings" className="flex flex-col items-end leading-tight hover:opacity-70 transition-opacity">
          <span className="text-[13px] font-semibold text-ink">{currentUser?.name}</span>
          <span className="text-[11px] text-mute uppercase tracking-wider">{currentUser?.role}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button 
            type="button" 
            onClick={() => logout()}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper/50 text-mute transition hover:border-danger hover:text-danger hover:bg-danger-soft"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const TITLES: [string, string][] = [
  ["/cases/new", "New guide case"],
  ["/orders/new", "New hardware order"],
  ["/cases", "Case pipeline"],
  ["/orders", "Hardware orders"],
  ["/doctors", "Doctors"],
  ["/patients", "Patients"],
  ["/team", "Team & workload"],
  ["/reports", "Reports & insights"],
  ["/settings", "Personal settings"],
  ["/help", "Guide & Help Center"],
  ["/admin", "Catalogs & settings"],
  ["/", "Dashboard"],
];

function pageTitle(pathname: string): string {
  for (const [prefix, title] of TITLES) {
    if (pathname === prefix || (prefix !== "/" && pathname.startsWith(prefix + "/"))) return title;
  }
  if (pathname.startsWith("/cases/")) return "Case";
  if (pathname.startsWith("/orders/")) return "Hardware order";
  if (pathname.startsWith("/doctors/")) return "Doctor profile";
  if (pathname.startsWith("/patients/")) return "Patient profile";
  return "Dashboard";
}

export function Topbar({ users, currentId }: { users: StaffOption[]; currentId: number }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-line bg-paper/85 px-8 backdrop-blur-md">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{pageTitle(pathname)}</h2>
        <span className="hidden text-[11px] text-mute sm:block">
          {pathname === "/" ? "live overview of the lab floor" : "surgical guide lab operations"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 lg:flex">
          {hasAbility(users.find(u => u.id === currentId)?.abilities, "cases:create", users.find(u => u.id === currentId)?.role) && (
            <Link href="/cases/new">
              <Button variant="outline" size="sm" className="h-9">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                Guide case
              </Button>
            </Link>
          )}
          {hasAbility(users.find(u => u.id === currentId)?.abilities, "orders:create", users.find(u => u.id === currentId)?.role) && (
            <Link href="/orders/new">
              <Button variant="primary" size="sm" className="h-9">
                <Package className="h-3.5 w-3.5" strokeWidth={2} />
                Hardware order
              </Button>
            </Link>
          )}
        </div>
        <div className="h-5 w-px bg-line" />
        <UserSwitcher users={users} currentId={currentId} />
      </div>
    </header>
  );
}
