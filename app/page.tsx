import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Heart,
  ArrowRight,
  Camera,
  Users,
  Film,
  ShieldCheck,
  Sparkles,
  Check,
  Quote,
  Star,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

import { LandingFaq } from "@/components/landing/faq";
import { ContactForm } from "@/components/landing/contact-form";
import { PLANS, TRIAL_DAYS, formatMnt } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Horom — Хүүхдийн өсөлтийн дурсамж",
  description:
    "Хүүхдийнхээ өдөр тутмын өсөлтийг зургаар хадгалж, гайхалтай timelapse дурсамж болгон үзээрэй.",
};

/* ─────────────────────────  PAGE  ───────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Nav />

      {/* ───────── Hero ───────── */}
      <section id="home" className="mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Хүүхдийн өсөлтийн дурсамж</Eyebrow>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              Хайртай мөч бүрийг хадгалж,
              <br />
              хүүхдийнхээ өсөлтийг{" "}
              <span className="text-brand">мөнхөл.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600">
              Өдөр бүрийн жижигхэн өөрчлөлтүүдийг Horom дээр хадгалж, хэдэн
              сарын дараа гайхалтай өсөлтийн timelapse дурсамж болгон эргэн
              үзээрэй.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/auth/sign-up">
                Үнэгүй эхлэх
              </PrimaryButton>
              <Link
                href="#features"
                className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline"
              >
                Хэрхэн ажилладаг вэ?
              </Link>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -top-4 right-4 h-2/3 w-4/5 rounded-[2rem] bg-brand-yellow" />
            <Sparkles
              className="absolute -bottom-3 left-2 text-brand"
              size={28}
            />
            <div className="relative overflow-hidden rounded-[2rem] shadow-xl">
              <div className="relative aspect-[5/4] w-full">
                <Image
                  src="/hero-sample.png"
                  alt="Аав хүүхэдтэйгээ дурсамжийн зураг үзэж байгаа нь"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Collage */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-4/5 overflow-hidden rounded-[2rem] shadow-lg">
              <Image
                src="/about-us-1.png"
                alt="Аав хүүхдээ тэвэрч байгаа нь"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 80vw, 35vw"
              />
            </div>
            <div className="absolute -bottom-8 right-0 aspect-square w-1/2 overflow-hidden rounded-[2rem] border-4 border-white shadow-xl">
              <Image
                src="/about-us-2.png"
                alt="Аав хүүхдээ хооллож байгаа нь"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 40vw, 20vw"
              />
            </div>
            <Sparkles
              className="absolute -top-4 -left-2 text-brand-yellow"
              size={32}
            />
          </div>

          <div>
            <Eyebrow>Бидний тухай</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
              Хүүхдийнхээ дурсамжийг хамгийн найдвартайгаар хадгал
            </h2>
            <p className="mt-5 leading-relaxed text-neutral-600">
              Хүүхэд нэг л удаа өснө. Тэр өсөлтийн мөч бүр — анхны инээмсэглэл,
              анхны алхам, өдөр бүрийн өөрчлөлт — үнэлж баршгүй үнэ цэнэтэй.
              Horom эдгээр мөчийг цэгцтэй, аюулгүй хадгалж, чамд эргэн санах
              боломжийг олгоно.
            </p>
            <div className="mt-7">
              <PrimaryButton href="/auth/sign-up">Дэлгэрэнгүй</PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Mission / Features ───────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Бидний зорилго</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
              Найдвартай дурсамжийн гэрэл гэгээтэй ирээдүйг цогцлооно
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-neutral-600">
              Технологи хэдий чинээ хялбар байна, дурсамж төдий чинээ бүрэн
              хадгалагдана. Бид үүнд л зорьж байна.
            </p>
            <div className="mt-7">
              <PrimaryButton href="/auth/sign-up">Эхлэх</PrimaryButton>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <MissionFeature
              icon={<Camera size={20} />}
              title="Хялбар байдал"
              text="Өдөр бүр эсвэл хүссэн үедээ хэдхэн товшилтоор зургаа нэм."
            />
            <MissionFeature
              icon={<Users size={20} />}
              title="Гэр бүлийн орон зай"
              text="Ээж, аав, эмээ өвөөгөө урьж, дурсамжийг хамтдаа хадгал."
            />
            <MissionFeature
              icon={<Film size={20} />}
              title="Timelapse бичлэг"
              text="Зураг цугларах тусам өсөлтийн бичлэг автоматаар бүтнэ."
            />
            <MissionFeature
              icon={<ShieldCheck size={20} />}
              title="Нууцлал хамгаалалт"
              text="Зураг тань зөвхөн танд. Зөвшөөрөлгүйгээр хуваалцахгүй."
            />
          </div>
        </div>
      </section>

      {/* ───────── Why Horom (Heal Yourself) ───────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative rounded-[2rem] border-l-4 border-brand-yellow bg-white p-8 shadow-lg md:p-10">
            <Eyebrow>Яагаад Horom гэж?</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
              Дурсамж хадгалах хамгийн энгийн арга
            </h2>
            <p className="mt-4 leading-relaxed text-neutral-600">
              Horom хүүхдийн өсөлтийн бүхэл түүхийг бүтээхэд туслах хэрэгслүүдийг
              нэг дор нэгтгэсэн.
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              <CheckItem
                title="Өдөр бүрийн өөрчлөлт"
                text="Жижигхэн мөчүүдийг ч алдалгүй тэмдэглэ."
              />
              <CheckItem
                title="Автомат эмхэтгэл"
                text="Огноо, түүх нь өөрөө цэгцтэй хадгалагдана."
              />
              <CheckItem
                title="Хялбар удирдлага"
                text="Хэдхэн товшилтоор зураг нэмж, зохион байгуул."
              />
              <CheckItem
                title="Аюулгүй хадгалалт"
                text="Хувийн, хамгаалагдсан цомог — зөвхөн танд."
              />
            </ul>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-xl lg:aspect-square">
            <Image
              src="/why-horom.png"
              alt="Аав хүүхэдтэйгээ инээмсэглэж байгаа нь"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>

      {/* ───────── Blog (green) ───────── */}
      <section className="bg-brand py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-lg text-3xl font-bold tracking-tight">
              Хүүхдэд зориулсан урам зориг ба зөвлөгөө
            </h2>
            <Link
              href="/auth/sign-up"
              className="rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Бүгдийг үзэх
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <BlogCard
              img="/blog-1.png"
              title="Хүүхдийн өсөлтийн үе шатууд"
              text="Төрснөөс сургуульд орох хүртэлх гол үе шатууд ба тэдгээрийг хэрхэн тэмдэглэх вэ."
            />
            <BlogCard
              img="/blog-2.png"
              title="Тэсвэртэй хүүхэд өсгөх нь"
              text="Хүүхдээ бэрхшээлийг давахад дэмжиж, өсөлтийн замд нь хамт байх зөвлөмжүүд."
            />
            <BlogCard
              img="/blog-3.png"
              title="Гэр бүлийн санхүү ба төлөвлөлт"
              text="Хүүхдийн ирээдүйд хамгийн чухал зүйлст төлөвлөлттэйгээр бэлдэх нь."
            />
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow>Үнэ</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
            Энгийн, ойлгомжтой үнэ
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            {TRIAL_DAYS} хоног бүрэн үнэгүй туршаад, таалагдвал багцаа сонгоорой.
            Карт шаардлагагүй, багц жилээр төлөгдөнө.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative flex flex-col gap-6 rounded-[2rem] bg-brand p-8 text-white shadow-xl"
                  : "relative flex flex-col gap-6 rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-lg"
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 right-8 rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-neutral-900">
                  Санал болгож буй
                </span>
              )}
              <div>
                <h3
                  className={
                    plan.highlighted
                      ? "text-lg font-semibold text-white"
                      : "text-lg font-semibold text-neutral-900"
                  }
                >
                  {plan.name}
                </h3>
                <p
                  className={
                    plan.highlighted
                      ? "mt-1 text-sm text-white/80"
                      : "mt-1 text-sm text-neutral-600"
                  }
                >
                  {plan.tagline}
                </p>
              </div>

              <div>
                <span className="text-4xl font-bold tracking-tight">
                  {formatMnt(plan.introPriceMnt)}
                </span>
                <span
                  className={
                    plan.highlighted ? "text-sm text-white/80" : "text-sm text-neutral-500"
                  }
                >
                  {" "}
                  /жил
                </span>
                <p
                  className={
                    plan.highlighted
                      ? "mt-1 text-xs text-white/85"
                      : "mt-1 text-xs text-neutral-500"
                  }
                >
                  2026 оны эрт дэмжигчийн үнэ · энгийн үнэ{" "}
                  {formatMnt(plan.standardPriceMnt)}
                </p>
              </div>

              <ul className="flex flex-col gap-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span
                      className={
                        plan.highlighted
                          ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20"
                          : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10"
                      }
                    >
                      <Check
                        size={12}
                        className={plan.highlighted ? "text-white" : "text-brand"}
                      />
                    </span>
                    <span
                      className={plan.highlighted ? "text-white/90" : "text-neutral-700"}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href="/auth/sign-up"
                  className={
                    plan.highlighted
                      ? "inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-cream"
                      : "inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                  }
                >
                  Үнэгүй туршиж эхлэх
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Багцаа Тохиргоо → Багц хэсгээс хүссэн үедээ идэвхжүүлж, ахиулж болно.
        </p>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-lg">
              <Image
                src="/faq.png"
                alt="Аав хүүхэдтэйгээ"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <Sparkles
              className="absolute -bottom-4 -right-3 text-brand-yellow"
              size={32}
            />
          </div>

          <div>
            <Eyebrow>Түгээмэл асуулт</Eyebrow>
            <h2 className="mt-4 mb-8 text-3xl font-bold tracking-tight text-neutral-900">
              Түгээмэл асуултууд
            </h2>
            <LandingFaq />
          </div>
        </div>
      </section>

      {/* ───────── Articles (cream) ───────── */}
      <section className="bg-brand-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Блог</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
                Онцлох нийтлэлүүд
              </h2>
            </div>
            <Link
              href="/auth/sign-up"
              className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-white"
            >
              Бүгдийг үзэх
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <ArticleRow
              img="/about-us-1.png"
              title="Хүүхдийн зураг авах бодит зөвлөгөө"
              date="2026 оны 7-р сар"
            />
            <ArticleRow
              img="/blog-2.png"
              title="Сэтгэл хөдлөлийн эрүүл өсөлт"
              date="2026 оны 7-р сар"
            />
            <ArticleRow
              img="/about-us-2.png"
              title="Гэр бүлээрээ дурсамж бүтээх нь"
              date="2026 оны 6-р сар"
            />
            <ArticleRow
              img="/why-horom.png"
              title="Хувь хүний өсөлт ба өөрийгөө таних"
              date="2026 оны 6-р сар"
            />
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Сэтгэгдэл</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
              Хэрэглэгчид биднийг ингэж үнэлдэг
            </h2>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Testimonial
            name="Б. Отгонцэцэг"
            role="Хоёр хүүхдийн ээж"
            text="Охиныхоо анхны жилийн зураг бүрийг Horom дээр хадгалсан. Одоо timelapse-ийг нь үзэхэд л нулимс гарч ирдэг. Үнэхээр гайхалтай."
          />
          <Testimonial
            name="Д. Ганбаатар"
            role="Аав"
            text="Ажлаараа их завгүй ч өдөрт нэг зураг нэмэх нь надад хэцүү биш. Хүү минь ямар хурдан өсөж байгааг одоо тод харж байна."
          />
          <Testimonial
            name="Э. Сарантуяа"
            role="Гэрийн эзэгтэй"
            text="Эмээ өвөө нь хол амьдардаг тул гэр бүлээрээ хуваалцах боломж нь маш их таалагдсан. Бүгд ач хүүгийнхээ өсөлтийг дагаж чадаж байна."
          />
          <Testimonial
            name="Т. Мөнхбат"
            role="Гурван хүүхдийн аав"
            text="Гурван хүүхдийн зургийг тус тусад нь цэгцтэй хадгалж чаддаг нь маш тохиромжтой. Нууцлал сайтай гэдэгт итгэлтэй байдаг."
          />
        </div>
      </section>

      {/* ───────── Contact ───────── */}
      <section id="contact" className="bg-brand-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>Холбоо барих</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
                Асуулт байна уу? Бидэнтэй холбогдоорой
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-neutral-600">
                Дурсамжийн аяллаа эхлүүлэхэд туслахад бид үргэлж бэлэн. Доорх
                мэдээллээр эсвэл форм бөглөн бидэнд хандаарай.
              </p>

              <div className="mt-8 flex flex-col gap-5">
                <ContactItem icon={<Phone size={18} />} label="Утас" value="+976 90442255" />
                <ContactItem icon={<Mail size={18} />} label="Имэйл" value="buyka.1776@gmail.com" />
                <ContactItem
                  icon={<MapPin size={18} />}
                  label="Хаяг"
                  value="Улаанбаатар хот, Монгол улс"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─────────────────────────  SECTIONS  ───────────────────────── */

function Nav() {
  const links = [
    { href: "#home", label: "Нүүр" },
    { href: "#about", label: "Танилцуулга" },
    { href: "#features", label: "Онцлог" },
    { href: "#pricing", label: "Үнэ" },
    { href: "#faq", label: "Асуулт" },
    { href: "#contact", label: "Холбоо барих" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#home" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Heart size={18} fill="white" />
          </span>
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            Horom
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden text-sm font-medium text-neutral-700 hover:text-brand sm:block"
          >
            Нэвтрэх
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Бүртгүүлэх
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-deep text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Heart size={18} fill="white" />
              </span>
              <span className="text-xl font-bold">Horom</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Хүүхдийнхээ өсөлтийн мөч бүрийг хадгалж, дурсамж болгон эргэн
              үзээрэй.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-yellow hover:text-brand-deep"
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          <FooterCol
            title="Бүтээгдэхүүн"
            links={[
              { label: "Онцлог", href: "#features" },
              { label: "Түгээмэл асуулт", href: "#faq" },
              { label: "Бүртгүүлэх", href: "/auth/sign-up" },
            ]}
          />
          <FooterCol
            title="Компани"
            links={[
              { label: "Танилцуулга", href: "#about" },
              { label: "Холбоо барих", href: "#contact" },
              { label: "Үйлчилгээний нөхцөл", href: "/terms" },
              { label: "Нэвтрэх", href: "/auth/login" },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-5 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Horom.mn — Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────  HELPERS  ───────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
      <span className="h-px w-6 bg-brand" />
      {children}
    </span>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
    >
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

function MissionFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{text}</p>
    </div>
  );
}

function CheckItem({ title, text }: { title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Check size={14} />
      </span>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-600">{text}</p>
      </div>
    </li>
  );
}

function BlogCard({
  img,
  title,
  text,
}: {
  img: string;
  title: string;
  text: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-md">
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={img}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 30vw"
        />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{text}</p>
        <Link
          href="/auth/sign-up"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-2"
        >
          Унших <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function ArticleRow({
  img,
  title,
  date,
}: {
  img: string;
  title: string;
  date: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <Image src={img} alt={title} fill className="object-cover" sizes="96px" />
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-xs text-neutral-400">{date}</p>
        <h3 className="mt-1 font-semibold leading-snug text-neutral-900">
          {title}
        </h3>
        <Link
          href="/auth/sign-up"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-2"
        >
          Унших <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function Testimonial({
  name,
  role,
  text,
}: {
  name: string;
  role: string;
  text: string;
}) {
  const initial = name.replace(/^[^.]*\.\s*/, "").charAt(0);
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-7 shadow-sm">
      <Quote className="text-brand-yellow" size={28} />
      <p className="mt-4 leading-relaxed text-neutral-700">{text}</p>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
          {initial}
        </span>
        <div>
          <p className="font-semibold text-neutral-900">{name}</p>
          <p className="text-sm text-neutral-500">{role}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} className="fill-brand-yellow text-brand-yellow" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="font-medium text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
