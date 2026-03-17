import type { Metadata } from "next";
import Script from "next/script";

import { SiteShell } from "@/components/site-shell";
import { listProfiles } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KenMatch",
  description: "Public allocation infrastructure for long-horizon frontier AI work, with earned voice, public curation, checkpoint-gated execution, and transparent economics.",
};

const themeBootScript = `
  try {
    var stored = window.localStorage.getItem("kenmatch-theme");
    var theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [profiles, viewer] = await Promise.all([listProfiles(), getViewerSession()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <Script id="theme-boot" strategy="beforeInteractive">{themeBootScript}</Script>
        <SiteShell featuredProfiles={profiles} viewer={viewer}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
