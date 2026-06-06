import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plane,
  LayoutDashboard,
  MapPin,
  Users,
  BookOpen,
  LogOut,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { deleteSession } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  if (session.profile.role !== "ADMIN" && session.profile.role !== "AGENT") {
    redirect("/");
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--brand-ivory)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col min-h-screen sticky top-0"
        style={{ background: "var(--brand-green)" }}
      >
        {/* Logo */}
        <div
          className="px-5 py-6 flex items-center gap-2.5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brand-yellow)" }}
          >
            <Plane size={16} style={{ color: "var(--brand-green)" }} />
          </div>
          <div>
            <p
              className="text-sm font-medium leading-none"
              style={{ color: "#e6f7ee" }}
            >
              letstravelin
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#a8dfc4" }}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ color: "#a8dfc4" }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: "#e6f7ee" }}>
                {session.profile.fullName}
              </p>
              <p className="text-xs" style={{ color: "#a8dfc4" }}>
                {session.profile.role}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await deleteSession();
                redirect("/login");
              }}
            >
              <button
                type="submit"
                className="p-1.5 rounded-lg"
                style={{ color: "#a8dfc4" }}
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8">{children}</main>
    </div>
  );
}
