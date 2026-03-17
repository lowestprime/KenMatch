import type { Metadata } from "next";
import Script from "next/script";

import { SiteShell } from "@/components/site-shell";
import { listProfiles } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KenMatch",
<<<<<<< HEAD
  description: "Public allocation infrastructure for long-horizon frontier AI work, with earned voice, public curation, checkpoint-gated execution, and transparent economics.",
};

const themeBootScript = `
  try {
    var stored = window.localStorage.getItem("kenmatch-theme");
    var theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
=======
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
>>>>>>> origin/main
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [profiles, viewer] = await Promise.all([listProfiles(), getViewerSession()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
<<<<<<< HEAD
        <Script id="theme-boot" strategy="beforeInteractive">{themeBootScript}</Script>
        <SiteShell featuredProfiles={profiles} viewer={viewer}>
=======
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteShell profiles={profiles} activeProfile={activeProfile}>
>>>>>>> origin/main
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
