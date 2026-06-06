"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Loader2 } from "lucide-react";
import { revalidateDestinations } from "@/lib/actions";
type FormData = {
  name: string;
  country: string;
  description: string;
  images: string[];
  tags: string[];
};

type Props = {
  initial?: FormData;
  destinationId?: string;
  accessToken: string;
};

const FIELD_STYLE = {
  background: "var(--brand-ivory)",
  border: "0.5px solid #d6cebc",
  color: "var(--brand-text)",
};

export default function DestinationForm({
  initial,
  destinationId,
  accessToken,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? [""]);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const isEdit = !!destinationId;

  function addImage() {
    setImages((prev) => [...prev, ""]);
  }

  function updateImage(index: number, value: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? value : img)));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      country,
      description,
      images: images.filter(Boolean),
      tags,
    };

    startTransition(async () => {
      try {
        const url = isEdit
          ? `${process.env.NEXT_PUBLIC_API_URL}/destinations/${destinationId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/destinations`;

        const res = await fetch(url, {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        await revalidateDestinations();
        router.push("/admin/destinations");
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Destination name <span style={{ color: "#e53e3e" }}>*</span>
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={FIELD_STYLE}
        />
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Country <span style={{ color: "#e53e3e" }}>*</span>
        </label>
        <input
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. India"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={FIELD_STYLE}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write a short description…"
          rows={4}
          className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
          style={FIELD_STYLE}
        />
      </div>

      {/* Images */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Image URLs
        </label>
        {images.map((img, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={img}
              onChange={(e) => updateImage(i, e.target.value)}
              placeholder="https://…"
              className="flex-1 h-10 rounded-lg px-3 text-sm outline-none"
              style={FIELD_STYLE}
            />
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addImage}
          className="flex items-center gap-1.5 text-xs font-medium w-fit px-3 py-1.5 rounded-lg"
          style={{
            background: "var(--brand-ivory)",
            color: "var(--brand-green)",
            border: "0.5px solid #c8d8ce",
          }}
        >
          <Plus size={12} /> Add image
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--brand-muted)" }}
        >
          Tags{" "}
          <span className="font-normal">(press Enter or comma to add)</span>
        </label>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: "var(--brand-green)", color: "white" }}
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="beach, adventure, heritage…"
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={FIELD_STYLE}
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-6 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-60"
          style={{ background: "var(--brand-green)", color: "white" }}
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Create destination"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/destinations")}
          className="h-10 px-6 rounded-xl text-sm font-medium"
          style={{
            background: "var(--brand-ivory)",
            color: "var(--brand-muted)",
            border: "0.5px solid #d6cebc",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
