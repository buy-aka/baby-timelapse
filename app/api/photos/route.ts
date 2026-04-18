import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import pool from "@/lib/db"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0]

  const result = await pool.query(
    `SELECT id, photo_date, file_name, note, created_at
     FROM baby_photos
     WHERE photo_date <= $1
     ORDER BY photo_date DESC
     LIMIT 10`,
    [startDate]
  )

  return NextResponse.json(result.rows)
}
