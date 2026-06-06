import { requireSession } from "@/lib/session";
import { notFound } from "next/navigation";
import DestinationForm from "../../_components/destination-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

async function getDestination(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/destinations/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const destination = await getDestination(id);

  if (!destination) notFound();

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
          Edit — {destination.name}
        </h1>
      </div>
      <div
        className="rounded-2xl p-6"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <DestinationForm
          initial={{
            name: destination.name,
            country: destination.country,
            description: destination.description ?? "",
            images: destination.images ?? [""],
            tags: destination.tags ?? [],
          }}
          destinationId={id}
          accessToken={session.accessToken}
        />
      </div>
    </div>
  );
}
