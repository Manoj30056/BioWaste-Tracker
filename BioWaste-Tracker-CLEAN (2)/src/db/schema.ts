import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  serial,
  pgEnum,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";

// Enums
export const facilityTypeEnum = pgEnum("facility_type", [
  "clinic",
  "nursing_home",
  "lab",
  "dental",
  "veterinary",
  "other",
]);

export const wasteCategory = pgEnum("waste_category", [
  "yellow",
  "red",
  "blue",
  "white",
  "cytotoxic",
  "chemical",
  "general",
]);

export const inspectionStatus = pgEnum("inspection_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const violationSeverity = pgEnum("violation_severity", [
  "minor",
  "major",
  "critical",
]);

export const complianceStatus = pgEnum("compliance_status", [
  "compliant",
  "non_compliant",
  "pending_review",
  "suspended",
]);

export const userRole = pgEnum("user_role", [
  "admin",
  "inspector",
  "facility_manager",
  "collector",
]);

export const alertType = pgEnum("alert_type", [
  "overdue_collection",
  "violation_found",
  "non_compliant",
  "inspection_due",
  "critical_waste",
]);

export const alertStatus = pgEnum("alert_status", [
  "active",
  "acknowledged",
  "resolved",
]);

// ============ App Tables (defined first to avoid circular refs) ============

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: facilityTypeEnum("type").notNull(),
  licenseNumber: varchar("license_number", { length: 100 }).notNull().unique(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 10 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  bedCount: integer("bed_count"),
  complianceStatus: complianceStatus("compliance_status")
    .notNull()
    .default("pending_review"),
  isActive: boolean("is_active").notNull().default(true),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ NextAuth Tables ============

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRole("role").notNull().default("facility_manager"),
  facilityId: integer("facility_id").references(() => facilities.id),
  phone: varchar("phone", { length: 20 }),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ============ More App Tables ============

export const wasteLogs = pgTable("waste_logs", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id")
    .notNull()
    .references(() => facilities.id),
  category: wasteCategory("category").notNull(),
  quantityKg: numeric("quantity_kg", { precision: 10, scale: 3 }).notNull(),
  description: text("description"),
  disposalMethod: varchar("disposal_method", { length: 255 }),
  handlerName: varchar("handler_name", { length: 255 }),
  manifestNumber: varchar("manifest_number", { length: 100 }),
  storageLocation: varchar("storage_location", { length: 255 }),
  collectedAt: timestamp("collected_at"),
  loggedById: text("logged_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  facilityId: integer("facility_id")
    .notNull()
    .references(() => facilities.id),
  inspectorId: text("inspector_id").references(() => users.id),
  status: inspectionStatus("status").notNull().default("scheduled"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  isSpotCheck: boolean("is_spot_check").notNull().default(false),
  overallScore: integer("overall_score"),
  segregationScore: integer("segregation_score"),
  storageScore: integer("storage_score"),
  documentationScore: integer("documentation_score"),
  trainingScore: integer("training_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id")
    .notNull()
    .references(() => inspections.id),
  facilityId: integer("facility_id")
    .notNull()
    .references(() => facilities.id),
  severity: violationSeverity("severity").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description").notNull(),
  correctiveAction: text("corrective_action"),
  deadline: timestamp("deadline"),
  resolvedAt: timestamp("resolved_at"),
  isResolved: boolean("is_resolved").notNull().default(false),
  fineAmount: numeric("fine_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const disposalPartners = pgTable("disposal_partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  licenseNumber: varchar("license_number", { length: 100 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alerts table for notifications
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: alertType("type").notNull(),
  status: alertStatus("status").notNull().default("active"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  facilityId: integer("facility_id").references(() => facilities.id),
  wasteLogId: integer("waste_log_id").references(() => wasteLogs.id),
  violationId: integer("violation_id").references(() => violations.id),
  inspectionId: integer("inspection_id").references(() => inspections.id),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Collection records - tracks when waste is picked up
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  wasteLogId: integer("waste_log_id").notNull().references(() => wasteLogs.id),
  collectorId: text("collector_id").references(() => users.id),
  collectorName: varchar("collector_name", { length: 255 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
  signature: text("signature"), // Base64 signature data
  notes: text("notes"),
  gpsLat: numeric("gps_lat", { precision: 10, scale: 7 }),
  gpsLng: numeric("gps_lng", { precision: 10, scale: 7 }),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type WasteLog = typeof wasteLogs.$inferSelect;
export type Inspection = typeof inspections.$inferSelect;
export type Violation = typeof violations.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Collection = typeof collections.$inferSelect;
