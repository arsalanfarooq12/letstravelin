"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const invalidateDestinations = useStore((s) => s.invalidateDestinations);

  function handleRefresh() {
    invalidateDestinations();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all disabled:opacity-60"
      style={{ background: "var(--brand-green)", color: "white" }}
      aria-label="Refresh page"
      title="Refresh"
    >
      <RefreshCw size={18} className={isPending ? "animate-spin" : ""} />
    </button>
  );
}
