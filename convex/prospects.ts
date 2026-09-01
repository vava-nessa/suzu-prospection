// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

const ALLOWED_EMAILS = ["vanessadepraute@gmail.com"] as const;

async function requireAuth(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) throw new Error("Non authentifié — connecte-toi.");
  const user = await ctx.db.get(userId);
  const email = (user as any)?.email?.toLowerCase?.().trim();
  if (!email || !(ALLOWED_EMAILS as readonly string[]).includes(email)) throw new Error("Accès refusé");
  return userId;
}

function contactedToDeprecated(status: string): "contacted" | "not_contacted" | null {
  if (status === "contacted" || status === "not_contacted") return status as any;
  // compat: old values → not_contacted/contacted
  if (status === "new" || status === "verified" || status === "queued") return "not_contacted";
  if (status === "sent" || status === "replied" || status === "bounced" || status === "opted_out") return "contacted";
  return status as any;
}

// List with filters + search
export const list = query({
  args: {
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    replied: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    let prospects: any[];
    const want = args.status && args.status !== "all" ? contactedToDeprecated(args.status) ?? args.status : null;
    if (want) {
      prospects = await ctx.db.query("prospects").withIndex("by_status", (q) => q.eq("status", want)).order("desc").collect();
    } else {
      prospects = await ctx.db.query("prospects").withIndex("by_createdAt").order("desc").collect();
    }

    if (args.country && args.country !== "all") {
      prospects = prospects.filter((p) => p.country === args.country);
    }
    if (args.replied !== undefined) {
      prospects = prospects.filter((p) => !!p.replied === args.replied);
    }
    if (args.search && args.search.trim()) {
      const s = args.search.toLowerCase().trim();
      prospects = prospects.filter(
        (p) =>
          p.email.toLowerCase().includes(s) ||
          p.firstName?.toLowerCase().includes(s) ||
          p.lastName?.toLowerCase().includes(s) ||
          p.githubUsername?.toLowerCase().includes(s) ||
          p.website?.toLowerCase().includes(s)
      );
    }
    if (args.country && args.country !== "all" && !args.status) {
      prospects.sort((a, b) => b.createdAt - a.createdAt);
    }
    const limit = args.limit ?? 300;
    return prospects.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("prospects") },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx: any) => {
    await requireAuth(ctx);
    const all = await ctx.db.query("prospects").collect();
    const total = all.length;
    const notContacted = all.filter((p) => (p.status ?? "not_contacted") === "not_contacted" || p.status === "new" || p.status === "verified" || p.status === "queued").length + 0; // computed below correctly
    // canonical counts
    const counts = { not_contacted: 0, contacted: 0, replied: 0 };
    for (const p of all) {
      const s = p.status as string;
      const contacted = s === "contacted" || s === "sent" || s === "replied" || s === "bounced" || s === "opted_out";
      if (contacted) counts.contacted++;
      else counts.not_contacted++;
      if (p.replied) counts.replied++;
    }
    return { total, ...counts, counts };
  },
});

export const upsert = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
    techStack: v.optional(v.string()),
    personalizationHook: v.optional(v.string()),
    sourceType: v.string(),
    sourceUrl: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const normalized = args.email.toLowerCase().trim();
    if (!normalized || !normalized.includes("@")) throw new Error("Invalid email");

    const existing = await ctx.db.query("prospects").withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized)).unique();
    if (existing) return { status: "skipped_duplicate" as const, id: existing._id, email: existing.email };

    if (args.githubUsername) {
      const byGithub = await ctx.db.query("prospects").withIndex("by_github", (q) => q.eq("githubUsername", args.githubUsername)).unique();
      if (byGithub) return { status: "skipped_duplicate_github" as const, id: byGithub._id, email: byGithub.email };
    }

    const id = await ctx.db.insert("prospects", {
      email: args.email.trim(),
      emailNormalized: normalized,
      firstName: args.firstName?.trim() || undefined,
      lastName: args.lastName?.trim() || undefined,
      githubUsername: args.githubUsername?.trim() || undefined,
      website: args.website?.trim() || undefined,
      country: args.country?.trim().toUpperCase() || undefined,
      techStack: args.techStack?.trim() || undefined,
      personalizationHook: args.personalizationHook?.trim() || undefined,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      status: "not_contacted",
      replied: false,
      emailVerified: false,
      createdAt: Date.now(),
      notes: args.notes?.trim() || undefined,
    });
    return { status: "created" as const, id, email: args.email.trim() };
  },
});

export const updateStatus = mutation({
  args: { id: v.id("prospects"), status: v.string() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const valid = ["not_contacted", "contacted", "new", "verified", "queued", "sent", "bounced", "replied", "opted_out"];
    if (!valid.includes(args.status)) throw new Error(`Invalid status: ${args.status}`);
    const normalized = contactedToDeprecated(args.status) ?? (args.status as any);
    await ctx.db.patch(args.id, { status: normalized, lastContactedAt: normalized === "contacted" ? Date.now() : undefined });
    return { ok: true };
  },
});

export const setReplied = mutation({
  args: { id: v.id("prospects"), replied: v.boolean() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.id, { replied: args.replied, repliedAt: args.replied ? Date.now() : undefined });
    return { ok: true };
  },
});

export const setContacted = mutation({
  args: { id: v.id("prospects"), contacted: v.boolean() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Not found");
    const next: any = { status: args.contacted ? "contacted" : "not_contacted" };
    if (args.contacted) next.lastContactedAt = Date.now();
    await ctx.db.patch(args.id, next);
    return { ok: true };
  },
});

export const updateProspect = mutation({
  args: {
    id: v.id("prospects"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
    personalizationHook: v.optional(v.string()),
    notes: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    status: v.optional(v.string()),
    replied: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const { id, ...patch } = args;
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) {
        if (k === "status") {
          const v2 = val as string;
          clean[k] = contactedToDeprecated(v2) ?? v2;
        } else clean[k] = val;
      }
    }
    if (Object.keys(clean).length === 0) return { ok: true };
    await ctx.db.patch(id, clean as any);
    return { ok: true };
  },
});

export const bulkUpdateStatus = mutation({
  args: { ids: v.array(v.id("prospects")), status: v.string() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const valid = ["not_contacted", "contacted", "new", "verified", "queued", "sent", "bounced", "replied", "opted_out"];
    if (!valid.includes(args.status)) throw new Error(`Invalid status: ${args.status}`);
    const normalized = contactedToDeprecated(args.status) ?? args.status;
    for (const id of args.ids) await ctx.db.patch(id, { status: normalized as string });
    return { updated: args.ids.length };
  },
});

export const bulkMarkContacted = mutation({
  args: { ids: v.array(v.id("prospects")), contacted: v.boolean() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    const t = args.contacted ? "contacted" : "not_contacted";
    for (const id of args.ids) await ctx.db.patch(id, { status: t, lastContactedAt: args.contacted ? Date.now() : undefined } as any);
    return { updated: args.ids.length };
  },
});

export const bulkMarkReplied = mutation({
  args: { ids: v.array(v.id("prospects")), replied: v.boolean() },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    for (const id of args.ids) await ctx.db.patch(id, { replied: args.replied, repliedAt: args.replied ? Date.now() : undefined } as any);
    return { updated: args.ids.length };
  },
});

export const remove = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

export const bulkImport = mutation({
  args: {
    prospects: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        githubUsername: v.optional(v.string()),
        website: v.optional(v.string()),
        country: v.optional(v.string()),
        techStack: v.optional(v.string()),
        personalizationHook: v.optional(v.string()),
        sourceType: v.string(),
        sourceUrl: v.string(),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    await requireAuth(ctx);
    let created = 0;
    let skipped = 0;
    for (const p of args.prospects) {
      const normalized = p.email.toLowerCase().trim();
      if (!normalized.includes("@")) {
        skipped++;
        continue;
      }
      const existing = await ctx.db.query("prospects").withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized)).unique();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("prospects", {
        email: p.email.trim(),
        emailNormalized: normalized,
        firstName: p.firstName?.trim() || undefined,
        lastName: p.lastName?.trim() || undefined,
        githubUsername: p.githubUsername?.trim() || undefined,
        website: p.website?.trim() || undefined,
        country: p.country?.trim().toUpperCase() || undefined,
        techStack: p.techStack?.trim() || undefined,
        personalizationHook: p.personalizationHook?.trim() || undefined,
        sourceType: p.sourceType,
        sourceUrl: p.sourceUrl,
        status: "not_contacted",
        replied: false,
        emailVerified: false,
        createdAt: Date.now(),
        notes: p.notes?.trim() || undefined,
      });
      created++;
    }
    return { created, skipped, total: args.prospects.length };
  },
});
