import { requireSession } from "@/lib/session";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--brand-text)" }}
        >
          Users
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
          User management will be available once the users API endpoint is built
          on the backend.
        </p>
      </div>
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20"
        style={{ background: "white", border: "0.5px solid #e8e2d8" }}
      >
        <Users
          size={32}
          style={{ color: "var(--brand-muted)" }}
          className="mb-3"
        />
        <p className="font-medium" style={{ color: "var(--brand-text)" }}>
          Coming soon
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
          Backend endpoint needed: GET /api/admin/users
        </p>
      </div>
    </div>
  );
}
