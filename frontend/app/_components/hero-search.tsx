"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const POPULAR_TAGS = [
  "beach",
  "mountains",
  "heritage",
  "adventure",
  "wildlife",
  "pilgrimage",
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (selectedTag) params.set("tags", selectedTag);
    router.push(`/destinations?${params.toString()}`);
  }

  function handleTagClick(tag: string) {
    const next = selectedTag === tag ? null : tag;
    setSelectedTag(next);
    const params = new URLSearchParams();
    if (next) params.set("tags", next);
    router.push(`/destinations?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 h-14 shadow-lg">
          <Search
            size={18}
            style={{ color: "var(--brand-muted)" }}
            className="flex-shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, cities, countries…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--brand-text)" }}
          />
        </div>
        <button
          type="submit"
          className="h-14 px-6 rounded-xl text-sm font-medium flex-shrink-0"
          style={{
            background: "var(--brand-yellow)",
            color: "var(--brand-green)",
          }}
        >
          Search
        </button>
      </form>

      {/* Popular tags */}
      <div className="flex flex-wrap gap-2 justify-center">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
            style={{
              background:
                selectedTag === tag
                  ? "var(--brand-yellow)"
                  : "rgba(255,255,255,0.2)",
              color: selectedTag === tag ? "var(--brand-green)" : "#fff",
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
