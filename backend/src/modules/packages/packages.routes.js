import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as packagesController from "./packages.controller.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────
router.get("/", packagesController.getAllPackages);
router.get("/:id", packagesController.getPackageById);
router.get("/:id/items", packagesController.getPackageItems);

// ─── Authenticated ────────────────────────────────────────────────
router.post(
  "/validate",
  requireAuth,
  packagesController.validatePackageAvailability
);

// ─── Agent + Admin only ───────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  packagesController.createPackage
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  packagesController.updatePackage
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  packagesController.deletePackage
);
router.post(
  "/:id/items",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  packagesController.addPackageItem
);
router.delete(
  "/:id/items/:itemId",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  packagesController.removePackageItem
);

export default router;
