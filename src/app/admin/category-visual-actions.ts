"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/app/action-state";
import { upsertCategoryVisualSetting } from "@/lib/category-visual-settings";
import { recordAudit } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

const colorPattern = /^#[0-9a-fA-F]{6}$/;

const visualSchema = z.object({
  categoryId: z.string().min(1),
  symbolKey: z.string().min(1).max(80),
  motif: z.enum(["helix", "tool", "graph", "system", "shield", "spark", "prism"]),
  primaryColor: z.string().regex(colorPattern),
  secondaryColor: z.string().regex(colorPattern),
  tertiaryColor: z.string().regex(colorPattern),
  backgroundColor: z.string().regex(colorPattern),
  customSvg: z.string().max(6000).optional(),
  note: z.string().max(1000).optional(),
});

function flattenErrors(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fieldErrors).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])));
}

async function requireAdmin() {
  const viewer = await getViewerSession();
  if (!viewer) throw new Error("Sign in as an administrator.");
  if (!["owner", "admin", "moderator"].includes(viewer.account.systemRole)) throw new Error("Admin privileges are required.");
  return viewer;
}

export async function updateCategoryVisualAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let viewer: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    viewer = await requireAdmin();
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Admin privileges are required." };
  }

  const parsed = visualSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "Fix the highlighted category visual fields.", fieldErrors: flattenErrors(parsed.error) };
  }

  try {
    await upsertCategoryVisualSetting({ ...parsed.data, updatedBy: viewer.account.id });
    await recordAudit({
      accountId: viewer.account.id,
      action: "category.visual.updated",
      detail: `Updated category visual ${parsed.data.categoryId}`,
      metadata: { motif: parsed.data.motif, symbolKey: parsed.data.symbolKey },
    });
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to update category visual." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/kens");
  return { status: "success", message: "Category visual saved and public symbols revalidated." };
}
