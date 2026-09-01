import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: "Suzu Prospection — CRM",
  description: "CRM prospection devs pour campagne cold email — Suzu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=sentient@300,400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
