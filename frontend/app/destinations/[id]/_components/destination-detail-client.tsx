"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useStore } from "@/lib/store";
import { Star, Loader2, Send } from "lucide-react";

type Props = {
  destination: {
    id: string;
    name: string;
    country: string;
    description?: string;
    images: string[];
    tags: string[];
    avgRating: number | null;
    _count: { hotels: number; reviews: number; packages: number };
    reviews: unknown[];
  };
};

export default function DestinationDetailClient({ destination }: Props) {
  // Select primitives individually — never select an object inline
  const setDestinationDetail = useStore((s) => s.setDestinationDetail);
  const profile = useStore((s) => s.profile);

  // Use a ref to seed the cache only once on mount
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setDestinationDetail(destination.id, {
      data: destination as never,
      cachedAt: Date.now(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!profile || profile.role !== "USER") return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const accessToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("lt_access="))
          ?.split("=")[1];

        if (!accessToken) throw new Error("Not authenticated");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/destinations/${destination.id}/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ rating, body }),
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
        setSuccess(true);
        setBody("");
        setRating(5);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "white", border: "0.5px solid #e8e2d8" }}
    >
      <h2
        className="text-base font-medium mb-4"
        style={{ color: "var(--brand-text)" }}
      >
        Write a review
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--brand-muted)" }}
          >
            Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)}>
                <Star
                  size={22}
                  fill={star <= rating ? "var(--brand-yellow)" : "transparent"}
                  style={{ color: "var(--brand-yellow)" }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--brand-muted)" }}
          >
            Your review
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience…"
            rows={3}
            className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
            style={{
              background: "var(--brand-ivory)",
              border: "0.5px solid #d6cebc",
              color: "var(--brand-text)",
            }}
          />
        </div>

        {error && (
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{ background: "#fee2e2", color: "#991b1b" }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{ background: "#dcfce7", color: "#166534" }}
          >
            Review submitted! Hit the refresh button to see it.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-5 rounded-xl text-sm font-medium flex items-center gap-2 w-fit disabled:opacity-60"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Submit review
        </button>
      </form>
    </div>
  );
}
