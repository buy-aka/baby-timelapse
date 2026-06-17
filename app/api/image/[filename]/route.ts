import { NextRequest, NextResponse } from "next/server"
import { getObject } from "@/lib/storage"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  try {
    const res = await getObject(filename)
    if (!res.Body) return new NextResponse("Not found", { status: 404 })

    const buffer = Buffer.from(await res.Body.transformToByteArray())
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
