"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export default function FilterDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full justify-between"
        style={{
          background: "white",
          border: "0.5px solid #e8e2d8",
          color: "var(--brand-text)",
        }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={15}
            style={{ color: "var(--brand-green)" }}
          />
          Filters
        </div>
        {open ? (
          <X size={15} style={{ color: "var(--brand-muted)" }} />
        ) : (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--brand-ivory)",
              color: "var(--brand-muted)",
            }}
          >
            Show
          </span>
        )}
      </button>

      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
