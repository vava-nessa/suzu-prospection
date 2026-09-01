"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun prospect pour l&apos;instant. Ajoute ton premier prospect ou lance le scraper.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Anti-doublon actif : email (lowercase) + GitHub username uniques.
        </p>
      </CardContent>
    </Card>
  );
}

function NotConfiguredState() {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <CardTitle className="text-amber-900 text-base">Convex non connecté</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-amber-800">
        <p>Ce CRM a besoin d&apos;un backend Convex (free plan). Étapes :</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li><code className="bg-white px-1.5 py-0.5 rounded border text-xs">npx convex dev</code> — connecte ton compte Convex (GitHub OAuth) et crée le projet <b>suzu-prospection</b></li>
          <li>Ça génère <code className="bg-white px-1.5 py-0.5 rounded border text-xs">.env.local</code> avec <code className="text-xs">NEXT_PUBLIC_CONVEX_URL</code> + dossier <code className="text-xs">convex/_generated</code></li>
          <li>Relance <code className="bg-white px-1.5 py-0.5 rounded border text-xs">pnpm dev</code> — le tableau devient live.</li>
        </ol>
        <p className="text-xs">Ensuite on déploiera sur Vercel (tu me connecteras tes comptes Convex + Vercel).</p>
      </CardContent>
    </Card>
  );
}

export function ProspectsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // simple debounce
  const handleSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearchChange as unknown as { _t?: number })._t);
    (handleSearchChange as unknown as { _t: number })._t = window.setTimeout(() => setDebouncedSearch(v), 350) as unknown as number;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Suzu Prospection</h1>
            <p className="text-sm text-muted-foreground">CRM prospects devs — crédits gratos / cold email</p>
          </div>
          <Badge variant="outline" className="w-fit bg-amber-50 text-amber-700 border-amber-200">Convex non connecté</Badge>
        </div>
        <NotConfiguredState />
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">—</p><p className="text-xs text-muted-foreground">En attente de Convex</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Vérifiés</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Envoyés</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">—</p></CardContent></Card>
        </div>
      </div>
    );
  }

  const loading = prospects === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Suzu Prospection</h1>
            <p className="text-sm text-muted-foreground">
              Prospects devs qualifiés — outreach &quot;crédits gratos / test gratuit&quot;
            </p>
          </div>
          <AddProspectDialog />
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total prospects</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats ? stats.total : loading ? "—" : "0"}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Vérifiés</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats ? stats.verified : "—"}</p>
              <p className="text-xs text-muted-foreground">{stats ? `${stats.total ? Math.round((stats.verified / stats.total) * 100) : 0}%` : ""}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Envoyés</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.counts?.sent ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Répondu</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.counts?.replied ?? 0}</p></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Recherche nom, email, GitHub, stack..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "all")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={country} onValueChange={(v: string | null) => setCountry(v ?? "all")}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === "all" ? "Tous pays" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : !prospects || prospects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Stack</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((p: any) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(p.firstName?.[0] ?? p.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.githubUsername || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              {p.githubUsername && <><GithubIcon className="h-3 w-3" />{p.githubUsername}</>}
                              {p.githubUsername && p.website && " · "}
                              {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1"><Globe className="h-3 w-3" />Site</a>}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${p.email}`} className="text-sm hover:underline underline-offset-4">
                          {p.email}
                        </a>
                        {p.emailVerified && <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">vérifié</Badge>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{p.country ?? "—"}</Badge></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground truncate max-w-[160px] block">{p.techStack ?? "—"}</span></TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>}></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "verified" })}>Marquer vérifié</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "queued" })}>Mettre en file</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "sent" })}>Marquer envoyé</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "replied" })}>Marquer répondu</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus({ id: p._id, status: "opted_out" })}>Opt-out</DropdownMenuItem>
                            {p.website && <DropdownMenuItem onClick={() => window.open(p.website, "_blank")} className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />Voir site</DropdownMenuItem>}
                            {p.sourceUrl && <DropdownMenuItem onClick={() => window.open(p.sourceUrl, "_blank")} className="flex items-center gap-2"><ExternalLink className="h-4 w-4" />Source RGPD</DropdownMenuItem>}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => { if (confirm(`Supprimer ${p.email} ?`)) removeProspect({ id: p._id }); }}
                            >
                              <Trash2 className="h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} — anti-doublon sur email + GitHub.
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {prospects.map((p: any) => (
              <Card key={p._id} className="overflow-hidden">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {(p.firstName?.[0] ?? p.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{[p.firstName, p.lastName].filter(Boolean).join(" ") || p.githubUsername || p.email.split("@")[0]}</p>
                        <a href={`mailto:${p.email}`} className="text-xs text-muted-foreground hover:underline break-all">{p.email}</a>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.country && <Badge variant="secondary" className="text-xs">{p.country}</Badge>}
                    {p.githubUsername && <Badge variant="outline" className="text-xs gap-1"><GithubIcon className="h-3 w-3" />{p.githubUsername}</Badge>}
                    {p.techStack && <Badge variant="outline" className="text-xs truncate max-w-[150px]">{p.techStack}</Badge>}
                    {p.emailVerified && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs" variant="outline">vérifié</Badge>}
                  </div>
                  {p.personalizationHook && <p className="text-xs bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 text-violet-900">💡 {p.personalizationHook}</p>}
                  <div className="flex flex-wrap gap-2">
                    {p.website && <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => window.open(p.website, "_blank")}><Globe className="h-3 w-3" /> Site</Button>}
                    {p.sourceUrl && <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => window.open(p.sourceUrl, "_blank")}><ExternalLink className="h-3 w-3" /> Source</Button>}
                    <Select value={p.status} onValueChange={(v: string | null) => v && updateStatus({ id: p._id, status: v })}>
                      <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(o => o.value !== "all").map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
