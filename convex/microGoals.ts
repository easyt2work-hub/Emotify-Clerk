import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    goalId: v.string(),
    goal: v.string(),
    points: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("microGoals", {
      ...args,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const markComplete = mutation({
  args: { id: v.id("microGoals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: true });
  },
});

export const getByDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return goals.filter((g) => g.date === args.date);
  },
});

export const getTotalPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return goals.filter((g) => g.completed).reduce((sum, g) => sum + g.points, 0);
  },
});

export const getStreak = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Group goals by date
    const dateMap: Record<string, boolean> = {};
    goals.forEach(g => {
      if (g.completed) {
        dateMap[g.date] = true;
      }
    });

    let streak = 0;
    const today = new Date();
    
    while (true) {
      const dateStr = today.toISOString().split('T')[0];
      if (dateMap[dateStr]) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        // If it's today and not completed yet, keep the streak from yesterday
        if (streak === 0) {
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           const yDateStr = yesterday.toISOString().split('T')[0];
           if (dateMap[yDateStr]) {
             // Start from yesterday
             today.setDate(today.getDate() - 1);
             continue;
           }
        }
        break;
      }
    }
    return streak;
  },
});
