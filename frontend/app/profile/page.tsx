"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Navbar from "@/app/_components/navbar";
import { User, Phone, Loader2, Save } from "lucide-react";

const FIELD_STYLE = {
  background: "var(--brand-ivory)",
  border: "0.5px solid #d6cebc",
  color: "var(--brand-text)",
};

export default function ProfilePage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const [hydrated, setHydrated] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Wait one tick for Zustand to hydrate from the provider
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Only redirect after hydration confirms profile is truly null
  useEffect(() => {
    if (!hydrated) return;
    if (!profile) {
      router.push("/");
      return;
    }
    setFullName(profile.fullName ?? "");
  }, [hydrated, profile, router]);

  function getToken(): string | undefined {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("lt_access="))
      ?.split("=")[1];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName, phone: phone || undefined }),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update profile");

        if (profile) setProfile({ ...profile, fullName });
        setSuccess(true);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  // Show nothing until Zustand hydrates
  if (!hydrated || !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--brand-ivory)" }}
      >
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--brand-green)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={profile} />

      {/* Header */}
      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brand-yellow)" }}
          >
            <User size={24} style={{ color: "var(--brand-green)" }} />
          </div>
          <div>
            <p className="text-sm mb-0.5" style={{ color: "#a8dfc4" }}>
              Your account
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {profile.fullName}
            </h1>
            <p className="text-sm" style={{ color: "#a8dfc4" }}>
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto w-full px-6 py-10">
        <div
          className="rounded-2xl p-6"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <h2
            className="text-base font-medium mb-5"
            style={{ color: "var(--brand-text)" }}
          >
            Personal information
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Full name
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--brand-muted)" }}
                />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none"
                  style={FIELD_STYLE}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Phone number
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--brand-muted)" }}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none"
                  style={FIELD_STYLE}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Role
              </label>
              <div
                className="h-10 rounded-lg px-3 flex items-center text-sm"
                style={{ ...FIELD_STYLE, opacity: 0.6 }}
              >
                {profile.role}
              </div>
            </div>

            {error && (
              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs rounded-lg px-3 py-2"
                style={{ background: "#dcfce7", color: "#166534" }}
              >
                Profile updated successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-5 rounded-xl text-sm font-medium flex items-center gap-2 w-fit mt-1 disabled:opacity-60"
              style={{ background: "var(--brand-green)", color: "white" }}
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
