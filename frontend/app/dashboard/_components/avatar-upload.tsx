"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Camera, Link, Loader2, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updateAvatarUrl } from "@/lib/avatar-actions";
import { useStore } from "@/lib/store";

type Props = {
  currentUrl: string | null;
  userId: string;
  fullName: string;
};

const FIELD_STYLE = {
  background: "var(--brand-ivory)",
  border: "0.5px solid #d6cebc",
  color: "var(--brand-text)",
};

export default function AvatarUpload({ currentUrl, userId, fullName }: Props) {
  const setProfile = useStore((s) => s.setProfile);
  const profile = useStore((s) => s.profile);

  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [urlInput, setUrlInput] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const ext = file.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`; // cache bust

        const result = await updateAvatarUrl(publicUrl);
        if (result.error) throw new Error(result.error);

        setPreview(publicUrl);
        if (profile) setProfile({ ...profile, fullName: profile.fullName });
        setSuccess(true);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateAvatarUrl(urlInput.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setPreview(urlInput.trim());
      setUrlInput("");
      setShowUrl(false);
      setSuccess(true);
    });
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-semibold flex-shrink-0"
          style={{
            background: preview ? undefined : "var(--brand-green)",
            color: "white",
          }}
        >
          {preview ? (
            <Image
              src={preview}
              alt={fullName}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <span>{initials || <User size={32} />}</span>
          )}
        </div>

        {/* Upload trigger */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: "var(--brand-yellow)",
            color: "var(--brand-green)",
          }}
          title="Upload photo"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Camera size={13} />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* URL option toggle */}
      <button
        onClick={() => setShowUrl((v) => !v)}
        className="flex items-center gap-1.5 text-xs"
        style={{ color: "var(--brand-green)" }}
      >
        <Link size={11} />
        {showUrl ? "Cancel" : "Use image URL instead"}
      </button>

      {/* URL input */}
      {showUrl && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full max-w-xs">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://…"
            className="flex-1 h-9 rounded-lg px-3 text-xs outline-none"
            style={FIELD_STYLE}
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-9 px-3 rounded-lg text-xs font-medium flex-shrink-0 disabled:opacity-60"
            style={{ background: "var(--brand-green)", color: "white" }}
          >
            Save
          </button>
        </form>
      )}

      {error && (
        <p className="text-xs" style={{ color: "#991b1b" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs" style={{ color: "#166534" }}>
          Avatar updated!
        </p>
      )}
    </div>
  );
}
