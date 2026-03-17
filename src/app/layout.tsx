import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { getDefaultProfileId, listProfiles } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KenMatch",
  description: "Crowdsourced allocation of sustained frontier compute through earned voice, transparent ranking, and safety review.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profiles = listProfiles();
  const activeProfileId = await getSessionProfileId();
  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ??
    profiles.find((profile) => profile.id === getDefaultProfileId()) ??
    profiles[0];

  return (
    <html lang="en">
      <body className="font-body antialiased">
        <SiteShell profiles={profiles} activeProfile={activeProfile}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}