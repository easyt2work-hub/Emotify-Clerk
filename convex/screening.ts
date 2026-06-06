import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Submit screening results */
export const submitScreening = mutation({
  args: {
    userId: v.string(),
    phq9_total: v.number(),
    gad7_total: v.number(),
    pq16_total: v.number(),
    wsas_total: v.number(),
    reqol10_total: v.number(),
    phq9_item9_flag: v.boolean(),
    phq9_item9_score: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("screenings", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Get latest screening for a user */
export const getLatest = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const screenings = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    return screenings[0] ?? null;
  },
});

/** Get all screenings for a user */
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
