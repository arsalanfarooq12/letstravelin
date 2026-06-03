import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/reset-password", authController.requestPasswordReset);

// Protected routes — requireAuth validates the JWT first
router.get("/profile", requireAuth, authController.getProfile);
router.patch("/profile", requireAuth, authController.updateProfile);

export default router;
