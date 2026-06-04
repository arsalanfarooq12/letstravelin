import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as hotelsController from "./hotels.controller.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────
router.get("/", hotelsController.getAllHotels);
router.get("/:id", hotelsController.getHotelById);
router.get("/:id/availability", hotelsController.checkHotelAvailability);
router.get("/:id/rooms", hotelsController.getRoomsByHotel);
router.get(
  "/:id/rooms/:roomId/availability",
  hotelsController.checkRoomAvailability
);
router.get("/:id/reviews", hotelsController.getHotelReviews);

// ─── Authenticated ────────────────────────────────────────────────
router.post("/:id/reviews", requireAuth, hotelsController.createReview);
router.delete(
  "/:id/reviews/:reviewId",
  requireAuth,
  hotelsController.deleteReview
);

// ─── Agent + Admin only ───────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  hotelsController.createHotel
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  hotelsController.updateHotel
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"), // only ADMIN can hard delete
  hotelsController.deleteHotel
);

// ─── Rooms — Agent + Admin only ───────────────────────────────────
router.post(
  "/:id/rooms",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  hotelsController.createRoom
);
router.patch(
  "/:id/rooms/:roomId",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  hotelsController.updateRoom
);
router.delete(
  "/:id/rooms/:roomId",
  requireAuth,
  requireRole("ADMIN"),
  hotelsController.deleteRoom
);

export default router;
