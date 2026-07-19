import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimiter";

/** Submit screening results */
export const submitScreening = mutation({
  args: {
    userId: v.optional(v.string()),
    phq9_total: v.number(),
    gad7_total: v.number(),
    pq16_total: v.number(),
    wsas_total: v.number(),
    reqol10_total: v.number(),
    phq9_item9_flag: v.boolean(),
    phq9_item9_score: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    if (args.phq9_total < 0 || args.gad7_total < 0 || args.pq16_total < 0 || args.wsas_total < 0 || args.reqol10_total < 0 || args.phq9_item9_score < 0) {
      throw new Error("Scores cannot be negative.");
    }

    return await ctx.db.insert("screenings", {
      userId,
      phq9_total: args.phq9_total,
      gad7_total: args.gad7_total,
      pq16_total: args.pq16_total,
      wsas_total: args.wsas_total,
      reqol10_total: args.reqol10_total,
      phq9_item9_flag: args.phq9_item9_flag,
      phq9_item9_score: args.phq9_item9_score,
      createdAt: Date.now(),
    });
  },
});

/** Get latest screening for a user */
export const getLatest = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const screenings = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return screenings[0] ?? null;
  },
});

/** Get all screenings for a user */
export const getAll = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
