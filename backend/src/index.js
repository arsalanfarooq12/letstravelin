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

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));

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
app.use(morgan("dev"));
app.use(express.json());

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
