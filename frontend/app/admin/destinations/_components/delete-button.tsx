"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteDestinationButton({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    startTransition(async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/destinations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
      style={{
        background: confirm ? "#fee2e2" : "var(--brand-ivory)",
        color: confirm ? "#991b1b" : "var(--brand-muted)",
        border: `0.5px solid ${confirm ? "#fca5a5" : "#d6cebc"}`,
      }}
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Trash2 size={12} />
      )}
      {confirm ? "Sure?" : "Delete"}
    </button>
  );
}
