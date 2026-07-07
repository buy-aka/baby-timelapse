"use client";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await authClient.signUp.email({ email, password, name })
    if (error) {
      setError(error.message ?? "Бүртгэлийн үед алдаа гарлаа")
      setIsLoading(false)
      return
    }
    // ?redirect= байвал тийш буцаана (жишээ нь /invite/<token>). Зөвхөн
    // дотоод харьцангуй зам — open-redirect-аас сэргийлж "//"-ийг хорино.
    const redirect = new URLSearchParams(window.location.search).get("redirect")
    router.push(
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/chat"
    );
  };

return (
  <div
    className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 p-6",
      className
    )}
    {...props}
  >
    <div className="w-full max-w-md">

      <div className="text-center mb-8">

        <div className="text-5xl mb-4">
          👶
        </div>

        <h1 className="text-3xl font-bold">
          Horom
        </h1>

        <p className="mt-3 text-muted-foreground">
          Хүүхдийнхээ өсөлтийн гайхамшгийг
          <br />
          өдөр бүр хадгалаарай
        </p>

      </div>


      <Card className="shadow-lg border-0">

        <CardHeader>

          <CardTitle className="text-xl text-center">
            Бүртгэл үүсгэх
          </CardTitle>

          <CardDescription className="text-center">
            Дурсамжийн аяллаа эхлүүлээрэй
          </CardDescription>

        </CardHeader>


        <CardContent>

          <form onSubmit={handleSignUp}>

            <div className="flex flex-col gap-5">


              <div className="grid gap-2">

                <Label htmlFor="name">
                  Таны нэр
                </Label>

                <Input
                  id="name"
                  type="text"
                  placeholder="Бат"
                  required
                  value={name}
                  onChange={(e)=>setName(e.target.value)}
                />

              </div>


              <div className="grid gap-2">

                <Label htmlFor="email">
                  Имэйл
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                />

              </div>


              <div className="grid gap-2">

                <Label htmlFor="password">
                  Нууц үг
                </Label>

                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                />

              </div>


              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}


              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={isLoading}
              >

                {isLoading
                  ? "Бүртгэж байна..."
                  : "Эхлэх"}

              </Button>


            </div>


            <div className="mt-6 text-center text-sm">

              Бүртгэлтэй юу?{" "}

              <Link
                href="/auth/login"
                className="font-medium underline"
              >
                Нэвтрэх
              </Link>

            </div>


          </form>

        </CardContent>

      </Card>

    </div>

  </div>
)
}
