import { ThemeSwitcher } from "@/components/theme-switcher"

// Бүх auth хуудас (нэвтрэх, бүртгүүлэх, нууц үг сэргээх) — баруун дээд
// буланд гэрэл/харанхуй горим солих товч.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>
      {children}
    </div>
  )
}
