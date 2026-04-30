import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDailyStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // We fetch all records for the user and aggregate them.
    // In a production environment with many records, you'd want to index by date or use a more efficient aggregation.

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    // MicroGoals
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalCalmPoints = goals.reduce((acc, g) => acc + (g.points || 0), 0);
    const completedGoalsCount = goals.filter(g => g.completed).length;

    // JPMR Logs
    const jpmrLogs = await ctx.db
      .query("jpmrLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const jpmrMinutes = jpmrLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
    
    // Average Intensity Drop in JPMR
    let totalJpmrDrop = 0;
    jpmrLogs.forEach(log => {
      totalJpmrDrop += (log.preIntensity - log.postIntensity);
    });
    const avgJpmrDrop = jpmrLogs.length > 0 ? (totalJpmrDrop / jpmrLogs.length).toFixed(1) : "0";

    // Reframes
    const reframes = await ctx.db
      .query("reframes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Average Intensity Drop in Reframes
    let totalReframeDrop = 0;
    reframes.forEach(r => {
      totalReframeDrop += (r.preIntensity - r.postIntensity);
    });
    const avgReframeDrop = reframes.length > 0 ? (totalReframeDrop / reframes.length).toFixed(1) : "0";

    // Emotion Logs
    const emotionLogs = await ctx.db
      .query("emotionLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalCheckins = emotionLogs.length;

    // Screenings
    const screenings = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Triages
    const triages = await ctx.db
      .query("triages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      totalCalmPoints,
      completedGoalsCount,
      jpmrMinutes,
      avgJpmrDrop,
      reframesCount: reframes.length,
      avgReframeDrop,
      totalCheckins,
      emotionLogs,
      microGoals: goals,
      jpmrLogs,
      reframes,
      screenings,
      triages
    };
  },
});
