import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export const metadata: Metadata = {
  title: "Suzu Prospection — CRM",
  description: "CRM prospection devs pour campagne cold email — Suzu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="fr" className="dark h-full antialiased">
        <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
