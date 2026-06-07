"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("lt_access")?.value ?? null;
}

export async function cancelBooking(id: string): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings/${id}/cancel`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Failed to cancel booking" };
    revalidatePath("/bookings/my");
    return {};
  } catch {
    return { error: "Network error" };
  }
}

export async function createBooking(
  payload: unknown
): Promise<{ data?: unknown; error?: string }> {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Failed to create booking" };
    revalidatePath("/bookings/my");
    return { data };
  } catch {
    return { error: "Network error" };
  }
}
