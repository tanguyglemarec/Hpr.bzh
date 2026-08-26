"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Mot de passe incorrect.");
        return;
      }
      router.replace(searchParams.get("next") || "/outils/tri");
      router.refresh();
    } catch {
      setError("Connexion impossible, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#131416] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-[#33363d] bg-[#1c1e22] p-6"
      >
        <div className="mb-5 flex items-center gap-2 text-[#eceae4]">
          <Lock size={18} className="text-[#5b8a9e]" />
          <h1 className="text-lg font-semibold">Outil interne HPR</h1>
        </div>
        <label className="block text-xs uppercase tracking-wide text-[#8b8d93]" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded border border-[#33363d] bg-transparent px-3 py-2 text-sm text-[#eceae4] outline-none focus:border-[#5b8a9e]"
        />
        {error && <p className="mt-2 text-xs text-[#c85a4a]">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#5b8a9e] px-4 py-2 text-sm font-semibold text-[#0d1114] disabled:opacity-40"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Entrer
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
