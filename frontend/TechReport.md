# letstravelin — Technical Report

**Version:** 1.0  
**Date:** June 2026  
**Author:** Arsalan Farooq  
**Classification:** Internal / Developer Reference

---

## Table of Contents

1. Executive Summary
2. System Architecture & Component Design
3. Technical Stack & Justification
4. Database Schema Overview
5. API & Integration Points
6. Deployment & Maintenance Guide
7. Future Scalability Considerations

---

## 1. Executive Summary

**letstravelin** is a full-stack travel agency platform built for the Indian domestic travel market. It enables travellers to discover destinations, browse hotels and curated packages, book transport, and manage their trips end-to-end — while giving travel agents and admins a complete back-office panel to manage inventory, listings, and bookings.

The system is architected as a monorepo with a clear separation between a stateless REST API backend and a server-rendered Next.js frontend. It is designed to operate at zero infrastructure cost during development and early production (Supabase free tier, Railway/Render free tier, Vercel free tier), with a well-defined path to scale to 50,000+ users without architectural rewrites.

**Core capabilities:**

- Destination, hotel, transport, and package discovery with search, filtering, and pagination
- Three-type booking system (hotel, transport, package) with atomic transactional writes
- Role-based access control across three user tiers (USER, AGENT, ADMIN)
- Supabase Auth-backed authentication with JWT verification on every protected route
- Admin panel for full destination and booking lifecycle management
- Server-side rendering with selective client-side Zustand caching for profile and navigation state

---

## 2. System Architecture & Component Design

### 2.1 High-Level Architecture

```
Browser / Mobile
      │
      ▼
┌─────────────────────────────┐
│     Next.js 16 Frontend     │  Vercel (free tier)
│  App Router · SSR · Zustand │
└──────────────┬──────────────┘
               │ HTTP (REST)
               ▼
┌─────────────────────────────┐
│   Express.js REST API       │  Railway / Render (free tier)
│   Node.js · ES Modules      │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐  ┌──────────────────┐
│  Prisma    │  │  Supabase Auth   │
│  ORM       │  │  (JWT issuance)  │
└─────┬──────┘  └──────────────────┘
      │
      ▼
┌─────────────────────────────┐
│  PostgreSQL via Supabase    │  Supabase (free tier)
│  Pooled connection (6543)   │
│  Direct connection (5432)   │
└─────────────────────────────┘
```

### 2.2 Request Lifecycle

1. Browser sends request to Next.js (Vercel edge)
2. `proxy.ts` (Next.js 16's replacement for `middleware.ts`) intercepts every request, checks for the `lt_access` HttpOnly cookie, and enforces public/protected route rules and role-based admin guards before any page renders
3. Server Components fetch data directly from the Express API using `fetch()` with `{ next: { revalidate: 3600 } }` for public data or `cache: 'no-store'` for user-specific data
4. The Express API verifies the JWT token via Supabase Auth SDK, then queries PostgreSQL through Prisma
5. The response is streamed back to the browser. Client Components hydrate and Zustand is seeded with profile data via the `Providers` wrapper in the root layout

### 2.3 Frontend Component Hierarchy

```
app/layout.tsx (RootLayout — Server)
  └── Providers (Client — seeds Zustand profile)
        ├── Navbar (Client — reads Zustand profile)
        ├── RefreshButton (Client — invalidates cache + revalidatePath)
        └── [page].tsx
              ├── Server Components (data fetching, SSR)
              └── Client Components (interactivity, forms, filters)
```

### 2.4 Authentication Flow

```
Client → POST /api/auth/login
       ← { accessToken, refreshToken, profile }

Client → createSession() [Server Action]
       → Sets lt_access (1h), lt_refresh (7d), lt_profile (7d) as HttpOnly cookies

Subsequent requests:
proxy.ts reads lt_access cookie → allows/redirects
Server Components call requireSession() → returns { accessToken, profile } or redirects
```

### 2.5 Booking Flow

```
User selects room/transport/package
  → /bookings/new?type=HOTEL&id=...&roomId=...

Multi-step form (3 steps):
  Step 1: Confirm booking type and user
  Step 2: Enter dates / seats / currency
  Step 3: Review → confirm

On confirm → createBooking() [Server Action]
  → POST /api/bookings with JWT
  → Prisma $transaction (atomic: booking + room allocations)
  → revalidatePath('/bookings/my')
  → redirect to /bookings/my
```

---

## 3. Technical Stack & Justification

### 3.1 Backend

| Layer         | Technology              | Version | Justification                                                 |
| ------------- | ----------------------- | ------- | ------------------------------------------------------------- |
| Runtime       | Node.js (ES Modules)    | 20.x    | Native ESM, no transpilation needed                           |
| Framework     | Express.js              | 4.x     | Minimal, well-understood, fast to extend                      |
| ORM           | Prisma                  | 7.8.0   | Type-safe queries, migration history, Supabase-compatible     |
| Database      | PostgreSQL via Supabase | 15.x    | Managed Postgres, built-in Auth, free tier generous           |
| Auth          | Supabase Auth           | SDK 2.x | Handles hashing, token rotation, OAuth — no custom auth logic |
| Validation    | Zod                     | 3.x     | Schema-first validation with typed error output               |
| HTTP security | Helmet                  | —       | Secure headers on all responses                               |

**Key backend decisions:**

- **Prisma transactions with 30s timeout:** The default 5s Prisma interactive transaction timeout is too short for Supabase's pooled connection latency. All booking write operations use `{ timeout: 30000 }` to prevent mid-write failures.
- **Soft delete on Profile and Booking:** Financial records are never hard-deleted. `deletedAt DateTime?` fields ensure audit trails are preserved while logically hiding deleted entities.
- **Price snapshots on RoomBooking:** `pricePerNight` is stored at booking time, not referenced from the Room. This prevents retroactive price changes from corrupting booking history.
- **Computed seat availability:** `availableSeats` is never stored — computed as `totalSeats - bookedCount` at query time. Eliminates desync bugs under concurrent load.

### 3.2 Frontend

| Layer      | Technology   | Version | Justification                                           |
| ---------- | ------------ | ------- | ------------------------------------------------------- |
| Framework  | Next.js      | 16.2.6  | App Router, RSC, streaming, proxy.ts routing            |
| UI         | React        | 19.2.4  | Server Components, useActionState, useTransition        |
| Styling    | Tailwind CSS | v4      | CSS-variable-first config, no tailwind.config.js needed |
| Components | shadcn/ui    | v4      | Unstyled primitives, full brand control                 |
| State      | Zustand      | Latest  | Minimal client state: profile + destination cache       |
| Language   | TypeScript   | 5.x     | End-to-end type safety                                  |

**Key frontend decisions:**

- **Next.js 16 proxy.ts over middleware.ts:** `middleware.ts` is deprecated in Next.js 16. The exported function is renamed `proxy`. All route protection lives here, reading cookies directly from `NextRequest` without a database call — keeping the edge fast.
- **Server Components as default:** All data fetching happens in Server Components. Client Components are only used where interactivity is required (forms, filters, booking flow). This keeps the JS bundle small and avoids waterfall fetches.
- **Zustand for profile only:** Zustand does not manage server data. It stores the authenticated profile (seeded from the server session via the `Providers` component) and a TTL-based destination detail cache seeded after SSR. Server data is cached at the HTTP layer via `next: { revalidate }`.
- **`useActionState` for forms:** All auth and booking forms use React 19's `useActionState` hook, giving progressive enhancement (works without JS) and clean pending/error state management without external form libraries.
- **Cookie-based sessions:** Tokens are stored in `HttpOnly; SameSite=Lax` cookies, not localStorage. JavaScript on the page cannot read them, eliminating XSS token theft.

---

## 4. Database Schema Overview

### 4.1 Core Models

```
Profile         — Public user record, extends auth.users via trigger
Destination     — Travel destination with images, tags, country
Hotel           — Hotel within a destination, with amenities and rating
Room            — Room type within a hotel, with inventory count
Transport       — Route between two destinations (FLIGHT/BUS/FERRY/TRAIN)
Package         — Curated bundle created by an AGENT or ADMIN
PackageItem     — Junction: hotel or transport inside a package
Booking         — Customer booking of type HOTEL, TRANSPORT, or PACKAGE
RoomBooking     — Junction: specific room allocation within a booking, with dates
Payment         — Payment record per booking (gateway + transaction ID)
Review          — Polymorphic review targeting HOTEL, PACKAGE, or DESTINATION
```

### 4.2 Key Relationships

```
Destination  ──< Hotel         (1:many, cascade delete)
Hotel        ──< Room          (1:many, cascade delete)
Room         ──< RoomBooking   (1:many, onDelete: Restrict — prevents deleting booked rooms)
Destination  ──< Transport     (origin/destination, two named relations)
Package      ──< PackageItem   (1:many)
Booking      ──< RoomBooking   (1:many, cascade delete)
Booking      ──< Payment       (1:many, cascade delete)
Profile      ──< Booking       (CustomerBookings / AgentBookings — named to disambiguate two FKs)
```

### 4.3 Enums

```sql
UserRole        → USER | AGENT | ADMIN
BookingType     → HOTEL | TRANSPORT | PACKAGE
BookingStatus   → PENDING | CONFIRMED | CANCELLED | COMPLETED
PaymentStatus   → PENDING | SUCCESS | FAILED | REFUNDED
TransportType   → FLIGHT | BUS | FERRY | TRAIN
ReviewTarget    → HOTEL | PACKAGE | DESTINATION
PackageItemType → HOTEL | TRANSPORT
```

**Important:** All Prisma-generated enums live in the `public` schema. Postgres trigger functions that reference these enums must use fully-qualified casts (`'USER'::public."UserRole"`) and set `search_path = public` on the function definition, or Supabase's `auth` schema context will fail to resolve the type.

### 4.4 Supabase Profile Trigger

A Postgres trigger auto-creates a `Profile` row on every new Supabase Auth signup:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO "Profile" (id, "fullName", role, "createdAt", "updatedAt")
  VALUES (
    new.id,
    new.raw_user_meta_data->>'fullName',
    'USER'::public."UserRole",
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 5. API & Integration Points

### 5.1 Base URL

```
Development:  http://localhost:5000/api
Production:   https://your-backend.railway.app/api
```

### 5.2 Authentication

All protected routes require:

```
Authorization: Bearer <access_token>
```

The token is the Supabase JWT issued at login. The backend verifies it with the Supabase Admin SDK and fetches the user's role from `Profile` (not from the JWT payload, preventing privilege escalation via token manipulation).

### 5.3 Endpoint Summary

**Auth** (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /register | — | Create account + auto-create Profile via trigger |
| POST | /login | — | Returns accessToken, refreshToken, profile |
| POST | /logout | — | Invalidates Supabase session |
| GET | /profile | ✅ | Get own profile |
| PATCH | /profile | ✅ | Update fullName, phone, avatarUrl |

**Destinations** (`/api/destinations`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | / | — | List with search, country, tags, cursor pagination |
| GET | /:id | — | Detail with hotels, packages, reviews, avgRating |
| POST | / | ADMIN | Create |
| PATCH | /:id | ADMIN | Update |
| DELETE | /:id | ADMIN | Delete |
| POST | /:id/reviews | USER | Submit review |

**Hotels** (`/api/hotels`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | / | — | List with search, rating, amenities, price filter |
| GET | /:id | — | Detail with rooms and reviews |
| POST | / | AGENT/ADMIN | Create |
| GET | /:id/availability | — | Room availability for date range |

**Transport** (`/api/transport`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | / | — | List with origin, destination, type, date, price filter |
| GET | /:id | — | Detail with live seat count |
| GET | /:id/availability | — | Seat availability breakdown |
| POST | /validate | USER | Validate before booking |

**Packages** (`/api/packages`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | / | — | List with search, destination, price, days filter |
| GET | /:id | — | Detail with items, destination, creator |
| POST | / | AGENT/ADMIN | Create |
| POST | /validate | USER | Validate availability |

**Bookings** (`/api/bookings`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | / | USER | Create (HOTEL/TRANSPORT/PACKAGE) |
| GET | /my | USER | Own bookings list |
| GET | /:id | USER | Single booking detail |
| PATCH | /:id/cancel | USER | Cancel own booking |
| GET | / | ADMIN | All bookings |
| PATCH | /:id/assign | ADMIN | Assign agent |
| PATCH | /:id/paid | AGENT/ADMIN | Mark as paid |
| PATCH | /:id/completed | AGENT/ADMIN | Mark as completed |

### 5.4 Pagination

All list endpoints use cursor-based pagination:

```json
{
  "data": [...],
  "nextCursor": "uuid-of-last-item",
  "hasNextPage": true
}
```

Pass `?cursor=<nextCursor>` to fetch the next page. Default limit is 12, max is 50.

### 5.5 Error Response Format

```json
{ "error": "Human-readable message" }
```

Zod validation errors additionally include:

```json
{
  "error": "Validation failed",
  "issues": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## 6. Deployment & Maintenance Guide

### 6.1 Environment Variables

**Backend** (`.env` in `/backend`):

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
FRONTEND_URL="https://your-frontend.vercel.app"
PORT=5000
```

**Frontend** (`.env.local` in `/frontend`):

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="https://your-backend.railway.app/api"
```

### 6.2 Database Setup

```bash
# Push schema to Supabase (development — no migration history)
cd backend
npx prisma db push

# Create tracked migration (staging/production)
npx prisma migrate dev --name init

# Apply migrations in CI/CD
npx prisma migrate deploy

# After schema changes, regenerate Prisma Client
npx prisma generate

# Visual database browser
npx prisma studio
```

After first deploy, run the profile trigger SQL in Supabase SQL Editor (see Section 4.4).

### 6.3 Running Locally

```bash
# Backend
cd backend
npm install
npm run dev        # Express on :5000

# Frontend
cd frontend
npm install
npm run dev        # Next.js on :3000
```

Or from the repo root (uses `concurrently`):

```bash
npm run dev
```

### 6.4 Deployment Targets

| Service  | Platform          | Notes                                                                     |
| -------- | ----------------- | ------------------------------------------------------------------------- |
| Frontend | Vercel            | Set env vars in project settings. Auto-deploys on push to main.           |
| Backend  | Railway or Render | Set env vars in dashboard. Ensure `PORT` is read from `process.env.PORT`. |
| Database | Supabase          | Use pooled URL for Prisma Client, direct URL for migrations.              |

### 6.5 Remote Image Domains

The Next.js config uses permissive remote image patterns for development:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**" },
    { protocol: "http",  hostname: "**" },
  ],
}
```

Before production, replace with explicit hostnames (e.g., `res.cloudinary.com`, `your-project.supabase.co`).

### 6.6 Cache Invalidation

Server data is cached at the Next.js HTTP layer with `revalidate: 3600`. To force-invalidate after admin writes, `lib/actions.ts` exports:

```typescript
export async function revalidateDestinations() {
  revalidatePath("/");
  revalidatePath("/destinations");
}
```

This is called automatically after create, update, and delete operations in the admin panel and via the floating refresh button.

---

## 7. Future Scalability Considerations

### 7.1 Payment Integration

The bookings module is payment-ready. The `Payment` model stores `gateway`, `transactionId` (unique), `amount`, and `status`. The next step is integrating **Razorpay** (primary for Indian market) or **Stripe**:

- Add `POST /api/payments/initiate` — creates a Razorpay order, returns `orderId`
- Add `POST /api/payments/verify` — verifies signature, calls `bookings/:id/paid`
- `transactionId @unique` on the `Payment` model already prevents duplicate webhook writes

### 7.2 Search at Scale

The current full-text search uses Prisma `contains` which maps to a Postgres `ILIKE` query. This works well to ~100k rows. Beyond that:

- Add a **GIN index** on `Destination.name` and `Hotel.name` for Postgres full-text search
- Migrate to **Typesense** (self-hosted, free) or **Algolia** for faceted search, typo tolerance, and instant results

### 7.3 Caching Layer

Currently there is no caching between the Express API and Postgres. For high read traffic:

- Add **Upstash Redis** (serverless, free tier) as an LRU cache for destination lists and hotel listings
- Cache TTL should match the `revalidate: 3600` frontend cache to prevent stale data serving

### 7.4 Image Management

Hotels and packages currently have no images. The schema supports `images String[]` on `Destination` already. The recommended path:

- Integrate **Cloudinary** free tier for upload, transformation, and CDN delivery
- Add `POST /api/upload` route (AGENT/ADMIN) that returns a signed Cloudinary URL
- Lock `next.config.ts` `remotePatterns` to `res.cloudinary.com`

### 7.5 Real-time Features

The current booking confirmation flow is manual (agent marks as paid). For automated confirmations:

- Add **BullMQ** job queue (backed by Redis) for async operations: confirmation emails, booking reminders, cancellation notices
- Use **Resend** or **Nodemailer** for transactional email

### 7.6 Microservices Path

The modular Express structure (`/modules/auth`, `/modules/bookings`, etc.) is already split along service boundaries. When individual modules hit load limits:

1. Extract **Bookings** first — highest write load, already uses transactions
2. Extract **Search** — reads only, easy to scale horizontally
3. Keep **Auth** on the monolith longest — session validation is stateless (JWT), not a bottleneck

### 7.7 Infrastructure Scaling Path

| Stage      | Users   | Changes                                                               |
| ---------- | ------- | --------------------------------------------------------------------- |
| Current    | 0–5k    | Supabase free, Railway free, Vercel free                              |
| Growth     | 5k–20k  | Supabase Pro ($25/mo), add Redis (Upstash free), Cloudinary free      |
| Scale      | 20k–50k | Dedicated RDS with read replica, Redis cluster, CDN for static assets |
| Enterprise | 50k+    | Microservices extraction, Elasticsearch, multi-region Postgres        |

---

_Report generated June 2026. All API endpoints and schema reflect the current production-ready state of the codebase._
