import Link from "next/link";
import { Button } from "./ui/button";
import { auth } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { headers } from "next/headers";

export async function AuthButton() {
  const session = await auth.api.getSession({ headers: await headers() });

  return session ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">{session.user.email}</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
