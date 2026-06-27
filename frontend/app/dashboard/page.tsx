import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import Navbar from "@/app/_components/navbar";
import TabSwitcher from "./_components/tab-switcher";
import OverviewTab from "./_components/overview-tab";
import BookingsTab from "./_components/bookings-tab";
import ProfileTab from "./_components/profile-tab";
import { requireSession } from "@/lib/session";

async function getMyBookings(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

async function getProfile(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab = "overview" } = await searchParams;

  const [bookings, profile] = await Promise.all([
    getMyBookings(session.accessToken),
    getProfile(session.accessToken),
  ]);

  const initials = session.profile.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session.profile} />

      {/* Header */}
      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-semibold flex-shrink-0"
            style={{
              background: profile?.avatarUrl
                ? undefined
                : "var(--brand-yellow)",
              color: "var(--brand-green)",
            }}
          >
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={session.profile.fullName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{initials || <User size={28} />}</span>
            )}
          </div>
          <div>
            <p className="text-sm mb-0.5" style={{ color: "#a8dfc4" }}>
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {session.profile.fullName}
            </h1>
            <p className="text-sm" style={{ color: "#a8dfc4" }}>
              {session.profile.role} · {bookings.length} booking
              {bookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Tab switcher */}
        <Suspense>
          <TabSwitcher />
        </Suspense>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab bookings={bookings} />}

        {tab === "bookings" && <BookingsTab bookings={bookings} />}

        {tab === "profile" && (
          <ProfileTab
            userId={session.profile.id}
            initialFullName={profile?.fullName ?? session.profile.fullName}
            initialPhone={profile?.phone ?? null}
            avatarUrl={profile?.avatarUrl ?? null}
            role={session.profile.role}
          />
        )}
      </div>
    </div>
  );
}
