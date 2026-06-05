"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { createSession } from "@/lib/session";

type State = { error?: string };

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  async function loginAction(_prev: State, formData: FormData): Promise<State> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const data = await api.auth.login({ email, password });
      await createSession(data.accessToken, data.refreshToken, {
        ...data.profile,
        role: data.profile.role as "USER" | "AGENT" | "ADMIN", // this line was added to fix the type issue, as the profile role is expected to be one of these three values
      });
      router.push("/");
      return {};
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: "#d6cebc", background: "var(--brand-ivory)" }}
      >
        {/* Card header */}
        <div className="px-6 py-7" style={{ background: "var(--brand-green)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#a8dfc4" }}>
            Welcome back
          </p>
          <h1 className="text-2xl font-medium leading-snug text-white">
            Where to <span style={{ color: "var(--brand-yellow)" }}>next?</span>
          </h1>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-10 rounded-lg px-3 text-sm border outline-none focus:ring-2 bg-white"
                style={{ borderColor: "#c8d8ce", color: "var(--brand-text)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs"
                  style={{ color: "var(--brand-green)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-10 w-full rounded-lg px-3 pr-10 text-sm border outline-none focus:ring-2 bg-white"
                  style={{ borderColor: "#c8d8ce", color: "var(--brand-text)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={15} style={{ color: "var(--brand-muted)" }} />
                  ) : (
                    <Eye size={15} style={{ color: "var(--brand-muted)" }} />
                  )}
                </button>
              </div>
            </div>

            {state.error && (
              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="h-10 rounded-lg text-sm font-medium text-white mt-1 transition-opacity disabled:opacity-60"
              style={{ background: "var(--brand-green)" }}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#8aaa96" }}>
            No account?{" "}
            <Link
              href="/register"
              className="font-medium"
              style={{ color: "var(--brand-green)" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
