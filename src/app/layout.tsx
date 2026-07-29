import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";

import { JsonLd } from "@/components/json-ld";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { SiteShell } from "@/components/site-shell";
import { canonicalOrigin } from "@/lib/env";
import { getCapacityState, getMaintenanceState } from "@/lib/db";
import {
  SITE_DESCRIPTION,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_VERSION,
  SOCIAL_IMAGE_WIDTH,
} from "@/lib/seo";
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

const assetVersion = SOCIAL_IMAGE_VERSION;
const openGraphImage = `/og-image.png?v=${assetVersion}`;
const twitterImage = `/share-image.png?v=${assetVersion}`;

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  applicationName: "KenMatch",
  title: {
    default: "KenMatch: Rank sustained AI work",
    template: "%s · KenMatch",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "KenMatch",
    "AI compute",
    "public allocation",
    "quadratic voting",
    "transparent AI",
    "frontier compute",
    "AI governance",
    "public AI alignment",
    "collective intelligence",
  ],
  authors: [{ name: "KenMatch Owner", url: "https://github.com/lowestprime" }],
  creator: "KenMatch Owner",
  icons: {
    icon: [
      { url: `/icon-dark.svg?v=${assetVersion}`, type: "image/svg+xml", sizes: "any" },
      { url: `/favicon.ico?v=${assetVersion}`, type: "image/x-icon", sizes: "32x32" },
      { url: `/favicon-32x32.png?v=${assetVersion}`, type: "image/png", sizes: "32x32" },
      { url: `/favicon-96x96.png?v=${assetVersion}`, type: "image/png", sizes: "96x96" },
    ],
    shortcut: [{ url: `/favicon.ico?v=${assetVersion}`, type: "image/x-icon" }],
    apple: [{ url: `/apple-touch-icon.png?v=${assetVersion}`, type: "image/png", sizes: "180x180" }],
  },
  alternates: { canonical: "/" },
  manifest: `/manifest.webmanifest?v=${assetVersion}`,
  openGraph: {
    title: "KenMatch: Rank sustained AI work",
    description: SITE_DESCRIPTION,
    siteName: "KenMatch",
    type: "website",
    url: canonicalOrigin,
    images: [{
      url: openGraphImage,
      width: SOCIAL_IMAGE_WIDTH,
      height: SOCIAL_IMAGE_HEIGHT,
      type: "image/png",
      alt: "KenMatch public board preview",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KenMatch: Rank sustained AI work",
    description: SITE_DESCRIPTION,
    images: [twitterImage],
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
    { media: "(prefers-color-scheme: light)", color: "#f1f3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [viewer, maintenance, capacity, headerStore] = await Promise.all([
    getViewerSession(),
    getMaintenanceState(),
    getCapacityState(),
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
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalOrigin}/#website`,
    name: "KenMatch",
    url: canonicalOrigin,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${canonicalOrigin}/#project` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalOrigin}/kens?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "Project",
    "@id": `${canonicalOrigin}/#project`,
    name: "KenMatch",
    url: canonicalOrigin,
    description: SITE_DESCRIPTION,
    logo: `${canonicalOrigin}/icon-512.png`,
    sameAs: ["https://github.com/lowestprime/KenMatch"],
  };

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
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={projectJsonLd} />
        <SiteShell viewer={viewer} capacity={capacity}>
          {showMaintenance ? <MaintenanceScreen state={maintenance} /> : children}
        </SiteShell>
      </body>
    </html>
  );
}
