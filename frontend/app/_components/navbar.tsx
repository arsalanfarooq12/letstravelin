"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, LogOut, User } from "lucide-react";
import { deleteSession } from "@/lib/session";
import type { Profile } from "@/lib/session";

export default function Navbar({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function handleLogout() {
    await deleteSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="w-full px-6 py-4 flex items-center justify-between"
      style={{ background: "var(--brand-green)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--brand-yellow)" }}
        >
          <Plane size={16} style={{ color: "var(--brand-green)" }} />
        </div>
        <span
          className="text-base font-medium tracking-tight"
          style={{ color: "#e6f7ee" }}
        >
          letstravelin
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-6">
        <Link
          href="/destinations"
          className="text-lg font-medium"
          style={{ color: "#a8dfc4" }}
        >
          Destinations
        </Link>

        <Link
          href="/hotels"
          className="text-lg font-medium"
          style={{ color: "#a8dfc4" }}
        >
          Hotels
        </Link>
        <Link href="/packages" className="text-sm" style={{ color: "#a8dfc4" }}>
          Packages
        </Link>
        {profile && (
          <Link
            href="/bookings/my"
            className="text-sm"
            style={{ color: "#a8dfc4" }}
          >
            My Bookings
          </Link>
        )}
      </nav>

      {/* Auth */}
      <div className="flex items-center gap-3">
        {profile ? (
          <>
            <Link
              href="/dashboard"
              className="hidden md:block text-sm"
              style={{ color: "#a8dfc4" }}
            >
              {profile.fullName}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#a8dfc4" }}
            >
              <LogOut size={15} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm"
              style={{ color: "#a8dfc4" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-1.5 rounded-lg font-medium"
              style={{
                background: "var(--brand-yellow)",
                color: "var(--brand-green)",
              }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
