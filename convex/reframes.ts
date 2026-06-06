import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    situation: v.string(),
    originalThought: v.string(),
    thinkingTrap: v.string(),
    guidedAnswers: v.array(v.string()),
    newThought: v.string(),
    preIntensity: v.number(),
    postIntensity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reframes", { ...args, createdAt: Date.now() });
  },
});

export const getRecent = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reframes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});
