import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "Nouveau", className: "bg-white/[0.06] text-white/70 border-white/[0.08]" },
  verified: { label: "Vérifié", className: "bg-sky-500/15 text-sky-300 border-sky-500/20" },
  queued: { label: "En file", className: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
  sent: { label: "Envoyé", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  bounced: { label: "Bounce", className: "bg-red-500/15 text-red-300 border-red-500/20" },
  replied: { label: "Répondu", className: "bg-violet-500/15 text-violet-300 border-violet-500/20" },
  opted_out: { label: "Opt-out", className: "bg-white/[0.04] text-white/30 border-white/[0.06]" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-white/[0.06] text-white/60 border-white/[0.08]" };
  return (
    <Badge variant="outline" className={`text-[11px] font-[500] tracking-[-0.01em] border rounded-full px-2 py-0.5 ${cfg.className}`}>
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
