import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanels } from "@/components/auth-panels";
import { getViewerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create an account to vote, comment, propose projects, and back work on KenMatch.",
};

export default async function AuthPage() {
  const viewer = await getViewerSession();
  if (viewer) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Contributor access</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Join the community</h1>
        <p className="text-lg leading-8 text-muted">
          Create an account to vote on projects, join discussions, propose new ideas, and back the work you believe in.
        </p>
      </section>
      <AuthPanels />
    </div>
  );
}
