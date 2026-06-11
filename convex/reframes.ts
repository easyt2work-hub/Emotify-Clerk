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

// --- NEW REFRAME LOGS MUTATIONS & QUERIES ---

export const createLog = mutation({
  args: {
    userId: v.string(),
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
    return await ctx.db.insert("reframeLogs", {
      ...args,
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
    const { id, reframe_text } = args;
    await ctx.db.patch(id, { reframe_text });
  },
});

export const removeLog = mutation({
  args: {
    id: v.id("reframeLogs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleFavoriteLog = mutation({
  args: {
    id: v.id("reframeLogs"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Log not found");
    await ctx.db.patch(args.id, { favorite: !item.favorite });
  },
});

export const getRecentLogs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reframeLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
