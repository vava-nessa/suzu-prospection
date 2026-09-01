"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { Search, MoreHorizontal, Trash2, ExternalLink, Globe, Copy, Check } from "lucide-react";

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
  const map: Record<string, string> = {
    FR: "🇫🇷", US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", ES: "🇪🇸", CA: "🇨🇦", BE: "🇧🇪", CH: "🇨🇭", NL: "🇳🇱", IT: "🇮🇹",
    PL: "🇵🇱", PT: "🇵🇹", IE: "🇮🇪", AT: "🇦🇹", SE: "🇸🇪", DK: "🇩🇰", NO: "🇳🇴", FI: "🇫🇮", CN: "🇨🇳",
    IL: "🇮🇱", AU: "🇦🇺", BR: "🇧🇷", IN: "🇮🇳", PK: "🇵🇰", EG: "🇪🇬", NG: "🇳🇬", JP: "🇯🇵", KR: "🇰🇷",
  };
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

const COUNTRIES = ["all", "FR", "DE", "GB", "ES", "IT", "PL", "NL", "BE", "CH", "AT", "SE", "DK", "US", "CA", "CN"];

function isConvexConfigured() {
  return !!process.env.NEXT_PUBLIC_CONVEX_URL;
}

export function ProspectsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [repliedFilter, setRepliedFilter] = useState("all");
  const [country, setCountry] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [editingHook, setEditingHook] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          limit: 1200,
        }
      : "skip"
  );

  const setContacted = useMutation(api.prospects.setContacted);
  const setReplied = useMutation(api.prospects.setReplied);
  const updateProspect = useMutation(api.prospects.updateProspect);
  const removeProspect = useMutation(api.prospects.remove);

  // virtualization — desktop table only
  const parentRef = useRef<HTMLDivElement>(null);
  const count = prospects?.length ?? 0;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 12,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const progress = useMemo(() => {
    if (!prospects) return null;
    const contacted = prospects.filter((p: any) => p.status === "contacted" || p.status === "sent").length;
    const replied = prospects.filter((p: any) => !!p.replied).length;
    return { total: prospects.length, contacted, replied };
  }, [prospects]);

  if (!isConfigured) return <div className="text-[11px] text-white/40">Convex non connecté.</div>;

  const loading = prospects === undefined;

  return (
    <div className="space-y-2">
      {/* toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <Input
            placeholder="Nom, email, GitHub, site, about…"
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
          {/* Desktop — virtualized */}
          <div className="hidden md:block border border-white/[0.06] rounded-[10px] overflow-hidden bg-[#040405]">
            {/* header */}
            <div className="border-b border-white/[0.06] bg-white/[0.03] flex text-[10px] font-[500] tracking-[0.08em] uppercase text-white/30">
              <div className="px-2.5 py-2 w-[118px] shrink-0">Nom</div>
              <div className="px-2.5 py-2 flex-1 min-w-[220px] max-w-[320px]">About</div>
              <div className="px-2.5 py-2 w-[148px] shrink-0">Site</div>
              <div className="px-2.5 py-2 flex-1 min-w-[180px]">Email</div>
              <div className="px-2.5 py-2 w-[140px] shrink-0">GitHub</div>
              <div className="px-2.5 py-2 w-[74px] shrink-0 text-center">Pays</div>
              <div className="px-2.5 py-2 w-[72px] shrink-0 text-center">Contacté</div>
              <div className="px-2.5 py-2 w-[72px] shrink-0 text-center">Réponse</div>
              <div className="px-2.5 py-2 w-[32px] shrink-0" />
            </div>

            {/* virtual scroll — Safari-safe: explicit height, pas de contain:strict qui casse la mesure */}
            <div ref={parentRef} className="overflow-auto overscroll-contain" style={{ height: "min(62vh, 680px)", maxHeight: "calc(100vh - 200px)" }}>
              <div style={{ height: `${totalSize}px`, position: "relative", width: "100%" }}>
                {count > 0 && virtualItems.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/30">Chargement…</div>
                )}
                {virtualItems.map((vr) => {
                  const p: any = (prospects as any[])[vr.index];
                  const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
                  const hook: string = p.personalizationHook ?? "";
                  const pitch = hook ? `I visited your website and was impressed by ${hook.charAt(0).toLowerCase() + hook.slice(1)} — would love to offer you free access to Suzu.` : "";
                  return (
                    <div
                      key={p._id}
                      data-index={vr.index}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vr.start}px)` }}
                      className={`flex items-center border-b border-white/[0.04] h-[38px] transition-colors ${rowBg(p)}`}
                    >
                      <div
                        className="px-2.5 w-[118px] shrink-0 truncate"
                        onDoubleClick={() => { setEditingId(p._id); setEditingName(displayName(p)); }}
                        title="Double-clique pour éditer"
                      >
                        {editingId === p._id ? (
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={async () => {
                              const v = editingName.trim();
                              if (v && v !== displayName(p)) await updateProspect({ id: p._id, firstName: v });
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingId(null); }}
                            className="h-6 w-[104px] bg-[#161616] border border-white/20 rounded-[6px] px-1.5 text-[12px] font-[500] text-white focus:outline-none focus:border-white/30"
                            placeholder="Prénom"
                          />
                        ) : (
                          <span className="text-[12px] font-[500] tracking-[-0.01em] text-white/85 cursor-text select-none hover:text-white truncate block">{displayName(p)}</span>
                        )}
                      </div>

                      <div
                        className="px-2.5 flex-1 min-w-[220px] max-w-[320px] truncate"
                        onDoubleClick={() => { setEditingHookId(p._id); setEditingHook(hook); }}
                        title={hook ? `${hook}\n\nDouble-clique pour éditer` : "Double-clique pour ajouter About"}
                      >
                        {editingHookId === p._id ? (
                          <input
                            autoFocus
                            value={editingHook}
                            onChange={(e) => setEditingHook(e.target.value)}
                            onBlur={async () => {
                              const v = editingHook.trim();
                              if (v !== hook) await updateProspect({ id: p._id, personalizationHook: v || undefined });
                              setEditingHookId(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingHookId(null); }}
                            className="h-6 w-[240px] bg-[#161616] border border-white/20 rounded-[6px] px-1.5 text-[11px] text-white focus:outline-none focus:border-white/30"
                            placeholder="About…"
                          />
                        ) : hook ? (
                          <div className="group flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] leading-[1.35] tracking-[-0.01em] text-white/45 truncate cursor-text select-none group-hover:text-white/65 flex-1 min-w-0">{hook}</span>
                            <button
                              title="Copier pitch"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await navigator.clipboard.writeText(`Hey ${displayName(p)}, ${pitch}`);
                                setCopiedId(p._id); setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-[5px] border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-white/30 hover:text-white/70"
                            >
                              {copiedId === p._id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-white/15 cursor-text">—</span>
                        )}
                      </div>

                      <div className="px-2.5 w-[148px] shrink-0 truncate">
                        {p.website ? (
                          <a href={p.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] tracking-[-0.01em] text-white/40 hover:text-white truncate">
                            <Globe className="h-3 w-3 shrink-0" /><span className="truncate">{siteHost(p.website) ?? "Site"}</span>
                          </a>
                        ) : <span className="text-[11px] text-white/15">—</span>}
                      </div>

                      <div className="px-2.5 flex-1 min-w-[180px] truncate">
                        <a href={`mailto:${p.email}`} className="text-[11px] tracking-[-0.01em] text-white/55 hover:text-white underline decoration-white/10 underline-offset-4 truncate block">
                          {p.email}
                        </a>
                      </div>

                      <div className="px-2.5 w-[140px] shrink-0 truncate">
                        {p.githubUsername ? (
                          <a href={`https://github.com/${p.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white truncate">
                            <GithubIcon className="h-3 w-3 shrink-0" />{p.githubUsername}
                          </a>
                        ) : <span className="text-[11px] text-white/15">—</span>}
                      </div>

                      <div className="px-2.5 w-[74px] shrink-0 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px]"><span className="text-[13px] leading-none">{countryFlag(p.country)}</span><span className="text-white/50 font-[500]">{(p.country ?? "—").toUpperCase()}</span></span>
                      </div>

                      <div className="px-2.5 w-[72px] shrink-0 text-center">
                        <input type="checkbox" checked={contacted} onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })} className="h-3.5 w-3.5 rounded-full align-middle accent-sky-500" title="Contacté = bleu" />
                      </div>

                      <div className="px-2.5 w-[72px] shrink-0 text-center">
                        <input type="checkbox" checked={!!p.replied} onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })} className="h-3.5 w-3.5 rounded align-middle accent-emerald-500" title="Réponse = vert" />
                      </div>

                      <div className="px-2.5 w-[32px] shrink-0 flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07] text-white/40"><MoreHorizontal className="h-3 w-3" /></button>}></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0f0f0f] border-white/[0.08] text-white min-w-[160px]">
                            <DropdownMenuItem onClick={() => setContacted({ id: p._id, contacted: !contacted })} className="text-[12px]">{contacted ? "Retirer contacté" : "Marquer contacté"}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReplied({ id: p._id, replied: !p.replied })} className="text-[12px]">{p.replied ? "Retirer réponse" : "Marquer réponse"}</DropdownMenuItem>
                            {hook && <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(`Hey ${displayName(p)}, ${pitch}`); setCopiedId(p._id); setTimeout(()=>setCopiedId(null),1500); }} className="text-[12px] gap-1"><Copy className="h-3 w-3" />Copier pitch</DropdownMenuItem>}
                            {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="text-[12px] gap-1"><ExternalLink className="h-3 w-3" />Source</DropdownMenuItem>}
                            <DropdownMenuItem className="text-[12px] text-red-300 focus:text-red-200 focus:bg-red-500/10" onClick={() => { if (confirm(`Supprimer ${p.email} ?`)) removeProspect({ id: p._id }); }}><Trash2 className="h-3 w-3" /> Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] tracking-[-0.01em] text-white/25 flex justify-between">
              <span>{progress ? `${progress.total} prospects · ${progress.contacted} contactés · ${progress.replied} réponses` : `${count} prospects`} · virtuel 1000+ · noir/bleu/vert · double-clic Nom/About</span>
              <span className="text-white/20">{count >= 1000 ? "1000 ✓" : `${count}/1000`}</span>
            </div>
          </div>

          {/* Mobile — gardé non virtualisé (limité aux 1200, ok sur mobile) */}
          <div className="grid gap-2 md:hidden">
            {(prospects as any[]).slice(0, 200).map((p: any) => {
              const contacted = p.status === "contacted" || p.status === "sent" || p.status === "replied";
              return (
                <div key={p._id} className={`border rounded-[10px] p-3 flex flex-col gap-2 ${p.replied ? "border-emerald-500/25 bg-emerald-500/[0.08]" : contacted ? "border-sky-400/25 bg-sky-500/[0.06]" : "border-white/[0.06] bg-white/[0.015]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className="text-[12px] font-[600] tracking-[-0.02em] truncate cursor-text select-none hover:text-white"
                      onDoubleClick={() => { setEditingId(p._id); setEditingName(displayName(p)); }}
                      title="Double-clique pour éditer"
                    >
                      {editingId === p._id ? (
                        <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={async () => { const v = editingName.trim(); if (v && v !== displayName(p)) await updateProspect({ id: p._id, firstName: v }); setEditingId(null); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingId(null); }} className="h-6 w-[112px] bg-[#161616] border border-white/20 rounded-[6px] px-1.5 text-[12px] font-[600] text-white focus:outline-none focus:border-white/30" placeholder="Prénom" onClick={(e) => e.stopPropagation()} />
                      ) : displayName(p)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[14px]">{countryFlag(p.country)}</span>
                      <input type="checkbox" checked={contacted} onChange={(e) => setContacted({ id: p._id, contacted: e.target.checked })} className="h-3.5 w-3.5 accent-sky-500 rounded-full" />
                      <input type="checkbox" checked={!!p.replied} onChange={(e) => setReplied({ id: p._id, replied: e.target.checked })} className="h-3.5 w-3.5 accent-emerald-500" />
                    </div>
                  </div>
                  <p className="text-[10px] tracking-[-0.01em] text-white/35 truncate">{p.email} {p.githubUsername ? `· ${p.githubUsername}` : ""}</p>
                  {p.personalizationHook && <p className="text-[11px] leading-[1.4] tracking-[-0.01em] text-white/45 line-clamp-3">{p.personalizationHook}</p>}
                </div>
              );
            })}
            {(prospects as any[]).length > 200 && <div className="text-[11px] text-white/30 text-center py-2">+ {(prospects as any[]).length - 200} autres — filtre ou passe sur desktop</div>}
          </div>
        </>
      )}
    </div>
  );
}
