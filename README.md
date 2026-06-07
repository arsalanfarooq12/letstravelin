# TravelApp — Backend API

A full-featured travel agency REST API built with **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **Supabase Auth**. Designed to scale from a solo-developer zero-budget launch to 50k+ users.

---

## 📁 Project Structure

```
travel-app/
├── frontend/                         # Next.js app (separate)
└── backend/
    ├── prisma/
    │   └── schema.prisma             # Full database schema
    ├── src/
    │   ├── index.js                  # Express app entry point
    │   ├── lib/
    │   │   ├── prisma.js             # Prisma client singleton
    │   │   └── supabase.js           # Supabase admin client
    │   ├── middleware/
    │   │   ├── auth.middleware.js    # JWT verification + profile fetch
    │   │   ├── role.middleware.js    # Role-based access control
    │   │   └── error.middleware.js   # Global error + Zod handler
    │   └── modules/
    │       ├── auth/
    │       │   ├── auth.routes.js
    │       │   ├── auth.controller.js
    │       │   ├── auth.service.js
    │       │   └── auth.schema.js
    │       ├── destinations/
    │       │   ├── destinations.routes.js
    │       │   ├── destinations.controller.js
    │       │   ├── destinations.service.js
    │       │   └── destinations.schema.js
    │       ├── hotels/
    │       │   ├── hotels.routes.js
    │       │   ├── hotels.controller.js
    │       │   ├── hotels.service.js
    │       │   └── hotels.schema.js
    │       ├── transport/
    │       │   ├── transport.routes.js
    │       │   ├── transport.controller.js
    │       │   ├── transport.service.js
    │       │   └── transport.schema.js
    │       ├── packages/
    │       │   ├── packages.routes.js
    │       │   ├── packages.controller.js
    │       │   ├── packages.service.js
    │       │   └── packages.schema.js
    │       └── bookings/
    │           ├── bookings.routes.js
    │           ├── bookings.controller.js
    │           ├── bookings.service.js
    │           └── bookings.schema.js
    └── package.json
```

---

## ⚙️ Tech Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Runtime    | Node.js (ES Modules)    |
| Framework  | Express.js              |
| ORM        | Prisma                  |
| Database   | PostgreSQL via Supabase |
| Auth       | Supabase Auth (JWT)     |
| Validation | Zod                     |
| Dev Server | Nodemon                 |

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd travel-app/backend
npm install
```

### 2. Environment variables

Create a `.env` file in `/backend`:

```env
# Supabase Postgres — pooled connection for Prisma Client
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Postgres — direct connection for migrations
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase project credentials
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"

# App config
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

> ⚠️ Never commit `.env` to version control. Add it to `.gitignore`.

### 3. Push schema to database

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev       # backend on :5000
```

To run frontend and backend together from the repo root:

```bash
npm run dev       # uses concurrently
```

---

## 🗄️ Database Schema

### Models

| Model         | Description                                            |
| ------------- | ------------------------------------------------------ |
| `Profile`     | App user — extends Supabase `auth.users`               |
| `Destination` | Travel destination (city/region)                       |
| `Hotel`       | Hotel within a destination                             |
| `Room`        | Room type within a hotel with inventory                |
| `Transport`   | Flight/bus/ferry/train between destinations            |
| `Package`     | Curated tour package (hotel + transport bundle)        |
| `PackageItem` | Junction: what's inside a package                      |
| `Booking`     | Customer booking (hotel, transport, or package)        |
| `RoomBooking` | Junction: room allocations per booking with date range |
| `Payment`     | Payment record per booking                             |
| `Review`      | Polymorphic review for hotel, package, or destination  |

### Enums

```prisma
UserRole        → USER | AGENT | ADMIN
BookingType     → HOTEL | TRANSPORT | PACKAGE
BookingStatus   → PENDING | CONFIRMED | CANCELLED | COMPLETED
PaymentStatus   → PENDING | SUCCESS | FAILED | REFUNDED
TransportType   → FLIGHT | BUS | FERRY | TRAIN
ReviewTarget    → HOTEL | PACKAGE | DESTINATION
PackageItemType → HOTEL | TRANSPORT
```

### Key design decisions

- **Soft delete** on `Profile` and `Booking` via `deletedAt DateTime?` — financial records are never hard deleted
- **Price snapshots** on `RoomBooking.pricePerNight` — preserves the charge at time of booking even if room prices change later
- **Computed availability** — seat/room counts are never stored; computed as `total - bookedCount` at query time to prevent desync
- **Polymorphic reviews** — single `Review` model handles hotel, package, and destination reviews via `targetType` enum
- **Named Prisma relations** — disambiguates multiple FKs pointing at `Profile` (`CustomerBookings` vs `AgentBookings`)
- **Prisma transactions** — hotel and package bookings use `prisma.$transaction` to guarantee atomic creation of booking + room allocations
- **`onDelete: Restrict`** on `RoomBooking → Room` — prevents deleting rooms that have booking history

---

## 🔐 Authentication

Authentication is handled entirely by **Supabase Auth**. The backend verifies JWTs on protected routes and fetches the user's role from the `Profile` table.

### How it works

1. Client signs in via Supabase → receives `access_token` + `refresh_token`
2. Client sends `Authorization: Bearer <access_token>` on every protected request
3. `auth.middleware.js` verifies the token with Supabase, fetches the `Profile` for role
4. `req.user` is populated with `{ id, email, role, fullName }`
5. `role.middleware.js` guards admin/agent routes

### Supabase profile trigger

A Postgres trigger auto-creates a `Profile` row whenever a user signs up:

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 📡 API Reference

### Base URL

```
http://localhost:5000/api
```

---

### Auth — `/api/auth`

| Method | Endpoint          | Auth | Role | Description                             |
| ------ | ----------------- | ---- | ---- | --------------------------------------- |
| POST   | `/register`       | —    | —    | Create a new account                    |
| POST   | `/login`          | —    | —    | Sign in, returns access + refresh token |
| POST   | `/logout`         | —    | —    | Invalidate current session              |
| POST   | `/reset-password` | —    | —    | Send password reset email               |
| GET    | `/profile`        | ✅   | —    | Get authenticated user's profile        |
| PATCH  | `/profile`        | ✅   | —    | Update authenticated user's profile     |

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

#### Login response

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "email": "user@example.com" },
  "profile": { "id": "uuid", "fullName": "John Doe", "role": "USER" }
}
```

---

### Destinations — `/api/destinations`

| Method | Endpoint                 | Auth | Role       | Description                                    |
| ------ | ------------------------ | ---- | ---------- | ---------------------------------------------- |
| GET    | `/`                      | —    | —          | List destinations (search, filter, paginate)   |
| GET    | `/:id`                   | —    | —          | Get destination with hotels, packages, reviews |
| POST   | `/`                      | ✅   | ADMIN      | Create destination                             |
| PATCH  | `/:id`                   | ✅   | ADMIN      | Update destination                             |
| DELETE | `/:id`                   | ✅   | ADMIN      | Delete destination                             |
| GET    | `/:id/reviews`           | —    | —          | Get reviews for a destination                  |
| POST   | `/:id/reviews`           | ✅   | USER       | Submit a review                                |
| DELETE | `/:id/reviews/:reviewId` | ✅   | USER/ADMIN | Delete a review                                |

#### Query parameters

| Param     | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| `search`  | string | Full-text search on name and description |
| `country` | string | Filter by country                        |
| `tags`    | string | Comma-separated e.g. `beach,adventure`   |
| `limit`   | number | Results per page (1–50, default 12)      |
| `cursor`  | uuid   | Cursor for next page                     |

---

### Hotels — `/api/hotels`

| Method | Endpoint                          | Auth | Role        | Description                       |
| ------ | --------------------------------- | ---- | ----------- | --------------------------------- |
| GET    | `/`                               | —    | —           | List hotels with search & filters |
| GET    | `/:id`                            | —    | —           | Get hotel with rooms & reviews    |
| POST   | `/`                               | ✅   | AGENT/ADMIN | Create hotel                      |
| PATCH  | `/:id`                            | ✅   | AGENT/ADMIN | Update hotel                      |
| DELETE | `/:id`                            | ✅   | ADMIN       | Delete hotel                      |
| GET    | `/:id/rooms`                      | —    | —           | List rooms for a hotel            |
| POST   | `/:id/rooms`                      | ✅   | AGENT/ADMIN | Add room to hotel                 |
| PATCH  | `/:id/rooms/:roomId`              | ✅   | AGENT/ADMIN | Update room                       |
| DELETE | `/:id/rooms/:roomId`              | ✅   | ADMIN       | Delete room                       |
| GET    | `/:id/availability`               | —    | —           | All rooms availability for dates  |
| GET    | `/:id/rooms/:roomId/availability` | —    | —           | Single room availability          |
| GET    | `/:id/reviews`                    | —    | —           | Get hotel reviews                 |
| POST   | `/:id/reviews`                    | ✅   | USER        | Submit a review                   |
| DELETE | `/:id/reviews/:reviewId`          | ✅   | USER/ADMIN  | Delete a review                   |

#### Query parameters

| Param           | Type   | Description                         |
| --------------- | ------ | ----------------------------------- |
| `destinationId` | uuid   | Filter by destination               |
| `search`        | string | Search hotel name                   |
| `minRating`     | number | Minimum star rating (1–5)           |
| `amenities`     | string | Comma-separated e.g. `wifi,pool`    |
| `minPrice`      | number | Minimum room price per night        |
| `maxPrice`      | number | Maximum room price per night        |
| `limit`         | number | Results per page (1–50, default 12) |
| `cursor`        | uuid   | Cursor for next page                |

#### Availability response

```json
{
  "hotelId": "uuid",
  "checkIn": "2025-12-01T00:00:00.000Z",
  "checkOut": "2025-12-05T00:00:00.000Z",
  "nights": 4,
  "hasAnyAvailability": true,
  "rooms": [
    {
      "roomId": "uuid",
      "type": "Deluxe Suite",
      "pricePerNight": "149.99",
      "totalRooms": 5,
      "bookedCount": 2,
      "availableCount": 3,
      "isAvailable": true
    }
  ]
}
```

---

### Transport — `/api/transport`

| Method | Endpoint            | Auth | Role        | Description                             |
| ------ | ------------------- | ---- | ----------- | --------------------------------------- |
| GET    | `/`                 | —    | —           | List routes with filters & pagination   |
| GET    | `/:id`              | —    | —           | Get route with live seat count          |
| GET    | `/:id/availability` | —    | —           | Detailed seat availability breakdown    |
| POST   | `/validate`         | ✅   | USER        | Validate booking intent before purchase |
| POST   | `/`                 | ✅   | AGENT/ADMIN | Create transport route                  |
| PATCH  | `/:id`              | ✅   | AGENT/ADMIN | Update route                            |
| DELETE | `/:id`              | ✅   | ADMIN       | Delete route                            |

#### Query parameters

| Param           | Type   | Description                            |
| --------------- | ------ | -------------------------------------- |
| `originId`      | uuid   | Filter by origin destination           |
| `destinationId` | uuid   | Filter by arrival destination          |
| `type`          | enum   | `FLIGHT`, `BUS`, `FERRY`, `TRAIN`      |
| `date`          | date   | Filter schedules on this calendar day  |
| `minPrice`      | number | Minimum ticket price                   |
| `maxPrice`      | number | Maximum ticket price                   |
| `minSeats`      | number | Only show routes with at least N seats |
| `limit`         | number | Results per page (1–50, default 12)    |
| `cursor`        | uuid   | Cursor for next page                   |

#### Availability response

```json
{
  "transportId": "uuid",
  "type": "FLIGHT",
  "schedule": "2025-12-01T08:00:00.000Z",
  "totalSeats": 180,
  "bookedCount": 43,
  "availableSeats": 137,
  "isSoldOut": false,
  "occupancyRate": 24,
  "statusBreakdown": [
    { "status": "CONFIRMED", "count": 38 },
    { "status": "PENDING", "count": 5 }
  ]
}
```

---

### Packages — `/api/packages`

| Method | Endpoint             | Auth | Role        | Description                                  |
| ------ | -------------------- | ---- | ----------- | -------------------------------------------- |
| GET    | `/`                  | —    | —           | List packages with search & filters          |
| GET    | `/:id`               | —    | —           | Get package with full items breakdown        |
| POST   | `/`                  | ✅   | AGENT/ADMIN | Create package                               |
| PATCH  | `/:id`               | ✅   | AGENT/ADMIN | Update package                               |
| DELETE | `/:id`               | ✅   | ADMIN       | Delete package                               |
| GET    | `/:id/items`         | —    | —           | List all items in a package                  |
| POST   | `/:id/items`         | ✅   | AGENT/ADMIN | Add hotel or transport to package            |
| DELETE | `/:id/items/:itemId` | ✅   | AGENT/ADMIN | Remove item from package                     |
| POST   | `/validate`          | ✅   | USER        | Validate package availability before booking |

#### Query parameters

| Param           | Type   | Description                         |
| --------------- | ------ | ----------------------------------- |
| `destinationId` | uuid   | Filter by destination               |
| `search`        | string | Search title and description        |
| `minPrice`      | number | Minimum package price               |
| `maxPrice`      | number | Maximum package price               |
| `minDays`       | number | Minimum duration in days            |
| `maxDays`       | number | Maximum duration in days            |
| `limit`         | number | Results per page (1–50, default 12) |
| `cursor`        | uuid   | Cursor for next page                |

#### Validate response

```json
{
  "valid": true,
  "packageTitle": "Goa Beach Getaway",
  "nights": 5,
  "seats": 2,
  "totalPrice": 599.98,
  "currency": "USD",
  "items": [
    {
      "itemType": "HOTEL",
      "hotelName": "Taj Holiday Village",
      "isAvailable": true
    },
    {
      "itemType": "TRANSPORT",
      "type": "FLIGHT",
      "availableSeats": 54,
      "isAvailable": true
    }
  ],
  "blockers": []
}
```

---

### Bookings — `/api/bookings`

| Method | Endpoint         | Auth | Role        | Description                                 |
| ------ | ---------------- | ---- | ----------- | ------------------------------------------- |
| POST   | `/`              | ✅   | USER        | Create hotel, transport, or package booking |
| GET    | `/my`            | ✅   | USER        | Get own bookings                            |
| GET    | `/:id`           | ✅   | USER        | Get single booking detail                   |
| PATCH  | `/:id/cancel`    | ✅   | USER        | Cancel own booking                          |
| GET    | `/managed`       | ✅   | AGENT/ADMIN | Get agent's assigned bookings               |
| PATCH  | `/:id/paid`      | ✅   | AGENT/ADMIN | Mark booking as paid manually               |
| PATCH  | `/:id/completed` | ✅   | AGENT/ADMIN | Mark booking as completed                   |
| GET    | `/`              | ✅   | ADMIN       | Get all bookings                            |
| PATCH  | `/:id/assign`    | ✅   | ADMIN       | Assign agent to a booking                   |

#### Create booking — Hotel

```json
{
  "type": "HOTEL",
  "currency": "USD",
  "rooms": [
    { "roomId": "uuid", "checkIn": "2025-12-01", "checkOut": "2025-12-05" }
  ]
}
```

#### Create booking — Transport

```json
{
  "type": "TRANSPORT",
  "transportId": "uuid",
  "seats": 2,
  "currency": "USD"
}
```

#### Create booking — Package

```json
{
  "type": "PACKAGE",
  "packageId": "uuid",
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-06",
  "seats": 2,
  "currency": "USD"
}
```

#### Mark as paid (agent)

```json
{
  "amount": 299.99,
  "gateway": "BANK_TRANSFER",
  "transactionId": "TXN-20251201-001"
}
```

#### Booking status flow

```
PENDING   → CONFIRMED  (after markPaid)
PENDING   → CANCELLED  (user or agent)
CONFIRMED → COMPLETED  (agent marks done)
CONFIRMED → CANCELLED  (agent/admin only)
COMPLETED → (terminal — no further transitions)
```

#### Query parameters for booking lists

| Param    | Type   | Description                                      |
| -------- | ------ | ------------------------------------------------ |
| `status` | enum   | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `type`   | enum   | `HOTEL`, `TRANSPORT`, `PACKAGE`                  |
| `limit`  | number | Results per page (1–50, default 10)              |
| `cursor` | uuid   | Cursor for next page                             |

---

## 🛡️ Middleware

### `requireAuth`

Verifies the Supabase JWT, checks the profile exists and is not soft-deleted, attaches `req.user` with `{ id, email, role, fullName }`.

### `requireRole(...roles)`

Role guard applied after `requireAuth`. Accepts one or more roles:

```javascript
router.post("/", requireAuth, requireRole("ADMIN"), controller);
router.patch("/:id", requireAuth, requireRole("ADMIN", "AGENT"), controller);
```

### `errorHandler`

Global error handler — registered last in `index.js`. Handles:

| Error type                       | HTTP Status | Response                                  |
| -------------------------------- | ----------- | ----------------------------------------- |
| Zod validation error             | 400         | `{ error, issues: [{ field, message }] }` |
| Prisma unique constraint (P2002) | 409         | `{ error: "already exists" }`             |
| Prisma not found (P2025)         | 404         | `{ error: "not found" }`                  |
| Custom `{ status, message }`     | as set      | `{ error: message }`                      |
| Unhandled                        | 500         | `{ error: "Internal server error" }`      |

---

## 📦 Modules Status

| Module         | Status      | Features                                                        |
| -------------- | ----------- | --------------------------------------------------------------- |
| Auth & Users   | ✅ Complete | Register, login, logout, reset password, profile CRUD           |
| Destinations   | ✅ Complete | CRUD, search & filter, pagination, polymorphic reviews          |
| Hotels & Rooms | ✅ Complete | CRUD, room management, availability checking, reviews           |
| Transport      | ✅ Complete | CRUD, search & filter, seat availability, booking validation    |
| Packages       | ✅ Complete | CRUD, item composition, availability validation                 |
| Bookings       | ✅ Complete | All three types, cancellation, agent assignment, manual payment |
| Payments       | 🔜 Planned  | Stripe / Razorpay integration                                   |

---

## 🏗️ Architecture

```
React (Next.js)  →  Express API  →  Prisma Client  →  PostgreSQL (Supabase)
                         ↓
                   Supabase Auth
                         ↓
                    Redis (future)
                    Cloudinary (images)
```

### Monorepo layout

```
travel-app/
├── frontend/    → Deployed on Vercel (free tier)
└── backend/     → Deployed on Railway / Render (free tier)
```

### Scaling path (when needed)

1. Add **Redis / Upstash** for session caching and search result caching
2. Add **Elasticsearch / Typesense** for full-text destination + hotel search
3. Extract **Bookings** into its own service with **BullMQ** for async confirmation emails
4. Migrate DB to a dedicated **RDS instance** with read replicas
5. Split monolith into **microservices** per module

---

## 📋 Development Scripts

```bash
npm run dev             # start with nodemon (hot reload)
npm run start           # production start
npx prisma db push      # sync schema to DB (dev, no migration history)
npx prisma migrate dev  # create a tracked migration (staging/prod)
npx prisma migrate deploy # apply migrations in production
npx prisma studio       # open visual DB browser at :5555
npx prisma generate     # regenerate Prisma Client after schema changes
```

---

## 🔒 Security Notes

- Supabase **service role key** is only used server-side — never exposed to the client
- Supabase Auth handles password hashing, token rotation, and OAuth providers
- `helmet()` sets secure HTTP headers on all responses
- `cors()` is restricted to `FRONTEND_URL` only
- Role is stored in your own `Profile` table — prevents privilege escalation via token manipulation
- Soft delete on `Booking` and `Profile` ensures financial records are never permanently lost
- `prisma.$transaction` on hotel and package bookings prevents partial writes
- `transactionId @unique` on `Payment` prevents duplicate payment records from gateway webhooks
- Booking cancellation and status transitions are strictly enforced in the service layer

---

_Built with ❤️ — solo developer, zero budget, production-ready architecture._
