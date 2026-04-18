import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import pool from "@/lib/db"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File
  const note = (formData.get("note") as string) || ""
  const photoDate = formData.get("photoDate") as string

  if (!file || !photoDate) {
    return NextResponse.json({ error: "file болон photoDate шаардлагатай" }, { status: 400 })
  }

  // Файлыг серверт дамжуулах
  const serverForm = new FormData()
  serverForm.append("file", file)

  const serverRes = await fetch(`${process.env.UPLOAD_SERVER_URL}/upload`, {
    method: "POST",
    headers: { "x-upload-secret": Buffer.from(process.env.UPLOAD_SECRET!).toString("base64") },
    body: serverForm,
  })

  if (!serverRes.ok) {
    return NextResponse.json({ error: "Upload сервер алдаа гарлаа" }, { status: 500 })
  }

  const { url } = await serverRes.json()

  await pool.query(
    `INSERT INTO baby_photos (id, photo_date, file_name, note, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
    [photoDate, url, note]
  )

  return NextResponse.json({ success: true, url })
}
