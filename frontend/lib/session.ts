"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * SESSION CONFIGURATION
 * These constants define the cookie keys and security settings used
 * to persist the Supabase auth state on the Next.js server.
 */
const ACCESS_TOKEN = "lt_access";
const REFRESH_TOKEN = "lt_refresh";
const PROFILE = "lt_profile";

const COOKIE_OPTS = {
  httpOnly: true, // Prevents JS access (XSS protection)
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax" as const, // CSRF protection
  path: "/",
};

export type Profile = {
  id: string;
  fullName: string;
  role: "USER" | "AGENT" | "ADMIN";
};

/**
 * Persists the user session by setting HTTP-only cookies.
 * Should be called immediately after a successful Supabase login.
 */
export async function createSession(
  accessToken: string,
  refreshToken: string,
  profile: Profile
) {
  const jar = await cookies();

  // Access token is short-lived for security (1 hour)
  jar.set(ACCESS_TOKEN, accessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 });

  // Refresh token and Profile are kept for 7 days to allow auto-login
  jar.set(REFRESH_TOKEN, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });

  jar.set(PROFILE, JSON.stringify(profile), {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 7,
  });
  // Non-HttpOnly cookie — readable by JS for Supabase Storage uploads only
  jar.set("lt_token_readable", accessToken, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60, // 1h — matches access token lifetime
    httpOnly: false, // intentionally readable by JS
  });
}

/**
 * Retrieves the current session from cookies.
 * Returns null if the user is unauthenticated or data is corrupted.
 */
export async function getSession(): Promise<{
  accessToken: string;
  profile: Profile;
} | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN)?.value;
  const profileRaw = jar.get(PROFILE)?.value;

  if (!accessToken || !profileRaw) return null;

  try {
    const profile = JSON.parse(profileRaw) as Profile;
    return { accessToken, profile };
  } catch (error) {
    console.error("Session parsing failed:", error);
    return null;
  }
}

/**
 * Logs the user out by clearing all auth-related cookies.
 */
export async function deleteSession() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN);
  jar.delete(REFRESH_TOKEN);
  jar.delete(PROFILE);
}

/**
 * Route Guard: Use this at the top of Server Components or Actions.
 * Instantly redirects to /login if no valid session is found.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
