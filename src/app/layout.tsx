import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";

import { SiteShell } from "@/components/site-shell";
import { listProfiles } from "@/lib/db";
import { canonicalOrigin, env } from "@/lib/env";
import { getViewerSession } from "@/lib/session";
import "@/app/globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.KENMATCH_PUBLIC_ORIGIN ?? canonicalOrigin),
  applicationName: "KenMatch",
  title: {
    default: "KenMatch — Transparent allocation of frontier AI compute",
    template: "%s · KenMatch",
  },
  description:
    "KenMatch turns sustained frontier AI compute into a publicly accountable commons. Propose Kens, vote on priority, and watch transparent allocation, funding, and checkpoints in real time.",
  keywords: [
    "KenMatch",
    "AI compute",
    "public allocation",
    "quadratic voting",
    "transparent AI",
    "frontier compute",
    "Cooper Beaman",
  ],
  authors: [{ name: "Cooper Beaman", url: "https://github.com/lowestprime" }],
  creator: "Cooper Beaman",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "KenMatch — Transparent allocation of frontier AI compute",
    description:
      "A community board for proposing, voting on, and shipping high-leverage AI Kens with transparent funding and checkpoints.",
    siteName: "KenMatch",
    type: "website",
    url: canonicalOrigin,
    images: ["/apple-touch-icon.svg"],
  },
  twitter: {
    card: "summary",
    title: "KenMatch",
    description:
      "Transparent allocation of frontier AI compute. Propose, vote, fund, and ship Kens with public accountability.",
    images: ["/apple-touch-icon.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

const themeBootScript = `
  try {
    var stored = window.localStorage.getItem("kenmatch-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "oled" || stored === "light" ? stored : (stored === "dark" ? "oled" : (prefersDark ? "oled" : "light"));
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    if (stored === "dark") { window.localStorage.setItem("kenmatch-theme", "oled"); }
  } catch (error) {}
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [profiles, viewer] = await Promise.all([listProfiles(), getViewerSession()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-body antialiased`}>
        <Script id="theme-boot" strategy="beforeInteractive">{themeBootScript}</Script>
        <SiteShell featuredProfiles={profiles} viewer={viewer}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
