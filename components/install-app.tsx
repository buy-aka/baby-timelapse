"use client"

import { useEffect, useState } from "react"
import { SquareArrowUp, SquarePlus, Download, Check, MoreVertical, Apple } from "lucide-react"
import { LogoMark } from "./logo"

type Platform = "ios" | "ios-other" | "android" | "desktop" | "standalone"

// beforeinstallprompt (Chromium) — стандартад ороогүй тул гар тодорхойлолт.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallApp() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) { setPlatform("standalone"); return }

    // iPadOS 13+ нь өөрийгөө Mac мэт харуулдаг тул touch-аар ялгана.
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    if (isIOS) {
      // iOS дээр PWA-г ЗӨВХӨН Safari суулгадаг. Chrome/Firefox бол өөр UA-тэй.
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
      setPlatform(isSafari ? "ios" : "ios-other")
      return
    }
    if (/Android/.test(ua)) { setPlatform("android"); return }
    setPlatform("desktop")
  }, [])

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <section id="install" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        {/* Зүүн тал — танилцуулга */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Апп суулгах
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Утсандаа апп болгон суулга
          </h2>
          <p className="mt-4 max-w-md text-neutral-600">
            Horom-ийг App Store, Play Store-гүйгээр шууд утсандаа суулгана. Нүүр
            дэлгэцээс жинхэнэ апп шиг хормын зуур нээж, зургаа нэмээрэй.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-brand-cream px-5 py-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-deep">
              <LogoMark size={26} tone="light" />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-deep">Horom</p>
              <p className="text-xs text-neutral-500">horom.mn</p>
            </div>
          </div>
        </div>

        {/* Баруун тал — төхөөрөмжид тохирсон заавар */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          {platform === null ? (
            <p className="text-sm text-neutral-400">Төхөөрөмжийг таньж байна...</p>
          ) : platform === "standalone" || installed ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={18} />
              </span>
              <p className="text-sm font-medium text-emerald-800">
                Апп аль хэдийн суулгагдсан байна.
              </p>
            </div>
          ) : platform === "ios" ? (
            <IosSteps />
          ) : platform === "ios-other" ? (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
              <Apple size={20} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-800">
                iPhone дээр аппыг зөвхөн <strong>Safari</strong> хөтчөөр суулгадаг.
                Энэ хуудсыг Safari-аар нээгээд дахин үзнэ үү.
              </p>
            </div>
          ) : deferred ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
                <Download size={26} />
              </span>
              <p className="text-sm text-neutral-600">
                Нэг товшилтоор утсандаа суулгана.
              </p>
              <button
                onClick={install}
                className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Апп суулгах
              </button>
            </div>
          ) : platform === "android" ? (
            <AndroidSteps />
          ) : (
            <DesktopHint />
          )}
        </div>
      </div>
    </section>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-brand-deep">
        {n}
      </span>
      <span className="pt-0.5 text-sm text-neutral-700">{children}</span>
    </li>
  )
}

function IosSteps() {
  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <Apple size={16} /> iPhone · Safari
      </p>
      <ol className="flex flex-col gap-4">
        <Step n={1}>
          Доод (эсвэл дээд) талын{" "}
          <SquareArrowUp size={15} className="mx-0.5 inline align-text-bottom text-brand" />
          {" "}<strong>Хуваалцах</strong> товчийг дарна.
        </Step>
        <Step n={2}>
          Жагсаалтаас{" "}
          <SquarePlus size={15} className="mx-0.5 inline align-text-bottom text-brand" />
          {" "}<strong>«Нүүр дэлгэцэнд нэмэх»</strong> (Add to Home Screen) сонгоно.
        </Step>
        <Step n={3}>
          Баруун дээд буланд <strong>«Нэмэх»</strong> дарна. Horom дүрс нүүр
          дэлгэцэнд тань гарч ирнэ.
        </Step>
      </ol>
    </div>
  )
}

function AndroidSteps() {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-neutral-900">Android · Chrome</p>
      <ol className="flex flex-col gap-4">
        <Step n={1}>
          Баруун дээд булангийн{" "}
          <MoreVertical size={15} className="mx-0.5 inline align-text-bottom text-brand" />
          {" "}цэсийг дарна.
        </Step>
        <Step n={2}>
          <strong>«Апп суулгах»</strong> (Install app) эсвэл{" "}
          <strong>«Нүүр дэлгэцэнд нэмэх»</strong> сонгоно.
        </Step>
        <Step n={3}>
          <strong>«Суулгах»</strong> дарна. Horom апп болон суулгагдана.
        </Step>
      </ol>
    </div>
  )
}

function DesktopHint() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-neutral-900">Компьютер</p>
      <p className="text-sm text-neutral-600">
        Хамгийн сайн туршлагыг гар утсаараа авна. Утсаараа{" "}
        <strong>horom.mn</strong> руу орж, аппыг нүүр дэлгэцэндээ суулгаарай.
      </p>
      <p className="text-sm text-neutral-600">
        Chrome/Edge дээр хаягийн мөрийн баруун талын{" "}
        <Download size={14} className="mx-0.5 inline align-text-bottom text-brand" />
        {" "}тэмдгээр компьютертаа ч суулгаж болно.
      </p>
    </div>
  )
}
