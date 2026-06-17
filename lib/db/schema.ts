import { pgTable, uuid, date, text, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/* ─── better-auth tables ─────────────────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

/* ─── Tenant tables (family → babies → photos) ───────── */

export const family = pgTable("family", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const FAMILY_ROLES = ["owner", "parent", "member", "viewer"] as const
export type FamilyRole = (typeof FAMILY_ROLES)[number]

export const familyMember = pgTable("family_member", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<FamilyRole>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("family_member_unique").on(table.familyId, table.userId),
  index("family_member_user_idx").on(table.userId),
])

export const baby = pgTable("baby", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  birthDate: date("birth_date"),
  gender: text("gender"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("baby_family_idx").on(table.familyId),
])

export const babyPhotos = pgTable("baby_photos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  babyId: uuid("baby_id").notNull().references(() => baby.id, { onDelete: "restrict" }),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  photoDate: date("photo_date").notNull(),
  fileName: text("file_name").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: false }),
}, (table) => [
  index("baby_photos_baby_date_idx").on(table.babyId, table.photoDate),
])

export const invitation = pgTable("invitation", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().$type<FamilyRole>(),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("invitation_family_idx").on(table.familyId),
  index("invitation_email_idx").on(table.email),
])

export type Family = typeof family.$inferSelect
export type FamilyMember = typeof familyMember.$inferSelect
export type Baby = typeof baby.$inferSelect
export type BabyPhoto = typeof babyPhotos.$inferSelect
export type NewBabyPhoto = typeof babyPhotos.$inferInsert
export type Invitation = typeof invitation.$inferSelect
