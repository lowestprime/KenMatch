import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";

import { MaintenanceScreen } from "@/components/maintenance-screen";
import { SiteShell } from "@/components/site-shell";
import { canonicalOrigin, env } from "@/lib/env";
import { getMaintenanceState } from "@/lib/db";
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
    default: "KenMatch: Rank sustained AI work",
    template: "%s · KenMatch",
  },
  description: "Transparent allocation of frontier AI compute.",
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
      { url: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  alternates: { canonical: canonicalOrigin },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "KenMatch: Rank sustained AI work",
    description:
      "Transparent allocation of frontier AI compute.",
    siteName: "KenMatch",
    type: "website",
    url: canonicalOrigin,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "KenMatch public board preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KenMatch: Rank sustained AI work",
    description: "Transparent allocation of frontier AI compute.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "KenMatch",
    statusBarStyle: "black-translucent",
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [viewer, maintenance, headerStore] = await Promise.all([
    getViewerSession(),
    getMaintenanceState(),
    headers(),
  ]);
  const pathname = headerStore.get("x-kenmatch-pathname") ?? "/";
  const isRecoveryPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/api/test-auth");
  const isAdminViewer = viewer && ["owner", "admin", "moderator"].includes(viewer.account.systemRole);
  const showMaintenance = maintenance.mode === "on" && !isRecoveryPath && !isAdminViewer;

  return (
    <html lang="en" data-scroll-behavior="smooth" data-theme="oled" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const key = "kenmatch-theme"; const stored = localStorage.getItem(key); const theme = stored === "light" ? "light" : "oled"; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark"; if (!stored || stored === "dark") localStorage.setItem(key, theme); } catch (_) { document.documentElement.dataset.theme = "oled"; document.documentElement.style.colorScheme = "dark"; } })();`,
          }}
        />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-body antialiased`}>
        <SiteShell viewer={viewer}>
          {showMaintenance ? <MaintenanceScreen state={maintenance} /> : children}
        </SiteShell>
      </body>
    </html>
  );
}
