"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
import { createComment, createProposal, saveCommentVote, saveTaskPulseVote, saveVote } from "@/lib/db";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/session";

export interface ActionState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string>;
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

const proposalSchema = z.object({
  title: z.string().min(8, "Give the proposal a specific title."),
  categorySlug: z.string().min(1, "Choose a category."),
  summary: z.string().min(30, "Summaries should explain the work in one or two clear sentences."),
  problem: z.string().min(40, "Describe the bottleneck or unmet need."),
  whyNow: z.string().min(30, "Explain why this work matters now."),
  publicBenefit: z.string().min(30, "Describe the public or ecosystem upside."),
  requestedTier: z.enum(["days", "weeks", "months"]),
  qualityBondCredits: z.coerce.number().int().min(1).max(6),
  deliverables: z.string().min(10, "List at least one deliverable."),
  evaluationCriteria: z.string().min(10, "List at least one evaluation criterion."),
  riskFlags: z.string().min(10, "List at least one risk or constraint."),
  evidence: z.string().min(10, "List at least one evidence source or anchor."),
});

const voteSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  voteCount: z.coerce.number().int().min(0).max(MAX_VOTES_PER_TASK),
  rationale: z.string().max(280, "Keep the rationale concise.").optional(),
});

const pulseVoteSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().min(-1).max(1),
});

const commentSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().trim().min(12, "Comments should make a concrete point.").max(1500, "Keep comments under 1,500 characters."),
});

const commentVoteSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().min(-1).max(1),
});

function splitLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function fieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(flattened).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])),
  );
}

async function activeProfileId() {
  const store = await cookies();
  return store.get(ACTIVE_PROFILE_COOKIE)?.value ?? "maya-chen";
}

export async function setActiveProfileAction(profileId: string) {
  const store = await cookies();
  store.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/");
}

export async function createProposalAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = proposalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "The proposal needs a few fixes before it can enter review.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const payload = parsed.data;
  const slug = createProposal(
    {
      ...payload,
      deliverables: splitLines(payload.deliverables),
      evaluationCriteria: splitLines(payload.evaluationCriteria),
      riskFlags: splitLines(payload.riskFlags),
      evidence: splitLines(payload.evidence),
    },
    profileId,
  );

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/governance");
  revalidatePath("/economics");
  redirect(`/tasks/${slug}`);
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "The vote input was invalid.",
    };
  }

  try {
    saveVote(parsed.data.taskId, profileId, parsed.data.voteCount, parsed.data.rationale?.trim() ?? "");
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save vote.",
    };
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${parsed.data.slug}`);
  revalidatePath("/governance");
  revalidatePath("/economics");

  return {
    status: "success",
    message: parsed.data.voteCount === 0 ? "Allocation cleared." : "Allocation updated.",
  };
}

export async function saveTaskPulseVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = pulseVoteSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "The pulse vote input was invalid.",
    };
  }

  try {
    saveTaskPulseVote(parsed.data.taskId, profileId, parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save public vote.",
    };
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${parsed.data.slug}`);
  revalidatePath("/governance");

  return {
    status: "success",
    message:
      parsed.data.value === 0 ? "Public vote removed." : parsed.data.value > 0 ? "Task upvoted." : "Task downvoted.",
  };
}

export async function createCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "The comment could not be posted.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    createComment(parsed.data.taskId, profileId, parsed.data.body, parsed.data.parentId?.trim() || null);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to post comment.",
    };
  }

  revalidatePath(`/tasks/${parsed.data.slug}`);
  revalidatePath("/tasks");

  return {
    status: "success",
    message: parsed.data.parentId ? "Reply posted." : "Comment posted.",
  };
}

export async function saveCommentVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = commentVoteSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      status: "error",
      message: "The comment vote input was invalid.",
    };
  }

  try {
    saveCommentVote(parsed.data.commentId, profileId, parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save comment vote.",
    };
  }

  revalidatePath(`/tasks/${parsed.data.slug}`);

  return {
    status: "success",
    message:
      parsed.data.value === 0 ? "Comment vote removed." : parsed.data.value > 0 ? "Comment upvoted." : "Comment downvoted.",
  };
}

