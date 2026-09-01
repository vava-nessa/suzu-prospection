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
        setError(`Doublon — déjà présent : ${res.email}`);
      } else {
        setSuccess(`Créé : ${res.email}`);
        setForm({
          email: "", firstName: "", lastName: "", githubUsername: "",
          website: "", country: "", techStack: "", personalizationHook: "",
          sourceType: "manual", sourceUrl: "", notes: "",
        });
        onAdded?.();
        setTimeout(() => setOpen(false), 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-[600] tracking-[-0.01em] text-black hover:bg-white/90"> <Plus className="h-3.5 w-3.5" /> Ajouter un prospect</button>}></DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/[0.08] bg-[#0f0f0f] text-white">
        <DialogHeader>
          <DialogTitle className="tracking-[-0.03em]">Ajouter un prospect</DialogTitle>
          <DialogDescription className="text-white/40 text-[13px]">
            Anti-doublon sur email + GitHub. sourceUrl = preuve RGPD.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Email *</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="alex@exemple.com" type="email" required className="mt-1 bg-white/[0.04] border-white/[0.08] focus-visible:border-white/15" />
            </div>
            <div>
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Prénom</label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Alex" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Nom</label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Dupont" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">GitHub</label>
              <Input value={form.githubUsername} onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} placeholder="octocat" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Pays</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="FR" maxLength={2} className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Site web</label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." type="url" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Stack</label>
              <Input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="nextjs, rust, python" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Hook perso</label>
              <Input value={form.personalizationHook} onChange={(e) => setForm({ ...form, personalizationHook: e.target.value })} placeholder="a build un CLI Rust pour parser du PDF" className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Source type</label>
              <Select value={form.sourceType} onValueChange={(v: string | null) => setForm({ ...form, sourceType: v ?? "manual" })}>
                <SelectTrigger className="mt-1 bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#0f0f0f] text-white">
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
              <label className="text-[11px] font-[500] tracking-[0.08em] uppercase text-white/50">Source URL *</label>
              <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://github.com/..." required className="mt-1 bg-white/[0.04] border-white/[0.08]" />
            </div>
          </div>

          {error && <p className="text-[13px] tracking-[-0.01em] text-red-200 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2">{error}</p>}
          {success && <p className="text-[13px] tracking-[-0.01em] text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-[10px] px-3 py-2">{success}</p>}

          <Button type="submit" disabled={loading} className="w-full h-9 bg-white text-black hover:bg-white/90 text-[13px] font-[600]">
            {loading ? "…" : "Créer le prospect"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
