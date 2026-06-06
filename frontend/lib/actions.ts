"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDestinations() {
  revalidatePath("/");
  revalidatePath("/destinations");
}
