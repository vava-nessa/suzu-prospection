// @ts-nocheck
import { mutation } from "./_generated/server";
export const backfillAddedAt = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("prospects").collect();
    let patched = 0;
    for (const d of all) {
      if (d.addedAt === undefined || d.addedAt === null) {
        const v = (d as any).createdAt ?? (d as any)._creationTime ?? Date.now();
        await ctx.db.patch(d._id, { addedAt: v as number });
        patched++;
      }
    }
    return { patched, total: all.length };
  },
});
