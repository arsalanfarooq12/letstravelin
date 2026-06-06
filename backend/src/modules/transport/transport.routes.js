import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as transportController from "./transport.controller.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────
router.get("/", transportController.getAllTransports);
router.get("/:id", transportController.getTransportById);
router.get("/:id/availability", transportController.getSeatAvailability);

// ─── Authenticated ────────────────────────────────────────────────
// validate before booking — called by frontend before creating a booking
router.post("/validate", requireAuth, transportController.validateBooking);

// ─── Agent + Admin only ───────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  transportController.createTransport
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  transportController.updateTransport
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  transportController.deleteTransport
);

export default router;
