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
import { useCallback, useEffect, useRef, useState } from "react";

type PhoneChallenge = {
  id: string;
  shortcode: string;
  text: string;
  smsUri: string;
  displayInstruction: string;
  expiresAt: string;
};

// Утасны дугаарыг цэвэрлэнэ: тоо бус тэмдэгт хасах, +976/976 угтварыг арилгах.
function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("976")) d = d.slice(3);
  return d;
}

function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{7}$/.test(phone);
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<"email" | "phone">("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"form" | "verify">("form");
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [statusText, setStatusText] = useState("SMS хүлээж байна...");
  const [expired, setExpired] = useState(false);

  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    pollRef.current = null;
    tickRef.current = null;
  }, []);

  const redirectAfterAuth = useCallback(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    router.push(
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/chat"
    );
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Нэвтрэх үед алдаа гарлаа");
      setIsLoading(false);
      return;
    }
    redirectAfterAuth();
  };

  // verify.mn "login" RULE-ийн статус шалгах (poll бүрт болон "Мессеж шалгах" товчинд).
  const checkPhoneStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/auth/phone-login/status?id=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        if (data.status === "VERIFIED") {
          stopTimers();
          setStatusText("Нэвтэрлээ ✓");
          redirectAfterAuth();
        } else if (data.status === "EXPIRED") {
          stopTimers();
          setExpired(true);
          setStatusText("Хугацаа дууссан");
          setError("Баталгаажуулах хугацаа дууслаа. Дахин оролдоно уу.");
        }
      } catch {
        // сүлжээний түр алдаа — дараагийн tick-д дахин оролдоно
      }
    },
    [redirectAfterAuth, stopTimers]
  );

  // "verify" алхамд орсон үед countdown + polling эхлүүлнэ.
  useEffect(() => {
    if (mode !== "phone" || phoneStep !== "verify" || !challenge) return;

    const update = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left <= 0) {
        stopTimers();
        setExpired(true);
        setStatusText("Хугацаа дууссан");
      }
    };
    update();

    tickRef.current = setInterval(update, 1000);
    pollRef.current = setInterval(() => checkPhoneStatus(challenge.id), 3000);

    return stopTimers;
  }, [mode, phoneStep, challenge, checkPhoneStatus, stopTimers]);

  const handleStartPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      setError("Утасны дугаараа зөв оруулна уу (8 оронтой).");
      return;
    }
    setPhone(normalized);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/phone-login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Нэвтрэлт эхлүүлэхэд алдаа гарлаа");
        setIsLoading(false);
        return;
      }
      setChallenge(data as PhoneChallenge);
      setExpired(false);
      setStatusText("SMS хүлээж байна...");
      setPhoneStep("verify");
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  };

  const backToPhoneForm = () => {
    stopTimers();
    setPhoneStep("form");
    setChallenge(null);
    setError(null);
  };

  const switchMode = (next: "email" | "phone") => {
    stopTimers();
    setMode(next);
    setPhoneStep("form");
    setChallenge(null);
    setError(null);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

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
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-3xl font-bold tracking-tight">Horom</h1>
          <p className="mt-3 text-muted-foreground">
            Хүүхдийнхээ өсөлтийн мөч бүрийг
            <br />
            дурсамж болгон хадгалаарай
          </p>
        </div>

        <Card className="shadow-lg border-0">
          {mode === "email" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">Нэвтрэх</CardTitle>
                <CardDescription className="text-center">
                  Бүртгэлээрээ нэвтэрнэ үү
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Имэйл</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Нууц үг</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                      {isLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => switchMode("phone")}
                    >
                      📱 Утасны дугаараар нэвтрэх
                    </Button>
                  </div>

                  <div className="mt-6 text-center text-sm">
                    Бүртгэлгүй юу?{" "}
                    <Link href="/auth/sign-up" className="font-medium underline">
                      Бүртгэл үүсгэх
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {mode === "phone" && phoneStep === "form" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  Утасны дугаараар нэвтрэх
                </CardTitle>
                <CardDescription className="text-center">
                  Бүртгэлдээ баталгаажуулсан дугаараа оруулна уу
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleStartPhoneLogin}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="login-phone">Утасны дугаар</Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="99112233"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full rounded-full" disabled={isLoading}>
                      {isLoading ? "Түр хүлээнэ үү..." : "Код авах"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => switchMode("email")}
                    >
                      ← Имэйлээр нэвтрэх
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {mode === "phone" && phoneStep === "verify" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">SMS-ээр баталгаажуулах</CardTitle>
                <CardDescription className="text-center">
                  {phone} дугаараар нэвтрэх гэж байна
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-5">
                  <div className="rounded-lg bg-blue-50 p-4 text-center text-sm text-slate-700">
                    <span className="font-semibold">{challenge?.shortcode}</span> дугаарт{" "}
                    <span className="font-mono font-bold">
                      &quot;{challenge?.text}&quot;
                    </span>{" "}
                    гэж SMS илгээнэ үү
                    <div className="mt-1 text-xs text-muted-foreground">
                      SMS-ийн төлбөр: 150₮ (үүрэн оператор тооцно).
                    </div>
                  </div>

                  {challenge?.smsUri && !expired && (
                    <a href={challenge.smsUri} className="w-full">
                      <Button type="button" variant="outline" className="w-full rounded-full">
                        ➤ SMS апп нээх
                      </Button>
                    </a>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{statusText}</p>
                    {!expired && (
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {mm}:{ss}
                      </p>
                    )}
                  </div>

                  {error && <p className="text-center text-sm text-red-500">{error}</p>}

                  {expired ? (
                    <Button
                      type="button"
                      className="w-full rounded-full"
                      onClick={backToPhoneForm}
                    >
                      Дахин оролдох
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full rounded-full"
                      onClick={() => challenge && checkPhoneStatus(challenge.id)}
                    >
                      Мессеж шалгах
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={backToPhoneForm}
                    className="text-center text-sm text-muted-foreground underline"
                  >
                    ← Дугаар засах
                  </button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
