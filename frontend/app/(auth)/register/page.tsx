"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check } from "lucide-react";
import { api } from "@/lib/api";
import { createSession } from "@/lib/session";
type State = { error?: string };

const STEPS = ["Account", "Details", "Done"];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  async function registerAction(
    _prev: State,
    formData: FormData
  ): Promise<State> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      await api.auth.register({ email, password, fullName });
      // Auto-login after register
      const data = await api.auth.login({ email, password });
      await createSession(data.accessToken, data.refreshToken, {
        ...data.profile, // spread the profile data to include id and fullName
        role: data.profile.role as "USER" | "AGENT" | "ADMIN", // this line was added to fix the type issue, as the profile role is expected to be one of these three values
      });
      router.push("/");
      return {};
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: "#d6cebc", background: "var(--brand-ivory)" }}
      >
        {/* Card header */}
        <div className="px-6 py-7" style={{ background: "var(--brand-green)" }}>
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className="flex items-center justify-center rounded-full text-xs font-medium"
                  style={{
                    width: 20,
                    height: 20,
                    background:
                      i === 1
                        ? "var(--brand-yellow)"
                        : i < 1
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.15)",
                    color: i === 1 ? "var(--brand-green)" : "#fff",
                  }}
                >
                  {i < 1 ? <Check size={11} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px w-6"
                    style={{
                      background:
                        i < 1
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#a8dfc4" }}>
            Start your adventure
          </p>
          <h1 className="text-2xl font-medium leading-snug text-white">
            It&apos;s{" "}
            <span style={{ color: "var(--brand-yellow)" }}>free.</span>
          </h1>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Priya Sharma"
                className="h-10 rounded-lg px-3 text-sm border outline-none focus:ring-2 bg-white"
                style={{ borderColor: "#c8d8ce", color: "var(--brand-text)" }}
              />
            </div>

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
              <label
                htmlFor="password"
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#8aaa96" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium"
              style={{ color: "var(--brand-green)" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
