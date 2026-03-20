"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type ActionState } from "@/app/action-state";
import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
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

const proposalSchema = z.object({
  title: z.string().min(8, "Give the Ken a specific title."),
  categorySlug: z.string().min(1, "Choose a category."),
  summary: z.string().min(30, "Summarize what the Ken will produce in one or two clear sentences."),
  problem: z.string().min(40, "Describe the bottleneck or unmet need."),
  whyNow: z.string().min(30, "Explain why this Ken matters now."),
  publicBenefit: z.string().min(30, "Describe the public, community, or ecosystem upside."),
  requestedTier: z.enum(["days", "weeks", "months"]),
  deliverables: z.string().min(10, "List at least one deliverable."),
  evaluationCriteria: z.string().min(10, "List at least one evaluation check."),
  riskFlags: z.string().min(10, "List at least one risk or operating constraint."),
  evidence: z.string().min(10, "List at least one evidence source or anchor."),
  enterprisePackaging: z.string().min(20, "Explain the optional service or institutional packaging path."),
  dataValueNote: z.string().min(20, "Explain what corrections, provenance, or evaluation data this Ken could generate."),
});

const voteSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  voteCount: z.coerce.number().int().min(0).max(MAX_VOTES_PER_TASK),
  rationale: z.string().max(280, "Keep the rationale concise.").optional(),
});

const pulseSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), "Invalid vote value."),
});

const commentSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().min(20, "Comments should be specific and useful."),
  stakeCredits: z.coerce.number().int().min(1).max(3),
});

const commentVoteSchema = z.object({
  commentId: z.string().min(1),
  slug: z.string().min(1),
  value: z.coerce.number().int().refine((value) => [-1, 0, 1].includes(value), "Invalid vote value."),
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(10, "Passwords must be at least 10 characters."),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Enter the name other contributors should see."),
  role: z.string().min(2, "Describe your current role."),
  specialty: z.string().min(2, "Describe your strongest area of practice."),
  bio: z.string().min(24, "Write a short but useful contributor bio."),
});

function splitLines(input: string) {
  return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function flattenFieldErrors(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])),
  );
}

async function requireViewerProfileId() {
  const profileId = await getViewerProfileId();
  if (!profileId) {
    throw new Error("Sign in to vote, comment, or submit a Ken.");
  }
  return profileId;
}

function revalidateCorePaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/kens");
  revalidatePath("/tasks");
  revalidatePath("/governance");
  revalidatePath("/economics");
  revalidatePath("/submit");
  if (slug) {
    revalidatePath(`/kens/${slug}`);
    revalidatePath(`/tasks/${slug}`);
  }
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));
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
      message: "Your contributor profile needs a few fixes.",
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

  revalidateCorePaths();
  redirect("/");
}

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
      message: "This Ken needs a few fixes before it can enter review.",
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
    redirect(`/kens/${slug}`);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to submit the Ken.",
    };
  }
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The voice allocation was invalid." };
  }

  try {
    await saveVote(parsed.data.taskId, await requireViewerProfileId(), parsed.data.voteCount, parsed.data.rationale?.trim() ?? "");
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save your voice allocation." };
  }

  revalidateCorePaths(parsed.data.slug);
  return {
    status: "success",
    message: parsed.data.voteCount === 0 ? "Voice allocation cleared." : "Voice allocation updated.",
  };
}

export async function saveTaskPulseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = pulseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The public vote was invalid." };
  }

  try {
    await saveTaskPulse(parsed.data.taskId, await requireViewerProfileId(), parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save the public vote." };
  }

  revalidateCorePaths(parsed.data.slug);
  return {
    status: "success",
    message:
      parsed.data.value === 1
        ? "Support recorded."
        : parsed.data.value === -1
          ? "Concern recorded."
          : "Public vote cleared.",
  };
}

export async function createCommentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Comments should be specific and useful.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    await createComment({
      taskId: parsed.data.taskId,
      profileId: await requireViewerProfileId(),
      parentId: parsed.data.parentId?.trim() || null,
      body: parsed.data.body.trim(),
      stakeCredits: parsed.data.stakeCredits,
    });
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to post the comment." };
  }

  revalidateCorePaths(parsed.data.slug);
  return { status: "success", message: "Comment posted." };
}

export async function saveCommentVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = commentVoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The comment vote was invalid." };
  }

  try {
    await saveCommentVote(parsed.data.commentId, await requireViewerProfileId(), parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Unable to save the comment vote." };
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
