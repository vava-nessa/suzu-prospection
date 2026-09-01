// @ts-nocheck
import { query } from "./_generated/server";
import { auth } from "./auth";

const ALLOWED_EMAILS = ["vanessadepraute@gmail.com"];

export const viewer = query({
  args: {},
  handler: async (ctx: any) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    const email = (user as any)?.email?.toLowerCase?.().trim();
    if (!email || !(ALLOWED_EMAILS as readonly string[]).includes(email)) return null;
    return { userId, email };
  },
});
