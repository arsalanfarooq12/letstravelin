import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as bookingsController from "./bookings.controller.js";

const router = Router();

// ─── User routes ──────────────────────────────────────────────────
router.post("/", requireAuth, bookingsController.createBooking);
router.get("/my", requireAuth, bookingsController.getMyBookings);
router.get("/:id", requireAuth, bookingsController.getBookingById);
router.patch("/:id/cancel", requireAuth, bookingsController.cancelBooking);

// ─── Agent routes ─────────────────────────────────────────────────
router.get(
  "/managed",
  requireAuth,
  requireRole("AGENT", "ADMIN"),
  bookingsController.getManagedBookings
);
router.patch(
  "/:id/paid",
  requireAuth,
  requireRole("AGENT", "ADMIN"),
  bookingsController.markBookingPaid
);
router.patch(
  "/:id/completed",
  requireAuth,
  requireRole("AGENT", "ADMIN"),
  bookingsController.markBookingCompleted
);

// ─── Admin routes ─────────────────────────────────────────────────
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  bookingsController.getAllBookings
);
router.patch(
  "/:id/assign",
  requireAuth,
  requireRole("ADMIN"),
  bookingsController.assignAgent
);

export default router;
