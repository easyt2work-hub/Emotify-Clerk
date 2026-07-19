import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimiter";

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    situation: v.string(),
    originalThought: v.string(),
    thinkingTrap: v.string(),
    guidedAnswers: v.array(v.string()),
    newThought: v.string(),
    preIntensity: v.number(),
    postIntensity: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    if (args.preIntensity < 1 || args.preIntensity > 10 || args.postIntensity < 1 || args.postIntensity > 10) {
      throw new Error("Intensities must be between 1 and 10.");
    }
    if (!args.situation.trim() || !args.originalThought.trim() || !args.newThought.trim()) {
      throw new Error("Text fields cannot be empty.");
    }

    return await ctx.db.insert("reframes", {
      userId,
      situation: args.situation,
      originalThought: args.originalThought,
      thinkingTrap: args.thinkingTrap,
      guidedAnswers: args.guidedAnswers,
      newThought: args.newThought,
      preIntensity: args.preIntensity,
      postIntensity: args.postIntensity,
      createdAt: Date.now(),
    });
  },
});

export const getRecent = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("reframes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

// --- NEW REFRAME LOGS MUTATIONS & QUERIES ---

export const createLog = mutation({
  args: {
    userId: v.optional(v.string()),
    situation_text: v.string(),
    thought_original: v.string(),
    thinking_trap_choice: v.string(),
    guided_answers: v.array(v.string()),
    reframe_text: v.string(),
    pre_reframe_intensity: v.number(),
    post_reframe_intensity: v.number(),
    improvement_percentage: v.number(),
    saved_reframe_flag: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    if (args.pre_reframe_intensity < 1 || args.pre_reframe_intensity > 10 || args.post_reframe_intensity < 1 || args.post_reframe_intensity > 10) {
      throw new Error("Intensities must be between 1 and 10.");
    }
    if (!args.situation_text.trim() || !args.thought_original.trim() || !args.reframe_text.trim()) {
      throw new Error("Text fields cannot be empty.");
    }

    return await ctx.db.insert("reframeLogs", {
      userId,
      situation_text: args.situation_text,
      thought_original: args.thought_original,
      thinking_trap_choice: args.thinking_trap_choice,
      guided_answers: args.guided_answers,
      reframe_text: args.reframe_text,
      pre_reframe_intensity: args.pre_reframe_intensity,
      post_reframe_intensity: args.post_reframe_intensity,
      improvement_percentage: args.improvement_percentage,
      saved_reframe_flag: args.saved_reframe_flag,
      favorite: false,
      createdAt: Date.now(),
    });
  },
});

export const updateLog = mutation({
  args: {
    id: v.id("reframeLogs"),
    reframe_text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Log not found");

    if (item.userId !== identity.subject) {
      throw new Error("Unauthorized: Cannot update log for another user.");
    }

    if (!args.reframe_text.trim()) {
      throw new Error("Reframe text cannot be empty.");
    }

    await ctx.db.patch(args.id, { reframe_text: args.reframe_text });
  },
});

export const removeLog = mutation({
  args: {
    id: v.id("reframeLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Log not found");

    if (item.userId !== identity.subject) {
      throw new Error("Unauthorized: Cannot delete log for another user.");
    }

    await ctx.db.delete(args.id);
  },
});

export const toggleFavoriteLog = mutation({
  args: {
    id: v.id("reframeLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Log not found");

    if (item.userId !== identity.subject) {
      throw new Error("Unauthorized: Cannot toggle favorite log for another user.");
    }

    await ctx.db.patch(args.id, { favorite: !item.favorite });
  },
});

export const getRecentLogs = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("reframeLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
