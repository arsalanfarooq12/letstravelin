import { Suspense } from "react";
import Navbar from "@/app/_components/navbar";
import PackageFilters from "./_components/packages-filters";
import PackageGrid from "./_components/packages-grid";
import FilterDrawer from "@/app/_components/filter-drawer";
import { getSession } from "@/lib/session";

function PackageGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <div style={{ height: 180, background: "#e2ddd5" }} />
          <div className="p-4 flex flex-col gap-3">
            <div
              className="h-4 rounded-full w-3/4"
              style={{ background: "#e2ddd5" }}
            />
            <div
              className="h-3 rounded-full w-full"
              style={{ background: "#e2ddd5" }}
            />
            <div
              className="h-3 rounded-full w-2/3"
              style={{ background: "#e2ddd5" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    destinationId?: string;
    minPrice?: string;
    maxPrice?: string;
    minDays?: string;
    maxDays?: string;
    cursor?: string;
  }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm mb-1" style={{ color: "#a8dfc4" }}>
            Curated trips
          </p>
          <h1 className="text-3xl font-semibold text-white">All Packages</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex flex-col gap-6">
          <Suspense>
            <FilterDrawer>
              <PackageFilters />
            </FilterDrawer>
          </Suspense>

          <main className="w-full">
            <Suspense
              key={JSON.stringify(params)}
              fallback={<PackageGridSkeleton />}
            >
              <PackageGrid {...params} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
