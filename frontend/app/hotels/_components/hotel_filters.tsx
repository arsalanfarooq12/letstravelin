"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, Star } from "lucide-react";

const AMENITIES = [
  "wifi",
  "pool",
  "spa",
  "restaurant",
  "parking",
  "breakfast",
  "roomservice",
  "gym",
];

export default function HotelFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      params.delete("cursor");
      return params.toString();
    },
    [searchParams]
  );

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ search: search || null })}`
      );
    });
  }

  function handleRating(rating: string) {
    const current = searchParams.get("minRating");
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          minRating: current === rating ? null : rating,
        })}`
      );
    });
  }

  function handleAmenity(amenity: string) {
    const current = searchParams.get("amenities")?.split(",") ?? [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          amenities: next.length ? next.join(",") : null,
        })}`
      );
    });
  }

  function handlePrice(key: "minPrice" | "maxPrice", value: string) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value || null })}`);
    });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  const activeRating = searchParams.get("minRating");
  const activeAmenities = searchParams.get("amenities")?.split(",") ?? [];
  const hasFilters = !!(
    searchParams.get("search") ||
    activeRating ||
    searchParams.get("amenities") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice")
  );

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5 sticky top-6"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-medium"
          style={{ color: "var(--brand-text)" }}
        >
          Filters
        </h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--brand-green)" }}
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Search
        </label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-lg px-3 h-9"
            style={{
              background: "var(--brand-ivory)",
              border: "0.5px solid #d6cebc",
            }}
          >
            <Search size={13} style={{ color: "var(--brand-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hotel name…"
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: "var(--brand-text)" }}
            />
          </div>
          <button
            type="submit"
            className="h-9 px-3 rounded-lg text-xs font-medium"
            style={{ background: "var(--brand-green)", color: "white" }}
          >
            Go
          </button>
        </form>
      </div>

      {/* Min Rating */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Min Rating
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {["3", "4", "4.5"].map((r) => (
            <button
              key={r}
              onClick={() => handleRating(r)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all"
              style={{
                background:
                  activeRating === r
                    ? "var(--brand-green)"
                    : "var(--brand-ivory)",
                color: activeRating === r ? "white" : "var(--brand-muted)",
                border: `0.5px solid ${
                  activeRating === r ? "var(--brand-green)" : "#d6cebc"
                }`,
              }}
            >
              <Star
                size={10}
                fill={activeRating === r ? "white" : "transparent"}
              />
              {r}+
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Price per night (₹)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => handlePrice("minPrice", e.target.value)}
            className="flex-1 h-9 rounded-lg px-3 text-xs outline-none"
            style={{
              background: "var(--brand-ivory)",
              border: "0.5px solid #d6cebc",
              color: "var(--brand-text)",
            }}
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => handlePrice("maxPrice", e.target.value)}
            className="flex-1 h-9 rounded-lg px-3 text-xs outline-none"
            style={{
              background: "var(--brand-ivory)",
              border: "0.5px solid #d6cebc",
              color: "var(--brand-text)",
            }}
          />
        </div>
      </div>

      {/* Amenities */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Amenities
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => (
            <button
              key={a}
              onClick={() => handleAmenity(a)}
              className="px-3 py-1 rounded-full text-xs capitalize transition-all"
              style={{
                background: activeAmenities.includes(a)
                  ? "var(--brand-green)"
                  : "var(--brand-ivory)",
                color: activeAmenities.includes(a)
                  ? "white"
                  : "var(--brand-muted)",
                border: `0.5px solid ${
                  activeAmenities.includes(a) ? "var(--brand-green)" : "#d6cebc"
                }`,
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <p
          className="text-xs text-center"
          style={{ color: "var(--brand-muted)" }}
        >
          Updating…
        </p>
      )}
    </div>
  );
}
