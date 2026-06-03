import { supabase } from "../../lib/supabase.js";
import { prisma } from "../../lib/prisma.js";

// Register a new user via Supabase Auth
export async function register({ email, password, fullName }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm for now; switch off in production
    user_metadata: { fullName },
  });

  if (error) throw { status: 400, message: error.message };

  // Profile row is auto-created by the Supabase trigger we set up in the DB
  // but we return the profile here for convenience
  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });

  return { user: data.user, profile };
}

// Sign in — returns Supabase session (access + refresh token)
export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw { status: 401, message: "Invalid email or password" };

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user,
    profile,
  };
}

// Sign out — invalidates the session on Supabase side
export async function logout(accessToken) {
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) throw { status: 400, message: error.message };
}

// Get profile for the authenticated user
export async function getProfile(userId) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (!profile) throw { status: 404, message: "Profile not found" };
  return profile;
}

// Update profile fields
export async function updateProfile(userId, data) {
  return prisma.profile.update({
    where: { id: userId },
    data,
  });
}

// Send password reset email via Supabase
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });
  if (error) throw { status: 400, message: error.message };
}
