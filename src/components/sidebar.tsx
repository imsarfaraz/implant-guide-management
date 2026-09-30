"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  StickyNote,
  UserRound,
  Users,
  UsersRound,
  BarChart3,
  Settings,
  Cross,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/cases", label: "Cases", icon: StickyNote, adminOnly: false },
  { href: "/doctors", label: "Doctors", icon: UserRound, adminOnly: false },
  { href: "/patients", label: "Patients", icon: Users, adminOnly: false },
  { href: "/team", label: "Team", icon: UsersRound, adminOnly: false },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: false },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
  { href: "/help", label: "Guide & Help", icon: HelpCircle, adminOnly: false },
  { href: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

export function Sidebar({ isAdmin, labName, defaultCollapsed = false }: { isAdmin: boolean; labName: string; defaultCollapsed?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggle = () => {
    const val = !collapsed;
    setCollapsed(val);
    document.cookie = `sidebar_collapsed=${val}; path=/; max-age=31536000`;
  };

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col bg-[#101216] text-paper transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 pb-6 pt-7 transition-all", collapsed ? "px-4 justify-center" : "px-6")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-[0_8px_20px_-8px_rgba(13,110,99,0.8)]">
          <Cross className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-medium leading-tight tracking-tight">
              {labName}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/40">
              Case Console
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg py-2.5 text-[13px] font-medium transition-all duration-150",
                collapsed ? "justify-center px-0" : "gap-3 px-3.5",
                active ? "text-paper" : "text-paper/50 hover:text-paper/90"
              )}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              {active && collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <span
                className={cn(
                  "absolute inset-0 rounded-lg transition-opacity duration-150",
                  active ? "bg-white/[0.07] opacity-100" : "opacity-0 group-hover:bg-white/[0.04] group-hover:opacity-100"
                )}
              />
              <item.icon
                className={cn(
                  "relative z-10 h-[17px] w-[17px] shrink-0 transition-colors",
                  active ? "text-accent" : "text-paper/40 group-hover:text-paper/70"
                )}
                strokeWidth={1.9}
              />
              {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="px-3 pb-3">
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "group flex w-full items-center rounded-lg py-2 text-paper/40 transition-colors hover:bg-white/[0.04] hover:text-paper/90",
            collapsed ? "justify-center" : "gap-3 px-3.5"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 transition-colors group-hover:text-paper/90" />
          ) : (
            <ChevronLeft className="h-4 w-4 shrink-0 transition-colors group-hover:text-paper/90" />
          )}
          {!collapsed && <span className="text-[13px] font-medium">Collapse</span>}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-white/[0.07] px-6 py-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-paper/30">
            Continuous dataset · no monthly forks
          </p>
          <p className="mt-1.5 font-num text-[10px] text-paper/20">v1.0 · {new Date().getFullYear()}</p>
        </div>
      )}
    </aside>
  );
}
