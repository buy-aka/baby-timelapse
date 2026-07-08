"use client"

import { useEffect } from "react"

// Service worker-ийг бүртгэнэ. Зөвхөн production-д — dev-д HMR-тэй зөрчилдөнө.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[PWA] Service worker бүртгэл амжилтгүй:", err)
    })
  }, [])

  return null
}
