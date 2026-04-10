"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type ActionState } from "@/app/action-state";
import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
import {
  authenticateAccount,
  bindSponsorshipCheckoutSession,
  changePassword,
  createAccount,
  createComment,
  createProposal,
  createSponsorshipCommitment,
  createSession,
  deleteSessionByToken,
  logSecurityEvent,
  resolveSponsorRestrictionTarget,
  saveCommentVote,
  saveTaskPulse,
  saveVote,
  toggleBookmark,
  updateLicensingConsent,
  updateProfile,
} from "@/lib/db";
import { env } from "@/lib/env";
import { guardMutationRequest, turnstileConfigured } from "@/lib/security";
import {
  clearViewerSessionCookie,
  getViewerProfileId,
  getViewerSession,
  getViewerToken,
  setViewerSessionCookie,
} from "@/lib/session";
import { getStripeClient, stripeEnabled } from "@/lib/stripe";
import type { AccountRecord, SponsorType } from "@/lib/types";

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
  password: z.string().min(12, "Passwords must be at least 12 characters."),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Enter the name other contributors should see."),
  role: z.string().min(2, "Describe your current role."),
  specialty: z.string().min(2, "Describe your strongest area of practice."),
  bio: z.string().min(24, "Write a short but useful contributor bio."),
  confirmPassword: z.string().min(12, "Confirm the password."),
  licensingConsent: z.enum(["audit-only", "allow-screened-licensing"]).default("audit-only"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match.",
});

const sponsorSchema = z.object({
  sponsorName: z.string().min(2, "Enter the sponsor name."),
  sponsorType: z.enum(["individual", "nonprofit", "public-agency", "company", "foundation"] satisfies [SponsorType, ...SponsorType[]]),
  sponsorContact: z.string().email("Enter a valid contact email."),
  note: z.string().min(16, "Add a short note describing the funding intent."),
  amountUsd: z.coerce.number().int().min(25, "Sponsor commitments start at $25."),
  restrictionScope: z.enum(["general", "category", "ken", "safety-reserve"]),
  restrictionTargetId: z.string().optional(),
  mode: z.enum(["simulated", "pledged", "live"]),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "Enter the name other contributors should see."),
  role: z.string().min(2, "Describe your current role."),
  specialty: z.string().min(2, "Describe your strongest area of practice."),
  bio: z.string().min(24, "Write a short but useful contributor bio."),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(12, "Enter your current password."),
  newPassword: z.string().min(12, "Passwords must be at least 12 characters."),
  confirmNewPassword: z.string().min(12, "Confirm the new password."),
}).refine((v) => v.newPassword === v.confirmNewPassword, {
  path: ["confirmNewPassword"],
  message: "Passwords must match.",
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

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  try {
    await guardMutationRequest({
      action: "sign-in",
      formData,
      requireTurnstile: turnstileConfigured(),
      rateLimit: {
        scope: "sign-in",
        identifierParts: [email],
        limit: 8,
        windowSeconds: 15 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to process sign-in.") };
  }

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
    await logSecurityEvent({
      eventType: "auth-failed",
      detail: `Rejected sign-in for ${parsed.data.email.toLowerCase()}`,
    });
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

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  try {
    await guardMutationRequest({
      action: "sign-up",
      formData,
      requireTurnstile: turnstileConfigured(),
      rateLimit: {
        scope: "sign-up",
        identifierParts: [email],
        limit: 4,
        windowSeconds: 15 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to process account creation.") };
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
    const accountInput = {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role,
      specialty: parsed.data.specialty,
      bio: parsed.data.bio,
      licensingConsent: parsed.data.licensingConsent,
    };
    const created = await createAccount({
      ...accountInput,
    });
    const session = await createSession(created.accountId);
    await setViewerSessionCookie(session.token);
  } catch (error) {
    return {
      status: "error",
      message: actionErrorMessage(error, "Unable to create account."),
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
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "create-proposal",
      actorId: profileId,
      formData,
      requireTurnstile: turnstileConfigured(),
      rateLimit: {
        scope: "create-proposal",
        limit: 4,
        windowSeconds: 10 * 60,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: actionErrorMessage(error, "Unable to submit the Ken."),
    };
  }

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
      profileId,
    );

    revalidateCorePaths(slug);
    redirect(`/kens/${slug}`);
  } catch (error) {
    return {
      status: "error",
      message: actionErrorMessage(error, "Unable to submit the Ken."),
    };
  }
}

export async function saveVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "save-vote",
      actorId: profileId,
      formData,
      rateLimit: {
        scope: "save-vote",
        limit: 18,
        windowSeconds: 5 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save your voice allocation.") };
  }

  const parsed = voteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The voice allocation was invalid." };
  }

  try {
    await saveVote(parsed.data.taskId, profileId, parsed.data.voteCount, parsed.data.rationale?.trim() ?? "");
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save your voice allocation.") };
  }

  revalidateCorePaths(parsed.data.slug);
  return {
    status: "success",
    message: parsed.data.voteCount === 0 ? "Voice allocation cleared." : "Voice allocation updated.",
  };
}

export async function saveTaskPulseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "save-pulse",
      actorId: profileId,
      formData,
      rateLimit: {
        scope: "save-pulse",
        limit: 24,
        windowSeconds: 5 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the public vote.") };
  }

  const parsed = pulseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The public vote was invalid." };
  }

  try {
    await saveTaskPulse(parsed.data.taskId, profileId, parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the public vote.") };
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
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "create-comment",
      actorId: profileId,
      formData,
      rateLimit: {
        scope: "create-comment",
        limit: 10,
        windowSeconds: 10 * 60,
      },
    });
  } catch (error) {
    return {
      status: "error",
      message: actionErrorMessage(error, "Unable to post the comment."),
    };
  }

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
      profileId,
      parentId: parsed.data.parentId?.trim() || null,
      body: parsed.data.body.trim(),
      stakeCredits: parsed.data.stakeCredits,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to post the comment.") };
  }

  revalidateCorePaths(parsed.data.slug);
  return { status: "success", message: "Comment posted." };
}

export async function saveCommentVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "save-comment-vote",
      actorId: profileId,
      formData,
      rateLimit: {
        scope: "save-comment-vote",
        limit: 24,
        windowSeconds: 5 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the comment vote.") };
  }

  const parsed = commentVoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "The comment vote was invalid." };
  }

  try {
    await saveCommentVote(parsed.data.commentId, profileId, parsed.data.value as -1 | 0 | 1);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the comment vote.") };
  }

  revalidateCorePaths(parsed.data.slug);
  return { status: "success", message: "Comment score updated." };
}

export async function createSponsorshipCommitmentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardMutationRequest({
      action: "create-sponsorship",
      formData,
      requireTurnstile: turnstileConfigured(),
      rateLimit: {
        scope: "create-sponsorship",
        identifierParts: [String(formData.get("sponsorContact") ?? "").trim().toLowerCase()],
        limit: 4,
        windowSeconds: 15 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to create the sponsorship.") };
  }

  const parsed = sponsorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "This sponsorship needs a few fixes.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    const target = await resolveSponsorRestrictionTarget(parsed.data.restrictionScope, parsed.data.restrictionTargetId);

    if (parsed.data.mode === "live") {
      if (!stripeEnabled()) {
        return {
          status: "error",
          message: "Live checkout is not configured on this deployment. Use a pledge or simulated funding entry instead.",
        };
      }

      const commitment = await createSponsorshipCommitment({
        sponsorName: parsed.data.sponsorName.trim(),
        sponsorType: parsed.data.sponsorType,
        sponsorContact: parsed.data.sponsorContact.trim().toLowerCase(),
        note: parsed.data.note.trim(),
        amountUsd: parsed.data.amountUsd,
        fundingState: "projected",
        status: "intake",
        restrictionScope: parsed.data.restrictionScope,
        restrictionTargetId: target.id,
        restrictionTargetLabel: target.label,
      });

      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: parsed.data.sponsorContact.trim().toLowerCase(),
        success_url: `${env.KENMATCH_PUBLIC_ORIGIN}/economics?checkout=success`,
        cancel_url: `${env.KENMATCH_PUBLIC_ORIGIN}/economics?checkout=cancelled`,
        submit_type: "donate",
        metadata: {
          commitmentId: commitment.id,
          restrictionScope: parsed.data.restrictionScope,
          restrictionTargetId: target.id ?? "",
          restrictionTargetLabel: target.label,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: parsed.data.amountUsd * 100,
              product_data: {
                name: `KenMatch sponsorship: ${target.label}`,
                description: parsed.data.note.trim(),
              },
            },
          },
        ],
      });

      await bindSponsorshipCheckoutSession(commitment.id, session.id);
      revalidateCorePaths();
      if (!session.url) {
        return { status: "error", message: "Stripe checkout did not return a redirect URL." };
      }
      redirect(session.url);
    }

    await createSponsorshipCommitment({
      sponsorName: parsed.data.sponsorName.trim(),
      sponsorType: parsed.data.sponsorType,
      sponsorContact: parsed.data.sponsorContact.trim().toLowerCase(),
      note: parsed.data.note.trim(),
      amountUsd: parsed.data.amountUsd,
      fundingState: parsed.data.mode === "simulated" ? "simulated" : "projected",
      status: parsed.data.mode === "simulated" ? "paid" : "intake",
      restrictionScope: parsed.data.restrictionScope,
      restrictionTargetId: target.id,
      restrictionTargetLabel: target.label,
    });
  } catch (error) {
    return {
      status: "error",
      message: actionErrorMessage(error, "Unable to create the sponsorship."),
    };
  }

  revalidateCorePaths();
  return {
    status: "success",
    message: parsed.data.mode === "simulated"
      ? "Simulated funding was added to the ledger."
      : "Sponsorship pledge recorded. It will stay visibly separate from committed funds until payment arrives.",
  };
}

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({ action: "update-profile", actorId: profileId, formData, rateLimit: { scope: "update-profile", limit: 6, windowSeconds: 10 * 60 } });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update profile.") };
  }

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "Fix the highlighted fields.", fieldErrors: flattenFieldErrors(parsed.error) };
  }

  try {
    await updateProfile(profileId, parsed.data);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update profile.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "Profile updated." };
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({ action: "change-password", actorId: profileId, formData, rateLimit: { scope: "change-password", limit: 4, windowSeconds: 15 * 60 } });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to change password.") };
  }

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "Fix the highlighted fields.", fieldErrors: flattenFieldErrors(parsed.error) };
  }

  try {
    const session = await getViewerSession();
    if (!session) throw new Error("Not signed in.");
    const account = await authenticateAccount(session.account.email, parsed.data.currentPassword);
    if (!account) return { status: "error", message: "Current password is incorrect." };
    await changePassword(account.id, parsed.data.newPassword);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to change password.") };
  }

  return { status: "success", message: "Password changed." };
}

export async function updateLicensingConsentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireViewerProfileId();
    const session = await getViewerSession();
    if (!session) throw new Error("Not signed in.");
    const consent = formData.get("licensingConsent") === "allow-screened-licensing" ? "allow-screened-licensing" : "audit-only";
    await updateLicensingConsent(session.account.id, consent as AccountRecord["licensingConsent"]);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update consent.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "Licensing consent updated." };
}

export async function toggleBookmarkAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({ action: "toggle-bookmark", actorId: profileId, formData, rateLimit: { scope: "toggle-bookmark", limit: 30, windowSeconds: 5 * 60 } });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update bookmark.") };
  }

  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!taskId) return { status: "error", message: "Missing task ID." };

  try {
    const bookmarked = await toggleBookmark(profileId, taskId);
    revalidateCorePaths();
    return { status: "success", message: bookmarked ? "Bookmarked." : "Bookmark removed." };
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update bookmark.") };
  }
}
