import { db } from "@/db";
import * as t from "@/db/schema";
import { guideCaseDoctors } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { ensureDb } from "@/db/bootstrap";

// ---------------------------------------------------------------------------
// Full-row query builders (shared across pages)
// ---------------------------------------------------------------------------

export async function fetchGuideCases() {
  await ensureDb();
  return db
    .select({
      id: t.guideCases.id,
      displayId: t.guideCases.displayId,
      monthKey: t.guideCases.monthKey,
      seqNo: t.guideCases.seqNo,
      doctorId: t.guideCases.doctorId,
      patientId: t.guideCases.patientId,
      caseTypeId: t.guideCases.caseTypeId,
      systemId: t.guideCases.systemId,
      sleeveId: t.guideCases.sleeveId,
      plannerId: t.guideCases.plannerId,
      statusId: t.guideCases.statusId,
      teeth: t.guideCases.teeth,
      centre: t.guideCases.centre,
      address: t.guideCases.address,
      remarks: t.guideCases.remarks,
      stlReceived: t.guideCases.stlReceived,
      modelReceived: t.guideCases.modelReceived,
      physioDispenser: t.guideCases.physioDispenser,
      kitNote: t.guideCases.kitNote,
      guideReport: t.guideCases.guideReport,
      statusSince: t.guideCases.statusSince,
      createdAt: t.guideCases.createdAt,
      updatedAt: t.guideCases.updatedAt,
      doctor: t.doctors.name,
      patient: t.patients.name,
      typeName: t.caseTypes.name,
      typeCode: t.caseTypes.code,
      system: t.implantSystems.name,
      sleeve: t.sleeveKits.name,
      planner: t.staff.name,
      plannerInitials: t.staff.initials,
      statusName: t.statuses.name,
      statusKey: t.statuses.key,
      statusKind: t.statuses.kind,
      statusColor: t.statuses.color,
      statusSort: t.statuses.sortOrder,
    })
    .from(t.guideCases)
    .innerJoin(t.doctors, eq(t.guideCases.doctorId, t.doctors.id))
    .innerJoin(t.patients, eq(t.guideCases.patientId, t.patients.id))
    .innerJoin(t.caseTypes, eq(t.guideCases.caseTypeId, t.caseTypes.id))
    .leftJoin(t.implantSystems, eq(t.guideCases.systemId, t.implantSystems.id))
    .leftJoin(t.sleeveKits, eq(t.guideCases.sleeveId, t.sleeveKits.id))
    .leftJoin(t.staff, eq(t.guideCases.plannerId, t.staff.id))
    .innerJoin(t.statuses, eq(t.guideCases.statusId, t.statuses.id));
}
export type GuideCaseRow = Awaited<ReturnType<typeof fetchGuideCases>>[number];

export async function fetchOrders() {
  await ensureDb();
  return db
    .select({
      id: t.hardwareOrders.id,
      displayId: t.hardwareOrders.displayId,
      monthKey: t.hardwareOrders.monthKey,
      seqNo: t.hardwareOrders.seqNo,
      doctorId: t.hardwareOrders.doctorId,
      patientId: t.hardwareOrders.patientId,
      packageTierId: t.hardwareOrders.packageTierId,
      orderDate: t.hardwareOrders.orderDate,
      deliveryDate: t.hardwareOrders.deliveryDate,
      delivered: t.hardwareOrders.delivered,
      remarks: t.hardwareOrders.remarks,
      linkedCaseId: t.hardwareOrders.linkedCaseId,
      createdAt: t.hardwareOrders.createdAt,
      updatedAt: t.hardwareOrders.updatedAt,
      doctor: t.doctors.name,
      patient: t.patients.name,
      tier: t.packageTiers.name,
      linkedDisplay: t.guideCases.displayId,
      linkedStatusKey: t.statuses.key,
      linkedStatusName: t.statuses.name,
      linkedStatusColor: t.statuses.color,
      itemCount: sql<number>`(select count(*)::int from hardware_items hi where hi.order_id = hardware_orders.id)`,
      totalQty: sql<number>`(select coalesce(sum(hi.qty),0)::int from hardware_items hi where hi.order_id = hardware_orders.id)`,
      failedCount: sql<number>`(select count(*)::int from hardware_items hi where hi.order_id = hardware_orders.id and hi.failed)`,
      accCount: sql<number>`(select count(*)::int from order_accessories oa where oa.order_id = hardware_orders.id)`,
    })
    .from(t.hardwareOrders)
    .innerJoin(t.doctors, eq(t.hardwareOrders.doctorId, t.doctors.id))
    .innerJoin(t.patients, eq(t.hardwareOrders.patientId, t.patients.id))
    .leftJoin(t.packageTiers, eq(t.hardwareOrders.packageTierId, t.packageTiers.id))
    .leftJoin(t.guideCases, eq(t.hardwareOrders.linkedCaseId, t.guideCases.id))
    .leftJoin(t.statuses, eq(t.guideCases.statusId, t.statuses.id));
}
export type OrderRow = Awaited<ReturnType<typeof fetchOrders>>[number];

// ---------------------------------------------------------------------------
// Catalogs & reference data
// ---------------------------------------------------------------------------

export async function getCatalogs() {
  await ensureDb();
  const [systems, sleeves, types, statusList, tiers, staffList, compat] = await Promise.all([
    db.select().from(t.implantSystems).orderBy(asc(t.implantSystems.name)),
    db.select().from(t.sleeveKits).orderBy(asc(t.sleeveKits.name)),
    db.select().from(t.caseTypes).orderBy(asc(t.caseTypes.sortOrder)),
    db.select().from(t.statuses).orderBy(asc(t.statuses.sortOrder)),
    db.select().from(t.packageTiers).orderBy(asc(t.packageTiers.sortOrder)),
    db.select().from(t.staff).orderBy(asc(t.staff.name)),
    db.select().from(t.sleeveCompat),
  ]);
  return { systems, sleeves, types, statusList, tiers, staffList, compat };
}
export type Catalogs = Awaited<ReturnType<typeof getCatalogs>>;

export async function getDoctors() {
  await ensureDb();
  return db.select().from(t.doctors).orderBy(asc(t.doctors.name));
}

export async function getPatients() {
  await ensureDb();
  return db.select().from(t.patients).orderBy(asc(t.patients.name));
}

export async function getStuckThreshold(): Promise<number> {
  await ensureDb();
  const rows = await db
    .select()
    .from(t.appSettings)
    .where(eq(t.appSettings.key, "stuck_threshold_days"));
  return parseInt(rows[0]?.value ?? "3", 10);
}

export async function getLabName(): Promise<string> {
  await ensureDb();
  const rows = await db
    .select()
    .from(t.appSettings)
    .where(eq(t.appSettings.key, "lab_name"));
  return rows[0]?.value ?? "Surgical Guide Lab";
}

// ---------------------------------------------------------------------------
// Detail queries
// ---------------------------------------------------------------------------

export async function fetchCaseHistory(caseId: number) {
  return db
    .select({
      id: t.statusHistory.id,
      caseId: t.statusHistory.caseId,
      fromStatusId: t.statusHistory.fromStatusId,
      toStatusId: t.statusHistory.toStatusId,
      staffId: t.statusHistory.staffId,
      remark: t.statusHistory.remark,
      createdAt: t.statusHistory.createdAt,
      fromName: sql<string | null>`(select s.name from statuses s where s.id = status_history.from_status_id)`,
      toName: sql<string>`(select s.name from statuses s where s.id = status_history.to_status_id)`,
      toColor: sql<string>`(select s.color from statuses s where s.id = status_history.to_status_id)`,
      staff: t.staff.name,
      staffInitials: t.staff.initials,
    })
    .from(t.statusHistory)
    .leftJoin(t.staff, eq(t.statusHistory.staffId, t.staff.id))
    .where(eq(t.statusHistory.caseId, caseId))
    .orderBy(asc(t.statusHistory.createdAt));
}
export type HistoryRow = Awaited<ReturnType<typeof fetchCaseHistory>>[number];

export async function fetchOrderItems(orderId: number) {
  return db
    .select({
      id: t.hardwareItems.id,
      orderId: t.hardwareItems.orderId,
      systemId: t.hardwareItems.systemId,
      size: t.hardwareItems.size,
      qty: t.hardwareItems.qty,
      coverScrewQty: t.hardwareItems.coverScrewQty,
      physioQty: t.hardwareItems.physioQty,
      failed: t.hardwareItems.failed,
      failNote: t.hardwareItems.failNote,
      sortOrder: t.hardwareItems.sortOrder,
      system: t.implantSystems.name,
    })
    .from(t.hardwareItems)
    .leftJoin(t.implantSystems, eq(t.hardwareItems.systemId, t.implantSystems.id))
    .where(eq(t.hardwareItems.orderId, orderId))
    .orderBy(asc(t.hardwareItems.sortOrder), asc(t.hardwareItems.id));
}
export type ItemRow = Awaited<ReturnType<typeof fetchOrderItems>>[number];

export async function fetchOrderAccessories(orderId: number) {
  return db
    .select()
    .from(t.orderAccessories)
    .where(eq(t.orderAccessories.orderId, orderId))
    .orderBy(asc(t.orderAccessories.sortOrder), asc(t.orderAccessories.id));
}

export async function fetchExtraDoctors(caseId: number) {
  return db
    .select({ id: guideCaseDoctors.doctorId, name: t.doctors.name })
    .from(guideCaseDoctors)
    .innerJoin(t.doctors, eq(guideCaseDoctors.doctorId, t.doctors.id))
    .where(eq(guideCaseDoctors.caseId, caseId));
}

export async function fetchDoctorClinics(doctorId: number) {
  return db
    .select()
    .from(t.doctorClinics)
    .where(eq(t.doctorClinics.doctorId, doctorId))
    .orderBy(asc(t.doctorClinics.isPrimary), asc(t.doctorClinics.id));
}

export async function fetchRecentActivity(limit = 10) {
  return db
    .select({
      id: t.activityLog.id,
      staffId: t.activityLog.staffId,
      entityType: t.activityLog.entityType,
      entityId: t.activityLog.entityId,
      action: t.activityLog.action,
      detail: t.activityLog.detail,
      createdAt: t.activityLog.createdAt,
      staff: t.staff.name,
      staffInitials: t.staff.initials,
    })
    .from(t.activityLog)
    .leftJoin(t.staff, eq(t.activityLog.staffId, t.staff.id))
    .orderBy(sql`${t.activityLog.createdAt} desc`)
    .limit(limit);
}
