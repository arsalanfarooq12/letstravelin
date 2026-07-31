import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import destinationsRouter from "./modules/destinations/destinations.routes.js";
import transportRouter from "./modules/transport/transport.routes.js";
import packagesRouter from "./modules/packages/packages.routes.js";
import hotelsRouter from "./modules/hotels/hotels.routes.js";
import bookingsRouter from "./modules/bookings/bookings.routes.js";
dotenv.config();

const app = express();
app.set("trust proxy", 1); // trust first proxy (if behind a reverse proxy like Nginx or Heroku)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // cache preflight for 24 hours
  })
);
// Force HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // max 200 requests per window per IP
  standardHeaders: "draft-7", // return RateLimit headers in response
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ── Auth rate limiter — stricter on login/register ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // max 10 attempts per window per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again in 15 minutes." },
});

// ── Booking rate limiter — prevent booking spam ───
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // max 20 bookings per hour per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Booking limit reached, please try again later." },
});

// Logging

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined")); // apache-style logs for production log aggregators
}
// Parse incoming JSON and URL-encoded data with a size limit of
// 10kb to prevent large payload attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/destinations", destinationsRouter);
app.use("/api/hotels", hotelsRouter);
app.use("/api/transport", transportRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/bookings", bookingLimiter, bookingsRouter);
// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Graceful shutdown is important for production environments, especially when using
// connection pools or other resources that need to be cleaned up before the process exits.
// This ensures that all ongoing requests are completed and resources are released properly.
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("DB disconnected. Process exiting.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
