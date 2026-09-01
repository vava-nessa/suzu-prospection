"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignInForm, SignOutButton } from "@/components/SignInForm";
import { ProspectsTable } from "@/components/ProspectsTable";

function AuthedApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewer = useQuery(api.viewer.viewer);

  if (isLoading || viewer === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated || !viewer) {
    return <SignInForm />;
  }

  return <ProspectsTable />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-zinc-950/70 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight">suzu-prospection</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">CRM · Convex · privé</span>
          </div>
          <HeaderAuth />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AuthedApp />
      </main>
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-muted-foreground border-t mt-8">
        Accès restreint à vanessadepraute@gmail.com · Anti-doublon : email (lowercase) + GitHub username · RGPD : sourceUrl obligatoire
      </footer>
    </div>
  );
}

function HeaderAuth() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.viewer.viewer);
  if (!isAuthenticated || !viewer) return <span className="text-xs text-muted-foreground hidden sm:block">🔒 privé</span>;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground hidden sm:inline">{viewer.email}</span>
      <SignOutButton />
    </div>
  );
}
