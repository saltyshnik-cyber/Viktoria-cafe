"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось войти");
        return;
      }

      router.push("/admin/orders");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-ink">Вход в админку</h1>
      <p className="mt-1 text-sm text-ink/60">Кафе «Виктория»</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-ink outline-none focus:border-primary"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
