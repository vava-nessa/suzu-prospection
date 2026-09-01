// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List with filters + search (server-side filtering)
export const list = query({
  args: {
    status: v.optional(v.string()),
    country: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let prospects;

    if (args.status && args.status !== "all") {
      prospects = await ctx.db
        .query("prospects")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      prospects = await ctx.db.query("prospects").withIndex("by_createdAt").order("desc").collect();
    }

    // Apply country filter
    if (args.country && args.country !== "all") {
      prospects = prospects.filter((p) => p.country === args.country);
    }

    // Apply search (client-side after fetch, covers name/email/github/website)
    if (args.search && args.search.trim()) {
      const s = args.search.toLowerCase().trim();
      prospects = prospects.filter(
        (p) =>
          p.email.toLowerCase().includes(s) ||
          p.firstName?.toLowerCase().includes(s) ||
          p.lastName?.toLowerCase().includes(s) ||
          p.githubUsername?.toLowerCase().includes(s) ||
          p.website?.toLowerCase().includes(s) ||
          p.techStack?.toLowerCase().includes(s)
      );
    }

    if (args.country && args.country !== "all" && !args.status) {
      // Re-sort by createdAt desc if we filtered by country without status index
      prospects.sort((a, b) => b.createdAt - a.createdAt);
    }

    const limit = args.limit ?? 200;
    return prospects.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    const counts: Record<string, number> = {};
    for (const p of all) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return {
      total: all.length,
      verified: all.filter((p) => p.emailVerified).length,
      counts,
    };
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
  handler: async (ctx, args) => {
    const normalized = args.email.toLowerCase().trim();
    if (!normalized || !normalized.includes("@")) {
      throw new Error("Invalid email");
    }

    const existing = await ctx.db
      .query("prospects")
      .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
      .unique();

    if (existing) {
      return { status: "skipped_duplicate" as const, id: existing._id, email: existing.email };
    }

    // Dedup by github username if provided
    if (args.githubUsername) {
      const byGithub = await ctx.db
        .query("prospects")
        .withIndex("by_github", (q) => q.eq("githubUsername", args.githubUsername))
        .unique();
      if (byGithub) {
        return { status: "skipped_duplicate_github" as const, id: byGithub._id, email: byGithub.email };
      }
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
      status: "new",
      emailVerified: false,
      createdAt: Date.now(),
      notes: args.notes?.trim() || undefined,
    });

    return { status: "created" as const, id, email: args.email.trim() };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("prospects"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const valid = ["new", "verified", "queued", "sent", "bounced", "replied", "opted_out"];
    if (!valid.includes(args.status)) throw new Error(`Invalid status: ${args.status}`);
    await ctx.db.patch(args.id, {
      status: args.status,
      lastContactedAt: args.status === "sent" ? Date.now() : undefined,
    });
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
    techStack: v.optional(v.string()),
    personalizationHook: v.optional(v.string()),
    notes: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) clean[k] = val;
    }
    if (Object.keys(clean).length === 0) return { ok: true };
    await ctx.db.patch(id, clean);
    return { ok: true };
  },
});

export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("prospects")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const valid = ["new", "verified", "queued", "sent", "bounced", "replied", "opted_out"];
    if (!valid.includes(args.status)) throw new Error(`Invalid status: ${args.status}`);
    for (const id of args.ids) {
      await ctx.db.patch(id, { status: args.status });
    }
    return { updated: args.ids.length };
  },
});

export const remove = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;
    for (const p of args.prospects) {
      const normalized = p.email.toLowerCase().trim();
      if (!normalized.includes("@")) {
        skipped++;
        continue;
      }
      const existing = await ctx.db
        .query("prospects")
        .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
        .unique();
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
        status: "new",
        emailVerified: false,
        createdAt: Date.now(),
        notes: p.notes?.trim() || undefined,
      });
      created++;
    }
    return { created, skipped, total: args.prospects.length };
  },
});
