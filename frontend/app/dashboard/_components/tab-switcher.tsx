"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, BookOpen, User } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "bookings", label: "Bookings", icon: BookOpen },
  { key: "profile", label: "Profile", icon: User },
];

export default function TabSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";

  return (
    <div
      className="flex gap-1 p-1 rounded-2xl w-fit"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => router.push(`/dashboard?tab=${key}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: active === key ? "var(--brand-green)" : "transparent",
            color: active === key ? "white" : "var(--brand-muted)",
          }}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
