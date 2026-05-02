"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/app/action-state";
import {
  createDiscussionComment,
  createDiscussionPost,
  saveDiscussionVote,
  toggleSavedItem,
  type DiscussionTargetType,
  type SavedItemType,
} from "@/lib/discussion-db";
import { publicWritesOpen } from "@/lib/db";
import { guardMutationRequest } from "@/lib/security";
import { getViewerProfileId } from "@/lib/session";

const postSchema = z.object({
  title: z.string().min(10, "Give the discussion a specific title.").max(160),
  topic: z.string().min(3, "Choose a topic.").max(60),
  bodyMarkdown: z.string().min(40, "Explain the idea, question, evidence, or proposal clearly.").max(8000),
});

const commentSchema = z.object({
  postId: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
  bodyMarkdown: z.string().min(12, "Add a substantive comment.").max(4000),
});

const voteSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), "Invalid vote."),
});

const saveSchema = z.object({
  itemType: z.enum(["discussion_post", "discussion_comment"]),
  itemId: z.string().min(1),
  slug: z.string().min(1),
});

function fieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flattened).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireViewer() {
  const profileId = await getViewerProfileId();
  if (!profileId) throw new Error("Sign in to participate in discussion.");
  if (!(await publicWritesOpen())) throw new Error("KenMatch is in maintenance mode. Public writes are paused.");
  return profileId;
}

export async function createDiscussionPostAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewer();
    await guardMutationRequest({
      action: "discussion-post",
      actorId: profileId,
      formData,
      rateLimit: { scope: "discussion-post", limit: 8, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to create discussion.") };
  }

  const parsed = postSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Fix the highlighted discussion fields.", fieldErrors: fieldErrors(parsed.error) };

  let slug = "";
  try {
    const created = await createDiscussionPost({ profileId, ...parsed.data });
    slug = created.slug;
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to create discussion.") };
  }
  revalidatePath("/discuss");
  redirect(`/discuss/${slug}`);
}

export async function createDiscussionCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewer();
    await guardMutationRequest({
      action: "discussion-comment",
      actorId: profileId,
      formData,
      rateLimit: { scope: "discussion-comment", limit: 40, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to add comment.") };
  }

  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Fix the highlighted comment fields.", fieldErrors: fieldErrors(parsed.error) };

  try {
    await createDiscussionComment({
      profileId,
      postId: parsed.data.postId,
      parentId: parsed.data.parentId || null,
      bodyMarkdown: parsed.data.bodyMarkdown,
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to add comment.") };
  }
  revalidatePath("/discuss");
  revalidatePath(`/discuss/${parsed.data.slug}`);
  return { status: "success", message: "Comment added." };
}

export async function discussionVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewer();
    await guardMutationRequest({ action: "discussion-vote", actorId: profileId, formData, rateLimit: { scope: "discussion-vote", limit: 120, windowSeconds: 10 * 60 } });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to vote.") };
  }

  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Invalid vote." };
  try {
    await saveDiscussionVote({
      profileId,
      targetType: parsed.data.targetType as DiscussionTargetType,
      targetId: parsed.data.targetId,
      value: parsed.data.value as -1 | 0 | 1,
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to vote.") };
  }
  revalidatePath("/discuss");
  revalidatePath(`/discuss/${parsed.data.slug}`);
  return { status: "success", message: "Vote saved." };
}

export async function toggleSavedDiscussionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewer();
    await guardMutationRequest({ action: "discussion-save", actorId: profileId, formData, rateLimit: { scope: "discussion-save", limit: 120, windowSeconds: 10 * 60 } });
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to save item.") };
  }
  const parsed = saveSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Invalid saved item." };
  try {
    const saved = await toggleSavedItem({
      profileId,
      itemType: parsed.data.itemType as SavedItemType,
      itemId: parsed.data.itemId,
    });
    revalidatePath("/account");
    revalidatePath("/discuss");
    revalidatePath(`/discuss/${parsed.data.slug}`);
    return { status: "success", message: saved ? "Saved." : "Removed from saved." };
  } catch (error) {
    return { status: "error", message: errorMessage(error, "Unable to save item.") };
  }
}
