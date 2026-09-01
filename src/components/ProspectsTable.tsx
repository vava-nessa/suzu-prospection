"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, STATUS_OPTIONS } from "@/components/StatusBadge";
import { AddProspectDialog } from "@/components/AddProspectDialog";
import { Search, MoreHorizontal, Trash2, ExternalLink, Globe } from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  );
}

const COUNTRIES = ["all", "FR", "US", "DE", "GB", "ES", "CA", "BE", "CH", "NL", "IT"];

function isConvexConfigured() {
  return !!process.env.NEXT_PUBLIC_CONVEX_URL;
}

function EmptyState() {
  return (
    <div className="border border-dashed border-white/[0.08] rounded-[12px] py-14 text-center bg-white/[0.015]">
      <p className="text-[14px] tracking-[-0.02em] text-white/60">Aucun prospect pour l&apos;instant.</p>
      <p className="text-[12px] tracking-[-0.01em] text-white/30 mt-1">Ajoute ton premier prospect ou lance le scraper. Anti-doublon actif.</p>
    </div>
  );
}

function NotConfiguredState() {
  return (
    <div className="border border-amber-500/20 bg-amber-500/[0.06] rounded-[12px] p-5">
      <p className="text-[13px] font-[600] tracking-[-0.02em] text-amber-200">Convex non connecté</p>
      <ol className="list-decimal list-inside mt-3 space-y-1 text-[13px] tracking-[-0.01em] text-amber-200/70">
        <li><code className="bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[11px]">npx convex dev</code> — crée le projet suzu-prospection</li>
        <li>Génère <code className="bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[11px]">.env.local</code> + <code className="bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[11px]">convex/_generated</code></li>
        <li>Relance <code className="bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[11px]">pnpm dev</code></li>
      </ol>
    </div>
  );
}

export function ProspectsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearchChange as unknown as { _t?: number })._t);
    (handleSearchChange as unknown as { _t: number })._t = window.setTimeout(() => setDebouncedSearch(v), 300) as unknown as number;
  };

  const isConfigured = isConvexConfigured();

  const prospects = useQuery(
    api.prospects.list,
    isConfigured ? { status, country, search: debouncedSearch || undefined, limit: 200 } : "skip"
  );
  const stats = useQuery(api.prospects.stats, isConfigured ? {} : "skip");

  const updateStatus = useMutation(api.prospects.updateStatus);
  const removeProspect = useMutation(api.prospects.remove);

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-[600] tracking-[-0.03em]">Prospects</h1>
          <p className="text-[13px] tracking-[-0.01em] text-white/40">CRM prospection — crédits gratos / cold email</p>
        </div>
        <NotConfiguredState />
      </div>
    );
  }

  const loading = prospects === undefined;

  return (
    <div className="space-y-6">
      {/* Title row — full width */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-[600] tracking-[-0.04em] leading-none">Prospects</h1>
          <p className="text-[13px] tracking-[-0.01em] text-white/40 mt-2">
            Devs qualifiés — outreach “crédits gratos / test gratuit” · {stats ? `${stats.total} total` : "…"} · anti-doublon
          </p>
        </div>
        <AddProspectDialog />
      </div>

      {/* Stats — Linear metrics bar, full width, hairline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-white/[0.06] rounded-[12px] overflow-hidden bg-white/[0.015]">
        {[
          { label: "Total", value: stats ? String(stats.total) : loading ? "—" : "0", sub: stats ? `${stats.verified} vérifiés` : "" },
          { label: "Vérifiés", value: stats ? String(stats.verified) : "—", sub: stats ? `${stats.total ? Math.round((stats.verified / stats.total) * 100) : 0}%` : "" },
          { label: "Envoyés", value: String(stats?.counts?.sent ?? 0), sub: "queued → sent" },
          { label: "Répondu", value: String(stats?.counts?.replied ?? 0), sub: `${stats?.counts?.bounced ?? 0} bounce` },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4 border-r last:border-r-0 border-white/[0.06] [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:border-r">
            <p className="text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">{s.label}</p>
            <p className="text-[24px] font-[600] tracking-[-0.04em] leading-none mt-2">{s.value}</p>
            <p className="text-[11px] tracking-[-0.01em] text-white/30 mt-1 h-4">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters — full width bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center border border-white/[0.06] rounded-[12px] bg-white/[0.015] p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <Input
            placeholder="Recherche nom, email, GitHub, stack…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 pl-8 bg-[#0a0a0a] border-white/[0.08] text-[13px] placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "all")}>
            <SelectTrigger className="h-8 w-[160px] bg-[#0a0a0a] border-white/[0.08] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-white">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v: string | null) => setCountry(v ?? "all")}>
            <SelectTrigger className="h-8 w-[110px] bg-[#0a0a0a] border-white/[0.08] text-[13px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-white">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c} className="text-[13px]">{c === "all" ? "Tous pays" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="border border-white/[0.06] rounded-[12px] bg-white/[0.015] p-6 space-y-3">
          <Skeleton className="h-9 w-full bg-white/[0.06]" />
          <Skeleton className="h-9 w-full bg-white/[0.04]" />
          <Skeleton className="h-9 w-full bg-white/[0.04]" />
        </div>
      ) : !prospects || prospects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop — full-width table, Linear style */}
          <div className="hidden md:block border border-white/[0.06] rounded-[12px] overflow-hidden bg-white/[0.015]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">Prospect</th>
                    <th className="px-4 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Pays</th>
                    <th className="px-4 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Stack</th>
                    <th className="px-4 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Statut</th>
                    <th className="px-4 py-3 w-[44px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {prospects.map((p: any) => (
                    <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-full bg-white text-black grid place-items-center text-[11px] font-[700] tracking-[-0.02em] shrink-0">
                            {(p.firstName?.[0] ?? p.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-[500] tracking-[-0.02em] truncate">
                              {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.githubUsername || "—"}
                            </p>
                            <p className="text-[11px] tracking-[-0.01em] text-white/30 truncate flex items-center gap-1">
                              {p.githubUsername && <><GithubIcon className="h-3 w-3" />{p.githubUsername}</>}
                              {p.githubUsername && p.website && <span className="text-white/15">·</span>}
                              {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="hover:text-white/60 inline-flex items-center gap-1"><Globe className="h-3 w-3" />Site</a>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${p.email}`} className="text-[13px] tracking-[-0.01em] text-white/70 hover:text-white underline decoration-white/10 underline-offset-4">
                          {p.email}
                        </a>
                        {p.emailVerified && <span className="ml-2 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-[500] text-emerald-300">vérifié</span>}
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-[500] tracking-[-0.01em] text-white/50">{p.country ?? "—"}</span></td>
                      <td className="px-4 py-3"><span className="text-[12px] tracking-[-0.01em] text-white/40 truncate max-w-[220px] block">{p.techStack ?? "—"}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button>}></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-white/[0.08] text-white min-w-[180px]">
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "verified" })} className="text-[13px] focus:bg-white/[0.06]">Marquer vérifié</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "queued" })} className="text-[13px] focus:bg-white/[0.06]">Mettre en file</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "sent" })} className="text-[13px] focus:bg-white/[0.06]">Marquer envoyé</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "replied" })} className="text-[13px] focus:bg-white/[0.06]">Marquer répondu</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "opted_out" })} className="text-[13px] focus:bg-white/[0.06]">Opt-out</DropdownMenuItem>
                            {p.website && <DropdownMenuItem onClick={() => window.open(p.website, "_blank")} className="text-[13px] focus:bg-white/[0.06] gap-2"><ExternalLink className="h-3.5 w-3.5" />Voir site</DropdownMenuItem>}
                            {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="text-[13px] focus:bg-white/[0.06] gap-2"><ExternalLink className="h-3.5 w-3.5" />Source RGPD</DropdownMenuItem>}
                            <DropdownMenuItem
                              className="text-[13px] text-red-300 focus:text-red-200 focus:bg-red-500/10"
                              onClick={() => { if (confirm(`Supprimer ${p.email} ?`)) removeProspect({ id: p._id }); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] tracking-[-0.01em] text-white/30">
              {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} · full width · anti-doublon email + GitHub
            </div>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {prospects.map((p: any) => (
              <div key={p._id} className="border border-white/[0.06] rounded-[12px] bg-white/[0.015] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-white text-black grid place-items-center text-[11px] font-[700] shrink-0">
                      {(p.firstName?.[0] ?? p.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-[600] tracking-[-0.02em] truncate">{[p.firstName, p.lastName].filter(Boolean).join(" ") || p.githubUsername || p.email.split("@")[0]}</p>
                      <a href={`mailto:${p.email}`} className="text-[11px] tracking-[-0.01em] text-white/40 hover:text-white/60 break-all">{p.email}</a>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.country && <Badge variant="outline" className="text-[11px] border-white/[0.08] bg-white/[0.04] text-white/50">{p.country}</Badge>}
                  {p.githubUsername && <Badge variant="outline" className="text-[11px] border-white/[0.08] bg-white/[0.04] text-white/50 gap-1"><GithubIcon className="h-3 w-3" />{p.githubUsername}</Badge>}
                  {p.techStack && <Badge variant="outline" className="text-[11px] border-white/[0.08] bg-white/[0.04] text-white/40 truncate max-w-[150px]">{p.techStack}</Badge>}
                  {p.emailVerified && <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[11px]" variant="outline">vérifié</Badge>}
                </div>
                {p.personalizationHook && <p className="text-[12px] tracking-[-0.01em] leading-relaxed border border-white/[0.06] bg-white/[0.03] rounded-[10px] px-3 py-2 text-white/60">💡 {p.personalizationHook}</p>}
                <div className="flex flex-wrap gap-2">
                  {p.website && <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] text-white/70" onClick={() => window.open(p.website, "_blank")}><Globe className="h-3 w-3" /> Site</Button>}
                  {p.sourceUrl && <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] text-white/70" onClick={() => window.open(p.sourceUrl, "_blank")}><ExternalLink className="h-3 w-3" /> Source</Button>}
                  <Select value={p.status} onValueChange={(v: string | null) => v && updateStatus({ id: p._id, status: v })}>
                    <SelectTrigger className="h-7 text-[11px] w-[130px] bg-[#0a0a0a] border-white/[0.08]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/[0.08] text-white">
                      {STATUS_OPTIONS.filter(o => o.value !== "all").map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
