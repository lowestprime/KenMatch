import { redirect } from "next/navigation";

import { AuthPanels } from "@/components/auth-panels";
import { getViewerSession } from "@/lib/session";

export default async function AuthPage() {
  const viewer = await getViewerSession();
  if (viewer) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Contributor access</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Join the public ledger behind KenMatch</h1>
        <p className="text-lg leading-8 text-muted">
          Accounts keep public participation attributable. That is how KenMatch separates open reading from accountable voting, commenting, and submission.
        </p>
      </section>
      <AuthPanels />
    </div>
  );
}
