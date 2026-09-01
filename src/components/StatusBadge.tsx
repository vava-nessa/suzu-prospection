import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  not_contacted: { label: "Non contacté", className: "bg-white/[0.06] text-white/60 border-white/[0.08]" },
  contacted: { label: "Contacté", className: "bg-sky-500/15 text-sky-300 border-sky-500/20" },
  // compat old
  new: { label: "Non contacté", className: "bg-white/[0.06] text-white/60 border-white/[0.08]" },
  verified: { label: "Non contacté", className: "bg-white/[0.06] text-white/60 border-white/[0.08]" },
  queued: { label: "Non contacté", className: "bg-white/[0.06] text-white/60 border-white/[0.08]" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["not_contacted"];
  return (
    <Badge variant="outline" className={`text-[11px] font-[500] tracking-[-0.01em] border rounded-full px-2 py-0.5 ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

export const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "not_contacted", label: "Non contactés" },
  { value: "contacted", label: "Contactés" },
];
