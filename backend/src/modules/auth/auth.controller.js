import * as authService from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

export async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json({ message: "Account created", ...result });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    await authService.logout(token);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const body = updateProfileSchema.parse(req.body);
    const profile = await authService.updateProfile(req.user.id, body);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = resetPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    // Always return 200 even if email doesn't exist — prevents user enumeration
    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
}
