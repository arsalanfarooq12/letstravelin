"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

export default function PackageFilters() {
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ search: search || null })}`
      );
    });
  }

  function handlePrice(key: "minPrice" | "maxPrice", value: string) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value || null })}`);
    });
  }

  function handleDays(key: "minDays" | "maxDays", value: string) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value || null })}`);
    });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  const hasFilters = !!(
    searchParams.get("search") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice") ||
    searchParams.get("minDays") ||
    searchParams.get("maxDays")
  );

  return (
    <div
      className="rounded-2xl p-4 w-full"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5 lg:w-52">
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
                placeholder="Package name…"
                className="flex-1 text-xs outline-none bg-transparent"
                style={{ color: "var(--brand-text)" }}
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3 rounded-lg text-xs font-medium flex-shrink-0"
              style={{ background: "var(--brand-green)", color: "white" }}
            >
              Go
            </button>
          </form>
        </div>

        {/* Price range */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--brand-muted)" }}
          >
            Price (₹)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={searchParams.get("minPrice") ?? ""}
              onBlur={(e) => handlePrice("minPrice", e.target.value)}
              className="w-24 h-9 rounded-lg px-3 text-xs outline-none"
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
              className="w-24 h-9 rounded-lg px-3 text-xs outline-none"
              style={{
                background: "var(--brand-ivory)",
                border: "0.5px solid #d6cebc",
                color: "var(--brand-text)",
              }}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--brand-muted)" }}
          >
            Duration (days)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={searchParams.get("minDays") ?? ""}
              onBlur={(e) => handleDays("minDays", e.target.value)}
              className="w-24 h-9 rounded-lg px-3 text-xs outline-none"
              style={{
                background: "var(--brand-ivory)",
                border: "0.5px solid #d6cebc",
                color: "var(--brand-text)",
              }}
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={searchParams.get("maxDays") ?? ""}
              onBlur={(e) => handleDays("maxDays", e.target.value)}
              className="w-24 h-9 rounded-lg px-3 text-xs outline-none"
              style={{
                background: "var(--brand-ivory)",
                border: "0.5px solid #d6cebc",
                color: "var(--brand-text)",
              }}
            />
          </div>
        </div>

        {/* Clear */}
        <div className="flex items-center gap-3 lg:flex-shrink-0">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs h-9 px-3 rounded-lg"
              style={{
                background: "var(--brand-ivory)",
                color: "var(--brand-green)",
                border: "0.5px solid #c8d8ce",
              }}
            >
              <X size={12} /> Clear
            </button>
          )}
          {isPending && (
            <span className="text-xs" style={{ color: "var(--brand-muted)" }}>
              Updating…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
