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
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-[13px] tracking-[-0.01em] text-muted-foreground">Chargement…</div>
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — Linear: hairline border, full bleed, no shadow */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="flex h-[56px] items-center justify-between gap-4 px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded-[8px] bg-white text-black grid place-items-center font-[700] text-[12px] tracking-[-0.02em]">S</div>
            <span className="text-[14px] font-[600] tracking-[-0.03em]">suzu-prospection</span>
            <span className="hidden md:inline text-[11px] tracking-[0.08em] uppercase text-white/30 ml-2">CRM · Convex · privé</span>
          </div>
          <HeaderAuth />
        </div>
      </header>

      {/* Full-width content — Linear uses 100% with max 1600 but flush */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <AuthedApp />
      </main>

      <footer className="mt-auto border-t border-white/[0.06] px-6 lg:px-8 py-6">
        <p className="text-[11px] leading-relaxed tracking-[-0.01em] text-white/30">
          Accès restreint à vanessadepraute@gmail.com · Anti-doublon email + GitHub · sourceUrl RGPD requis · Sentient · Dark
        </p>
      </footer>
    </div>
  );
}

function HeaderAuth() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.viewer.viewer);
  if (!isAuthenticated || !viewer) {
    return <span className="text-[11px] tracking-[0.08em] uppercase text-white/30">🔒 privé</span>;
  }
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-[12px] tracking-[-0.01em] text-white/50">{viewer.email}</span>
      <SignOutButton />
    </div>
  );
}
