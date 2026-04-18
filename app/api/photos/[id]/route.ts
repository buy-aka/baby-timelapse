import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import pool from "@/lib/db"
import { headers } from "next/headers"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await pool.query(
    `UPDATE baby_photos SET deleted_at = NOW() WHERE id = $1`,
    [id]
  )

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { note, photo_date } = await request.json()

  await pool.query(
    `UPDATE baby_photos SET note = $1, photo_date = $2 WHERE id = $3`,
    [note, photo_date, id]
  )

  return NextResponse.json({ success: true })
}
