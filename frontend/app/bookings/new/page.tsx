"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Plane,
  Package,
  Check,
  Loader2,
  Calendar,
} from "lucide-react";
import Navbar from "@/app/_components/navbar";
import { useStore } from "@/lib/store";
import { createBooking } from "@/lib/booking-actions";

const STEPS = ["Select", "Details", "Confirm"];

const FIELD_STYLE = {
  background: "var(--brand-ivory)",
  border: "0.5px solid #d6cebc",
  color: "var(--brand-text)",
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full text-xs font-medium transition-all"
            style={{
              width: 28,
              height: 28,
              background:
                i < current
                  ? "var(--brand-green)"
                  : i === current
                  ? "var(--brand-yellow)"
                  : "var(--brand-ivory)",
              color:
                i < current
                  ? "white"
                  : i === current
                  ? "var(--brand-green)"
                  : "var(--brand-muted)",
              border: `0.5px solid ${i <= current ? "transparent" : "#d6cebc"}`,
            }}
          >
            {i < current ? <Check size={12} /> : i + 1}
          </div>
          <span
            className="text-xs font-medium"
            style={{
              color: i === current ? "var(--brand-text)" : "var(--brand-muted)",
            }}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className="w-8 h-px mx-1"
              style={{
                background: i < current ? "var(--brand-green)" : "#d6cebc",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useStore((s) => s.profile);

  const type = (searchParams.get("type") ?? "HOTEL") as
    | "HOTEL"
    | "TRANSPORT"
    | "PACKAGE";
  const resourceId = searchParams.get("id") ?? "";
  const roomId = searchParams.get("roomId") ?? "";

  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [seats, setSeats] = useState(1);
  const [currency, setCurrency] = useState("INR");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-sm mb-4" style={{ color: "var(--brand-muted)" }}>
          You must be logged in to book.
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  function buildPayload() {
    if (type === "HOTEL") {
      return {
        type: "HOTEL",
        currency,
        rooms: [{ roomId, checkIn, checkOut }],
      };
    }
    if (type === "TRANSPORT") {
      return { type: "TRANSPORT", transportId: resourceId, seats, currency };
    }
    if (type === "PACKAGE") {
      return {
        type: "PACKAGE",
        packageId: resourceId,
        checkIn,
        checkOut,
        seats,
        currency,
      };
    }
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const payload = buildPayload();
      const result = await createBooking(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/bookings/my");
    });
  }

  // Step 0 — what are we booking summary
  // Step 1 — fill in details
  // Step 2 — confirm

  return (
    <div className="max-w-lg mx-auto">
      <StepIndicator current={step} />

      {/* Step 0 — What are we booking */}
      {step === 0 && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-green)",
              }}
            >
              {type === "HOTEL" && <BedDouble size={22} />}
              {type === "TRANSPORT" && <Plane size={22} />}
              {type === "PACKAGE" && <Package size={22} />}
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                You are booking a
              </p>
              <p
                className="text-base font-semibold"
                style={{ color: "var(--brand-text)" }}
              >
                {type}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "var(--brand-ivory)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--brand-muted)" }}>
              Booking for
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--brand-text)" }}
            >
              {profile.fullName}
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="h-11 rounded-xl text-sm font-medium"
            style={{ background: "var(--brand-green)", color: "white" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <h2
            className="text-base font-medium"
            style={{ color: "var(--brand-text)" }}
          >
            Booking details
          </h2>

          {/* Hotel or Package — needs dates */}
          {(type === "HOTEL" || type === "PACKAGE") && (
            <>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Check-in date
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--brand-muted)" }}
                  />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none"
                    style={FIELD_STYLE}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Check-out date
                </label>
                <div className="relative">
                  <Calendar
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--brand-muted)" }}
                  />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none"
                    style={FIELD_STYLE}
                  />
                </div>
              </div>
            </>
          )}

          {/* Transport or Package — needs seats */}
          {(type === "TRANSPORT" || type === "PACKAGE") && (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--brand-muted)" }}
              >
                Number of seats
              </label>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                min={1}
                max={10}
                className="h-10 rounded-lg px-3 text-sm outline-none"
                style={FIELD_STYLE}
              />
            </div>
          )}

          {/* Currency */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--brand-muted)" }}
            >
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 rounded-lg px-3 text-sm outline-none"
              style={FIELD_STYLE}
            >
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 h-11 rounded-xl text-sm font-medium"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-muted)",
                border: "0.5px solid #d6cebc",
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={
                (type === "HOTEL" && (!checkIn || !checkOut)) ||
                (type === "PACKAGE" && (!checkIn || !checkOut))
              }
              className="flex-1 h-11 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--brand-green)", color: "white" }}
            >
              Review booking
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Confirm */}
      {step === 2 && (
        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <h2
            className="text-base font-medium"
            style={{ color: "var(--brand-text)" }}
          >
            Review & confirm
          </h2>

          <div
            className="flex flex-col gap-2 rounded-xl p-4"
            style={{ background: "var(--brand-ivory)" }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--brand-muted)" }}>Type</span>
              <span
                className="font-medium"
                style={{ color: "var(--brand-text)" }}
              >
                {type}
              </span>
            </div>
            {checkIn && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--brand-muted)" }}>Check-in</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {new Date(checkIn).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {checkOut && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--brand-muted)" }}>Check-out</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {new Date(checkOut).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {(type === "TRANSPORT" || type === "PACKAGE") && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--brand-muted)" }}>Seats</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {seats}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--brand-muted)" }}>Currency</span>
              <span
                className="font-medium"
                style={{ color: "var(--brand-text)" }}
              >
                {currency}
              </span>
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#fef9c3" }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "#854d0e" }}>
              Payment is collected manually by our team after booking
              confirmation. You will be contacted within 24 hours.
            </p>
          </div>

          {error && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{ background: "#fee2e2", color: "#991b1b" }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 h-11 rounded-xl text-sm font-medium"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-muted)",
                border: "0.5px solid #d6cebc",
              }}
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--brand-green)", color: "white" }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Confirm booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  const profile = useStore((s) => s.profile);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={profile} />

      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-lg mx-auto">
          <Link
            href="/bookings/my"
            className="flex items-center gap-1.5 text-sm mb-4"
            style={{ color: "#a8dfc4" }}
          >
            <ArrowLeft size={14} /> My Bookings
          </Link>
          <h1 className="text-2xl font-semibold text-white">New Booking</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-6 py-10">
        <Suspense>
          <BookingForm />
        </Suspense>
      </div>
    </div>
  );
}
