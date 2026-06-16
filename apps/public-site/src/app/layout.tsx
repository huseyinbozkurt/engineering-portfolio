import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { getPublicSiteAvailability } from "@/lib/site-availability";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  verification: {
    other: {
      "google-adsense-account": [process.env.GOOGLE_ADSENSE_VERIFICATION ?? ""],
    }
  }
};

export const viewport: Viewport = {
  themeColor: "#050914",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { shouldShowComingSoon } = await getPublicSiteAvailability();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {shouldShowComingSoon ? (
          <main>
            <ComingSoon />
          </main>
        ) : (
          <>
            <Nav />
            <main>{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
