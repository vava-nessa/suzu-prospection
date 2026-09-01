
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
