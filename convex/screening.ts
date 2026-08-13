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
    wsas_total: v.optional(v.number()),
    reqol10_total: v.optional(v.number()),
    phq9_item9_flag: v.boolean(),
    phq9_item9_score: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    if (args.phq9_total < 0 || args.gad7_total < 0 || args.pq16_total < 0 || args.phq9_item9_score < 0) {
      throw new Error("Scores cannot be negative.");
    }

    return await ctx.db.insert("screenings", {
      userId,
      phq9_total: args.phq9_total,
      gad7_total: args.gad7_total,
      pq16_total: args.pq16_total,
      wsas_total: args.wsas_total ?? 0,
      reqol10_total: args.reqol10_total ?? 0,
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

    let targetUserId = args.userId || identity.subject;
    // Resolve stable userId if passed ID is a user _id
    try {
      const user: any = await ctx.db.get(targetUserId as any);
      if (user && user.clerkId) {
        targetUserId = user.clerkId;
      }
    } catch (e) {}

    const screenings = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .take(1);

    if (screenings.length > 0) return screenings[0];

    // Fallback search with args.userId directly
    if (args.userId && args.userId !== targetUserId) {
      const alt = await ctx.db
        .query("screenings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(1);
      if (alt.length > 0) return alt[0];
    }

    return null;
  },
});

/** Get all screenings for a user */
export const getAll = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let targetUserId = args.userId || identity.subject;

    // Resolve stable userId / clerkId if passed ID is a database _id
    let user: any = null;
    try {
      user = await ctx.db.get(targetUserId as any);
    } catch (e) {}

    const searchIds = new Set<string>();
    if (targetUserId) searchIds.add(targetUserId);
    if (user) {
      if (user._id) searchIds.add(String(user._id));
      if (user.clerkId) searchIds.add(user.clerkId);
    }

    const allResults = [];
    for (const idToSearch of Array.from(searchIds)) {
      const res = await ctx.db
        .query("screenings")
        .withIndex("by_userId", (q) => q.eq("userId", idToSearch))
        .order("desc")
        .collect();
      allResults.push(...res);
    }

    // Deduplicate by _id
    const seen = new Set();
    const deduplicated = allResults.filter(s => {
      if (seen.has(s._id)) return false;
      seen.add(s._id);
      return true;
    });

    return deduplicated.sort((a, b) => b.createdAt - a.createdAt);
  },
});

