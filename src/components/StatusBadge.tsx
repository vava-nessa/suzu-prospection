import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "Nouveau", className: "bg-slate-100 text-slate-700 border-slate-200" },
  verified: { label: "Vérifié", className: "bg-sky-100 text-sky-700 border-sky-200" },
  queued: { label: "En file", className: "bg-amber-100 text-amber-700 border-amber-200" },
  sent: { label: "Envoyé", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  bounced: { label: "Bounce", className: "bg-red-100 text-red-700 border-red-200" },
  replied: { label: "Répondu", className: "bg-violet-100 text-violet-700 border-violet-200" },
  opted_out: { label: "Opt-out", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-zinc-100 text-zinc-700" };
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${cfg.className} whitespace-nowrap`}>
      {cfg.label}
    </Badge>
  );
}

export const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "new", label: "Nouveau" },
  { value: "verified", label: "Vérifié" },
  { value: "queued", label: "En file" },
  { value: "sent", label: "Envoyé" },
  { value: "bounced", label: "Bounce" },
  { value: "replied", label: "Répondu" },
  { value: "opted_out", label: "Opt-out" },
];
