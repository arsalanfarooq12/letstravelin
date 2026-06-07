import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  BookOpen,
  MapPin,
  BedDouble,
  Plane,
  Package,
  ArrowRight,
  Clock,
} from "lucide-react";
import Navbar from "@/app/_components/navbar";
import CancelButton from "../_components/cancel-button";
import { getSession } from "@/lib/session";

type RoomBooking = {
  id: string;
  pricePerNight: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  room: {
    type: string;
    hotel: {
      id: string;
      name: string;
      destination: { id: string; name: string };
    };
  };
};

type Booking = {
  id: string;
  type: "HOTEL" | "TRANSPORT" | "PACKAGE";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice: string;
  currency: string;
  createdAt: string;
  rooms: RoomBooking[];
  transport: {
    id: string;
    type: string;
    schedule: string;
    origin: { name: string };
    destination: { name: string };
  } | null;
  package: {
    id: string;
    title: string;
    destination: { name: string };
  } | null;
  payments: unknown[];
};

type ApiResponse = {
  data: Booking[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

async function getMyBookings(token: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { data: [], nextCursor: null, hasNextPage: false };
    return res.json();
  } catch {
    return { data: [], nextCursor: null, hasNextPage: false };
  }
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef9c3", color: "#854d0e" },
  CONFIRMED: { bg: "#dcfce7", color: "#166534" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", color: "#1e40af" },
};

function BookingCard({ booking }: { booking: Booking }) {
  const status = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const canCancel =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  // Derive title and subtitle from booking type
  let title = "";
  let subtitle = "";
  let icon = <BookOpen size={18} />;

  if (booking.type === "HOTEL" && booking.rooms.length > 0) {
    const r = booking.rooms[0];
    title = r.room.hotel.name;
    subtitle = `${r.room.type} · ${r.nights} night${
      r.nights !== 1 ? "s" : ""
    } · ${r.room.hotel.destination.name}`;
    icon = <BedDouble size={18} />;
  } else if (booking.type === "TRANSPORT" && booking.transport) {
    title = `${booking.transport.origin.name} → ${booking.transport.destination.name}`;
    subtitle = `${booking.transport.type} · ${new Date(
      booking.transport.schedule
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
    icon = <Plane size={18} />;
  } else if (booking.type === "PACKAGE" && booking.package) {
    title = booking.package.title;
    subtitle = `Package · ${booking.package.destination.name}`;
    icon = <Package size={18} />;
  }

  return (
    <div
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
            {icon}
          </div>
          <div>
            <h3
              className="font-medium text-sm leading-snug"
              style={{ color: "var(--brand-text)" }}
            >
              {title}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--brand-muted)" }}
            >
              {subtitle}
            </p>
            <p
              className="text-xs mt-1 flex items-center gap-1"
              style={{ color: "var(--brand-muted)" }}
            >
              <Clock size={10} />
              {new Date(booking.createdAt).toLocaleDateString("en-IN", {
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
            {booking.status}
          </span>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--brand-green)" }}
          >
            ₹{Number(booking.totalPrice).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "0.5px solid #f0ece4" }}
      >
        <Link
          href={`/bookings/${booking.id}`}
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--brand-green)" }}
        >
          View details <ArrowRight size={12} />
        </Link>
        {canCancel && <CancelButton bookingId={booking.id} />}
      </div>
    </div>
  );
}

export default async function MyBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: bookings } = await getMyBookings(session.accessToken);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session.profile} />

      {/* Header */}
      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm mb-1" style={{ color: "#a8dfc4" }}>
            Your account
          </p>
          <h1 className="text-3xl font-semibold text-white">My Bookings</h1>
          <p className="text-sm mt-1" style={{ color: "#a8dfc4" }}>
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        {bookings.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <BookOpen
              size={32}
              style={{ color: "var(--brand-muted)" }}
              className="mb-3"
            />
            <h3
              className="font-medium mb-1"
              style={{ color: "var(--brand-text)" }}
            >
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
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
