import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Suspense } from "react";

async function UserDetails() {
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
      {JSON.stringify(session?.user ?? {}, null, 2)}
    </pre>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <Suspense fallback={<p>Loading...</p>}>
          <UserDetails />
        </Suspense>
      </div>
    </div>
  );
}
