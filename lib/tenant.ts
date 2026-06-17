import { db } from "@/lib/db"
import { baby, family, familyMember, FamilyRole } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

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
