import Link from "next/link";
import {
  BedDouble,
  Plane,
  Package,
  ArrowRight,
  BookOpen,
  Clock,
} from "lucide-react";
import CancelButton from "@/app/bookings/_components/cancel-button";

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
  transport: {
    origin: { name: string };
    destination: { name: string };
    type: string;
  } | null;
  package: { title: string; destination: { name: string } } | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef9c3", color: "#854d0e" },
  CONFIRMED: { bg: "#dcfce7", color: "#166534" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", color: "#1e40af" },
};

const TYPE_ICONS = {
  HOTEL: <BedDouble size={18} />,
  TRANSPORT: <Plane size={18} />,
  PACKAGE: <Package size={18} />,
};

function getTitle(b: Booking): string {
  if (b.type === "HOTEL" && b.rooms.length > 0)
    return b.rooms[0].room.hotel.name;
  if (b.type === "TRANSPORT" && b.transport)
    return `${b.transport.origin.name} → ${b.transport.destination.name}`;
  if (b.type === "PACKAGE" && b.package) return b.package.title;
  return "Booking";
}

function getSubtitle(b: Booking): string {
  if (b.type === "HOTEL" && b.rooms.length > 0) {
    const r = b.rooms[0];
    return `${r.nights} night${r.nights !== 1 ? "s" : ""} · ${
      r.room.hotel.destination.name
    }`;
  }
  if (b.type === "TRANSPORT" && b.transport) return `${b.transport.type}`;
  if (b.type === "PACKAGE" && b.package)
    return `Package · ${b.package.destination.name}`;
  return "";
}

export default function BookingsTab({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <BookOpen
          size={32}
          style={{ color: "var(--brand-muted)" }}
          className="mb-3"
        />
        <h3 className="font-medium mb-1" style={{ color: "var(--brand-text)" }}>
          No bookings yet
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--brand-muted)" }}>
          Start exploring and book your first trip
        </p>
        <Link
          href="/destinations"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          Explore destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bookings.map((b) => {
        const status = STATUS_STYLES[b.status];
        const canCancel = b.status === "PENDING" || b.status === "CONFIRMED";

        return (
          <div
            key={b.id}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--brand-ivory)",
                    color: "var(--brand-green)",
                  }}
                >
                  {TYPE_ICONS[b.type]}
                </div>
                <div>
                  <h3
                    className="font-medium text-sm"
                    style={{ color: "var(--brand-text)" }}
                  >
                    {getTitle(b)}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {getSubtitle(b)}
                  </p>
                  <p
                    className="text-xs mt-1 flex items-center gap-1"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    <Clock size={10} />
                    {new Date(b.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: status.bg, color: status.color }}
                >
                  {b.status}
                </span>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--brand-green)" }}
                >
                  ₹{Number(b.totalPrice).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: "0.5px solid #f0ece4" }}
            >
              <Link
                href={`/bookings/${b.id}`}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--brand-green)" }}
              >
                View details <ArrowRight size={12} />
              </Link>
              {canCancel && <CancelButton bookingId={b.id} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
