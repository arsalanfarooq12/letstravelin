import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ArrowRight, Package } from "lucide-react";

type PackageItem = {
  id: string;
  itemType: "HOTEL" | "TRANSPORT";
  hotel?: { id: string; name: string } | null;
  transport?: { id: string; type: string } | null;
};

type Package = {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  price: string;
  destination: { id: string; name: string; country: string; images?: string[] };
  creator: { id: string; fullName: string };
  packageItems: PackageItem[];
  _count: { bookings: number };
};

type ApiResponse = {
  data: Package[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

type Props = {
  search?: string;
  destinationId?: string;
  minPrice?: string;
  maxPrice?: string;
  minDays?: string;
  maxDays?: string;
  cursor?: string;
};

async function getPackages(params: Props): Promise<ApiResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.destinationId) query.set("destinationId", params.destinationId);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.minDays) query.set("minDays", params.minDays);
  if (params.maxDays) query.set("maxDays", params.maxDays);
  if (params.cursor) query.set("cursor", params.cursor);
  query.set("limit", "12");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/packages?${query.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { data: [], nextCursor: null, hasNextPage: false };
    return res.json();
  } catch {
    return { data: [], nextCursor: null, hasNextPage: false };
  }
}

function PackageCard({ pkg }: { pkg: Package }) {
  const image = pkg.destination.images?.[0];

  return (
    <Link
      href={`/packages/${pkg.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      {/* Image */}
      <div
        className="relative w-full"
        style={{ height: 180, background: "#d6cebc" }}
      >
        {image ? (
          <Image
            src={image}
            alt={pkg.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-green) 0%, #006630 100%)",
            }}
          >
            <Package size={36} style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Duration badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: "var(--brand-yellow)",
            color: "var(--brand-green)",
          }}
        >
          <Clock size={10} />
          {pkg.durationDays} days
        </div>

        {/* Destination */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-medium text-sm">
            {pkg.destination.name}
          </p>
          <p className="text-white/70 text-xs flex items-center gap-1">
            <MapPin size={10} /> {pkg.destination.country}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3
          className="font-medium text-sm leading-snug line-clamp-1"
          style={{ color: "var(--brand-text)" }}
        >
          {pkg.title}
        </h3>
        <p
          className="text-xs leading-relaxed line-clamp-2 flex-1"
          style={{ color: "var(--brand-muted)" }}
        >
          {pkg.description}
        </p>

        {/* Items count */}
        {pkg.packageItems.length > 0 && (
          <div className="flex gap-1.5">
            {pkg.packageItems.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: "var(--brand-ivory)",
                  color: "var(--brand-muted)",
                }}
              >
                {item.itemType === "HOTEL"
                  ? item.hotel?.name
                  : item.transport?.type}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2 mt-auto"
          style={{ borderTop: "0.5px solid #f0ece4" }}
        >
          <div>
            <p
              className="text-base font-semibold"
              style={{ color: "var(--brand-green)" }}
            >
              ₹{Number(pkg.price).toLocaleString("en-IN")}
            </p>
            <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
              per person
            </p>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "var(--brand-green)" }}
          >
            View <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--brand-ivory)" }}
      >
        <Package size={24} style={{ color: "var(--brand-muted)" }} />
      </div>
      <h3 className="font-medium mb-1" style={{ color: "var(--brand-text)" }}>
        No packages found
      </h3>
      <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
        Try adjusting your filters
      </p>
    </div>
  );
}

export default async function PackageGrid(props: Props) {
  const { data, nextCursor, hasNextPage } = await getPackages(props);

  if (data.length === 0) return <EmptyState />;

  const nextParams = new URLSearchParams();
  if (props.search) nextParams.set("search", props.search);
  if (props.destinationId) nextParams.set("destinationId", props.destinationId);
  if (props.minPrice) nextParams.set("minPrice", props.minPrice);
  if (props.maxPrice) nextParams.set("maxPrice", props.maxPrice);
  if (props.minDays) nextParams.set("minDays", props.minDays);
  if (props.maxDays) nextParams.set("maxDays", props.maxDays);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
        {data.length} package{data.length !== 1 ? "s" : ""} found
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>
      {hasNextPage && nextCursor && (
        <Link
          href={`/packages?${nextParams.toString()}`}
          className="flex items-center justify-center h-11 rounded-xl text-sm font-medium"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          Load more
        </Link>
      )}
    </div>
  );
}
