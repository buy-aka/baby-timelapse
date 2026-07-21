import { pgTable, uuid, date, text, timestamp, boolean, integer, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/* ─── better-auth tables ─────────────────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // verify.mn-ээр баталгаажсан утасны дугаар (бүртгэлд заавал).
  // NULL зөвшөөрнө — хуучин хэрэглэгчид утасгүй байж болно. Postgres-д
  // unique index нь олон NULL-ыг зөвшөөрдөг тул зөрчилдөхгүй.
  phone: text("phone").unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  // Бүртгэлийн үед үйлчилгээний нөхцөл (/terms) зөвшөөрсөн эсэх.
  // Зөвшөөрсөн хугацаа нь createdAt (бүртгэлийн агшин) болно.
  termsAccepted: boolean("terms_accepted").notNull().default(false),
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

/* ─── verify.mn — утас баталгаажуулах session ────────── */

// verify.mn (MO SMS) баталгаажуулалтын session. Бүртгэлийн үед
// хэрэглэгч 144773 руу код илгээж утсаа баталгаажуулна.
// status зөвхөн сервер тал (GET /api/verify/status) verify.mn-ээс
// баталгаажуулж VERIFIED болгоно — client шууд өөрчилж чадахгүй.
export const verifySession = pgTable("verify_session", {
  // verify.mn-ий буцаадаг sessionId (UUID)
  sessionId: text("session_id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("PENDING").$type<"PENDING" | "VERIFIED" | "EXPIRED">(),
  // Нэг баталгаажуулалтыг зөвхөн нэг бүртгэлд ашиглана (replay-с сэргийлэх)
  consumed: boolean("consumed").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("verify_session_phone_idx").on(table.phone),
])

export type VerifySession = typeof verifySession.$inferSelect

/* ─── verify.mn — RULE-ээр нэвтрэх (утасны дугаараар, парольгүй) ─── */

// "login" RULE-ээр ирэх SMS-г хүлээх challenge. Хэрэглэгч аль хэдийн
// баталгаажсан утастай бол энэ кодыг 144773 руу илгээж парольгүй нэвтэрнэ.
// status-ыг зөвхөн app/api/sms/check (verify.mn callback) VERIFIED болгодог,
// app/api/auth/phone-login/status нь VERIFIED→CONSUMED болгож session үүсгэнэ.
export const phoneLoginChallenge = pgTable("phone_login_challenge", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("PENDING").$type<"PENDING" | "VERIFIED" | "CONSUMED" | "EXPIRED">(),
  // verify.mn callback-аас ирэх requestId — debug/audit-д зориулав.
  requestId: text("request_id"),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("phone_login_challenge_phone_idx").on(table.phone),
])

export type PhoneLoginChallenge = typeof phoneLoginChallenge.$inferSelect

/* ─── Tenant tables (family → babies → photos) ───────── */

export const family = pgTable("family", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/* ─── Багцын захиалга (subscription, family тутамд нэг) ─── */

// Гэр бүл бүрд нэг захиалга. Төлөв нь хадгалагдахгүй — огноонуудаас гарна:
//   plan тавигдсан && periodEndsAt > now  → идэвхтэй (төлбөртэй)
//   үгүй бол trialEndsAt > now            → туршилтын хугацаа
//   аль нь ч биш                           → дууссан
// requestedPlan/requestedAmountMnt/paymentReference — хэрэглэгч багц сонгож
// шилжүүлэг хийхийг хүлээж буй үед бөглөгдөнө. Дүнг хүсэлтийн агшинд
// баазад тогтоож, reference-ийг багц солигдох бүрд шинэчилдэг тул
// "бага дүн төлөөд өндөр багц авах" боломжгүй. Баталгаажуулмагц гурвууланг
// нь цэвэрлэж plan/periodEndsAt-ыг тавина (deploy/DEPLOY.md-ийн SQL-ийг үз).
export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }).unique(),
  plan: text("plan").$type<"basic" | "plus">(),
  requestedPlan: text("requested_plan").$type<"basic" | "plus">(),
  requestedAmountMnt: integer("requested_amount_mnt"),
  paymentReference: text("payment_reference").unique(),
  trialEndsAt: timestamp("trial_ends_at").notNull(),
  periodEndsAt: timestamp("period_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type Subscription = typeof subscription.$inferSelect

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
  // /api/image/[filename] эрхийн шалгалт файлын нэрээр хайдаг
  index("baby_photos_file_name_idx").on(table.fileName),
])

/* ─── Plus багцын тусдаа цомог (album, family тутамд) ─── */

// Timelapse-ээс тусдаа, огноонд баригдахгүй зургийн цомог. Зөвхөн Plus
// багцтай гэр бүлд нээлттэй, нийт хэмжээ нь ALBUM_LIMIT_BYTES-ээр
// хязгаарлагдана (size баганын нийлбэрээр тоолно). Устгахад мөр болон
// storage дахь объектыг хамт устгадаг (soft delete БИШ) — квот үнэн зөв
// үлдэж, диск чөлөөлөгдөнө.
export const albumPhoto = pgTable("album_photo", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  size: integer("size").notNull(), // байтаар
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("album_photo_family_idx").on(table.familyId, table.createdAt),
  index("album_photo_file_name_idx").on(table.fileName),
])

export type AlbumPhoto = typeof albumPhoto.$inferSelect

/* ─── Timelapse бичлэг татсан түүх (rate limit-д) ─── */

// Багцын хязгаар: Basic/туршилт 7 хоногт 1, Plus өдөрт 1 (rolling цонх).
// Хязгаар family түвшинд тоологдоно — /api/video сүүлийн бичлэгийг эндээс
// шалгаж, амжилттай үүсгэсний ДАРАА мөр нэмдэг.
export const videoDownload = pgTable("video_download", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  babyId: uuid("baby_id").notNull().references(() => baby.id, { onDelete: "cascade" }),
  downloadedBy: text("downloaded_by").references(() => user.id, { onDelete: "set null" }),
  frameCount: integer("frame_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("video_download_family_idx").on(table.familyId, table.createdAt),
])

export const invitation = pgTable("invitation", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: uuid("family_id").notNull().references(() => family.id, { onDelete: "cascade" }),
  // Урьж буй хүний холбоо барих. Одоо утасны дугаараар урина (8 орон);
  // урилгыг холбоос/QR-аар гараар илгээдэг тул зөвхөн тэмдэглэлийн шинжтэй.
  // email нь хуучин урилгуудад зориулж nullable үлдэв.
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().$type<FamilyRole>(),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("invitation_family_idx").on(table.familyId),
  index("invitation_phone_idx").on(table.phone),
])

export type Family = typeof family.$inferSelect
export type FamilyMember = typeof familyMember.$inferSelect
export type Baby = typeof baby.$inferSelect
export type BabyPhoto = typeof babyPhotos.$inferSelect
export type NewBabyPhoto = typeof babyPhotos.$inferInsert
export type Invitation = typeof invitation.$inferSelect
