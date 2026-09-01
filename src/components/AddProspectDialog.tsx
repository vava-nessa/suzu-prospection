"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export function AddProspectDialog({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const upsert = useMutation(api.prospects.upsert);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    githubUsername: "",
    website: "",
    country: "",
    techStack: "",
    personalizationHook: "",
    sourceType: "manual",
    sourceUrl: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.email.trim() || !form.sourceUrl.trim()) {
      setError("Email et sourceUrl sont obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const res = await upsert({
        email: form.email.trim(),
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        githubUsername: form.githubUsername || undefined,
        website: form.website || undefined,
        country: form.country || undefined,
        techStack: form.techStack || undefined,
        personalizationHook: form.personalizationHook || undefined,
        sourceType: form.sourceType,
        sourceUrl: form.sourceUrl,
        notes: form.notes || undefined,
      });
      if (res.status === "skipped_duplicate" || res.status === "skipped_duplicate_github") {
        setError(`Doublon détecté — déjà présent : ${res.email}`);
      } else {
        setSuccess(`Prospect créé : ${res.email}`);
        setForm({
          email: "", firstName: "", lastName: "", githubUsername: "",
          website: "", country: "", techStack: "", personalizationHook: "",
          sourceType: "manual", sourceUrl: "", notes: "",
        });
        onAdded?.();
        setTimeout(() => setOpen(false), 900);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> Ajouter un prospect</button>}></DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un prospect</DialogTitle>
          <DialogDescription>
            Anti-doublon actif sur email (insensible à la casse) + GitHub. SourceUrl = preuve RGPD.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium">Email *</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@exemple.com" type="email" required />
            </div>
            <div>
              <label className="text-xs font-medium">Prénom</label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Alex" />
            </div>
            <div>
              <label className="text-xs font-medium">Nom</label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" />
            </div>
            <div>
              <label className="text-xs font-medium">GitHub</label>
              <Input value={form.githubUsername} onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} placeholder="octocat" />
            </div>
            <div>
              <label className="text-xs font-medium">Pays (ISO2)</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="FR" maxLength={2} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Site web</label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." type="url" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Stack</label>
              <Input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="nextjs, rust, python" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Hook personnalisation</label>
              <Input value={form.personalizationHook} onChange={(e) => setForm({ ...form, personalizationHook: e.target.value })} placeholder="a build un CLI Rust pour parser du PDF" />
            </div>
            <div>
              <label className="text-xs font-medium">Source type</label>
              <Select value={form.sourceType} onValueChange={(v: string | null) => setForm({ ...form, sourceType: v ?? "manual" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">manual</SelectItem>
                  <SelectItem value="github">github</SelectItem>
                  <SelectItem value="website">website</SelectItem>
                  <SelectItem value="producthunt">producthunt</SelectItem>
                  <SelectItem value="directory">directory</SelectItem>
                  <SelectItem value="referral">referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Source URL *</label>
              <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://github.com/..." required />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Notes</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes internes" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">{success}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Ajout..." : "Créer le prospect"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
