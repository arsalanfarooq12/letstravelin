import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Star,
  ArrowLeft,
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Coffee,
  Hotel,
  BedDouble,
} from "lucide-react";
import Navbar from "@/app/_components/navbar";
import { getSession } from "@/lib/session";

type Room = {
  id: string;
  type: string;
  capacity: number;
  pricePerNight: string;
  totalRooms: number;
};

type Review = {
  id: string;
  rating: number;
  body?: string;
  createdAt: string;
  user: { id: string; fullName: string };
};

type HotelDetail = {
  id: string;
  name: string;
  rating: number | null;
  amenities: string[];
  createdAt: string;
  destination: { id: string; name: string; country: string };
  rooms: Room[];
  reviews: Review[];
  _count: { reviews: number };
  avgRating: number | null;
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={15} />,
  pool: <Waves size={15} />,
  parking: <Car size={15} />,
  restaurant: <Utensils size={15} />,
  gym: <Dumbbell size={15} />,
  breakfast: <Coffee size={15} />,
};

async function getHotel(id: string): Promise<HotelDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hotels/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [hotel, session] = await Promise.all([getHotel(id), getSession()]);

  if (!hotel) notFound();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      {/* Hero */}
      <div
        className="relative w-full flex items-end"
        style={{
          height: 300,
          background:
            "linear-gradient(135deg, var(--brand-green) 0%, #006630 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Hotel size={80} style={{ color: "rgba(255,255,255,0.1)" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <Link
          href="/hotels"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.35)",
            color: "white",
            backdropFilter: "blur(8px)",
          }}
        >
          <ArrowLeft size={15} /> All hotels
        </Link>

        <div className="relative px-8 pb-8 max-w-5xl mx-auto w-full">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1">
                {hotel.name}
              </h1>
              <p className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin size={14} />
                {hotel.destination.name}, {hotel.destination.country}
              </p>
            </div>
            {hotel.rating && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Star
                  size={16}
                  fill="var(--brand-yellow)"
                  style={{ color: "var(--brand-yellow)" }}
                />
                <span className="text-white font-semibold">{hotel.rating}</span>
                <span className="text-white/60 text-sm">/ 5</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-base font-medium mb-4"
              style={{ color: "var(--brand-text)" }}
            >
              Amenities
            </h2>
            <div className="flex flex-wrap gap-3">
              {hotel.amenities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl capitalize text-sm"
                  style={{
                    background: "var(--brand-ivory)",
                    color: "var(--brand-text)",
                    border: "0.5px solid #e8e2d8",
                  }}
                >
                  <span style={{ color: "var(--brand-green)" }}>
                    {AMENITY_ICONS[a] ?? null}
                  </span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rooms */}
        <div>
          <h2
            className="text-base font-medium mb-4"
            style={{ color: "var(--brand-text)" }}
          >
            Rooms {hotel.rooms.length > 0 && `(${hotel.rooms.length})`}
          </h2>
          {hotel.rooms.length === 0 ? (
            <div
              className="rounded-2xl py-12 flex flex-col items-center"
              style={{ background: "white", border: "0.5px solid #e8e2d8" }}
            >
              <BedDouble
                size={28}
                style={{ color: "var(--brand-muted)" }}
                className="mb-2"
              />
              <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                No rooms listed yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "white", border: "0.5px solid #e8e2d8" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-medium text-sm"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {room.type}
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        Capacity: {room.capacity} guest
                        {room.capacity !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-base font-semibold"
                        style={{ color: "var(--brand-green)" }}
                      >
                        ₹{Number(room.pricePerNight).toLocaleString("en-IN")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        /night
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: "0.5px solid #f0ece4" }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      {room.totalRooms} room{room.totalRooms !== 1 ? "s" : ""}{" "}
                      available
                    </p>
                    <Link
                      href={`/destinations/${hotel.destination.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{
                        background: "var(--brand-green)",
                        color: "white",
                      }}
                    >
                      Book now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-medium"
              style={{ color: "var(--brand-text)" }}
            >
              Reviews {hotel._count.reviews > 0 && `(${hotel._count.reviews})`}
            </h2>
            {hotel.avgRating && (
              <div className="flex items-center gap-1.5">
                <Star
                  size={14}
                  fill="var(--brand-yellow)"
                  style={{ color: "var(--brand-yellow)" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {hotel.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {hotel.reviews.length === 0 ? (
            <div
              className="rounded-2xl py-12 flex flex-col items-center"
              style={{ background: "white", border: "0.5px solid #e8e2d8" }}
            >
              <Star
                size={28}
                style={{ color: "var(--brand-muted)" }}
                className="mb-2"
              />
              <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                No reviews yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 rounded-2xl flex flex-col gap-3"
                  style={{ background: "white", border: "0.5px solid #e8e2d8" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--brand-text)" }}
                      >
                        {review.user.fullName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={
                            i < review.rating
                              ? "var(--brand-yellow)"
                              : "transparent"
                          }
                          style={{ color: "var(--brand-yellow)" }}
                        />
                      ))}
                    </div>
                  </div>
                  {review.body && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      &ldquo;{review.body}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to destination */}
        <Link
          href={`/destinations/${hotel.destination.id}`}
          className="flex items-center gap-2 text-sm font-medium w-fit px-5 py-2.5 rounded-xl"
          style={{
            background: "var(--brand-ivory)",
            color: "var(--brand-green)",
            border: "0.5px solid #c8d8ce",
          }}
        >
          <MapPin size={14} /> View {hotel.destination.name} destination
        </Link>
      </div>
    </div>
  );
}
