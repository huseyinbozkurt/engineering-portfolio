import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Admin",
  description: "Minimal content management application for the engineering portfolio.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
