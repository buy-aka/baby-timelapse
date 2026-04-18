import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

// Better Auth email confirmation-г /api/auth/* route-оор шийддэг тул
// энэ route нь зөвхөн legacy redirect болгон үлдэнэ
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/chat";
  redirect(next);
}
