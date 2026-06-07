import { Suspense } from "react";
import Navbar from "@/app/_components/navbar";
import Filters from "./_components/filters";
import DestinationList from "./_components/destination-list";
import FilterDrawer from "@/app/_components/filter-drawer";
import { getSession } from "@/lib/session";

function DestinationListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex gap-5 p-4 rounded-2xl animate-pulse"
          style={{ background: "white", border: "0.5px solid #e8e2d8" }}
        >
          <div
            className="flex-shrink-0 rounded-xl"
            style={{ width: 160, height: 120, background: "#e2ddd5" }}
          />
          <div className="flex flex-col gap-2 flex-1 py-1">
            <div
              className="h-3 rounded-full w-24"
              style={{ background: "#e2ddd5" }}
            />
            <div
              className="h-4 rounded-full w-48"
              style={{ background: "#e2ddd5" }}
            />
            <div
              className="h-3 rounded-full w-32"
              style={{ background: "#e2ddd5" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    country?: string;
    tags?: string;
    cursor?: string;
  }>;
}) {
  const session = await getSession();
  const { search, country, tags, cursor } = await searchParams;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--brand-ivory)" }}
    >
      <Navbar profile={session?.profile ?? null} />

      {/* Page header */}
      <div className="px-6 py-10" style={{ background: "var(--brand-green)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm mb-1" style={{ color: "#a8dfc4" }}>
            Explore
          </p>
          <h1 className="text-3xl font-semibold text-white">
            All Destinations
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8">
        {/* Mobile + Desktop filter layout */}
        <div className="flex flex-col gap-6">
          <Suspense>
            <FilterDrawer>
              <Filters />
            </FilterDrawer>
          </Suspense>

          {/* List */}
          <div>
            <Suspense
              key={`${search}-${country}-${tags}-${cursor}`}
              fallback={<DestinationListSkeleton />}
            >
              <DestinationList
                search={search}
                country={country}
                tags={tags}
                cursor={cursor}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
