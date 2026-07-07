import Link from "next/link";
import { Camera, CalendarDays, Film, ShieldCheck, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">

      {/* Navbar */}
      <header className="container mx-auto flex items-center justify-between py-6 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-400 text-white">
            <Heart size={22} fill="white" />
          </div>

          <span className="text-2xl font-bold tracking-tight">
            Horom
          </span>
        </div>


        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">
              Нэвтрэх
            </Link>
          </Button>

          <Button asChild>
            <Link href="/auth/sign-up">
              Үнэгүй эхлэх
            </Link>
          </Button>
        </nav>
      </header>


      {/* Hero */}
      <section className="container mx-auto px-6 py-20">

        <div className="grid items-center gap-12 lg:grid-cols-2">

          <div>

            <Badge className="mb-6 bg-orange-100 text-orange-700 hover:bg-orange-100">
              👶 Хүүхдийн өсөлтийн дурсамж
            </Badge>


            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Хүүхдийнхээ өсөлтийг
              <span className="text-orange-500">
                {" "}мөнхөл.
              </span>
            </h1>


            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Өдөр бүрийн жижигхэн өөрчлөлтүүдийг хадгалж,
              хэдэн сарын дараа гайхалтай өсөлтийн timelapse
              бичлэг болгон үзээрэй.
            </p>


            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Button
                size="lg"
                className="rounded-full px-8"
                asChild
              >
                <Link href="/auth/sign-up">
                  Эхлэх →
                </Link>
              </Button>


              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                asChild
              >
                <Link href="/auth/login">
                  Нэвтрэх
                </Link>
              </Button>

            </div>


            <p className="mt-5 text-sm text-muted-foreground">
              ✓ Үнэгүй эхлэх боломжтой
              <br />
              ✓ Зураг тань зөвхөн танд хадгалагдана
            </p>

          </div>



          {/* Preview */}
          <div className="relative">

            <Card className="overflow-hidden rounded-3xl shadow-xl">

              <CardContent className="p-0">

                <div className="aspect-square bg-gradient-to-br from-orange-200 via-pink-100 to-white flex items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg text-6xl">
                      👶
                    </div>

                    <p className="mt-6 text-xl font-semibold">
                      Baby Timeline
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Day 1 → Month 12
                    </p>

                  </div>

                </div>


              </CardContent>

            </Card>


            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-lg">

              <p className="text-sm text-muted-foreground">
                Өнөөдрийн зураг
              </p>

              <p className="font-bold">
                2026.07.07
              </p>

            </div>


          </div>


        </div>

      </section>



      {/* Features */}
      <section className="container mx-auto px-6 py-20">

        <div className="text-center">

          <h2 className="text-3xl font-bold">
            Хэрхэн ажилладаг вэ?
          </h2>

          <p className="mt-3 text-muted-foreground">
            Хүүхдийн өсөлтийн түүхийг гурван алхмаар хадгална.
          </p>

        </div>


        <div className="mt-12 grid gap-6 md:grid-cols-3">


          <Feature
            icon={<Camera />}
            title="Зураг нэм"
            text="Өдөр бүр эсвэл хүссэн үедээ хүүхдийнхээ зургийг оруул."
          />


          <Feature
            icon={<CalendarDays />}
            title="Өсөлтийг хадгал"
            text="Зураг бүрийн огноо, түүх автоматаар хадгалагдана."
          />


          <Feature
            icon={<Film />}
            title="Timelapse үүсгэ"
            text="Хэдэн сарын дараа өсөлтийн гайхалтай бичлэгтэй болно."
          />

        </div>

      </section>




      {/* Privacy */}
      <section className="bg-orange-50 py-20">

        <div className="container mx-auto px-6">

          <Card className="rounded-3xl">

            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">

              <ShieldCheck
                size={48}
                className="text-orange-500"
              />

              <h2 className="text-3xl font-bold">
                Таны гэр бүлийн дурсамж хамгаалагдана
              </h2>


              <p className="max-w-xl text-muted-foreground">

                Хүүхдийн зураг бол хамгийн үнэ цэнтэй зүйл.
                Horom таны зөвшөөрөлгүйгээр мэдээллийг
                хуваалцахгүй.

              </p>


            </CardContent>

          </Card>

        </div>

      </section>




      {/* CTA */}
      <section className="container mx-auto px-6 py-20 text-center">

        <h2 className="text-4xl font-bold">
          Хүүхдийнхээ анхны мөчүүдийг
          өнөөдрөөс хадгалж эхлээрэй.
        </h2>


        <Button
          size="lg"
          className="mt-8 rounded-full px-10"
          asChild
        >
          <Link href="/auth/sign-up">
            Horom ашиглаж эхлэх
          </Link>
        </Button>

      </section>



      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Horom.mn
      </footer>


    </main>
  );
}



function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {

  return (
    <Card className="rounded-3xl">

      <CardContent className="p-8">

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          {icon}
        </div>


        <h3 className="text-xl font-semibold">
          {title}
        </h3>


        <p className="mt-3 text-muted-foreground">
          {text}
        </p>

      </CardContent>

    </Card>
  );

}