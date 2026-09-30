import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.enum(["admin", "planner", "tech", "frontdesk"]).optional(),
  initials: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  abilities: z.string().optional().nullable(),
  globalAccess: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const updateStaffSchema = staffSchema.extend({
  id: z.number(),
});

export const doctorSchema = z.object({
  name: z.string().min(1, "Doctor name is required"),
  area: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const updateDoctorSchema = doctorSchema.extend({
  id: z.number(),
});

export const patientSchema = z.object({
  doctorId: z.number(),
  name: z.string().min(1, "Patient name is required"),
  notes: z.string().optional().nullable(),
});

export const updatePatientSchema = patientSchema.extend({
  id: z.number(),
  doctorId: z.number().optional().nullable(),
});

export const idSchema = z.object({
  id: z.number(),
});

export const guideCaseSchema = z.object({
  doctorId: z.coerce.number().optional().nullable(),
  newDoctorName: z.string().optional().nullable(),
  newDoctorArea: z.string().optional().nullable(),
  patientId: z.coerce.number().optional().nullable(),
  newPatientName: z.string().optional().nullable(),
  newPatientNotes: z.string().optional().nullable(),
  caseTypeId: z.coerce.number().min(1, "Case type is required"),
  systemId: z.coerce.number().optional().nullable(),
  sleeveId: z.coerce.number().optional().nullable(),
  plannerId: z.coerce.number().optional().nullable(),
  teeth: z.string().optional().nullable(),
  centre: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  kitNote: z.string().optional().nullable(),
  guideReport: z.string().optional().nullable(),
  stlReceived: z.boolean().optional(),
  modelReceived: z.boolean().optional(),
  physioDispenser: z.boolean().optional(),
});

export const updateGuideCaseSchema = guideCaseSchema.extend({
  caseId: z.coerce.number(),
  doctorId: z.coerce.number(),
  patientId: z.coerce.number(),
  caseTypeId: z.coerce.number().optional().nullable(),
});

export const moveCaseSchema = z.object({
  caseId: z.coerce.number(),
  statusKey: z.string().min(1),
  remark: z.string().optional().nullable(),
});

export const hardwareItemSchema = z.object({
  systemId: z.coerce.number().optional().nullable(),
  size: z.string().optional().nullable(),
  qty: z.coerce.number().optional().default(1),
  coverScrewQty: z.coerce.number().optional().default(0),
  cover: z.coerce.number().optional(), // fallback
  physioQty: z.coerce.number().optional().default(0),
  physio: z.coerce.number().optional(), // fallback
  failed: z.boolean().optional(),
  failNote: z.string().optional().nullable(),
});

export const orderAccessorySchema = z.object({
  kind: z.string().optional().default("other"),
  detail: z.string().optional().nullable(),
  qty: z.coerce.number().optional().default(1),
  note: z.string().optional().nullable(),
});

export const hardwareOrderSchema = z.object({
  doctorId: z.coerce.number().optional().nullable(),
  newDoctorName: z.string().optional().nullable(),
  newDoctorArea: z.string().optional().nullable(),
  patientId: z.coerce.number().optional().nullable(),
  newPatientName: z.string().optional().nullable(),
  newPatientNotes: z.string().optional().nullable(),
  tierId: z.coerce.number().optional().nullable(),
  orderDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  delivered: z.boolean().optional(),
  remarks: z.string().optional().nullable(),
  linkedCaseId: z.coerce.number().optional().nullable(),
  items: z.array(hardwareItemSchema).optional(),
  accessories: z.array(orderAccessorySchema).optional(),
});

export const updateHardwareOrderSchema = z.object({
  orderId: z.coerce.number(),
  tierId: z.coerce.number().optional().nullable(),
  orderDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  delivered: z.boolean().optional(),
  remarks: z.string().optional().nullable(),
  linkedCaseId: z.coerce.number().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters long"),
});
