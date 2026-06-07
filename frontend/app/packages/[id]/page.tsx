import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ArrowLeft,
  Package,
  BedDouble,
  Plane,
  Train,
  Bus,
  Ship,
  Star,
  Users,
} from "lucide-react";
import Navbar from "@/app/_components/navbar";
import { getSession } from "@/lib/session";

type PackageItem = {
  id: string;
  itemType: "HOTEL" | "TRANSPORT";
  hotel?: { id: string; name: string } | null;
  transport?: { id: string; type: string; schedule: string } | null;
};

type PackageDetail = {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  price: string;
  destination: {
    id: string;
    name: string;
    country: string;
    images: string[];
    description?: string;
  };
  creator: { id: string; fullName: string; avatarUrl?: string | null };
  packageItems: PackageItem[];
  _count: { bookings: number };
};

const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  FLIGHT: <Plane size={15} />,
  TRAIN: <Train size={15} />,
  BUS: <Bus size={15} />,
  FERRY: <Ship size={15} />,
};

async function getPackage(id: string): Promise<PackageDetail | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/packages/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, session] = await Promise.all([getPackage(id), getSession()]);
  if (!pkg) notFound();

  const image = pkg.destination.images?.[0];
  const hotelItems = pkg.packageItems.filter((i) => i.itemType === "HOTEL");
  const transportItems = pkg.packageItems.filter(
    (i) => i.itemType === "TRANSPORT"
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      {/* Hero */}
      <div
        className="relative w-full flex items-end"
        style={{ height: 360, background: "#d6cebc" }}
      >
        {image ? (
          <Image
            src={image}
            alt={pkg.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-green) 0%, #006630 100%)",
            }}
          >
            <Package size={80} style={{ color: "rgba(255,255,255,0.1)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Link
          href="/packages"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
          style={{
            background: "rgba(0,0,0,0.35)",
            color: "white",
            backdropFilter: "blur(8px)",
          }}
        >
          <ArrowLeft size={15} /> All packages
        </Link>

        <div className="relative px-8 pb-8 max-w-5xl mx-auto w-full">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              background: "var(--brand-yellow)",
              color: "var(--brand-green)",
            }}
          >
            <Clock size={11} /> {pkg.durationDays} days
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2">
            {pkg.title}
          </h1>
          <p className="flex items-center gap-1.5 text-white/80 text-sm">
            <MapPin size={14} /> {pkg.destination.name},{" "}
            {pkg.destination.country}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left — main content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: Clock,
                label: "Duration",
                value: `${pkg.durationDays} days`,
              },
              {
                icon: Users,
                label: "Bookings",
                value: pkg._count.bookings.toString(),
              },
              {
                icon: Package,
                label: "Items",
                value: pkg.packageItems.length.toString(),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 py-4 rounded-2xl"
                style={{ background: "white", border: "0.5px solid #e8e2d8" }}
              >
                <Icon size={18} style={{ color: "var(--brand-green)" }} />
                <p
                  className="text-lg font-semibold"
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
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <h2
              className="text-base font-medium mb-3"
              style={{ color: "var(--brand-text)" }}
            >
              About this package
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--brand-muted)" }}
            >
              {pkg.description}
            </p>
          </div>

          {/* Package items */}
          {pkg.packageItems.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "white", border: "0.5px solid #e8e2d8" }}
            >
              <h2
                className="text-base font-medium mb-4"
                style={{ color: "var(--brand-text)" }}
              >
                What&apos;s included
              </h2>
              <div className="flex flex-col gap-3">
                {hotelItems.length > 0 && (
                  <div>
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      HOTELS
                    </p>
                    {hotelItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1"
                        style={{ background: "var(--brand-ivory)" }}
                      >
                        <BedDouble
                          size={15}
                          style={{ color: "var(--brand-green)" }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--brand-text)" }}
                        >
                          {item.hotel?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {transportItems.length > 0 && (
                  <div>
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--brand-muted)" }}
                    >
                      TRANSPORT
                    </p>
                    {transportItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1"
                        style={{ background: "var(--brand-ivory)" }}
                      >
                        <span style={{ color: "var(--brand-green)" }}>
                          {TRANSPORT_ICONS[item.transport?.type ?? ""] ?? (
                            <Plane size={15} />
                          )}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "var(--brand-text)" }}
                        >
                          {item.transport?.type} ·{" "}
                          {item.transport?.schedule
                            ? new Date(
                                item.transport.schedule
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About destination */}
          {pkg.destination.description && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "white", border: "0.5px solid #e8e2d8" }}
            >
              <h2
                className="text-base font-medium mb-3"
                style={{ color: "var(--brand-text)" }}
              >
                About {pkg.destination.name}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--brand-muted)" }}
              >
                {pkg.destination.description}
              </p>
              <Link
                href={`/destinations/${pkg.destination.id}`}
                className="flex items-center gap-1.5 text-xs font-medium mt-3 w-fit"
                style={{ color: "var(--brand-green)" }}
              >
                <MapPin size={12} /> View destination
              </Link>
            </div>
          )}
        </div>

        {/* Right — booking card */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 sticky top-6"
            style={{ background: "white", border: "0.5px solid #e8e2d8" }}
          >
            <div>
              <p
                className="text-xs mb-1"
                style={{ color: "var(--brand-muted)" }}
              >
                Price per person
              </p>
              <p
                className="text-3xl font-semibold"
                style={{ color: "var(--brand-green)" }}
              >
                ₹{Number(pkg.price).toLocaleString("en-IN")}
              </p>
            </div>

            <div
              className="flex flex-col gap-2 text-sm"
              style={{ borderTop: "0.5px solid #f0ece4", paddingTop: 12 }}
            >
              <div className="flex justify-between">
                <span style={{ color: "var(--brand-muted)" }}>Duration</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {pkg.durationDays} days
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--brand-muted)" }}>Destination</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {pkg.destination.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--brand-muted)" }}>Created by</span>
                <span
                  className="font-medium"
                  style={{ color: "var(--brand-text)" }}
                >
                  {pkg.creator.fullName}
                </span>
              </div>
            </div>

            {session?.profile.role === "USER" ? (
              <Link
                href={`/bookings/new?type=PACKAGE&id=${pkg.id}`}
                className="flex items-center justify-center h-11 rounded-xl text-sm font-medium"
                style={{ background: "var(--brand-green)", color: "white" }}
              >
                Book this package
              </Link>
            ) : !session ? (
              <Link
                href={`/login?from=/packages/${pkg.id}`}
                className="flex items-center justify-center h-11 rounded-xl text-sm font-medium"
                style={{ background: "var(--brand-green)", color: "white" }}
              >
                Sign in to book
              </Link>
            ) : (
              <div
                className="flex items-center justify-center h-11 rounded-xl text-sm"
                style={{
                  background: "var(--brand-ivory)",
                  color: "var(--brand-muted)",
                }}
              >
                Booking for users only
              </div>
            )}

            <p
              className="text-xs text-center"
              style={{ color: "var(--brand-muted)" }}
            >
              Payment collected by our team after confirmation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
