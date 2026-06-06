import { requireSession } from "@/lib/session";
import { MapPin, Users, BookOpen, TrendingUp } from "lucide-react";

async function getStats(token: string) {
  try {
    const [destRes, usersRes] = await Promise.allSettled([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/destinations?limit=1`, {
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const destinations =
      destRes.status === "fulfilled" && destRes.value.ok
        ? await destRes.value.json()
        : null;

    return {
      destinations: destinations?.data?.length ?? 0,
    };
  } catch {
    return { destinations: 0 };
  }
}

const STAT_CARDS = [
  {
    label: "Destinations",
    icon: MapPin,
    color: "var(--brand-green)",
    key: "destinations",
  },
  { label: "Users", icon: Users, color: "#3b82f6", key: "users" },
  { label: "Bookings", icon: BookOpen, color: "#f59e0b", key: "bookings" },
  { label: "Revenue", icon: TrendingUp, color: "#10b981", key: "revenue" },
];

export default async function AdminOverviewPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--brand-text)" }}
        >
          Welcome back, {session.profile.fullName}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
          Here&apos;s what&apos;s happening on letstravelin today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p
                className="text-2xl font-semibold"
                style={{ color: "var(--brand-text)" }}
              >
                —
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--brand-muted)" }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <h2
          className="text-sm font-medium mb-4"
          style={{ color: "var(--brand-text)" }}
        >
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add destination", href: "/admin/destinations/new" },
            { label: "View all destinations", href: "/admin/destinations" },
            { label: "View bookings", href: "/admin/bookings" },
            { label: "Manage users", href: "/admin/users" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-green)",
                border: "0.5px solid #c8d8ce",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
