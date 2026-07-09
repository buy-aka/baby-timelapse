import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Heart } from "lucide-react"
import { PLANS, TRIAL_DAYS, formatMnt } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл — Horom",
  description: "Horom үйлчилгээний нөхцөл, нууцлалын бодлого",
}

// Сүүлд шинэчилсэн огноо — нөхцөлд өөрчлөлт оруулах бүрт гараар шинэчилнэ.
const LAST_UPDATED = "2026 оны 7 сарын 8"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
              <Heart size={18} fill="white" />
            </span>
            <span className="text-xl font-bold tracking-tight">Horom</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-brand"
          >
            <ArrowLeft size={14} />
            Нүүр хуудас
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Үйлчилгээний нөхцөл</h1>
        <p className="mt-2 text-sm text-neutral-500">Сүүлд шинэчилсэн: {LAST_UPDATED}</p>

        <div className="mt-8 flex flex-col gap-8 leading-relaxed text-neutral-700">
          <Section n="1" title="Ерөнхий зүйл">
            <p>
              Horom (horom.mn) нь хүүхдийн өсөлтийн зургийг өдөр тутам хадгалж,
              timelapse дурсамж болгон үзэх боломж олгодог гэр бүлийн үйлчилгээ юм.
              Та бүртгүүлэхдээ энэхүү нөхцөлийг зөвшөөрснөөр бидэнтэй үйлчилгээний
              гэрээ байгуулж байна. Нөхцөлийг зөвшөөрөөгүй тохиолдолд үйлчилгээг
              ашиглах боломжгүй.
            </p>
          </Section>

          <Section n="2" title="Бүртгэл, аюулгүй байдал">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Бүртгүүлэхэд үнэн зөв мэдээлэл (нэр, имэйл, утасны дугаар) оруулах
                ба утасны дугаараа SMS-ээр баталгаажуулна.
              </li>
              <li>
                Нэвтрэх мэдээллээ (нууц үг) нууцлах үүргийг хэрэглэгч өөрөө
                хариуцна. Таны бүртгэлээр хийгдсэн үйлдлийг таных гэж үзнэ.
              </li>
              <li>
                Утсаар нэвтрэх болон утас баталгаажуулах SMS илгээхэд үүрэн
                операторын тариф (одоогоор 150₮) хэрэглэгчээс хураагдана.
              </li>
            </ul>
          </Section>

          <Section n="3" title="Багц, төлбөр">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Шинэ гэр бүл бүрт {TRIAL_DAYS} хоногийн үнэгүй туршилтын хугацаа
                олгогдоно. Туршилтад төлбөрийн мэдээлэл шаардлагагүй бөгөөд хугацаа
                дуусахад автоматаар төлбөр авахгүй.
              </li>
              <li>
                Багцууд жилээр төлөгдөнө:{" "}
                {PLANS.map(
                  (p, i) =>
                    `${p.name} — ${formatMnt(p.introPriceMnt)}/жил (2026 оны эрт дэмжигчийн үнэ, энгийн үнэ ${formatMnt(p.standardPriceMnt)})${i < PLANS.length - 1 ? "; " : "."}`
                )}
              </li>
              <li>
                Үнийн өөрчлөлт зөвхөн дараагийн төлбөрийн хугацаанаас хэрэгжинэ —
                төлсөн хугацаанд тань үнэ нэмэгдэхгүй.
              </li>
              <li>
                Төлбөр банкны шилжүүлгээр хийгдэж, ажлын 1 өдөрт багтаан
                баталгаажина. Үйлчилгээ ашиглагдаагүй бүрэн жилийн төлбөрийг
                бичгээр хүсэлт гаргаснаар буцаан олгож болно.
              </li>
            </ul>
          </Section>

          <Section n="4" title="Таны контент ба өмчлөл">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Оруулсан бүх зураг, мэдээллийн өмчлөл бүрэн хэрэглэгчид үлдэнэ.
                Horom таны контентыг зөвхөн үйлчилгээг үзүүлэх (хадгалах, timelapse
                бүтээх, таны урьсан гишүүдэд харуулах) зорилгоор боловсруулна.
              </li>
              <li>
                Бид таны зургийг сурталчилгаа, маркетинг болон бусад зорилгоор
                таны бичгээр өгсөн зөвшөөрөлгүйгээр хэзээ ч ашиглахгүй, гуравдагч
                этгээдэд дамжуулахгүй, худалдахгүй.
              </li>
              <li>
                Зураг харах эрх зөвхөн таны гэр бүлийн бүртгэлд урьсан гишүүдэд
                олгогдоно. Хэнийг урих, хэний эрхийг хасахыг та бүрэн хянана.
              </li>
            </ul>
          </Section>

          <Section n="5" title="Хүүхдийн мэдээллийн хамгаалалт">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Хүүхдийн зураг, мэдээлэл оруулахдаа та тухайн хүүхдийн эцэг эх
                эсвэл хууль ёсны асран хамгаалагч мөн, эсвэл тэдний зөвшөөрлийг
                авсан гэдгээ баталж байна.
              </li>
              <li>
                Хүүхдийн мэдээллийг бид Монгол Улсын Хүний хувийн мэдээлэл
                хамгаалах тухай хуулийн дагуу боловсруулна.
              </li>
              <li>
                Зургууд шифрлэгдсэн (HTTPS) сувгаар дамжиж, хамгаалагдсан серверт
                хадгалагдана.
              </li>
            </ul>
          </Section>

          <Section n="6" title="Хориглох зүйлс">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Бусдын хүүхдийн зургийг зөвшөөрөлгүйгээр оруулах;</li>
              <li>Хууль бус, садар самуун, хүчирхийллийн контент байршуулах;</li>
              <li>
                Үйлчилгээний хэвийн ажиллагаанд халдах, автоматжуулсан хэрэгслээр
                зохиомол ачаалал үүсгэх;
              </li>
              <li>Бусдын бүртгэлд зөвшөөрөлгүй нэвтрэхийг оролдох.</li>
            </ul>
            <p className="mt-2">
              Эдгээрийг зөрчсөн тохиолдолд бид бүртгэлийг урьдчилан мэдэгдэлгүйгээр
              түдгэлзүүлэх буюу цуцлах эрхтэй.
            </p>
          </Section>

          <Section n="7" title="Бүртгэл цуцлах, мэдээлэл устгах">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Та хүссэн үедээ бүртгэлээ цуцлуулах хүсэлтийг{" "}
                <a href="mailto:info@horom.mn" className="text-brand underline">
                  info@horom.mn
                </a>{" "}
                хаягаар гаргаж болно.
              </li>
              <li>
                Цуцлалтын дараа таны бүх зураг, хувийн мэдээлэл 30 хоногийн дотор
                системээс бүрэн устгагдана (нөөц хуулбараас арилах хүртэл нэмэлт
                хугацаа шаардагдаж болно).
              </li>
              <li>
                Багцын үлдсэн хугацааны төлбөр цуцлалтад буцаан олгогдохгүй, гэхдээ
                хугацаа дуустал үйлчилгээгээ ашиглаж болно.
              </li>
            </ul>
          </Section>

          <Section n="8" title="Хариуцлагын хязгаарлалт">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                Бид үйлчилгээг тасралтгүй, найдвартай байлгахад бүх талаар хичээж,
                өгөгдлийг тогтмол нөөцөлдөг. Гэхдээ техникийн саатал, давагдашгүй
                хүчин зүйлээс үүдэх түр тасалдалд бүрэн баталгаа өгөх боломжгүй.
              </li>
              <li>
                Оруулсан зургийнхаа эх хувийг өөр төхөөрөмжид хадгалахыг зөвлөж
                байна — Horom нь нэмэлт хадгалалт бөгөөд цорын ганц нөөц байх
                зориулалтгүй.
              </li>
              <li>
                Бидний нийт хариуцлага тухайн хэрэглэгчийн сүүлийн 12 сард төлсөн
                төлбөрийн дүнгээс хэтрэхгүй.
              </li>
            </ul>
          </Section>

          <Section n="9" title="Нөхцөлийн өөрчлөлт">
            <p>
              Бид энэхүү нөхцөлийг шинэчилж болно. Мэдэгдэхүйц өөрчлөлтийг
              хэрэгжихээс 14-өөс доошгүй хоногийн өмнө бүртгэлтэй имэйл эсвэл апп
              доторх мэдэгдлээр танд мэдээлнэ. Өөрчлөлтийн дараа үйлчилгээг
              үргэлжлүүлэн ашигласнаар шинэ нөхцөлийг зөвшөөрсөнд тооцно.
            </p>
          </Section>

          <Section n="10" title="Холбоо барих">
            <p>
              Асуулт, санал хүсэлтээ{" "}
              <a href="mailto:info@horom.mn" className="text-brand underline">
                info@horom.mn
              </a>{" "}
              хаягаар илгээнэ үү.
            </p>
          </Section>
        </div>

        <div className="mt-12 rounded-2xl bg-brand-cream p-6 text-sm text-neutral-600">
          Энэхүү нөхцөлийг зөвшөөрснөөр та Horom-той үйлчилгээний гэрээ
          байгуулж буйгаа хүлээн зөвшөөрч байна. Бүртгүүлэх үедээ зөвшөөрсөн
          тэмдэглэгээ таны бүртгэлд хадгалагдана.
        </div>
      </main>
    </div>
  )
}

function Section({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900">
        {n}. {title}
      </h2>
      <div className="mt-3 text-[15px]">{children}</div>
    </section>
  )
}
