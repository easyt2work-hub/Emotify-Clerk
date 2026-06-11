import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    emotionLabel: v.string(),
    selectedRegions: v.array(v.string()),
    bodyRatings: v.array(
      v.object({
        region: v.string(),
        intensity: v.number(),
      })
    ),
    averageIntensity: v.number(),
    suggestedAction: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emotionMaps", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getRecentLogs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotionMaps")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});
