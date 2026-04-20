"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type ActionState } from "@/app/action-state";
import { MAX_VOTES_PER_TASK } from "@/lib/allocation";
import {
  authenticateAccount,
  bindSponsorshipCheckoutSession,
  consumeEmailToken,
  createAccount,
  createBookmark,
  createComment,
  createEmailToken,
  createProposal,
  createSponsorshipCommitment,
  createSession,
  decideVerification,
  deleteSessionByToken,
  findAccountByEmailExported,
  findAccountByIdExported,
  getAboutPageContent,
  getAdminNotificationSettings,
  logSecurityEvent,
  markEmailVerified,
  markVisitorAccountCreated,
  recordAudit,
  requestVerification,
  resolveSponsorRestrictionTarget,
  saveCommentVote,
  saveTaskPulse,
  saveVote,
  searchIndex,
  setAboutPageContent,
  setAccountRole,
  setAdminNotificationSettings,
  suspendProfile,
  updateAccountLastLogin,
  updateAccountPassword,
  updateProfileDetails,
} from "@/lib/db";
import { canonicalOrigin, env, notificationEmails } from "@/lib/env";
import {
  buildPasswordResetEmail,
  buildSignupNotificationEmail,
  buildVerificationEmail,
  buildVerificationRequestEmail,
  sendMail,
} from "@/lib/mail";
import { guardMutationRequest, turnstileConfigured } from "@/lib/security";
import {
  clearViewerSessionCookie,
  getViewerProfileId,
  getViewerSession,
  getViewerToken,
  setViewerSessionCookie,
} from "@/lib/session";
import { getStripeClient, stripeEnabled } from "@/lib/stripe";
import type { AboutPageContent, ProfileLink, SearchResultItem, SponsorType } from "@/lib/types";
import { extractVisitorContext } from "@/lib/visitor";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(8, "Reset token is required."),
    password: z.string().min(12, "Passwords must be at least 12 characters."),
    confirmPassword: z.string().min(12, "Confirm the password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Enter the name other contributors should see."),
  role: z.string().min(2, "Describe your current role."),
  specialty: z.string().min(2, "Describe your strongest area of practice."),
  bio: z.string().min(24, "Write a short but useful contributor bio."),
  location: z.string().max(120).optional(),
  pronouns: z.string().max(40).optional(),
  links: z.string().max(2000).optional(),
  avatarGradient: z.string().max(200).optional(),
  avatarImage: z.string().max(200_000).optional(),
});

const bookmarkSchema = z.object({
  taskId: z.string().min(1),
  slug: z.string().min(1),
});

const verificationRequestSchema = z.object({
  note: z.string().min(20, "Explain your identity and credentials briefly."),
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

async function requireAdminSession() {
  const session = await getViewerSession();
  if (!session) throw new Error("Sign in as an administrator.");
  if (session.account.systemRole !== "owner" && session.account.systemRole !== "admin") {
    throw new Error("Administrator privileges are required.");
  }
  return session;
}

async function requireOwnerSession() {
  const session = await getViewerSession();
  if (!session) throw new Error("Sign in as the owner.");
  if (session.account.systemRole !== "owner") {
    throw new Error("Only the owner can perform this action.");
  }
  return session;
}

function revalidateCorePaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/kens");
  revalidatePath("/tasks");
  revalidatePath("/governance");
  revalidatePath("/economics");
  revalidatePath("/submit");
  revalidatePath("/about");
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/people");
  if (slug) {
    revalidatePath(`/kens/${slug}`);
    revalidatePath(`/tasks/${slug}`);
  }
}

function parseLinksFromText(raw: string | undefined): ProfileLink[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const separator = line.indexOf("|");
      if (separator >= 0) {
        return {
          label: line.slice(0, separator).trim().slice(0, 40),
          url: line.slice(separator + 1).trim().slice(0, 200),
        };
      }
      try {
        const url = new URL(line);
        return { label: url.hostname.replace(/^www\./, "").slice(0, 40), url: url.toString().slice(0, 200) };
      } catch {
        return { label: line.slice(0, 40), url: line.slice(0, 200) };
      }
    })
    .filter((entry) => entry.url.length > 0);
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

  if (!account.emailVerified && env.KENMATCH_REQUIRE_EMAIL_VERIFICATION && account.systemRole !== "owner") {
    return {
      status: "error",
      message: "Please confirm your email before signing in. We can resend the verification link from this form if needed.",
    };
  }

  const session = await createSession(account.id);
  await setViewerSessionCookie(session.token);
  await updateAccountLastLogin(account.id);
  await recordAudit({
    accountId: account.id,
    action: "auth.sign-in",
    detail: `Successful sign-in for ${account.email}.`,
  });
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

  let created: { accountId: string; profileId: string; systemRole: string; emailVerified: boolean } | null = null;
  let visitorContext: Awaited<ReturnType<typeof extractVisitorContext>> | null = null;
  try {
    visitorContext = await extractVisitorContext();
    const accountInput = {
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role,
      specialty: parsed.data.specialty,
      bio: parsed.data.bio,
      licensingConsent: parsed.data.licensingConsent,
    };
    created = await createAccount({ ...accountInput });

    if (visitorContext) {
      await markVisitorAccountCreated(visitorContext.visitorHash);
    }

    await recordAudit({
      accountId: created.accountId,
      action: "auth.sign-up",
      detail: `Account created for ${parsed.data.email.toLowerCase()}`,
      metadata: { role: created.systemRole, country: visitorContext?.countryName ?? null },
      ipAddress: visitorContext?.ipAddress ?? null,
    });

    const notificationSettings = await getAdminNotificationSettings();
    if (notificationSettings.notifyOnSignup && notificationSettings.recipientEmails.length > 0) {
      const notify = buildSignupNotificationEmail({
        accountEmail: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
        role: parsed.data.role,
        specialty: parsed.data.specialty,
        ipAddress: visitorContext?.ipAddress ?? null,
        country: visitorContext?.countryName ?? null,
      });
      await sendMail({ to: notificationSettings.recipientEmails, ...notify });
    }

    if (!created.emailVerified) {
      const tokenResult = await createEmailToken({
        accountId: created.accountId,
        email: parsed.data.email.toLowerCase(),
        purpose: "email-verification",
      });
      const url = `${canonicalOrigin}/verify?token=${encodeURIComponent(tokenResult.token)}`;
      const mail = buildVerificationEmail({ name: parsed.data.name, url });
      await sendMail({ to: parsed.data.email.toLowerCase(), ...mail });
      return {
        status: "success",
        message: "Check your inbox for a verification link. You can sign in as soon as your email is verified.",
      };
    }

    const session = await createSession(created.accountId);
    await setViewerSessionCookie(session.token);
    await updateAccountLastLogin(created.accountId);
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

export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  try {
    await guardMutationRequest({
      action: "forgot-password",
      formData,
      requireTurnstile: turnstileConfigured(),
      rateLimit: {
        scope: "forgot-password",
        identifierParts: [email],
        limit: 4,
        windowSeconds: 15 * 60,
      },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to process password reset.") };
  }

  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const account = await findAccountByEmailExported(parsed.data.email);
  if (account) {
    const token = await createEmailToken({
      accountId: account.id,
      email: account.email,
      purpose: "password-reset",
    });
    const url = `${canonicalOrigin}/reset?token=${encodeURIComponent(token.token)}`;
    const mail = buildPasswordResetEmail({ name: account.email.split("@")[0] ?? "there", url });
    await sendMail({ to: account.email, ...mail });
    await recordAudit({
      accountId: account.id,
      action: "auth.password-reset-requested",
      detail: `Password reset link issued for ${account.email}.`,
    });
  }

  return {
    status: "success",
    message: "If that account exists, a password reset email is on its way.",
  };
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardMutationRequest({
      action: "reset-password",
      formData,
      rateLimit: { scope: "reset-password", limit: 6, windowSeconds: 15 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to reset the password.") };
  }

  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "The reset form has a few issues.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  const tokenRecord = await consumeEmailToken("password-reset", parsed.data.token);
  if (!tokenRecord) {
    return { status: "error", message: "This reset link is invalid or has expired." };
  }
  try {
    await updateAccountPassword(tokenRecord.accountId, parsed.data.password);
    await recordAudit({
      accountId: tokenRecord.accountId,
      action: "auth.password-reset-completed",
      detail: "Password reset via email link.",
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to reset the password.") };
  }
  return { status: "success", message: "Password reset. You can now sign in." };
}

export async function verifyEmailAction(token: string) {
  const record = await consumeEmailToken("email-verification", token);
  if (!record) return { ok: false, message: "This verification link is invalid or has expired." } as const;
  await markEmailVerified(record.accountId);
  await recordAudit({
    accountId: record.accountId,
    action: "auth.email-verified",
    detail: "Email address confirmed via link.",
  });
  return { ok: true, message: "Email verified. You can now sign in." } as const;
}

export async function resendVerificationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  const account = await findAccountByEmailExported(parsed.data.email);
  if (account && !account.emailVerified) {
    const tokenResult = await createEmailToken({
      accountId: account.id,
      email: account.email,
      purpose: "email-verification",
    });
    const url = `${canonicalOrigin}/verify?token=${encodeURIComponent(tokenResult.token)}`;
    const mail = buildVerificationEmail({ name: account.email.split("@")[0] ?? "there", url });
    await sendMail({ to: account.email, ...mail });
  }
  return { status: "success", message: "If that account exists and is unverified, a fresh link has been sent." };
}

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "update-profile",
      actorId: profileId,
      formData,
      rateLimit: { scope: "update-profile", limit: 20, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update the profile.") };
  }

  const parsed = profileUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Fix the highlighted profile fields.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    await updateProfileDetails(profileId, {
      name: parsed.data.name,
      role: parsed.data.role,
      bio: parsed.data.bio,
      specialty: parsed.data.specialty,
      location: parsed.data.location?.trim() || null,
      pronouns: parsed.data.pronouns?.trim() || null,
      links: parseLinksFromText(parsed.data.links),
      avatarGradient: parsed.data.avatarGradient?.trim() || null,
      avatarImage: parsed.data.avatarImage?.trim() || null,
    });
    await recordAudit({
      accountId: null,
      action: "profile.update",
      detail: `Profile updated for ${profileId}`,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update the profile.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "Profile saved." };
}

export async function requestVerificationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "request-verification",
      actorId: profileId,
      formData,
      rateLimit: { scope: "request-verification", limit: 4, windowSeconds: 60 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to submit verification request.") };
  }

  const parsed = verificationRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please explain your identity, credentials, or verification reasoning.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    await requestVerification(profileId, parsed.data.note);
    const settings = await getAdminNotificationSettings();
    if (settings.notifyOnVerificationRequest && settings.recipientEmails.length > 0) {
      const session = await getViewerSession();
      const mail = buildVerificationRequestEmail({
        name: session?.profile.name ?? "Contributor",
        note: parsed.data.note,
        profileUrl: `${canonicalOrigin}/people/${profileId}`,
      });
      await sendMail({ to: settings.recipientEmails, ...mail });
    }
    await recordAudit({
      accountId: null,
      action: "profile.verification-requested",
      detail: `Verification request from ${profileId}`,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to submit verification request.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "Verification request submitted. Admins will review it soon." };
}

export async function toggleBookmarkAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let profileId: string;
  try {
    profileId = await requireViewerProfileId();
    await guardMutationRequest({
      action: "toggle-bookmark",
      actorId: profileId,
      formData,
      rateLimit: { scope: "toggle-bookmark", limit: 40, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update bookmark.") };
  }

  const parsed = bookmarkSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { status: "error", message: "Invalid bookmark request." };
  try {
    const result = await createBookmark(profileId, parsed.data.taskId);
    revalidateCorePaths(parsed.data.slug);
    return {
      status: "success",
      message: result.bookmarked ? "Added to bookmarks." : "Removed from bookmarks.",
    };
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update bookmark.") };
  }
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
      rateLimit: { scope: "create-proposal", limit: 4, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to submit the Ken.") };
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
    await recordAudit({
      accountId: null,
      action: "ken.created",
      detail: `New Ken submitted: ${parsed.data.title}`,
    });
    const settings = await getAdminNotificationSettings();
    if (settings.notifyOnProposal && settings.recipientEmails.length > 0) {
      await sendMail({
        to: settings.recipientEmails,
        subject: `[KenMatch] New Ken: ${parsed.data.title}`,
        text: `A new Ken has entered review.\n\nTitle: ${parsed.data.title}\nURL: ${canonicalOrigin}/kens/${slug}`,
      });
    }

    revalidateCorePaths(slug);
    redirect(`/kens/${slug}`);
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to submit the Ken.") };
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
      rateLimit: { scope: "save-vote", limit: 18, windowSeconds: 5 * 60 },
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
      rateLimit: { scope: "save-pulse", limit: 24, windowSeconds: 5 * 60 },
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
      rateLimit: { scope: "create-comment", limit: 10, windowSeconds: 10 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to post the comment.") };
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
      rateLimit: { scope: "save-comment-vote", limit: 24, windowSeconds: 5 * 60 },
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
      const origin = env.KENMATCH_PUBLIC_ORIGIN ?? canonicalOrigin;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: parsed.data.sponsorContact.trim().toLowerCase(),
        success_url: `${origin}/economics?checkout=success`,
        cancel_url: `${origin}/economics?checkout=cancelled`,
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

export async function updateAboutPageAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session: Awaited<ReturnType<typeof requireOwnerSession>>;
  try {
    session = await requireOwnerSession();
    await guardMutationRequest({
      action: "update-about",
      actorId: session.account.id,
      formData,
      rateLimit: { scope: "update-about", limit: 10, windowSeconds: 60 * 60 },
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the About page.") };
  }

  const payload: AboutPageContent = {
    heroEyebrow: String(formData.get("heroEyebrow") ?? "").slice(0, 120),
    heroTitle: String(formData.get("heroTitle") ?? "").slice(0, 240),
    heroSubtitle: String(formData.get("heroSubtitle") ?? "").slice(0, 600),
    missionTitle: String(formData.get("missionTitle") ?? "").slice(0, 200),
    missionBody: String(formData.get("missionBody") ?? "").slice(0, 4000),
    beliefsTitle: String(formData.get("beliefsTitle") ?? "").slice(0, 200),
    beliefsBullets: splitLines(String(formData.get("beliefsBullets") ?? "")),
    backgroundTitle: String(formData.get("backgroundTitle") ?? "").slice(0, 200),
    backgroundBody: String(formData.get("backgroundBody") ?? "").slice(0, 4000),
    goalsTitle: String(formData.get("goalsTitle") ?? "").slice(0, 200),
    goalsBullets: splitLines(String(formData.get("goalsBullets") ?? "")),
    contactTitle: String(formData.get("contactTitle") ?? "").slice(0, 200),
    contactBody: String(formData.get("contactBody") ?? "").slice(0, 4000),
    contactEmail: String(formData.get("contactEmail") ?? "").slice(0, 200),
    links: parseLinksFromText(String(formData.get("links") ?? "")),
    lastUpdated: new Date().toISOString(),
  };

  try {
    await setAboutPageContent(payload, session.account.id);
    await recordAudit({
      accountId: session.account.id,
      action: "about.update",
      detail: "About page updated.",
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to save the About page.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "About page updated." };
}

export async function updateNotificationSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;
  try {
    session = await requireAdminSession();
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update notifications.") };
  }

  const recipients = String(formData.get("recipientEmails") ?? "")
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 10);
  const payload = {
    recipientEmails: recipients.length > 0 ? recipients : notificationEmails,
    notifyOnSignup: formData.get("notifyOnSignup") === "on",
    notifyOnFirstVisit: formData.get("notifyOnFirstVisit") === "on",
    notifyOnVerificationRequest: formData.get("notifyOnVerificationRequest") === "on",
    notifyOnProposal: formData.get("notifyOnProposal") === "on",
    dailyDigest: formData.get("dailyDigest") === "on",
    updatedAt: new Date().toISOString(),
  };

  try {
    await setAdminNotificationSettings(payload, session.account.id);
    await recordAudit({
      accountId: session.account.id,
      action: "admin.notifications-updated",
      detail: "Admin notification settings updated.",
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update notifications.") };
  }

  revalidateCorePaths();
  return { status: "success", message: "Notification preferences saved." };
}

export async function verifyProfileDecisionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;
  try {
    session = await requireAdminSession();
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to process decision.") };
  }

  const profileId = String(formData.get("profileId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);

  if (!profileId || !["approved", "rejected", "pending"].includes(decision)) {
    return { status: "error", message: "Invalid verification decision." };
  }

  try {
    await decideVerification(profileId, decision as "approved" | "rejected" | "pending", note || null);
    await recordAudit({
      accountId: session.account.id,
      action: "admin.verification-decision",
      detail: `Profile ${profileId} -> ${decision}`,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to record the decision.") };
  }

  revalidateCorePaths();
  return { status: "success", message: `Verification ${decision}.` };
}

export async function moderateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;
  try {
    session = await requireAdminSession();
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to moderate profile.") };
  }

  const profileId = String(formData.get("profileId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!profileId || !["active", "restricted", "suspended"].includes(status)) {
    return { status: "error", message: "Invalid moderation status." };
  }
  try {
    await suspendProfile(profileId, status as "active" | "restricted" | "suspended");
    await recordAudit({
      accountId: session.account.id,
      action: "admin.moderation",
      detail: `Profile ${profileId} -> ${status}`,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to moderate profile.") };
  }
  revalidateCorePaths();
  return { status: "success", message: `Profile moderation status set to ${status}.` };
}

export async function updateAccountRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session: Awaited<ReturnType<typeof requireOwnerSession>>;
  try {
    session = await requireOwnerSession();
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update account role.") };
  }

  const accountId = String(formData.get("accountId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!accountId || !["contributor", "moderator", "admin", "owner"].includes(role)) {
    return { status: "error", message: "Invalid role." };
  }

  const account = await findAccountByIdExported(accountId);
  if (!account) return { status: "error", message: "Account not found." };
  if (account.id === session.account.id && role !== "owner") {
    return { status: "error", message: "Cannot demote the current owner." };
  }

  try {
    await setAccountRole(accountId, role as "contributor" | "moderator" | "admin" | "owner");
    await recordAudit({
      accountId: session.account.id,
      action: "admin.role-update",
      detail: `${account.email} -> ${role}`,
    });
  } catch (error) {
    return { status: "error", message: actionErrorMessage(error, "Unable to update role.") };
  }
  revalidateCorePaths();
  return { status: "success", message: `Role updated to ${role}.` };
}

export async function getAuthBannerState() {
  const session = await getViewerSession();
  return session
    ? { signedIn: true, name: session.profile.name, role: session.account.systemRole, email: session.account.email }
    : { signedIn: false, signupsEnabled: env.KENMATCH_ALLOW_SIGNUPS };
}

export async function getAboutContent(): Promise<AboutPageContent> {
  return getAboutPageContent();
}

export async function searchAction(query: string): Promise<SearchResultItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 1) return [];
  const viewerId = await getViewerProfileId();
  const items = await searchIndex(viewerId);
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  function score(item: SearchResultItem) {
    const haystack = `${item.title} ${item.subtitle ?? ""} ${item.type}`.toLowerCase();
    let scoreValue = 0;
    for (const token of tokens) {
      if (!haystack.includes(token)) return -1;
      if (haystack.startsWith(token)) scoreValue += 3;
      else scoreValue += 1;
    }
    if (item.type === "ken") scoreValue += 0.5;
    return scoreValue;
  }
  return items
    .map((item) => ({ item, score: score(item) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((entry) => entry.item);
}
