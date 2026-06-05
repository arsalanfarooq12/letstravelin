import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

type Destination = {
  id: string;
  name: string;
  country: string;
  description?: string;
  images: string[];
  tags: string[];
};

type ApiResponse = {
  data: Destination[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

type Props = {
  search?: string;
  country?: string;
  tags?: string;
  cursor?: string;
};

async function getDestinations(params: Props): Promise<ApiResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.country) query.set("country", params.country);
  if (params.tags) query.set("tags", params.tags);
  if (params.cursor) query.set("cursor", params.cursor);
  query.set("limit", "10");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/destinations?${query.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { data: [], nextCursor: null, hasNextPage: false };
    return res.json();
  } catch {
    return { data: [], nextCursor: null, hasNextPage: false };
  }
}

function DestinationRow({ destination }: { destination: Destination }) {
  const image = destination.images?.[0];

  return (
    <Link
      href={`/destinations/${destination.id}`}
      className="group flex gap-5 p-4 rounded-2xl transition-all"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      {/* Image */}
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden"
        style={{ width: 160, height: 120, background: "#d6cebc" }}
      >
        {image ? (
          <Image
            src={image}
            alt={destination.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-green) 0%, #006630 100%)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 py-1 min-w-0">
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {destination.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: "var(--brand-ivory)",
                  color: "var(--brand-green)",
                  border: "0.5px solid #c8d8ce",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <h3
            className="font-medium text-base leading-snug mb-1 truncate"
            style={{ color: "var(--brand-text)" }}
          >
            {destination.name}
          </h3>
          <p
            className="text-xs flex items-center gap-1 mb-2"
            style={{ color: "var(--brand-muted)" }}
          >
            <MapPin size={11} /> {destination.country}
          </p>
          {destination.description && (
            <p
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: "var(--brand-muted)" }}
            >
              {destination.description}
            </p>
          )}
        </div>
        <div
          className="flex items-center gap-1 text-xs font-medium mt-2"
          style={{ color: "var(--brand-green)" }}
        >
          View destination <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--brand-ivory)" }}
      >
        <MapPin size={24} style={{ color: "var(--brand-muted)" }} />
      </div>
      <h3 className="font-medium mb-1" style={{ color: "var(--brand-text)" }}>
        No destinations found
      </h3>
      <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
        Try adjusting your filters or search term
      </p>
    </div>
  );
}

export default async function DestinationList({
  search,
  country,
  tags,
  cursor,
}: Props) {
  const { data, nextCursor, hasNextPage } = await getDestinations({
    search,
    country,
    tags,
    cursor,
  });

  if (data.length === 0) return <EmptyState />;

  const nextParams = new URLSearchParams();
  if (search) nextParams.set("search", search);
  if (country) nextParams.set("country", country);
  if (tags) nextParams.set("tags", tags);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs mb-2" style={{ color: "var(--brand-muted)" }}>
        {data.length} destination{data.length !== 1 ? "s" : ""} found
      </p>

      {data.map((d) => (
        <DestinationRow key={d.id} destination={d} />
      ))}

      {hasNextPage && nextCursor && (
        <Link
          href={`/destinations?${nextParams.toString()}`}
          className="flex items-center justify-center h-11 rounded-xl text-sm font-medium mt-2"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          Load more
        </Link>
      )}
    </div>
  );
}
