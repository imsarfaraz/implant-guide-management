export interface AbilityDefinition {
  key: string;
  label: string;
  description: string;
  category: "Cases" | "Orders" | "Admin" | "Analytics";
}

export const ALL_ABILITIES: AbilityDefinition[] = [
  // Cases
  {
    key: "cases:create",
    label: "Create Guide Cases",
    description: "Can log new surgical guide requests and upload scan details",
    category: "Cases",
  },
  {
    key: "cases:edit",
    label: "Edit Case Details",
    description: "Can modify teeth map, sleeve kit, address, and case remarks",
    category: "Cases",
  },
  {
    key: "cases:plan",
    label: "Be Assigned as Planner",
    description: "Can be assigned to design surgical guides and replan workflows",
    category: "Cases",
  },
  {
    key: "cases:status",
    label: "Change Case Status",
    description: "Can move cases across the pipeline (To Approve, Print, Dispatch, etc.)",
    category: "Cases",
  },
  {
    key: "cases:delete",
    label: "Delete Cases",
    description: "Can remove erroneous or test guide cases from the platform",
    category: "Cases",
  },

  // Orders
  {
    key: "orders:create",
    label: "Create Hardware Orders",
    description: "Can place implant fixture, cover screw, and accessory orders",
    category: "Orders",
  },
  {
    key: "orders:edit",
    label: "Edit Hardware Orders",
    description: "Can modify line items, sizes, quantities, and record failure notes",
    category: "Orders",
  },
  {
    key: "orders:deliver",
    label: "Dispatch & Mark Delivered",
    description: "Can confirm delivery or dispatch of hardware to clinics",
    category: "Orders",
  },
  {
    key: "orders:delete",
    label: "Delete Hardware Orders",
    description: "Can cancel and remove hardware order records",
    category: "Orders",
  },

  // Admin & Management
  {
    key: "catalog:manage",
    label: "Manage Catalogs",
    description: "Add or toggle implant systems, sleeves, case types, and settings",
    category: "Admin",
  },
  {
    key: "team:manage",
    label: "Manage Team & Roles",
    description: "Add, edit, or deactivate team members and configure abilities",
    category: "Admin",
  },
  {
    key: "reports:view",
    label: "View Advanced Reports",
    description: "Access volume analytics, turnaround time, and leaderboards",
    category: "Analytics",
  },
];

export const ROLE_PRESETS: Record<string, { label: string; abilities: string[] }> = {
  admin: {
    label: "Lab Director / Admin",
    abilities: ALL_ABILITIES.map((a) => a.key),
  },
  planner: {
    label: "Surgical Guide Planner",
    abilities: [
      "cases:create",
      "cases:edit",
      "cases:plan",
      "cases:status",
      "orders:create",
      "orders:edit",
      "reports:view",
    ],
  },
  tech: {
    label: "3D Printing & Lab Tech",
    abilities: [
      "cases:status",
      "orders:edit",
      "orders:deliver",
    ],
  },
  frontdesk: {
    label: "Front Desk & Logistics",
    abilities: [
      "cases:create",
      "cases:edit",
      "cases:status",
      "orders:create",
      "orders:edit",
      "orders:deliver",
    ],
  },
};

export function parseAbilities(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatAbilities(list: string[]): string {
  return Array.from(new Set(list)).join(",");
}

export function hasAbility(staffAbilities: string | null | undefined, ability: string, role?: string): boolean {
  if (role === "admin") return true;
  const list = parseAbilities(staffAbilities);
  return list.includes(ability) || list.includes("*");
}
