import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Coffee,
  ArrowRight,
  Hotel,
} from "lucide-react";

type Hotel = {
  id: string;
  name: string;
  rating: number | null;
  amenities: string[];
  startingFrom: string | null;
  destination: { id: string; name: string; country: string };
  rooms: { id: string; type: string; pricePerNight: string }[];
  _count: { reviews: number };
};

type ApiResponse = {
  data: Hotel[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

type Props = {
  search?: string;
  destinationId?: string;
  minRating?: string;
  amenities?: string;
  minPrice?: string;
  maxPrice?: string;
  cursor?: string;
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={12} />,
  pool: <Waves size={12} />,
  parking: <Car size={12} />,
  restaurant: <Utensils size={12} />,
  gym: <Dumbbell size={12} />,
  breakfast: <Coffee size={12} />,
};

async function getHotels(params: Props): Promise<ApiResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.destinationId) query.set("destinationId", params.destinationId);
  if (params.minRating) query.set("minRating", params.minRating);
  if (params.amenities) query.set("amenities", params.amenities);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.cursor) query.set("cursor", params.cursor);
  query.set("limit", "12");

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/hotels?${query.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { data: [], nextCursor: null, hasNextPage: false };
    return res.json();
  } catch {
    return { data: [], nextCursor: null, hasNextPage: false };
  }
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <Star
        size={12}
        fill="var(--brand-yellow)"
        style={{ color: "var(--brand-yellow)" }}
      />
      <span
        className="text-xs font-medium"
        style={{ color: "var(--brand-text)" }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const price = hotel.startingFrom ?? hotel.rooms?.[0]?.pricePerNight ?? null;

  return (
    <Link
      href={`/hotels/${hotel.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      {/* Image placeholder — hotels don't have images yet */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          height: 160,
          background:
            "linear-gradient(135deg, var(--brand-green) 0%, #006630 100%)",
        }}
      >
        <Hotel size={36} style={{ color: "rgba(255,255,255,0.3)" }} />
        {hotel.rating && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            <Star
              size={11}
              fill="var(--brand-yellow)"
              style={{ color: "var(--brand-yellow)" }}
            />
            <span className="text-xs text-white font-medium">
              {hotel.rating}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div>
          <h3
            className="font-medium text-sm leading-snug line-clamp-1 mb-1"
            style={{ color: "var(--brand-text)" }}
          >
            {hotel.name}
          </h3>
          <p
            className="text-xs flex items-center gap-1"
            style={{ color: "var(--brand-muted)" }}
          >
            <MapPin size={11} />
            {hotel.destination.name}, {hotel.destination.country}
          </p>
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize"
                style={{
                  background: "var(--brand-ivory)",
                  color: "var(--brand-muted)",
                }}
              >
                {AMENITY_ICONS[a] ?? null}
                {a}
              </span>
            ))}
            {hotel.amenities.length > 4 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: "var(--brand-ivory)",
                  color: "var(--brand-muted)",
                }}
              >
                +{hotel.amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-auto pt-2"
          style={{ borderTop: "0.5px solid #f0ece4" }}
        >
          <div>
            {price ? (
              <>
                <span
                  className="text-xs"
                  style={{ color: "var(--brand-muted)" }}
                >
                  from{" "}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--brand-green)" }}
                >
                  ₹{Number(price).toLocaleString("en-IN")}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--brand-muted)" }}
                >
                  /night
                </span>
              </>
            ) : (
              <span className="text-xs" style={{ color: "var(--brand-muted)" }}>
                Price on request
              </span>
            )}
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
        <Hotel size={24} style={{ color: "var(--brand-muted)" }} />
      </div>
      <h3 className="font-medium mb-1" style={{ color: "var(--brand-text)" }}>
        No hotels found
      </h3>
      <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
        Try adjusting your filters
      </p>
    </div>
  );
}

export default async function HotelGrid(props: Props) {
  const { data, nextCursor, hasNextPage } = await getHotels(props);

  if (data.length === 0) return <EmptyState />;

  const nextParams = new URLSearchParams();
  if (props.search) nextParams.set("search", props.search);
  if (props.destinationId) nextParams.set("destinationId", props.destinationId);
  if (props.minRating) nextParams.set("minRating", props.minRating);
  if (props.amenities) nextParams.set("amenities", props.amenities);
  if (props.minPrice) nextParams.set("minPrice", props.minPrice);
  if (props.maxPrice) nextParams.set("maxPrice", props.maxPrice);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
        {data.length} hotel{data.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((h) => (
          <HotelCard key={h.id} hotel={h} />
        ))}
      </div>

      {hasNextPage && nextCursor && (
        <Link
          href={`/hotels?${nextParams.toString()}`}
          className="flex items-center justify-center h-11 rounded-xl text-sm font-medium"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          Load more
        </Link>
      )}
    </div>
  );
}
