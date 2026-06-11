import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("followUps", {
      ...args,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const getPending = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("followUps")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();
  },
});

export const markComplete = mutation({
  args: { id: v.id("followUps") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: true });
  },
});

/** Schedule follow-up based on triage level */
export const scheduleFollowUp = mutation({
  args: { userId: v.string(), level: v.string() },
  handler: async (ctx, args) => {
    let intervalMs = 0;
    
    switch (args.level) {
      case "mild":
        intervalMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
      case "moderate":
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      case "severe":
      case "suicide_flag":
      case "psychosis_flag":
        // Severe cases handled manually or with high frequency
        intervalMs = 2 * 24 * 60 * 60 * 1000; // 2 days for check-in
        break;
      default:
        intervalMs = 14 * 24 * 60 * 60 * 1000; // 14 days default
    }

    const dueDate = Date.now() + intervalMs;
    
    return await ctx.db.insert("followUps", {
      userId: args.userId,
      type: "screening_review",
      dueDate,
      completed: false,
      createdAt: Date.now(),
    });
  },
});
