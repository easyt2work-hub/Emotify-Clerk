import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    preIntensity: v.number(),
    postIntensity: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jpmrLogs", { ...args, createdAt: Date.now() });
  },
});

export const getRecent = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jpmrLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});
