"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/app/action-state";
import { publicWritesOpen } from "@/lib/db";
import { toggleKenBookmark } from "@/lib/ken-bookmarks";
import { guardMutationRequest } from "@/lib/security";
import { getViewerProfileId } from "@/lib/session";

const kenBookmarkSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
});

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function toggleKenBookmarkAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await getViewerProfileId() ?? "";
    if (!profileId) throw new Error("Sign in to save Kens.");
    if (!(await publicWritesOpen())) throw new Error("KenMatch is in maintenance mode. Public writes are paused.");
    await guardMutationRequest({
      action: "ken-bookmark",
      actorId: profileId,
      formData,
      rateLimit: { scope: "ken-bookmark", limit: 120, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: messageFor(error, "Unable to save Ken.") };
  }

  const parsed = kenBookmarkSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Invalid Ken bookmark." };

  try {
    const saved = await toggleKenBookmark({ profileId, taskId: parsed.data.taskId });
    revalidatePath("/account");
    revalidatePath("/kens");
    revalidatePath(`/kens/${parsed.data.slug}`);
    return { status: "success", message: saved ? "Ken saved." : "Ken removed from saved." };
  } catch (error) {
    return { status: "error", message: messageFor(error, "Unable to save Ken.") };
  }
}
