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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Verification = {
  sessionId: string;
  smsUri: string;
  displayInstruction: string;
  shortcode: string;
  text: string;
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

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<"form" | "verify">("form");
  const [verification, setVerification] = useState<Verification | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [statusText, setStatusText] = useState("SMS хүлээж байна...");
  const [expired, setExpired] = useState(false);

  const router = useRouter();
  const completingRef = useRef(false);
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

  // Утас баталгаажсаны дараа бүртгэлийг үүсгэнэ (нэг л удаа).
  const completeSignUp = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    setStatusText("Бүртгэл үүсгэж байна...");

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      phone,
      termsAccepted,
    });
    if (error) {
      completingRef.current = false;
      setError(error.message ?? "Бүртгэлийн үед алдаа гарлаа");
      setStatusText("Алдаа гарлаа");
      return;
    }
    redirectAfterAuth();
  }, [email, password, name, phone, termsAccepted, redirectAfterAuth]);

  // verify.mn статус шалгах (poll бүрд болон "Мессеж шалгах" товчинд).
  const checkStatus = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(
          `/api/verify/status?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (res.status === 429) return; // хэт ойр — дараагийн tick-д
        const data = await res.json();
        if (data.sessionStatus === "VERIFIED") {
          stopTimers();
          setStatusText("Баталгаажлаа ✓");
          await completeSignUp();
        } else if (data.sessionStatus === "EXPIRED") {
          stopTimers();
          setExpired(true);
          setStatusText("Хугацаа дууссан");
          setError("Баталгаажуулах хугацаа дууслаа. Дахин оролдоно уу.");
        }
      } catch {
        // сүлжээний түр алдаа — дараагийн tick-д дахин оролдоно
      }
    },
    [completeSignUp, stopTimers]
  );

  // "verify" алхамд орсон үед countdown + polling эхлүүлнэ.
  useEffect(() => {
    if (step !== "verify" || !verification) return;

    const update = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(verification.expiresAt).getTime() - Date.now()) / 1000)
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
    pollRef.current = setInterval(() => checkStatus(verification.sessionId), 3000);

    return stopTimers;
  }, [step, verification, checkStatus, stopTimers]);

  const handleStartVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      setError("Утасны дугаараа зөв оруулна уу (8 оронтой).");
      return;
    }
    if (password.length < 8) {
      setError("Нууц үг доод тал нь 8 тэмдэгт байх ёстой.");
      return;
    }
    // SMS (хэрэглэгчид 150₮-ийн зардал) илгээхээс ӨМНӨ нөхцөлөө шаардана.
    if (!termsAccepted) {
      setError("Үргэлжлүүлэхийн тулд үйлчилгээний нөхцөлийг зөвшөөрнө үү.");
      return;
    }
    setPhone(normalized);
    setIsLoading(true);

    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Баталгаажуулалт эхлүүлэхэд алдаа гарлаа");
        setIsLoading(false);
        return;
      }
      setVerification(data as Verification);
      setExpired(false);
      setStatusText("SMS хүлээж байна...");
      completingRef.current = false;
      setStep("verify");
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  };

  const backToForm = () => {
    stopTimers();
    setStep("form");
    setVerification(null);
    setError(null);
    completingRef.current = false;
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
          <div className="text-5xl mb-4">👶</div>
          <h1 className="text-3xl font-bold">Horom</h1>
          <p className="mt-3 text-muted-foreground">
            Хүүхдийнхээ өсөлтийн гайхамшгийг
            <br />
            өдөр бүр хадгалаарай
          </p>
        </div>

        <Card className="shadow-lg border-0">
          {step === "form" ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">Бүртгэл үүсгэх</CardTitle>
                <CardDescription className="text-center">
                  Дурсамжийн аяллаа эхлүүлээрэй
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleStartVerify}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Таны нэр</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Бат"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone">Утасны дугаар</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="99112233"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Дугаараа SMS-ээр баталгаажуулна (нэг удаа).
                      </p>
                    </div>

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

                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(v) => setTermsAccepted(v === true)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm font-normal leading-snug text-muted-foreground"
                      >
                        <Link
                          href="/terms"
                          target="_blank"
                          rel="noopener"
                          className="font-medium text-foreground underline underline-offset-2"
                        >
                          Үйлчилгээний нөхцөл
                        </Link>
                        ийг уншиж танилцан, зөвшөөрч байна.
                      </Label>
                    </div>

                    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

                    <Button
                      type="submit"
                      className="w-full rounded-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Түр хүлээнэ үү..." : "Үргэлжлүүлэх"}
                    </Button>
                  </div>

                  <div className="mt-6 text-center text-sm">
                    Бүртгэлтэй юу?{" "}
                    <Link href="/auth/login" className="font-medium underline">
                      Нэвтрэх
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  Утсаа баталгаажуулах
                </CardTitle>
                <CardDescription className="text-center">
                  {phone} дугаарыг баталгаажуулна
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-5">
                  <div className="rounded-lg bg-blue-50 p-4 text-center text-sm text-slate-700">
                    <span className="font-semibold">{verification?.shortcode}</span>{" "}
                    дугаарт{" "}
                    <span className="font-mono font-bold">
                      &quot;{verification?.text}&quot;
                    </span>{" "}
                    гэж SMS илгээнэ үү
                    <div className="mt-1 text-xs text-muted-foreground">
                      SMS-ийн төлбөр: 150₮ (үүрэн оператор тооцно).
                    </div>
                  </div>

                  {verification?.smsUri && !expired && (
                    <a href={verification.smsUri} className="w-full">
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
                      onClick={backToForm}
                    >
                      Дахин оролдох
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full rounded-full"
                      disabled={completingRef.current}
                      onClick={() =>
                        verification && checkStatus(verification.sessionId)
                      }
                    >
                      Мессеж шалгах
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={backToForm}
                    className="text-center text-sm text-muted-foreground underline"
                  >
                    ← Мэдээлэл засах
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
