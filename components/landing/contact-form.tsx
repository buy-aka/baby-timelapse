"use client";

import { useState } from "react";

const SUPPORT_EMAIL = "info@horom.mn";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тусдаа backend байхгүй тул хэрэглэгчийн мэйл клиентээр илгээнэ.
    const body = `Нэр: ${name}\nИмэйл: ${email}\n\n${message}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject || "Horom — Холбоо барих"
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-brand";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        className={inputCls}
        placeholder="Таны нэр"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={inputCls}
        type="email"
        placeholder="Имэйл хаяг"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={inputCls}
        placeholder="Гарчиг"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        className={`${inputCls} min-h-28 resize-none`}
        placeholder="Таны зурвас"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="submit"
        className="mt-1 self-start rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        Илгээх
      </button>
    </form>
  );
}
