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
  const exactDate = searchParams.get("exactDate")
  const offset = parseInt(searchParams.get("offset") || "0")

  // Яг тодорхой огноогоор хайх (compare / onthisday горим)
  if (exactDate) {
    const result = await pool.query(
      `SELECT id, photo_date, file_name, note, created_at
       FROM baby_photos
       WHERE photo_date = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [exactDate]
    )
    return NextResponse.json(result.rows)
  }

  // Хэвийн жагсаалт (grid / feed горим, offset дэмждэг)
  const result = await pool.query(
    `SELECT id, photo_date, file_name, note, created_at
     FROM baby_photos
     WHERE photo_date <= $1 AND deleted_at IS NULL
     ORDER BY photo_date DESC
     LIMIT 10 OFFSET $2`,
    [startDate, offset]
  )

  return NextResponse.json(result.rows)
}
