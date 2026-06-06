import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Hotel, Package, ArrowLeft } from "lucide-react";
import Navbar from "@/app/_components/navbar";
import { getSession } from "@/lib/session";
import DestinationDetailClient from "./_components/destination-detail-client";

type Destination = {
  id: string;
  name: string;
  country: string;
  description?: string;
  images: string[];
  tags: string[];
  avgRating: number | null;
  _count: { hotels: number; reviews: number; packages: number };
  reviews: {
    id: string;
    rating: number;
    body?: string;
    createdAt: string;
    user: { id: string; fullName: string; avatarUrl?: string };
  }[];
};

async function getDestination(id: string): Promise<Destination | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/destinations/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [destination, session] = await Promise.all([
    getDestination(id),
    getSession(),
  ]);

  if (!destination) notFound();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      {/* Hero images */}
      <div
        className="relative w-full"
        style={{ height: 380, background: "#d6cebc" }}
      >
        {destination.images?.[0] ? (
          <Image
            src={destination.images[0]}
            alt={destination.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button */}
        <Link
          href="/destinations"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.35)",
            color: "white",
            backdropFilter: "blur(8px)",
          }}
        >
          <ArrowLeft size={15} /> All destinations
        </Link>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {destination.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium"
                  style={{
                    background: "var(--brand-yellow)",
                    color: "var(--brand-green)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-semibold text-white">
              {destination.name}
            </h1>
            <p className="flex items-center gap-1.5 mt-2 text-white/80">
              <MapPin size={14} /> {destination.country}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Hotel, label: "Hotels", value: destination._count.hotels },
            {
              icon: Package,
              label: "Packages",
              value: destination._count.packages,
            },
            { icon: Star, label: "Reviews", value: destination._count.reviews },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-5 rounded-2xl"
              style={{ background: "white", border: "0.5px solid #e8e2d8" }}
            >
              <Icon size={20} style={{ color: "var(--brand-green)" }} />
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--brand-text)" }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Description */}
        {destination.description && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-base font-medium mb-3"
              style={{ color: "var(--brand-text)" }}
            >
              About {destination.name}
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--brand-muted)" }}
            >
              {destination.description}
            </p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-medium"
              style={{ color: "var(--brand-text)" }}
            >
              Reviews{" "}
              {destination._count.reviews > 0 &&
                `(${destination._count.reviews})`}
            </h2>
            {destination.avgRating && (
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
                  {destination.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {destination.reviews.length === 0 ? (
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
                No reviews yet. Be the first!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {destination.reviews.map((review) => (
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

        {/* Client component handles review submission + Zustand cache seeding */}
        <DestinationDetailClient destination={destination} />
      </div>
    </div>
  );
}
