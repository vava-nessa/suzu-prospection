// @ts-nocheck
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
    email: v.string(),
    emailNormalized: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    website: v.optional(v.string()),
    country: v.optional(v.string()),
    techStack: v.optional(v.string()),
    personalizationHook: v.optional(v.string()),
    sourceType: v.string(),
    sourceUrl: v.string(),
    status: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    lastContactedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_emailNormalized", ["emailNormalized"])
    .index("by_github", ["githubUsername"])
    .index("by_status", ["status"])
    .index("by_country", ["country"])
    .index("by_createdAt", ["createdAt"]),

  sends: defineTable({
    prospectId: v.id("prospects"),
    campaignId: v.string(),
    sentAt: v.number(),
    status: v.string(),
    subject: v.optional(v.string()),
  }).index("by_prospect", ["prospectId"]),

  campaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
});
