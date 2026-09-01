import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const ALLOWED_EMAILS = ["vanessadepraute@gmail.com"] as const;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = (params.email as string)?.toLowerCase().trim();
        if (!email || !(ALLOWED_EMAILS as readonly string[]).includes(email)) {
          throw new Error("Accès refusé — email non autorisé.");
        }
        return { email };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = (args.profile.email as string)?.toLowerCase().trim();
      if (!email || !(ALLOWED_EMAILS as readonly string[]).includes(email)) {
        throw new Error("Accès refusé — email non autorisé.");
      }
      if (args.existingUserId) return args.existingUserId;
      return await ctx.db.insert("users", args.profile as never);
    },
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      const email = (user as unknown as { email?: string } | null)?.email?.toLowerCase().trim();
      if (!email || !(ALLOWED_EMAILS as readonly string[]).includes(email)) {
        throw new Error("Accès refusé — email non autorisé.");
      }
    },
  },
});
