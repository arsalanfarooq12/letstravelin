import { create } from "zustand";
import type { Profile } from "./session";

type Destination = {
  id: string;
  name: string;
  country: string;
  description?: string;
  images: string[];
  tags: string[];
  createdAt: string;
  hotels?: unknown[];
  reviews?: unknown[];
  packages?: unknown[];
  transportsFrom?: unknown[];
  _count?: { hotels: number; reviews: number; packages: number };
  avgRating?: number | null;
};

type CachedList = {
  data: Destination[];
  nextCursor: string | null;
  hasNextPage: boolean;
  cachedAt: number;
};

type CachedDetail = {
  data: Destination;
  cachedAt: number;
};

const TTL = 60 * 60 * 1000; // 1 hour in ms

type Store = {
  // Profile
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;

  // Destinations list cache (keyed by query string)
  destinationLists: Record<string, CachedList>;
  setDestinationList: (key: string, value: CachedList) => void;
  getDestinationList: (key: string) => CachedList | null;

  // Destination detail cache (keyed by id)
  destinationDetails: Record<string, CachedDetail>;
  setDestinationDetail: (id: string, value: CachedDetail) => void;
  getDestinationDetail: (id: string) => CachedDetail | null;

  // Manual invalidation
  invalidateDestinations: () => void;
};

export const useStore = create<Store>((set, get) => ({
  // ── Profile ──────────────────────────────────────
  profile: null,
  setProfile: (profile) => set({ profile }),

  // ── Destinations list ─────────────────────────────
  destinationLists: {},
  setDestinationList: (key, value) =>
    set((s) => ({ destinationLists: { ...s.destinationLists, [key]: value } })),
  getDestinationList: (key) => {
    const entry = get().destinationLists[key];
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > TTL) return null; // expired
    return entry;
  },

  // ── Destination detail ────────────────────────────
  destinationDetails: {},
  setDestinationDetail: (id, value) =>
    set((s) => ({
      destinationDetails: { ...s.destinationDetails, [id]: value },
    })),
  getDestinationDetail: (id) => {
    const entry = get().destinationDetails[id];
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > TTL) return null; // expired
    return entry;
  },

  // ── Invalidation (called by refresh button) ───────
  invalidateDestinations: () =>
    set({ destinationLists: {}, destinationDetails: {} }),
}));
