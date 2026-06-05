import Link from "next/link";
import { Plane } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      {/* Brand header */}
      <header
        className="w-full px-6 py-5 flex items-center gap-3"
        style={{ background: "var(--brand-green)" }}
      >
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
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer
        className="py-4 text-center text-xs"
        style={{ color: "var(--brand-muted)" }}
      >
        © {new Date().getFullYear()} letstravelin
      </footer>
    </div>
  );
}
