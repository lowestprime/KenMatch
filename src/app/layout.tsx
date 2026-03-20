import type { Metadata } from "next";
import Script from "next/script";

import { SiteShell } from "@/components/site-shell";
import { listProfiles } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

import "@/app/globals.css";

export const metadata: Metadata = {
  applicationName: "KenMatch",
  title: "KenMatch",
  description: "A public board for proposing, ranking, funding, auditing, and shipping long-running AI Kens.",
};

const themeBootScript = `
  try {
    var stored = window.localStorage.getItem("kenmatch-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "oled" || stored === "dark" || stored === "light" ? stored : (prefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
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
