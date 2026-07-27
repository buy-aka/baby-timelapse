import { db } from "@/lib/db"
import { baby, family, familyMember, invitation, user, FamilyRole } from "@/lib/db/schema"
import { and, desc, eq, gt, isNull } from "drizzle-orm"

export type PendingInvite = {
  token: string
  role: FamilyRole
  familyId: string
  familyName: string
  invitedByName: string
}

/**
 * Хэрэглэгчийн баталгаажсан утсаар нь ирсэн, хараахан хүлээж аваагүй,
 * хугацаа дуусаагүй урилгууд. Аль хэдийн гишүүн болсон гэр бүлийг хасна.
 * (Урьсан хүн урьж буй хүний утсыг оруулдаг тул утсаар тааруулна.)
 */
export async function getPendingInvitesForUser(userId: string): Promise<PendingInvite[]> {
  const [u] = await db.select({ phone: user.phone }).from(user).where(eq(user.id, userId)).limit(1)
  if (!u?.phone) return []

  const memberRows = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId))
  const inFamilies = new Set(memberRows.map((r) => r.familyId))

  const rows = await db
    .select({
      token: invitation.token,
      role: invitation.role,
      familyId: invitation.familyId,
      familyName: family.name,
      invitedByName: user.name,
    })
    .from(invitation)
    .innerJoin(family, eq(family.id, invitation.familyId))
    .innerJoin(user, eq(user.id, invitation.invitedBy))
    .where(and(
      eq(invitation.phone, u.phone),
      isNull(invitation.acceptedAt),
      gt(invitation.expiresAt, new Date()),
    ))
    .orderBy(desc(invitation.createdAt))

  return rows.filter((r) => !inFamilies.has(r.familyId))
}

/** Хэрэглэгчийн хандах эрхтэй бүх baby-ийн ID-нуудыг буцаана */
export async function getUserBabyIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: baby.id })
    .from(baby)
    .innerJoin(familyMember, eq(familyMember.familyId, baby.familyId))
    .where(eq(familyMember.userId, userId))
  return rows.map((r) => r.id)
}

/** Хэрэглэгч өгөгдсөн baby-д хандах эрхтэй эсэхийг шалгана */
export async function userCanAccessBaby(userId: string, babyId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: baby.id })
    .from(baby)
    .innerJoin(familyMember, eq(familyMember.familyId, baby.familyId))
    .where(and(eq(familyMember.userId, userId), eq(baby.id, babyId)))
    .limit(1)
  return !!row
}

/** Хэрэглэгчийн анхдагч (хамгийн эртний) baby-г буцаана */
export async function getUserDefaultBaby(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: baby.id })
    .from(baby)
    .innerJoin(familyMember, eq(familyMember.familyId, baby.familyId))
    .where(eq(familyMember.userId, userId))
    .orderBy(baby.createdAt)
    .limit(1)
  return row?.id ?? null
}

/** Хэрэглэгчийн өгөгдсөн family-д үүрэг (role)-ийг буцаана */
export async function getUserFamilyRole(userId: string, familyId: string): Promise<FamilyRole | null> {
  const [row] = await db
    .select({ role: familyMember.role })
    .from(familyMember)
    .where(and(eq(familyMember.userId, userId), eq(familyMember.familyId, familyId)))
    .limit(1)
  return row?.role ?? null
}

/** Baby-ийн харьяалагдах family-ийн ID-г буцаана */
export async function getBabyFamilyId(babyId: string): Promise<string | null> {
  const [row] = await db
    .select({ familyId: baby.familyId })
    .from(baby)
    .where(eq(baby.id, babyId))
    .limit(1)
  return row?.familyId ?? null
}

/**
 * Хэрэглэгчийн үндсэн гэр бүл: өөрийн эзэмшдэг family эхэнд, байхгүй бол
 * хамгийн анх элссэн family. Цомог (album) зэрэг family түвшний
 * функцүүдэд хэрэглэнэ.
 */
export async function getUserPrimaryFamily(userId: string): Promise<string | null> {
  const owned = await getUserOwnedFamily(userId)
  if (owned) return owned
  const [row] = await db
    .select({ familyId: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId))
    .orderBy(familyMember.createdAt)
    .limit(1)
  return row?.familyId ?? null
}

/** Гэр бүлийн гишүүдийн тоо (эзэмшигчийг оруулаад) */
export async function getFamilyMemberCount(familyId: string): Promise<number> {
  const rows = await db
    .select({ id: familyMember.id })
    .from(familyMember)
    .where(eq(familyMember.familyId, familyId))
  return rows.length
}

/** Хэрэглэгчийн өөрийн (owner) гэр бүлийг буцаана. Шинэ baby үүсгэхэд хэрэглэнэ. */
export async function getUserOwnedFamily(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: family.id })
    .from(family)
    .where(eq(family.ownerId, userId))
    .orderBy(family.createdAt)
    .limit(1)
  return row?.id ?? null
}
