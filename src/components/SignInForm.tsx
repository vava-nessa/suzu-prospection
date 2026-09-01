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
      // Convex Auth renvoie souvent l'erreur dans le message
      if (msg.includes("Accès refusé") || msg.includes("non autorisé")) {
        setError("Accès refusé — seul vanessadepraute@gmail.com est autorisé.");
      } else if (msg.includes("Invalid") || msg.includes("InvalidAccountId")) {
        setError(flow === "signIn" ? "Email ou mot de passe incorrect." : "Erreur lors de la création.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-2">S</div>
          <CardTitle className="text-xl">Suzu Prospection</CardTitle>
          <CardDescription>
            {flow === "signIn" ? "Connecte-toi pour accéder à ton CRM" : "Crée ton accès (1 seule fois)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vanessadepraute@gmail.com"
                required
                disabled={loading}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Seul vanessadepraute@gmail.com est autorisé.</p>
            </div>
            <div>
              <label className="text-xs font-medium">Mot de passe</label>
              <div className="relative mt-1">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">8 caractères minimum.</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : flow === "signIn" ? "Se connecter" : "Créer mon accès"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError(null); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
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
    <Button variant="ghost" size="sm" onClick={() => void signOut()} className="gap-2 text-xs">
      <LogOut className="h-4 w-4" /> Déconnexion
    </Button>
  );
}
