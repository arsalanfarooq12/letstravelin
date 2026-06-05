import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Shield, Clock, Star, ArrowRight, Phone } from "lucide-react";
import Navbar from "./_components/navbar";
import HeroSearch from "./_components/hero-search";
import { getSession } from "@/lib/session";

// ─── Data fetching ────────────────────────────────────────────────

type Destination = {
  id: string;
  name: string;
  country: string;
  images: string[];
  tags: string[];
  description?: string;
};

async function getFeaturedDestinations(): Promise<Destination[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/destinations?limit=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.destinations ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

// ─── Sub-components ───────────────────────────────────────────────

function DestinationCard({ destination }: { destination: Destination }) {
  const image = destination.images?.[0];

  return (
    <Link
      href={`/destinations/${destination.id}`}
      className="group rounded-2xl overflow-hidden relative block aspect-[4/3]"
      style={{ background: "#d6cebc" }}
    >
      {image ? (
        <Image
          src={image}
          alt={destination.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {destination.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{
                background: "var(--brand-yellow)",
                color: "var(--brand-green)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-white font-medium text-lg leading-tight">
          {destination.name}
        </h3>
        <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
          <MapPin size={12} />
          {destination.country}
        </p>
      </div>
    </Link>
  );
}

function DestinationCardSkeleton() {
  return (
    <div
      className="rounded-2xl aspect-[4/3] animate-pulse"
      style={{ background: "#e2ddd5" }}
    />
  );
}

async function FeaturedDestinations() {
  const destinations = await getFeaturedDestinations();

  if (destinations.length === 0) {
    return (
      <p
        className="text-center col-span-3 py-8"
        style={{ color: "var(--brand-muted)" }}
      >
        No destinations found. Add some from the admin panel.
      </p>
    );
  }

  return (
    <>
      {destinations.map((d) => (
        <DestinationCard key={d.id} destination={d} />
      ))}
    </>
  );
}

const FEATURES = [
  {
    icon: Shield,
    title: "Safe & Trusted",
    body: "Every destination and hotel is verified by our team before listing.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    body: "Our travel experts are available round the clock to help you.",
  },
  {
    icon: Star,
    title: "Best Price",
    body: "We guarantee the best prices on hotels, transport, and packages.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    body: "Curated by local travel agents who know every destination inside out.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    body: "Booked a Goa package through letstravelin and it was flawless. The hotel was exactly as described and the transport was on time.",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    location: "Delhi",
    body: "Found an amazing hill station retreat at a price I could not believe. The team was super helpful throughout.",
    rating: 5,
  },
  {
    name: "Ananya Krishnan",
    location: "Bangalore",
    body: "I have used many travel apps but letstravelin feels genuinely local. They know exactly what Indian travellers need.",
    rating: 5,
  },
];

// ─── Page ─────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await getSession();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center px-6 py-28 text-center overflow-hidden"
        style={{ background: "var(--brand-green)", minHeight: "520px" }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "var(--brand-yellow)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full opacity-10"
          style={{ background: "var(--brand-yellow)" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 w-full">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,204,0,0.15)",
              color: "var(--brand-yellow)",
            }}
          >
            🇮🇳 India&apos;s favourite travel companion
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight max-w-3xl">
            Explore India,{" "}
            <span style={{ color: "var(--brand-yellow)" }}>your way</span>
          </h1>

          <p className="text-lg max-w-xl" style={{ color: "#a8dfc4" }}>
            From the beaches of Goa to the peaks of Ladakh — discover, book, and
            travel with confidence.
          </p>

          <HeroSearch />
        </div>
      </section>

      {/* ── Featured Destinations ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--brand-green)" }}
            >
              Popular right now
            </p>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--brand-text)" }}
            >
              Top Destinations
            </h2>
          </div>
          <Link
            href="/destinations"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--brand-green)" }}
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Suspense
            fallback={
              <>
                {[...Array(6)].map((_, i) => (
                  <DestinationCardSkeleton key={i} />
                ))}
              </>
            }
          >
            <FeaturedDestinations />
          </Suspense>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="px-6 py-16" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--brand-green)" }}
            >
              Why choose us
            </p>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--brand-text)" }}
            >
              Travel with confidence
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 p-6 rounded-2xl"
                style={{ background: "var(--brand-ivory)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--brand-green)" }}
                >
                  <Icon size={18} color="white" />
                </div>
                <h3
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--brand-green)" }}
          >
            Traveller stories
          </p>
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--brand-text)" }}
          >
            What our customers say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, location, body, rating }) => (
            <div
              key={name}
              className="flex flex-col gap-4 p-6 rounded-2xl border"
              style={{ background: "white", borderColor: "#e8e2d8" }}
            >
              <div className="flex gap-0.5">
                {[...Array(rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="var(--brand-yellow)"
                    style={{ color: "var(--brand-yellow)" }}
                  />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "var(--brand-muted)" }}
              >
                &ldquo;{body}&rdquo;
              </p>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {name}
                </p>
                <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                  {location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-6 py-20 text-center"
        style={{ background: "var(--brand-green)" }}
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl font-semibold text-white leading-tight">
            Ready to plan your next trip?
          </h2>
          <p style={{ color: "#a8dfc4" }}>
            Join thousands of Indian travellers who trust letstravelin for their
            journeys.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {session ? (
              <Link
                href="/destinations"
                className="h-12 px-8 rounded-xl text-sm font-medium flex items-center gap-2"
                style={{
                  background: "var(--brand-yellow)",
                  color: "var(--brand-green)",
                }}
              >
                Browse destinations <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="h-12 px-8 rounded-xl text-sm font-medium flex items-center gap-2"
                  style={{
                    background: "var(--brand-yellow)",
                    color: "var(--brand-green)",
                  }}
                >
                  Get started free <ArrowRight size={16} />
                </Link>
                <Link
                  href="/destinations"
                  className="h-12 px-8 rounded-xl text-sm font-medium border flex items-center"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "white",
                  }}
                >
                  Explore destinations
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
        style={{ background: "#006630", color: "#a8dfc4" }}
      >
        <span>
          © {new Date().getFullYear()} letstravelin. All rights reserved.
        </span>
        <div className="flex items-center gap-1.5">
          <Phone size={12} />
          <span>support@letstravelin.in</span>
        </div>
      </footer>
    </div>
  );
}
