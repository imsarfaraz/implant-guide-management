import { sql } from "drizzle-orm";
import { db } from "./index";
import { seedDatabase } from "./seeding";

// Idempotent schema DDL — lets the app self-initialize in any fresh
// environment (no manual `drizzle-kit push` or seed step required).
const DDL = `
CREATE TABLE IF NOT EXISTS staff (
  id serial PRIMARY KEY,
  name text NOT NULL,
  username text UNIQUE,
  password_hash text,
  role text NOT NULL DEFAULT 'frontdesk',
  initials text,
  email text,
  phone text,
  abilities text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS abilities text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS global_access boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS doctors (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS doctor_clinics (
  id serial PRIMARY KEY,
  doctor_id integer NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  area text NOT NULL,
  address text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinic_doctor_idx ON doctor_clinics (doctor_id);
CREATE TABLE IF NOT EXISTS patients (
  id serial PRIMARY KEY,
  doctor_id integer NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patient_doctor_idx ON patients (doctor_id);
CREATE TABLE IF NOT EXISTS implant_systems (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sleeve_kits (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sleeve_compat (
  sleeve_id integer NOT NULL REFERENCES sleeve_kits(id) ON DELETE CASCADE,
  system_id integer NOT NULL REFERENCES implant_systems(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS sleeve_compat_uq ON sleeve_compat (sleeve_id, system_id);
CREATE INDEX IF NOT EXISTS sleeve_compat_system_idx ON sleeve_compat (system_id);
CREATE TABLE IF NOT EXISTS case_types (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS statuses (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'stage',
  sort_order integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#64748b',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS package_tiers (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS guide_cases (
  id serial PRIMARY KEY,
  display_id text NOT NULL UNIQUE,
  month_key text NOT NULL,
  seq_no integer NOT NULL,
  doctor_id integer NOT NULL REFERENCES doctors(id),
  patient_id integer NOT NULL REFERENCES patients(id),
  case_type_id integer NOT NULL REFERENCES case_types(id),
  system_id integer REFERENCES implant_systems(id),
  sleeve_id integer REFERENCES sleeve_kits(id),
  planner_id integer REFERENCES staff(id),
  status_id integer NOT NULL REFERENCES statuses(id),
  teeth text,
  centre text,
  address text,
  remarks text,
  stl_received boolean NOT NULL DEFAULT false,
  model_received boolean NOT NULL DEFAULT false,
  guide_report text,
  kit_note text,
  physio_dispenser boolean NOT NULL DEFAULT false,
  status_since timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS guide_case_month_seq_uq ON guide_cases (month_key, seq_no);
CREATE INDEX IF NOT EXISTS guide_case_doctor_idx ON guide_cases (doctor_id);
CREATE INDEX IF NOT EXISTS guide_case_patient_idx ON guide_cases (patient_id);
CREATE INDEX IF NOT EXISTS guide_case_status_idx ON guide_cases (status_id);
CREATE INDEX IF NOT EXISTS guide_case_planner_idx ON guide_cases (planner_id);
CREATE INDEX IF NOT EXISTS guide_case_created_idx ON guide_cases (created_at);
CREATE TABLE IF NOT EXISTS guide_case_doctors (
  case_id integer NOT NULL REFERENCES guide_cases(id) ON DELETE CASCADE,
  doctor_id integer NOT NULL REFERENCES doctors(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS guide_case_doctors_uq ON guide_case_doctors (case_id, doctor_id);
CREATE INDEX IF NOT EXISTS guide_case_doctors_doctor_idx ON guide_case_doctors (doctor_id);
CREATE TABLE IF NOT EXISTS status_history (
  id serial PRIMARY KEY,
  case_id integer NOT NULL REFERENCES guide_cases(id) ON DELETE CASCADE,
  from_status_id integer REFERENCES statuses(id),
  to_status_id integer NOT NULL REFERENCES statuses(id),
  staff_id integer REFERENCES staff(id),
  remark text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS status_history_case_idx ON status_history (case_id);
CREATE INDEX IF NOT EXISTS status_history_created_idx ON status_history (created_at);
CREATE TABLE IF NOT EXISTS hardware_orders (
  id serial PRIMARY KEY,
  display_id text NOT NULL UNIQUE,
  month_key text NOT NULL,
  seq_no integer NOT NULL,
  doctor_id integer NOT NULL REFERENCES doctors(id),
  patient_id integer NOT NULL REFERENCES patients(id),
  package_tier_id integer REFERENCES package_tiers(id),
  order_date date,
  delivery_date date,
  delivered boolean NOT NULL DEFAULT false,
  remarks text,
  linked_case_id integer REFERENCES guide_cases(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hw_order_month_seq_uq ON hardware_orders (month_key, seq_no);
CREATE INDEX IF NOT EXISTS hw_order_doctor_idx ON hardware_orders (doctor_id);
CREATE INDEX IF NOT EXISTS hw_order_patient_idx ON hardware_orders (patient_id);
CREATE INDEX IF NOT EXISTS hw_order_date_idx ON hardware_orders (order_date);
CREATE TABLE IF NOT EXISTS hardware_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES hardware_orders(id) ON DELETE CASCADE,
  system_id integer REFERENCES implant_systems(id),
  size text,
  qty integer NOT NULL DEFAULT 1,
  cover_screw_qty integer NOT NULL DEFAULT 0,
  physio_qty integer NOT NULL DEFAULT 0,
  failed boolean NOT NULL DEFAULT false,
  fail_note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hw_item_order_idx ON hardware_items (order_id);
CREATE TABLE IF NOT EXISTS order_accessories (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES hardware_orders(id) ON DELETE CASCADE,
  kind text NOT NULL,
  detail text,
  qty integer NOT NULL DEFAULT 1,
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_acc_order_idx ON order_accessories (order_id);
CREATE TABLE IF NOT EXISTS activity_log (
  id serial PRIMARY KEY,
  staff_id integer REFERENCES staff(id),
  entity_type text NOT NULL,
  entity_id integer,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_log (created_at);
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

const g = globalThis as typeof globalThis & { __labDbReady?: Promise<void> };

async function init(): Promise<void> {
  await db.execute(sql.raw(DDL));
  const res = (await db.execute(
    sql`select count(*)::int as n from staff`
  )) as unknown as { rows: { n: number }[] };
  const n = res.rows[0]?.n ?? 0;
  if (n === 0) {
    await seedDatabase();
  }
}

export function ensureDb(): Promise<void> {
  if (!g.__labDbReady) {
    g.__labDbReady = init().catch((err) => {
      g.__labDbReady = undefined;
      throw err;
    });
  }
  return g.__labDbReady;
}
