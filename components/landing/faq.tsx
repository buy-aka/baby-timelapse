"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Хүүхдийн зураг хаана, хэр найдвартай хадгалагдах вэ?",
    a: "Таны оруулсан бүх зураг өөрийн хувийн, хамгаалагдсан цомогт хадгалагдана. Зөвхөн та болон таны урьсан гэр бүлийн гишүүд харах эрхтэй — таны зөвшөөрөлгүйгээр хэнтэй ч хуваалцахгүй.",
  },
  {
    q: "Хэрхэн бүртгүүлэх вэ?",
    a: "Нэр, утас, имэйл, нууц үгээ оруулаад утсаа нэг удаа SMS-ээр баталгаажуулна. Баталгаажсаны дараа шууд эхний зургаа оруулж эхэлж болно.",
  },
  {
    q: "Гэр бүлийн бусад гишүүдийг нэмж болох уу?",
    a: "Тийм. Ээж, аав, эмээ өвөө зэрэг гэр бүлийн гишүүдийг урьж, хүүхдийн өсөлтийн дурсамжийг хамтдаа хадгалж, үзэх боломжтой.",
  },
  {
    q: "Timelapse бичлэг хэзээ бэлэн болох вэ?",
    a: "Зураг тань цугларах тусам өсөлтийн timeline автоматаар бүтнэ. Хэдэн сарын дараа өдөр бүрийн жижигхэн өөрчлөлтүүд нэгдээд гайхалтай өсөлтийн түүх болно.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-2xl border transition-colors ${
              isOpen
                ? "border-brand bg-white shadow-sm"
                : "border-neutral-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium text-neutral-900">{item.q}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isOpen
                    ? "bg-brand text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>

            {isOpen && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
