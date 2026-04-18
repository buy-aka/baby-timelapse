import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const url = `${process.env.UPLOAD_SERVER_URL}/uploads/${filename}`

  const res = await fetch(url)
  if (!res.ok) return new NextResponse("Not found", { status: 404 })

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
