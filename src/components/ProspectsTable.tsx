"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
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

function countryFlag(code?: string): string {
  const c = (code ?? "").trim().toUpperCase();
  if (c.length !== 2) return "🌍";
  const map: Record<string, string> = { FR: "🇫🇷", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", ES: "🇪🇸", CA: "🇨🇦", BE: "🇧🇪", CH: "🇨🇭", NL: "🇳🇱", IT: "🇮🇹", PL: "🇵🇱", PT: "🇵🇹", IE: "🇮🇪", IL: "🇮🇱", AU: "🇦🇺", BR: "🇧🇷", IN: "🇮🇳", MX: "🇲🇽", SE: "🇸🇪", DK: "🇩🇰", NO: "🇳🇴", JP: "🇯🇵", KR: "🇰🇷" };
  if (map[c]) return map[c];
  const A = "A".charCodeAt(0);
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + (ch.charCodeAt(0) - A)));
}

function displayName(p: any): string {
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  if (n) return n;
  if (p.githubUsername) return p.githubUsername;
  return p.email.split("@")[0];
}

function siteHost(url?: string): string | null {
  if (!url) return null;
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}

function rowBg(p: any): string {
  // replied > contacted > not_contacted — subtle blue/green wash on black
  if (p.replied) return "bg-emerald-500/[0.09] hover:bg-emerald-500/[0.13] border-l-2 border-l-emerald-500/60";
  const s = p.status as string;
  const contacted = s === "contacted" || s === "sent" || s === "replied";
  if (contacted) return "bg-sky-500/[0.07] hover:bg-sky-500/[0.11] border-l-2 border-l-sky-400/50";
  return "bg-transparent hover:bg-white/[0.03]";
}

const COUNTRIES = ["all", "FR", "US", "DE", "GB", "ES", "CA", "BE", "CH", "NL", "IT"];

function isConvexConfigured() {
  return !!process.env.NEXT_PUBLIC_CONVEX_URL;
}

function EmptyState() {
  return (
    <div className="border border-dashed border-white/[0.08] rounded-[12px] py-14 text-center bg-white/[0.015]">
      <p className="text-[14px] tracking-[-0.02em] text-white/60">Aucun prospect.</p>
      <p className="text-[12px] tracking-[-0.01em] text-white/30 mt-1">Ajoute un prospect ou importe en masse — anti-doublon actif.</p>
    </div>
  );
}

export function ProspectsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [repliedFilter, setRepliedFilter] = useState("all");
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
    isConfigured
      ? {
          status,
          country,
          search: debouncedSearch || undefined,
          replied: repliedFilter === "all" ? undefined : repliedFilter === "replied",
          limit: 300,
        }
      : "skip"
  );
  const stats = useQuery(api.prospects.stats, isConfigured ? {} : "skip");

  const setContacted = useMutation(api.prospects.setContacted);
  const setReplied = useMutation(api.prospects.setReplied);
  const removeProspect = useMutation(api.prospects.remove);

  if (!isConfigured) {
    return <div className="text-[13px] text-white/40">Convex non connecté — <code>CONVEX_URL</code> manquant.</div>;
  }

  const loading = prospects === undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-[600] tracking-[-0.04em] leading-none">Prospects</h1>
          <p className="text-[13px] tracking-[-0.01em] text-white/40 mt-2">
            {stats ? `${stats.total} total · ${stats.not_contacted} non contactés · ${stats.contacted} contactés · ${stats.replied} réponses` : "…"} · bleu = contacté · vert = réponse
          </p>
        </div>
        <AddProspectDialog />
      </div>

      {/* Legend — scannable row */}
      <div className="flex flex-wrap gap-2 text-[11px] tracking-[-0.01em]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-transparent px-3 py-1 text-white/50">
          <span className="h-2 w-2 rounded-full bg-white/20" /> Non contacté — fond noir
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/[0.08] px-3 py-1 text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" /> Contacté — bleu
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.09] px-3 py-1 text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Réponse — vert
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center border border-white/[0.06] rounded-[12px] bg-white/[0.015] p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <Input
            placeholder="Recherche nom, email, GitHub, site…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 pl-8 bg-[#0a0a0a] border-white/[0.08] text-[13px] placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "all")}>
            <SelectTrigger className="h-8 w-[150px] bg-[#0a0a0a] border-white/[0.08] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-white">
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={repliedFilter} onValueChange={(v: string | null) => setRepliedFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-[140px] bg-[#0a0a0a] border-white/[0.08] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-white">
              <SelectItem value="all" className="text-[13px]">Toute réponse</SelectItem>
              <SelectItem value="replied" className="text-[13px]">Avec réponse</SelectItem>
              <SelectItem value="no_reply" className="text-[13px]">Sans réponse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v: string | null) => setCountry(v ?? "all")}>
            <SelectTrigger className="h-8 w-[120px] bg-[#0a0a0a] border-white/[0.08] text-[13px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent className="bg-[#111] border-white/[0.08] text-white">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c} className="text-[13px]">{c === "all" ? "Tous pays" : `${countryFlag(c)} ${c}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table — black rows, blue/green wash for progress */}
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
          {/* Desktop */}
          <div className="hidden md:block border border-white/[0.06] rounded-[12px] overflow-hidden bg-[#050507]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.04]">
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">Nom</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">Site</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">Email</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30 whitespace-nowrap">GitHub</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Pays</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Contacté</th>
                    <th className="px-3 py-3 text-[11px] font-[500] tracking-[0.08em] uppercase text-white/30">Réponse</th>
                    <th className="px-3 py-3 w-[36px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {prospects.map((p: any) => {
                    const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
                    return (
                      <tr key={p._id} className={`transition-colors ${rowBg(p)}`}>
                        <td className="px-3 py-2.5">
                          <span className="text-[13px] font-[500] tracking-[-0.02em] text-white/90">{displayName(p)}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          {p.website ? (
                            <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] tracking-[-0.01em] text-white/50 hover:text-white underline decoration-white/10 underline-offset-4">
                              <Globe className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{siteHost(p.website) ?? "Site"}</span>
                              <ExternalLink className="h-3 w-3 opacity-40" />
                            </a>
                          ) : (
                            <span className="text-[12px] text-white/20">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <a href={`mailto:${p.email}`} className="text-[12px] tracking-[-0.01em] text-white/60 hover:text-white underline decoration-white/10 underline-offset-4">
                            {p.email}
                          </a>
                        </td>
                        <td className="px-3 py-2.5">
                          {p.githubUsername ? (
                            <a href={`https://github.com/${p.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] tracking-[-0.01em] text-white/60 hover:text-white">
                              <GithubIcon className="h-3.5 w-3.5" />
                              {p.githubUsername}
                              <ExternalLink className="h-3 w-3 opacity-40" />
                            </a>
                          ) : (
                            <span className="text-[12px] text-white/20">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[12px] tracking-[-0.01em] text-white/60">
                            <span className="text-[14px] leading-none">{countryFlag(p.country)}</span>
                            <span className="font-[500]">{(p.country ?? "—").toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={contacted}
                              onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })}
                              className="h-4 w-4 rounded-full border-white/15 bg-white/[0.06] text-sky-500 focus:ring-sky-500/20 accent-sky-500"
                            />
                            <StatusBadge status={contacted ? "contacted" : "not_contacted"} />
                          </label>
                        </td>
                        <td className="px-3 py-2.5">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!p.replied}
                              onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })}
                              className="h-4 w-4 rounded border-white/15 bg-white/[0.06] accent-emerald-500 focus:ring-emerald-500/20"
                            />
                            {p.replied ? (
                              <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-[600] tracking-[-0.01em] text-emerald-300">Répondu</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-[500] tracking-[-0.01em] text-white/30">—</span>
                            )}
                          </label>
                        </td>
                        <td className="px-3 py-2.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button>}></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-white/[0.08] text-white min-w-[180px]">
                              {!contacted ? (
                                <DropdownMenuItem onClick={() => setContacted({ id: p._id, contacted: true })} className="text-[13px] focus:bg-white/[0.06]">Marquer contacté (bleu)</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setContacted({ id: p._id, contacted: false })} className="text-[13px] focus:bg-white/[0.06]">Retirer contacté</DropdownMenuItem>
                              )}
                              {!p.replied ? (
                                <DropdownMenuItem onClick={() => setReplied({ id: p._id, replied: true })} className="text-[13px] focus:bg-white/[0.06]">Marquer réponse (vert)</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setReplied({ id: p._id, replied: false })} className="text-[13px] focus:bg-white/[0.06]">Retirer réponse</DropdownMenuItem>
                              )}
                              {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="text-[13px] focus:bg-white/[0.06] gap-2"><ExternalLink className="h-3.5 w-3.5" />Source RGPD</DropdownMenuItem>}
                              <DropdownMenuItem className="text-[13px] text-red-300 focus:text-red-200 focus:bg-red-500/10" onClick={() => { if (confirm(`Supprimer ${p.email} ?`)) removeProspect({ id: p._id }); }}>
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/[0.06] bg-white/[0.02] flex flex-wrap gap-3 px-4 py-3 text-[11px] tracking-[-0.01em] text-white/30">
              <span>{prospects.length} prospect{prospects.length !== 1 ? "s" : ""}</span>
              <span className="text-white/15">·</span>
              <span><i className="inline-block h-2 w-4 rounded-sm bg-white/10 border border-white/10 align-middle mr-1.5" />non contacté</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-4 rounded-sm bg-sky-500/20 border border-sky-400/30" />contacté</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-4 rounded-sm bg-emerald-500/15 border border-emerald-500/30" />réponse</span>
            </div>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {prospects.map((p: any) => {
              const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
              return (
                <div key={p._id} className={`border rounded-[12px] p-4 space-y-3 ${p.replied ? "border-emerald-500/25 bg-emerald-500/[0.08]" : contacted ? "border-sky-400/25 bg-sky-500/[0.06]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-[600] tracking-[-0.02em] truncate">{displayName(p)}</p>
                      <a href={`mailto:${p.email}`} className="text-[11px] tracking-[-0.01em] text-white/40 break-all">{p.email}</a>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<button className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/[0.06] bg-white/[0.03]"><MoreHorizontal className="h-3.5 w-3.5 text-white/40" /></button>}></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-white/[0.08] text-white">
                        <DropdownMenuItem onClick={() => setContacted({ id: p._id, contacted: !contacted })} className="text-[13px]">{contacted ? "Retirer contacté" : "Marquer contacté"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setReplied({ id: p._id, replied: !p.replied })} className="text-[13px]">{p.replied ? "Retirer réponse" : "Marquer réponse"}</DropdownMenuItem>
                        {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="text-[13px]">Source RGPD</DropdownMenuItem>}
                        <DropdownMenuItem className="text-red-300" onClick={() => confirm(`Supprimer ${p.email} ?`) && removeProspect({ id: p._id })}><Trash2 className="h-3 w-3.5" />Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/60 hover:text-white"><Globe className="h-3 w-3" />{siteHost(p.website)}</a>}
                    {p.githubUsername && <a href={`https://github.com/${p.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/60 hover:text-white"><GithubIcon className="h-3 w-3" />{p.githubUsername}</a>}
                    <span className="inline-flex items-center gap-1"><span className="text-[14px]">{countryFlag(p.country)}</span>{(p.country ?? "—").toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[12px] tracking-[-0.01em]">
                      <input type="checkbox" checked={contacted} onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })} className="h-4 w-4 accent-sky-500 rounded-full" />
                      <StatusBadge status={contacted ? "contacted" : "not_contacted"} />
                    </label>
                    <label className="inline-flex items-center gap-2 text-[12px]">
                      <input type="checkbox" checked={!!p.replied} onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                      {p.replied ? <span className="text-emerald-300 font-[600]">Répondu</span> : <span className="text-white/30">— réponse</span>}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
