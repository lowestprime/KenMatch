import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { getDefaultProfileId, listProfiles } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KenMatch",
  description: "Crowdsourced allocation of sustained frontier compute through earned voice, public curation, and treasury-backed execution.",
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("kenmatch-theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = stored === "dark" || stored === "light" ? stored : system;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profiles = listProfiles();
  const activeProfileId = await getSessionProfileId();
  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ??
    profiles.find((profile) => profile.id === getDefaultProfileId()) ??
    profiles[0];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteShell profiles={profiles} activeProfile={activeProfile}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
