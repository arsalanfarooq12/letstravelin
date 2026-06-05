"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

const TAGS = [
  "beach",
  "mountains",
  "heritage",
  "adventure",
  "wildlife",
  "pilgrimage",
  "citybreak",
  "nature",
];

const COUNTRIES = ["India", "Nepal", "Bhutan", "Sri Lanka", "Maldives"];

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // Reset cursor on any filter change
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

  function handleTag(tag: string) {
    const current = searchParams.get("tags");
    const next = current === tag ? null : tag;
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ tags: next })}`);
    });
  }

  function handleCountry(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({ country: e.target.value || null })}`
      );
    });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push(pathname));
  }

  const activeTag = searchParams.get("tags");
  const activeCountry = searchParams.get("country");
  const hasFilters = !!(
    searchParams.get("search") ||
    activeTag ||
    activeCountry
  );

  return (
    <div
      className="  rounded-2xl p-5 flex flex-col gap-5 sticky top-6"
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
              placeholder="Search…"
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

      {/* Country */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Country
        </label>
        <select
          value={activeCountry ?? ""}
          onChange={handleCountry}
          className="h-9 rounded-lg px-3 text-xs outline-none"
          style={{
            background: "var(--brand-ivory)",
            border: "0.5px solid #d6cebc",
            color: "var(--brand-text)",
          }}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTag(tag)}
              className="px-3 py-1 rounded-full text-xs capitalize transition-all"
              style={{
                background:
                  activeTag === tag
                    ? "var(--brand-green)"
                    : "var(--brand-ivory)",
                color: activeTag === tag ? "white" : "var(--brand-muted)",
                border: `0.5px solid ${
                  activeTag === tag ? "var(--brand-green)" : "#d6cebc"
                }`,
              }}
            >
              {tag}
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
