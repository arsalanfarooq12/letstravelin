"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("lt_access")?.value ?? null;
}

export async function updateAvatarUrl(
  url: string
): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatarUrl: url }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Failed to update avatar" };
    revalidatePath("/dashboard");
    return {};
  } catch {
    return { error: "Network error" };
  }
}
