"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type ActionState } from "@/app/action-state";
import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
<<<<<<< HEAD
import {
  authenticateAccount,
  createAccount,
  createComment,
  createProposal,
  createSession,
  deleteSessionByToken,
  saveCommentVote,
  saveTaskPulse,
  saveVote,
} from "@/lib/db";
import { env } from "@/lib/env";
import {
  clearViewerSessionCookie,
  getViewerProfileId,
  getViewerToken,
  getViewerSession,
  setViewerSessionCookie,
} from "@/lib/session";
=======
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
>>>>>>> origin/main

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
  enterprisePackaging: z.string().min(20, "Describe how this could be packaged for institutions without compromising the public-good output."),
  dataValueNote: z.string().min(20, "Describe what preference, correction, or provenance data this task might generate."),
});

const voteSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  voteCount: z.coerce.number().int().min(0).max(MAX_VOTES_PER_TASK),
  rationale: z.string().max(280, "Keep the rationale concise.").optional(),
});

<<<<<<< HEAD
const pulseSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), "Invalid pulse value."),
=======
const pulseVoteSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().min(-1).max(1),
>>>>>>> origin/main
});

const commentSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
<<<<<<< HEAD
  body: z.string().min(20, "Comments should be substantive and specific."),
  stakeCredits: z.coerce.number().int().min(1).max(3),
=======
  body: z.string().trim().min(12, "Comments should make a concrete point.").max(1500, "Keep comments under 1,500 characters."),
>>>>>>> origin/main
});

const commentVoteSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
<<<<<<< HEAD
  value: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), "Invalid vote value."),
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(10, "Passwords must be at least 10 characters."),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Enter the name you want other contributors to see."),
  role: z.string().min(2, "Describe your current role."),
  specialty: z.string().min(2, "Describe your strongest area of expertise."),
  bio: z.string().min(24, "Write a short but useful contributor bio."),
=======
  value: z.coerce.number().int().min(-1).max(1),
>>>>>>> origin/main
});

function splitLines(input: string) {
  return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

<<<<<<< HEAD
function flattenFieldErrors(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])),
=======
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
>>>>>>> origin/main
  );
}

async function requireViewerProfileId() {
  const profileId = await getViewerProfileId();
  if (!profileId) {
    throw new Error("Sign in to participate in public curation.");
  }
  return profileId;
}

function revalidateCorePaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/governance");
  revalidatePath("/economics");
<<<<<<< HEAD
  revalidatePath("/submit");
  if (slug) {
    revalidatePath(`/tasks/${slug}`);
  }
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));
=======
  redirect(`/tasks/${slug}`);
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const profileId = await activeProfileId();
  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));

>>>>>>> origin/main
  if (!parsed.success) {
    return {
      status: "error",
      message: "Fix the highlighted sign-in fields.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  const account = await authenticateAccount(parsed.data.email, parsed.data.password);
  if (!account) {
    return {
      status: "error",
      message: "Email or password was incorrect.",
    };
  }

  const session = await createSession(account.id);
  await setViewerSessionCookie(session.token);
  revalidateCorePaths();
  redirect("/");
}

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!env.KENMATCH_ALLOW_SIGNUPS) {
    return {
      status: "error",
      message: "Public signups are disabled in this deployment.",
    };
  }

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "The contributor profile needs a few fixes.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    const created = await createAccount(parsed.data);
    const session = await createSession(created.accountId);
    await setViewerSessionCookie(session.token);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create account.",
    };
  }

<<<<<<< HEAD
  revalidateCorePaths();
  redirect("/");
}
=======
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${parsed.data.slug}`);
  revalidatePath("/governance");
  revalidatePath("/economics");
>>>>>>> origin/main

export async function signOutAction() {
  const token = await getViewerToken();
  if (token) {
    await deleteSessionByToken(token);
  }
  await clearViewerSessionCookie();
  revalidateCorePaths();
  redirect("/");
}

export async function createProposalAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = proposalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "The proposal needs a few fixes before it can enter review.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    const slug = await createProposal(
      {
        ...parsed.data,
        deliverables: splitLines(parsed.data.deliverables),
        evaluationCriteria: splitLines(parsed.data.evaluationCriteria),
        riskFlags: splitLines(parsed.data.riskFlags),
        evidence: splitLines(parsed.data.evidence),
      },
      await requireViewerProfileId(),
    );

    revalidateCorePaths(slug);
    redirect(`/tasks/${slug}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to submit proposal.",
    };
  }
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The vote input was invalid." };
  }

  try {
    await saveVote(parsed.data.taskId, await requireViewerProfileId(), parsed.data.voteCount, parsed.data.rationale?.trim() ?? "");
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save vote." };
  }

  revalidateCorePaths(parsed.data.slug);
  return {
    status: "success",
<<<<<<< HEAD
    message: parsed.data.voteCount === 0 ? "Quadratic allocation cleared." : "Quadratic allocation updated.",
  };
}

export async function saveTaskPulseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = pulseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The pulse vote was invalid." };
  }

  try {
    await saveTaskPulse(parsed.data.taskId, await requireViewerProfileId(), parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save pulse vote." };
  }

  revalidateCorePaths(parsed.data.slug);
  return {
    status: "success",
    message:
      parsed.data.value === 1
        ? "Public curation signal recorded as supportive."
        : parsed.data.value === -1
          ? "Public curation signal recorded as critical."
          : "Public curation signal cleared.",
  };
}

export async function createCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Comments should be specific and substantial.",
      fieldErrors: flattenFieldErrors(parsed.error),
=======
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
>>>>>>> origin/main
    };
  }

  try {
<<<<<<< HEAD
    await createComment({
      taskId: parsed.data.taskId,
      profileId: await requireViewerProfileId(),
      parentId: parsed.data.parentId?.trim() || null,
      body: parsed.data.body.trim(),
      stakeCredits: parsed.data.stakeCredits,
    });
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to post comment." };
  }

  revalidateCorePaths(parsed.data.slug);
  return { status: "success", message: "Comment posted to the public thread." };
}

export async function saveCommentVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = commentVoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The comment vote was invalid." };
  }

  try {
    await saveCommentVote(parsed.data.commentId, await requireViewerProfileId(), parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save comment vote." };
  }

  revalidateCorePaths(parsed.data.slug);
  return { status: "success", message: "Comment score updated." };
}

export async function getAuthBannerState() {
  const session = await getViewerSession();
  return session
    ? { signedIn: true, name: session.profile.name }
    : { signedIn: false, signupsEnabled: env.KENMATCH_ALLOW_SIGNUPS };
}



=======
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

>>>>>>> origin/main
