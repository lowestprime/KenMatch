"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
import { createProposal, saveVote } from "@/lib/db";
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

function splitLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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
  const store = await cookies();
  const profileId = store.get(ACTIVE_PROFILE_COOKIE)?.value ?? "maya-chen";
  const parsed = proposalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(parsed.error.flatten().fieldErrors).flatMap(([key, value]) => (value?.[0] ? [[key, value[0]]] : [])),
    );

    return {
      status: "error",
      message: "The proposal needs a few fixes before it can enter review.",
      fieldErrors,
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
  redirect(`/tasks/${slug}`);
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const store = await cookies();
  const profileId = store.get(ACTIVE_PROFILE_COOKIE)?.value ?? "maya-chen";
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

  return {
    status: "success",
    message: parsed.data.voteCount === 0 ? "Vote allocation cleared." : "Vote allocation updated.",
  };
}