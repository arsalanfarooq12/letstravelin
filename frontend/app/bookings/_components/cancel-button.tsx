"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { cancelBooking } from "@/lib/booking-actions";

export default function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result.error) {
        setError(result.error);
        setConfirm(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60 transition-all"
        style={{
          background: confirm ? "#fee2e2" : "var(--brand-ivory)",
          color: confirm ? "#991b1b" : "var(--brand-muted)",
          border: `0.5px solid ${confirm ? "#fca5a5" : "#d6cebc"}`,
        }}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <X size={12} />
        )}
        {confirm ? "Confirm cancel?" : "Cancel booking"}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "#991b1b" }}>
          {error}
        </p>
      )}
    </div>
  );
}
