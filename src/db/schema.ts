import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("frontdesk"), // admin | planner | tech | frontdesk
  initials: text("initials"),
  email: text("email"),
  phone: text("phone"),
  abilities: text("abilities"), // comma-separated permission keys
  globalAccess: boolean("global_access").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctorClinics = pgTable(
  "doctor_clinics",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    area: text("area").notNull(),
    address: text("address"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clinic_doctor_idx").on(t.doctorId)]
);

export const patients = pgTable(
  "patients",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("patient_doctor_idx").on(t.doctorId)]
);

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

export const implantSystems = pgTable("implant_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sleeveKits = pgTable("sleeve_kits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sleeveCompat = pgTable(
  "sleeve_compat",
  {
    sleeveId: integer("sleeve_id")
      .notNull()
      .references(() => sleeveKits.id, { onDelete: "cascade" }),
    systemId: integer("system_id")
      .notNull()
      .references(() => implantSystems.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("sleeve_compat_uq").on(t.sleeveId, t.systemId),
    index("sleeve_compat_system_idx").on(t.systemId),
  ]
);

export const caseTypes = pgTable("case_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("stage"), // stage | hold | terminal
  sortOrder: integer("sort_order").notNull().default(0),
  color: text("color").notNull().default("#64748b"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const packageTiers = pgTable("package_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Guide cases
// ---------------------------------------------------------------------------

export const guideCases = pgTable(
  "guide_cases",
  {
    id: serial("id").primaryKey(),
    displayId: text("display_id").notNull().unique(),
    monthKey: text("month_key").notNull(),
    seqNo: integer("seq_no").notNull(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    caseTypeId: integer("case_type_id")
      .notNull()
      .references(() => caseTypes.id),
    systemId: integer("system_id").references(() => implantSystems.id),
    sleeveId: integer("sleeve_id").references(() => sleeveKits.id),
    plannerId: integer("planner_id").references(() => staff.id),
    statusId: integer("status_id")
      .notNull()
      .references(() => statuses.id),
    teeth: text("teeth"),
    centre: text("centre"),
    address: text("address"),
    remarks: text("remarks"),
    stlReceived: boolean("stl_received").notNull().default(false),
    modelReceived: boolean("model_received").notNull().default(false),
    guideReport: text("guide_report"),
    kitNote: text("kit_note"),
    physioDispenser: boolean("physio_dispenser").notNull().default(false),
    statusSince: timestamp("status_since", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("guide_case_month_seq_uq").on(t.monthKey, t.seqNo),
    index("guide_case_doctor_idx").on(t.doctorId),
    index("guide_case_patient_idx").on(t.patientId),
    index("guide_case_status_idx").on(t.statusId),
    index("guide_case_planner_idx").on(t.plannerId),
    index("guide_case_created_idx").on(t.createdAt),
  ]
);

// Joint cases: a guide case can involve more than one doctor.
export const guideCaseDoctors = pgTable(
  "guide_case_doctors",
  {
    caseId: integer("case_id")
      .notNull()
      .references(() => guideCases.id, { onDelete: "cascade" }),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("guide_case_doctors_uq").on(t.caseId, t.doctorId),
    index("guide_case_doctors_doctor_idx").on(t.doctorId),
  ]
);

export const statusHistory = pgTable(
  "status_history",
  {
    id: serial("id").primaryKey(),
    caseId: integer("case_id")
      .notNull()
      .references(() => guideCases.id, { onDelete: "cascade" }),
    fromStatusId: integer("from_status_id").references(() => statuses.id),
    toStatusId: integer("to_status_id")
      .notNull()
      .references(() => statuses.id),
    staffId: integer("staff_id").references(() => staff.id),
    remark: text("remark"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("status_history_case_idx").on(t.caseId),
    index("status_history_created_idx").on(t.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Implant hardware orders
// ---------------------------------------------------------------------------

export const hardwareOrders = pgTable(
  "hardware_orders",
  {
    id: serial("id").primaryKey(),
    displayId: text("display_id").notNull().unique(),
    monthKey: text("month_key").notNull(),
    seqNo: integer("seq_no").notNull(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    packageTierId: integer("package_tier_id").references(() => packageTiers.id),
    orderDate: date("order_date"),
    deliveryDate: date("delivery_date"),
    delivered: boolean("delivered").notNull().default(false),
    remarks: text("remarks"),
    linkedCaseId: integer("linked_case_id").references(() => guideCases.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("hw_order_month_seq_uq").on(t.monthKey, t.seqNo),
    index("hw_order_doctor_idx").on(t.doctorId),
    index("hw_order_patient_idx").on(t.patientId),
    index("hw_order_date_idx").on(t.orderDate),
  ]
);

export const hardwareItems = pgTable(
  "hardware_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => hardwareOrders.id, { onDelete: "cascade" }),
    systemId: integer("system_id").references(() => implantSystems.id),
    size: text("size"),
    qty: integer("qty").notNull().default(1),
    coverScrewQty: integer("cover_screw_qty").notNull().default(0),
    physioQty: integer("physio_qty").notNull().default(0),
    failed: boolean("failed").notNull().default(false),
    failNote: text("fail_note"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("hw_item_order_idx").on(t.orderId)]
);

export const orderAccessories = pgTable(
  "order_accessories",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => hardwareOrders.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // healing_cap | cover_screw | prosthetic_screw | abutment | physio | other
    detail: text("detail"),
    qty: integer("qty").notNull().default(1),
    note: text("note"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_acc_order_idx").on(t.orderId)]
);

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export const activityLog = pgTable(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id").references(() => staff.id),
    entityType: text("entity_type").notNull(), // guide_case | hardware_order | doctor | patient | catalog | setting
    entityId: integer("entity_id"),
    action: text("action").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)]
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
