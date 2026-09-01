import { ProspectsTable } from "@/components/ProspectsTable";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-zinc-950/70 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight">suzu-prospection</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">CRM · Convex · Vercel</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">responsive · anti-doublon</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ProspectsTable />
      </main>
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-muted-foreground border-t mt-8">
        Anti-doublon : email (lowercase) + GitHub username · RGPD : sourceUrl obligatoire · Statuts : new → verified → queued → sent → replied
      </footer>
    </div>
  );
}
