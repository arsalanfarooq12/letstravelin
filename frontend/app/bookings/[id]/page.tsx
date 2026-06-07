import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Plane,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Clock,
} from "lucide-react";
import Navbar from "@/app/_components/navbar";
import CancelButton from "../_components/cancel-button";
import { getSession } from "@/lib/session";

async function getBooking(id: string, token: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef9c3", color: "#854d0e" },
  CONFIRMED: { bg: "#dcfce7", color: "#166534" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", color: "#1e40af" },
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const booking = await getBooking(id, session.accessToken);
  if (!booking) notFound();

  const status = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const canCancel =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session.profile} />

      {/* Header */}
      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-3xl mx-auto">
          <Link
            href="/bookings/my"
            className="flex items-center gap-1.5 text-sm mb-4"
            style={{ color: "#a8dfc4" }}
          >
            <ArrowLeft size={14} /> My Bookings
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Booking Details
              </h1>
              <p
                className="text-xs mt-1 font-mono"
                style={{ color: "#a8dfc4" }}
              >
                #{booking.id}
              </p>
            </div>
            <span
              className="text-sm px-3 py-1.5 rounded-full font-medium"
              style={{ background: status.bg, color: status.color }}
            >
              {booking.status}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-6">
        {/* Summary card */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <div className="flex items-center gap-2 mb-1">
            {booking.type === "HOTEL" && (
              <BedDouble size={16} style={{ color: "var(--brand-green)" }} />
            )}
            {booking.type === "TRANSPORT" && (
              <Plane size={16} style={{ color: "var(--brand-green)" }} />
            )}
            {booking.type === "PACKAGE" && (
              <Package size={16} style={{ color: "var(--brand-green)" }} />
            )}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-green)",
              }}
            >
              {booking.type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p
                className="text-xs mb-0.5"
                style={{ color: "var(--brand-muted)" }}
              >
                Total price
              </p>
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--brand-green)" }}
              >
                ₹{Number(booking.totalPrice).toLocaleString("en-IN")}
                <span
                  className="text-sm font-normal ml-1"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {booking.currency}
                </span>
              </p>
            </div>
            <div>
              <p
                className="text-xs mb-0.5"
                style={{ color: "var(--brand-muted)" }}
              >
                Booked on
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--brand-text)" }}
              >
                {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Hotel rooms */}
        {booking.type === "HOTEL" && booking.rooms.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-sm font-medium mb-4 flex items-center gap-2"
              style={{ color: "var(--brand-text)" }}
            >
              <BedDouble size={15} style={{ color: "var(--brand-green)" }} />{" "}
              Room Details
            </h2>
            <div className="flex flex-col gap-4">
              {booking.rooms.map((rb: any) => (
                <div key={rb.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {rb.room.hotel.name}
                      </p>
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        <MapPin size={10} /> {rb.room.hotel.destination.name}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--brand-ivory)",
                        color: "var(--brand-green)",
                      }}
                    >
                      {rb.room.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Check-in",
                        value: new Date(rb.checkIn).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        ),
                      },
                      {
                        label: "Check-out",
                        value: new Date(rb.checkOut).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        ),
                      },
                      { label: "Nights", value: rb.nights.toString() },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{ background: "var(--brand-ivory)" }}
                      >
                        <p
                          className="text-xs mb-0.5"
                          style={{ color: "var(--brand-muted)" }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--brand-text)" }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: "0.5px solid #f0ece4" }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      Price per night
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--brand-text)" }}
                    >
                      ₹{Number(rb.pricePerNight).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transport */}
        {booking.type === "TRANSPORT" && booking.transport && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-sm font-medium mb-4 flex items-center gap-2"
              style={{ color: "var(--brand-text)" }}
            >
              <Plane size={15} style={{ color: "var(--brand-green)" }} />{" "}
              Transport Details
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--brand-text)" }}
                >
                  {booking.transport.origin.name}
                </p>
                <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                  Origin
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 px-4">
                <div
                  className="flex-1 h-px"
                  style={{ background: "#e8e2d8" }}
                />
                <Plane size={14} style={{ color: "var(--brand-green)" }} />
                <div
                  className="flex-1 h-px"
                  style={{ background: "#e8e2d8" }}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--brand-text)" }}
                >
                  {booking.transport.destination.name}
                </p>
                <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                  Destination
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--brand-ivory)" }}
              >
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Type
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {booking.transport.type}
                </p>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--brand-ivory)" }}
              >
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Schedule
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {new Date(booking.transport.schedule).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Package */}
        {booking.type === "PACKAGE" && booking.package && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-sm font-medium mb-4 flex items-center gap-2"
              style={{ color: "var(--brand-text)" }}
            >
              <Package size={15} style={{ color: "var(--brand-green)" }} />{" "}
              Package Details
            </h2>
            <p
              className="text-base font-medium mb-1"
              style={{ color: "var(--brand-text)" }}
            >
              {booking.package.title}
            </p>
            <p
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--brand-muted)" }}
            >
              <MapPin size={11} /> {booking.package.destination.name}
            </p>
          </div>
        )}

        {/* Payment status */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <h2
            className="text-sm font-medium mb-4 flex items-center gap-2"
            style={{ color: "var(--brand-text)" }}
          >
            <CreditCard size={15} style={{ color: "var(--brand-green)" }} />{" "}
            Payment
          </h2>
          {booking.payments.length === 0 ? (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "#fef9c3" }}
            >
              <Clock size={15} style={{ color: "#854d0e" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#854d0e" }}>
                  Payment pending
                </p>
                <p className="text-xs" style={{ color: "#a16207" }}>
                  Your booking is confirmed once payment is received by our
                  team.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {booking.payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "0.5px solid #f0ece4" }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--brand-text)" }}
                    >
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      {p.gateway} · {p.transactionId}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        p.status === "SUCCESS" ? "#dcfce7" : "#fee2e2",
                      color: p.status === "SUCCESS" ? "#166534" : "#991b1b",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {canCancel && (
          <div
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--brand-text)" }}
              >
                Cancel this booking
              </p>
              <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                This action cannot be undone
              </p>
            </div>
            <CancelButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  );
}
