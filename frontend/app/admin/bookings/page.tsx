import { requireSession } from "@/lib/session";
import { BookOpen } from "lucide-react";

export default async function AdminBookingsPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--brand-text)" }}
        >
          Bookings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
          Bookings overview will be available once the bookings module is built
          on the backend.
        </p>
      </div>
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <BookOpen
          size={32}
          style={{ color: "var(--brand-muted)" }}
          className="mb-3"
        />
        <p className="font-medium" style={{ color: "var(--brand-text)" }}>
          Coming soon
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
          Backend module needed: Bookings
        </p>
      </div>
    </div>
  );
}
