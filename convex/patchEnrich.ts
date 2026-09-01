// @ts-nocheck
import { mutation } from "./_generated/server";

export const patchEnrich = mutation({
  args: {},
  handler: async (ctx) => {
    const patches = [
      {
        email: "ahmedashraf01085@gmail.com",
        country: "EG",
        personalizationHook:
          "FullStack .NET Developer from New Cairo — AI-powered apps with ASP.NET Core & React + Vite portfolio",
      },
      {
        email: "tusharjangid98870@gmail.com",
        country: "IN",
        personalizationHook:
          "Full-stack developer from Coimbatore — passionate about turning ideas into reality (Tushar-Portfolio)",
      },
      {
        email: "ktanay7870@gmail.com",
        country: "IN",
        personalizationHook:
          "Software Developer from India — portfolio nishant-kumar-pearl.vercel.app, Student, 38 repos",
      },
      {
        email: "sanketkumarkar@gmail.com",
        country: "IN",
        personalizationHook: "Developer from Chennai — my-portfolio (updated Feb), GitHub-centric showcase",
      },
      {
        email: "devgoyalg2346@gmail.com",
        country: "IN",
        personalizationHook:
          "Front End Web Developer — Linktree portfolio with LinkedIn/GitHub/LeetCode, focused on front-end",
      },
      {
        email: "stephenseun09@gmail.com",
        country: "NG",
        personalizationHook: "Frontend Developer based in Lagos, Nigeria — clean React portfolio",
      },
      {
        email: "777divyanshgoyal@gmail.com",
        country: "IN",
        personalizationHook:
          "Web developer & programmer — dynamic interactive websites, scalable front-end portfolio",
      },
      {
        email: "mohsindev369@gmail.com",
        country: "PK",
        personalizationHook:
          "Senior Next.js developer (7y, 151 projects) — custom SaaS & AI automation for UK/EU/US businesses, fixed price",
      },
      {
        email: "sayansenapati2544@gmail.com",
        country: "IN",
        personalizationHook:
          "Full-stack web developer from Bangalore — builds sites, web apps & SaaS applications",
      },
      {
        email: "gangera0707@gmail.com",
        country: "IN",
        personalizationHook:
          "Computer Engineering student at GEC Gandhinagar — Full Stack Developer portfolio with React projects",
      },
    ];
    let patched = 0;
    const results = [];
    for (const p of patches) {
      const normalized = p.email.toLowerCase().trim();
      const doc = await ctx.db
        .query("prospects")
        .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalized))
        .unique();
      if (!doc) {
        results.push({ email: p.email, status: "not_found" });
        continue;
      }
      await ctx.db.patch(doc._id, {
        country: p.country,
        personalizationHook: p.personalizationHook,
      });
      patched++;
      results.push({ email: p.email, status: "patched", country: p.country });
    }
    return { patched, results };
  },
});
