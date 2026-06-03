# TravelApp — Backend API

A full-featured travel agency REST API built with **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **Supabase Auth**. Designed to scale from a solo-developer zero-budget launch to 50k+ users.

---

## Project Structure

```
travel-app/
├── frontend/                     # Next.js app (separate)
└── backend/
    ├── prisma/
    │   └── schema.prisma         # Full database schema
    ├── src/
    │   ├── index.js              # Express app entry point
    │   ├── lib/
    │   │   ├── prisma.js         # Prisma client singleton
    │   │   └── supabase.js       # Supabase admin client
    │   ├── middleware/
    │   │   ├── auth.middleware.js     # JWT verification + profile fetch
    │   │   ├── role.middleware.js     # Role-based access control
    │   │   └── error.middleware.js    # Global error + Zod handler
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.routes.js
    │   │   │   ├── auth.controller.js
    │   │   │   ├── auth.service.js
    │   │   │   └── auth.schema.js
    │   │   └── destinations/
    │   │       ├── destinations.routes.js
    │   │       ├── destinations.controller.js
    │   │       ├── destinations.service.js
    │   │       └── destinations.schema.js
    └── package.json
```

---

## Tech Stack

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

## Getting Started

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
UserRole      → USER | AGENT | ADMIN
BookingType   → HOTEL | TRANSPORT | PACKAGE
BookingStatus → PENDING | CONFIRMED | CANCELLED | COMPLETED
PaymentStatus → PENDING | SUCCESS | FAILED | REFUNDED
TransportType → FLIGHT | BUS | FERRY | TRAIN
ReviewTarget  → HOTEL | PACKAGE | DESTINATION
PackageItemType → HOTEL | TRANSPORT
```

### Key design decisions

- **Soft delete** on `Profile` and `Booking` via `deletedAt DateTime?` — financial records are never hard deleted
- **Price snapshots** on `RoomBooking.pricePerNight` — preserves what the customer was charged even if room prices change later
- **Computed availability** — `availableSeats` is not stored; computed as `totalSeats - bookedCount` at query time to prevent desync
- **Polymorphic reviews** — single `Review` model handles hotel, package, and destination reviews via `targetType` enum
- **Named Prisma relations** — disambiguates multiple foreign keys pointing at `Profile` (`CustomerBookings` vs `AgentBookings`)

---

## Authentication

Authentication is handled entirely by **Supabase Auth**. The backend verifies JWTs on protected routes and fetches the user's role from the `Profile` table.

### How it works

1. Client signs in via Supabase → receives `access_token` + `refresh_token`
2. Client sends `Authorization: Bearer <access_token>` on every protected request
3. `auth.middleware.js` verifies the token with Supabase, fetches the `Profile` for role
4. `req.user` is populated with `{ id, email, role, fullName }`
5. `role.middleware.js` guards admin/agent routes

### Supabase profile trigger

A Postgres trigger auto-creates a `Profile` row in your public schema whenever a new user signs up in `auth.users`:

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

| Method | Endpoint          | Auth | Description                             |
| ------ | ----------------- | ---- | --------------------------------------- |
| POST   | `/register`       | —    | Create a new account                    |
| POST   | `/login`          | —    | Sign in, returns access + refresh token |
| POST   | `/logout`         | —    | Invalidate current session              |
| POST   | `/reset-password` | —    | Send password reset email               |
| GET    | `/profile`        | ✅   | Get authenticated user's profile        |
| PATCH  | `/profile`        | ✅   | Update authenticated user's profile     |

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

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:

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

#### Query parameters for GET `/`

| Param     | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `search`  | string | Full-text search on name and description      |
| `country` | string | Filter by country                             |
| `tags`    | string | Comma-separated tags e.g. `beach,adventure`   |
| `limit`   | number | Results per page (1–50, default 12)           |
| `cursor`  | uuid   | Cursor for next page (from previous response) |

#### Example requests

```bash
# List all
curl http://localhost:5000/api/destinations

# Search
curl "http://localhost:5000/api/destinations?search=goa&tags=beach,nightlife"

# Paginate
curl "http://localhost:5000/api/destinations?cursor=<last-id>&limit=12"

# Create (admin)
curl -X POST http://localhost:5000/api/destinations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Goa","country":"India","tags":["beach","nightlife"],"images":[]}'

# Submit review
curl -X POST http://localhost:5000/api/destinations/<id>/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"body":"Absolutely stunning destination!"}'
```

---

## 🛡️ Middleware

### `requireAuth`

Verifies the Supabase JWT and attaches `req.user` with role. Applied to all protected routes.

### `requireRole(...roles)`

Role guard applied after `requireAuth`. Accepts one or more roles:

```javascript
// Single role
router.post("/", requireAuth, requireRole("ADMIN"), controller);

// Multiple roles
router.patch("/:id", requireAuth, requireRole("ADMIN", "AGENT"), controller);
```

### `errorHandler`

Global error handler — must be registered last in `index.js`. Handles:

| Error type                       | HTTP Status | Response                                  |
| -------------------------------- | ----------- | ----------------------------------------- |
| Zod validation error             | 400         | `{ error, issues: [{ field, message }] }` |
| Prisma unique constraint (P2002) | 409         | `{ error: "already exists" }`             |
| Prisma not found (P2025)         | 404         | `{ error: "not found" }`                  |
| Custom `{ status, message }`     | as set      | `{ error: message }`                      |
| Unhandled                        | 500         | `{ error: "Internal server error" }`      |

---

## 📦 Modules Status

| Module         | Status      | Notes                                 |
| -------------- | ----------- | ------------------------------------- |
| Auth & Users   | ✅ Complete | Register, login, logout, profile CRUD |
| Destinations   | ✅ Complete | CRUD, search, pagination, reviews     |
| Hotels & Rooms | 🔜 Next     | —                                     |
| Transport      | 🔜 Planned  | —                                     |
| Packages       | 🔜 Planned  | —                                     |
| Bookings       | 🔜 Planned  | —                                     |
| Payments       | 🔜 Planned  | Stripe / Razorpay integration         |

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
3. Extract **Bookings** into its own service with **BullMQ** job queue for async confirmation emails
4. Migrate DB to dedicated **RDS instance** with read replicas
5. Split monolith into **microservices** per module

---

## 📋 Development Scripts

```bash
npm run dev            # start with nodemon (hot reload)
npm run start          # production start
npx prisma db push     # sync schema to database (dev)
npx prisma migrate dev # create a tracked migration
npx prisma studio      # open visual DB browser at :5555
npx prisma generate    # regenerate Prisma Client after schema changes
```

---

## 🔒 Security Notes

- Supabase **service role key** is only used server-side — never exposed to the client
- Supabase Auth handles password hashing, token rotation, and OAuth
- `helmet()` sets secure HTTP headers on all responses
- `cors()` is restricted to `FRONTEND_URL` only
- Passwords reset via Supabase — no custom reset token logic needed
- Soft delete on `Booking` and `Profile` ensures financial records are never permanently lost
- Role is stored in your own `Profile` table, not the Supabase JWT — prevents privilege escalation via token manipulation

---

_Built with ❤️ — solo developer, zero budget, production-ready architecture._
