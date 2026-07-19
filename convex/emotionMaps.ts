import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimiter";

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    if (args.averageIntensity < 0) {
      throw new Error("Intensity cannot be negative.");
    }
    for (const rating of args.bodyRatings) {
      if (rating.intensity < 0) {
        throw new Error("Rating intensity cannot be negative.");
      }
    }

    return await ctx.db.insert("emotionMaps", {
      userId,
      emotionLabel: args.emotionLabel,
      selectedRegions: args.selectedRegions,
      bodyRatings: args.bodyRatings,
      averageIntensity: args.averageIntensity,
      suggestedAction: args.suggestedAction,
      createdAt: Date.now(),
    });
  },
});

export const getRecentLogs = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("emotionMaps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
