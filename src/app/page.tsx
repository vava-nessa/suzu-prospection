"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignInForm, SignOutButton } from "@/components/SignInForm";
import { ProspectsTable } from "@/components/ProspectsTable";

function AuthedApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewer = useQuery(api.viewer.viewer);
  if (isLoading || viewer === undefined) {
    return <div className="grid place-items-center py-16 text-[12px] tracking-[-0.01em] text-white/40">Chargement…</div>;
  }
  if (!isAuthenticated || !viewer) return <SignInForm />;
  return <ProspectsTable />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="flex h-9 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-[7px] bg-white text-black grid place-items-center font-[700] text-[11px] tracking-[-0.02em]">S</div>
            <span className="text-[12px] font-[600] tracking-[-0.03em]">suzu-prospection</span>
            <span className="hidden sm:inline text-[10px] tracking-[0.08em] uppercase text-white/25">privé</span>
          </div>
          <HeaderAuth />
        </div>
      </header>
      <main className="px-3 sm:px-4 py-3">
        <AuthedApp />
      </main>
    </div>
  );
}

function HeaderAuth() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.viewer.viewer);
  if (!isAuthenticated || !viewer) return <span className="text-[10px] tracking-[0.08em] uppercase text-white/25">🔒 privé</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-[11px] tracking-[-0.01em] text-white/40 max-w-[180px] truncate">{viewer.email}</span>
      <SignOutButton />
    </div>
  );
}
