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
  if (p.firstName) return p.firstName;
  if (p.githubUsername) return p.githubUsername;
  return p.email.split("@")[0];
}

function siteHost(url?: string): string | null {
  if (!url) return null;
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}

function rowBg(p: any): string {
  if (p.replied) return "bg-emerald-500/[0.09] hover:bg-emerald-500/[0.13] border-l-2 border-l-emerald-500/60";
  const s = p.status as string;
  if (s === "contacted" || s === "sent" || s === "replied") return "bg-sky-500/[0.07] hover:bg-sky-500/[0.11] border-l-2 border-l-sky-400/50";
  return "bg-transparent hover:bg-white/[0.025]";
}

const COUNTRIES = ["all", "FR", "US", "DE", "GB", "ES", "CA", "BE", "CH", "NL", "IT"];

function isConvexConfigured() {
  return !!process.env.NEXT_PUBLIC_CONVEX_URL;
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
          limit: 400,
        }
      : "skip"
  );

  const setContacted = useMutation(api.prospects.setContacted);
  const setReplied = useMutation(api.prospects.setReplied);
  const removeProspect = useMutation(api.prospects.remove);

  if (!isConfigured) return <div className="text-[11px] text-white/40">Convex non connecté.</div>;

  const loading = prospects === undefined;

  return (
    <div className="space-y-2">
      {/* compact toolbar — no title/legend, list starts high */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <Input
            placeholder="Nom, email, GitHub, site…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-7 pl-8 bg-[#0c0c0c] border-white/[0.07] text-[12px] placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "all")}>
            <SelectTrigger className="h-7 w-[128px] bg-[#0c0c0c] border-white/[0.07] text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/[0.08] text-white">
              <SelectItem value="all" className="text-[12px]">Tous</SelectItem>
              <SelectItem value="not_contacted" className="text-[12px]">Non contactés</SelectItem>
              <SelectItem value="contacted" className="text-[12px]">Contactés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={repliedFilter} onValueChange={(v: string | null) => setRepliedFilter(v ?? "all")}>
            <SelectTrigger className="h-7 w-[124px] bg-[#0c0c0c] border-white/[0.07] text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/[0.08] text-white">
              <SelectItem value="all" className="text-[12px]">Toute réponse</SelectItem>
              <SelectItem value="replied" className="text-[12px]">Répondu</SelectItem>
              <SelectItem value="no_reply" className="text-[12px]">Sans réponse</SelectItem>
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v: string | null) => setCountry(v ?? "all")}>
            <SelectTrigger className="h-7 w-[102px] bg-[#0c0c0c] border-white/[0.07] text-[12px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/[0.08] text-white">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c} className="text-[12px]">{c === "all" ? "Tous pays" : `${countryFlag(c)} ${c}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddProspectDialog />
        </div>
      </div>

      {loading ? (
        <div className="border border-white/[0.06] rounded-[10px] p-3 space-y-2">
          <Skeleton className="h-6 w-full bg-white/[0.06]" />
          <Skeleton className="h-6 w-full bg-white/[0.04]" />
        </div>
      ) : !prospects || prospects.length === 0 ? (
        <div className="border border-dashed border-white/[0.07] rounded-[10px] py-10 text-center text-[12px] tracking-[-0.01em] text-white/30">Aucun prospect · anti-doublon actif</div>
      ) : (
        <>
          {/* Desktop — compact rows */}
          <div className="hidden md:block border border-white/[0.06] rounded-[10px] overflow-hidden bg-[#040405]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">Nom</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">Site</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">Email</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">GitHub</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30 text-center">Pays</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30 text-center">Contacté</th>
                    <th className="px-2.5 py-2 text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30 text-center">Réponse</th>
                    <th className="px-2.5 py-2 w-[28px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {prospects.map((p: any) => {
                    const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
                    return (
                      <tr key={p._id} className={`transition-colors ${rowBg(p)}`}>
                        <td className="px-2.5 py-1.5"><span className="text-[12px] font-[500] tracking-[-0.01em] text-white/85">{displayName(p)}</span></td>
                        <td className="px-2.5 py-1.5">
                          {p.website ? (
                            <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] tracking-[-0.01em] text-white/40 hover:text-white">
                              <Globe className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{siteHost(p.website) ?? "Site"}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-white/15">—</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <a href={`mailto:${p.email}`} className="text-[11px] tracking-[-0.01em] text-white/55 hover:text-white underline decoration-white/10 underline-offset-4">
                            {p.email}
                          </a>
                        </td>
                        <td className="px-2.5 py-1.5">
                          {p.githubUsername ? (
                            <a href={`https://github.com/${p.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] tracking-[-0.01em] text-white/55 hover:text-white">
                              <GithubIcon className="h-3 w-3" />{p.githubUsername}
                            </a>
                          ) : (
                            <span className="text-[11px] text-white/15">—</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <span className="text-[13px] leading-none">{countryFlag(p.country)}</span>
                            <span className="text-white/50 font-[500]">{(p.country ?? "—").toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={contacted}
                            onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })}
                            className="h-3.5 w-3.5 rounded-full align-middle accent-sky-500"
                            title="Contacté = bleu"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={!!p.replied}
                            onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })}
                            className="h-3.5 w-3.5 rounded align-middle accent-emerald-500"
                            title="Réponse = vert"
                          />
                        </td>
                        <td className="px-2.5 py-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] text-white/40"><MoreHorizontal className="h-3 w-3" /></button>}></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-white/[0.08] text-white min-w-[160px]">
                              <DropdownMenuItem onClick={() => setContacted({ id: p._id, contacted: !contacted })} className="text-[12px]">{contacted ? "Retirer contacté" : "Marquer contacté"}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setReplied({ id: p._id, replied: !p.replied })} className="text-[12px]">{p.replied ? "Retirer réponse" : "Marquer réponse"}</DropdownMenuItem>
                              {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="text-[12px] gap-1"><ExternalLink className="h-3 w-3" />Source</DropdownMenuItem>}
                              <DropdownMenuItem className="text-[12px] text-red-300 focus:text-red-200 focus:bg-red-500/10" onClick={() => { if (confirm(`Supprimer ${p.email} ?`)) removeProspect({ id: p._id }); }}>
                                <Trash2 className="h-3 w-3" /> Supprimer
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
            <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] tracking-[-0.01em] text-white/25">
              {prospects.length} · noir = non contacté · bleu = contacté · vert = réponse
            </div>
          </div>

          {/* Mobile */}
          <div className="grid gap-2 md:hidden">
            {prospects.map((p: any) => {
              const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
              return (
                <div key={p._id} className={`border rounded-[10px] p-3 flex items-center justify-between gap-3 ${p.replied ? "border-emerald-500/25 bg-emerald-500/[0.08]" : contacted ? "border-sky-400/25 bg-sky-500/[0.06]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-[600] tracking-[-0.02em] truncate">{displayName(p)}</p>
                    <p className="text-[10px] tracking-[-0.01em] text-white/35 truncate">{p.email} {p.githubUsername ? `· ${p.githubUsername}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[14px]">{countryFlag(p.country)}</span>
                    <input type="checkbox" checked={contacted} onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })} className="h-3.5 w-3.5 accent-sky-500 rounded-full" />
                    <input type="checkbox" checked={!!p.replied} onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })} className="h-3.5 w-3.5 accent-emerald-500" />
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
