"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Eye, EyeOff } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("vanessadepraute@gmail.com");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email: email.trim().toLowerCase(), password, flow });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Accès refusé") || msg.includes("non autorisé")) {
        setError("Accès refusé — seul vanessadepraute@gmail.com est autorisé.");
      } else if (msg.toLowerCase().includes("invalid")) {
        setError(flow === "signIn" ? "Email ou mot de passe incorrect." : "Impossible de créer le compte.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] grid place-items-center px-4 py-10">
      <Card className="w-full max-w-[420px] border-white/[0.08] bg-white/[0.03] backdrop-blur shadow-none">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-[10px] bg-white text-black grid place-items-center font-[700] text-[14px] tracking-[-0.02em] mb-3">S</div>
          <CardTitle className="text-[18px] tracking-[-0.03em] font-[600]">Suzu Prospection</CardTitle>
          <CardDescription className="text-[13px] tracking-[-0.01em] text-white/40">
            {flow === "signIn" ? "Connecte-toi pour accéder à ton CRM" : "Crée ton accès — une seule fois"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vanessadepraute@gmail.com"
                required
                disabled={loading}
                className="h-9 bg-white/[0.04] border-white/[0.08] text-[13px] placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-white/10"
              />
              <p className="text-[11px] tracking-[-0.01em] text-white/25">Seul vanessadepraute@gmail.com est autorisé.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Mot de passe</label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-[13px] pr-9 placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 p-1"
                  tabIndex={-1}
                  aria-label={show ? "Masquer" : "Afficher"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] tracking-[-0.01em] text-white/25">8 caractères minimum.</p>
            </div>

            {error && (
              <div className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] tracking-[-0.01em] text-red-200">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-9 bg-white text-black hover:bg-white/90 text-[13px] font-[600] tracking-[-0.01em]" disabled={loading}>
              {loading ? "…" : flow === "signIn" ? "Se connecter" : "Créer mon accès"}
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError(null); }}
                className="text-[12px] tracking-[-0.01em] text-white/30 hover:text-white/60 underline underline-offset-4 decoration-white/15"
              >
                {flow === "signIn" ? "Première fois ? Créer mon accès →" : "Déjà un compte ? Se connecter →"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()} className="h-7 gap-1.5 text-[12px] tracking-[-0.01em] text-white/50 hover:text-white hover:bg-white/[0.06] px-2.5">
      <LogOut className="h-3.5 w-3.5" /> Déconnexion
    </Button>
  );
}
