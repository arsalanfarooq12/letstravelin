import { requireSession } from "@/lib/session";
import DestinationForm from "../_components/destination-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewDestinationPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/destinations"
          className="flex items-center gap-1.5 text-xs mb-4"
          style={{ color: "var(--brand-muted)" }}
        >
          <ChevronLeft size={14} /> Back to destinations
        </Link>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--brand-text)" }}
        >
          Add destination
        </h1>
      </div>
      <div
        className="rounded-2xl p-6"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <DestinationForm accessToken={session.accessToken} />
      </div>
    </div>
  );
}
