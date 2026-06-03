import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as destinationsController from "./destinations.controller.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────
router.get("/", destinationsController.getAllDestinations);
router.get("/:id", destinationsController.getDestinationById);
router.get("/:id/reviews", destinationsController.getDestinationReviews);

// ─── Authenticated routes ─────────────────────────────────────────
router.post("/:id/reviews", requireAuth, destinationsController.createReview);
router.delete(
  "/:id/reviews/:reviewId",
  requireAuth,
  destinationsController.deleteReview
);

// ─── Admin only routes ────────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  destinationsController.createDestination
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  destinationsController.updateDestination
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  destinationsController.deleteDestination
);

export default router;
