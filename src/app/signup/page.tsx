"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthPageLayout } from "@/components/AuthPageLayout";

export default function SignupPage() {
  const router = useRouter();
  const { hydrated, currentUser, signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) return;
    router.replace("/");
  }, [hydrated, currentUser, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const u = username.trim();
    const em = email.trim();
    const pw = password;

    if (u.length < 2 || u.length > 64) {
      setMessage("Username must be 2-64 characters.");
      setSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.toLowerCase())) {
      setMessage("Email format is invalid.");
      setSubmitting(false);
      return;
    }
    if (!pw || pw.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    const result = await signup({ username: u, email: em, password: pw });
    if (!result.ok) {
      setMessage(result.message);
      setSubmitting(false);
      return;
    }

    router.replace("/");
  }

  return (
    <AuthPageLayout>
      <header className="space-y-3 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
          Create account
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          Sign up
        </h1>
        <p className="mx-auto max-w-xl text-white/45">
          Passwords are hashed with bcrypt. Stay signed in with a secure cookie;
          guest data merges into this account automatically.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-[20px] ring-1 ring-inset ring-white/[0.06]"
      >
        {message ? (
          <div
            className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-foreground backdrop-blur-md"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <label className="block space-y-2 text-sm">
          <span className="text-white/50">Username</span>
          <input
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-foreground placeholder:text-white/25 outline-none backdrop-blur-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your name"
            type="text"
            required
            minLength={2}
            maxLength={64}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-white/50">Email</span>
          <input
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-foreground placeholder:text-white/25 outline-none backdrop-blur-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            required
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-white/50">Password</span>
          <input
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-foreground placeholder:text-white/25 outline-none backdrop-blur-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 chars"
            type="password"
            required
            minLength={8}
          />
        </label>

        <button
          disabled={submitting}
          className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(245,197,24,0.3)] transition-all hover:shadow-[0_0_30px_rgba(245,197,24,0.5)] disabled:opacity-60"
          type="submit"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" />
            {submitting ? "Creating..." : "Create account"}
          </span>
        </button>

        <div className="pt-2 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link
            className="font-semibold text-primary hover:text-primary/85"
            href="/login"
          >
            Log in
          </Link>
        </div>
      </form>
    </AuthPageLayout>
  );
}
