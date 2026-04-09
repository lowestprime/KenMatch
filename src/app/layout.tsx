import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";

import { SiteShell } from "@/components/site-shell";
import { listProfiles } from "@/lib/db";
import { env } from "@/lib/env";
import { getViewerSession } from "@/lib/session";
import "@/app/globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: env.KENMATCH_PUBLIC_ORIGIN ? new URL(env.KENMATCH_PUBLIC_ORIGIN) : undefined,
  applicationName: "KenMatch",
  title: {
    default: "KenMatch",
    template: "%s | KenMatch",
  },
  description: "A community board for proposing, backing, reviewing, and shipping long-running AI Kens with visible checkpoints, public discussion, and clearly labeled sandbox demos.",
  icons: {
    icon: "/icon.svg",
  },
};

export const dynamic = "force-dynamic";

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
      <body className={`${bodyFont.variable} ${displayFont.variable} font-body antialiased`}>
        <Script id="theme-boot" strategy="beforeInteractive">{themeBootScript}</Script>
        <SiteShell featuredProfiles={profiles} viewer={viewer}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
