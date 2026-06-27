import Link from "next/link";
import {
  BedDouble,
  Plane,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Booking = {
  id: string;
  type: "HOTEL" | "TRANSPORT" | "PACKAGE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice: string;
  currency: string;
  createdAt: string;
  rooms: {
    room: { hotel: { name: string; destination: { name: string } } };
    nights: number;
  }[];
  transport: { origin: { name: string }; destination: { name: string } } | null;
  package: { title: string } | null;
};

type Props = { bookings: Booking[] };

const TYPE_ICONS = {
  HOTEL: <BedDouble size={14} />,
  TRANSPORT: <Plane size={14} />,
  PACKAGE: <Package size={14} />,
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef9c3", color: "#854d0e" },
  CONFIRMED: { bg: "#dcfce7", color: "#166534" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", color: "#1e40af" },
};

export default function OverviewTab({ bookings }: Props) {
  // Compute stats
  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  const tripsTaken = bookings.filter((b) => b.status === "COMPLETED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const recent = bookings.slice(0, 4);

  const STATS = [
    {
      icon: TrendingUp,
      label: "Total spent",
      value: `₹${totalSpent.toLocaleString("en-IN")}`,
      color: "var(--brand-green)",
    },
    {
      icon: CheckCircle,
      label: "Trips completed",
      value: tripsTaken.toString(),
      color: "#10b981",
    },
    {
      icon: Clock,
      label: "Pending",
      value: pending.toString(),
      color: "#f59e0b",
    },
    {
      icon: CheckCircle,
      label: "Confirmed",
      value: confirmed.toString(),
      color: "#3b82f6",
    },
  ];

  function getBookingTitle(b: Booking): string {
    if (b.type === "HOTEL" && b.rooms.length > 0)
      return b.rooms[0].room.hotel.name;
    if (b.type === "TRANSPORT" && b.transport)
      return `${b.transport.origin.name} → ${b.transport.destination.name}`;
    if (b.type === "PACKAGE" && b.package) return b.package.title;
    return "Booking";
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18` }}
            >
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--brand-text)" }}
              >
                {value}
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

      {/* Recent bookings */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-medium"
            style={{ color: "var(--brand-text)" }}
          >
            Recent bookings
          </h2>
          <Link
            href="/dashboard?tab=bookings"
            className="text-xs flex items-center gap-1"
            style={{ color: "var(--brand-green)" }}
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
              No bookings yet.
            </p>
            <Link
              href="/destinations"
              className="text-xs font-medium mt-2 inline-block"
              style={{ color: "var(--brand-green)" }}
            >
              Explore destinations →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((b) => {
              const status = STATUS_STYLES[b.status];
              return (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="flex items-center justify-between py-3 px-3 rounded-xl transition-all"
                  style={{ background: "var(--brand-ivory)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "white",
                        color: "var(--brand-green)",
                      }}
                    >
                      {TYPE_ICONS[b.type]}
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium line-clamp-1"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {getBookingTitle(b)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {b.status}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--brand-green)" }}
                    >
                      ₹{Number(b.totalPrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
          Quick links
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "🏔️ Destinations", href: "/destinations" },
            { label: "🏨 Hotels", href: "/hotels" },
            { label: "📦 Packages", href: "/packages" },
            { label: "📋 All bookings", href: "/dashboard?tab=bookings" },
          ].map(({ label, href }) => (
            <Link
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
