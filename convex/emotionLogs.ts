import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    emotion: v.string(),
    bodyRegions: v.array(v.string()),
    preIntensity: v.optional(v.number()),
    postIntensity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emotionLogs", { ...args, createdAt: Date.now() });
  },
});

export const getRecent = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotionLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});
