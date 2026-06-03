// src/middleware/auth.middleware.js
import { supabase } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed token" });
    }

    const token = authHeader.split("Bearer ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // fetch role from your Profile table
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, role: true, deletedAt: true },
    });

    if (!profile || profile.deletedAt) {
      return res
        .status(401)
        .json({ error: "Account not found or deactivated" });
    }

    req.user = { ...user, role: profile.role, fullName: profile.fullName };
    next();
  } catch (err) {
    next(err);
  }
}
