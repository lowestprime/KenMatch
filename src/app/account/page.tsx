import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountSettingsPanels } from "@/components/account-settings-panels";
import { Avatar } from "@/components/avatar";
import { getViewerSession } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account settings",
  description: "Manage your KenMatch profile, password, and account preferences.",
};

export default async function AccountPage() {
  const viewer = await getViewerSession();
  if (!viewer) {
    redirect("/auth");
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex items-center gap-5">
          <Avatar name={viewer.profile.name} hue={viewer.profile.avatarHue} size={64} />
          <div>
            <div className="eyebrow">Account settings</div>
            <h1 className="font-display text-3xl font-semibold text-foreground">{viewer.profile.name}</h1>
            <p className="text-sm text-muted">{viewer.profile.role} · {viewer.profile.specialty}</p>
          </div>
        </div>
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Email</div><div className="mt-2 text-sm font-semibold text-foreground break-all">{viewer.account.email}</div></div>
          <div className="metric-card"><div className="eyebrow">Role</div><div className="mt-2 text-sm font-semibold text-foreground capitalize">{viewer.account.systemRole}</div></div>
          <div className="metric-card"><div className="eyebrow">Status</div><div className="mt-2 text-sm font-semibold text-foreground">{viewer.account.emailVerified ? "Verified" : "Unverified"}</div></div>
          <div className="metric-card"><div className="eyebrow">Member since</div><div className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(viewer.account.createdAt)}</div></div>
        </div>
      </section>
      <AccountSettingsPanels viewer={viewer} />
    </div>
  );
}
