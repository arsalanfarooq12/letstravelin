import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/session";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import DeleteDestinationButton from "./_components/delete-button";

type Destination = {
  id: string;
  name: string;
  country: string;
  images: string[];
  tags: string[];
  _count?: { hotels: number; reviews: number };
};

async function getDestinations(token: string): Promise<Destination[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/destinations?limit=50`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function AdminDestinationsPage() {
  const session = await requireSession();
  const destinations = await getDestinations(session.accessToken);
  const isAdmin = session.profile.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--brand-text)" }}
          >
            Destinations
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
            {destinations.length} destination
            {destinations.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          <Plus size={15} /> Add destination
        </Link>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        {destinations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin
              size={32}
              style={{ color: "var(--brand-muted)" }}
              className="mb-3"
            />
            <p className="font-medium" style={{ color: "var(--brand-text)" }}>
              No destinations yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
              Add your first destination to get started
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "0.5px solid #e8e2d8" }}>
                {["Destination", "Country", "Tags", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d.id} style={{ borderBottom: "0.5px solid #f0ece4" }}>
                  {/* Name + image */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ background: "#d6cebc" }}
                      >
                        {d.images?.[0] && (
                          <Image
                            src={d.images[0]}
                            alt={d.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        )}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {d.name}
                      </span>
                    </div>
                  </td>

                  {/* Country */}
                  <td
                    className="px-5 py-3 text-sm"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {d.country}
                  </td>

                  {/* Tags */}
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: "var(--brand-ivory)",
                            color: "var(--brand-green)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/destinations/${d.id}/edit`}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                          background: "var(--brand-ivory)",
                          color: "var(--brand-green)",
                          border: "0.5px solid #c8d8ce",
                        }}
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      {isAdmin && (
                        <DeleteDestinationButton
                          id={d.id}
                          token={session.accessToken}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
