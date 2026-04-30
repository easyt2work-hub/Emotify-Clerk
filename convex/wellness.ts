import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wellnessProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch all relevant data for generation
    const screenings = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const emotionLogs = await ctx.db
      .query("emotionLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    const microGoals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    const jpmrLogs = await ctx.db
      .query("jpmrLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // 2. Generate Profile Logic
    let personality_traits = ["Reflective personality"];
    let mood_pattern = "Mostly calm";
    let wellness_goals = ["Reduce stress"];
    let energy_pattern = "Active in evening";

    const latestScreening = screenings[0];
    const totalGoals = microGoals.length;
    const completedGoals = microGoals.filter(g => g.completed).length;

    // Mood pattern logic
    const avgIntensity = emotionLogs.length > 0 
      ? emotionLogs.reduce((acc, log) => acc + (log.preIntensity || 0), 0) / emotionLogs.length 
      : 0;
    
    if (avgIntensity > 7) mood_pattern = "Easily stressed during pressure";
    else if (avgIntensity > 4) mood_pattern = "Moderate emotional shifts";
    else mood_pattern = "Mostly calm and stable";

    // Personality traits logic
    if (jpmrLogs.length > 3) personality_traits.push("Values relaxation");
    if (completedGoals > 3) personality_traits.push("Consistent and improving");
    if (latestScreening?.gad7_total > 10) personality_traits.push("Sensitive to stress");
    if (latestScreening?.phq9_total > 15) personality_traits.push("Needs gentle support");

    // Wellness goals logic
    if (latestScreening?.reqol10_total < 15) wellness_goals.push("Gentle recovery");
    if (latestScreening?.phq9_total > 5) wellness_goals.push("Improve mood");
    if (latestScreening?.wsas_total > 10) wellness_goals.push("Build daily habits");
    if (jpmrLogs.length < 2) wellness_goals.push("Improve focus");

    // Energy pattern (mock logic based on creation times)
    const morningLogs = emotionLogs.filter(log => {
      const hour = new Date(log.createdAt).getHours();
      return hour >= 5 && hour < 12;
    }).length;
    if (morningLogs > 3) energy_pattern = "Morning person";
    else energy_pattern = "Evening person";

    // 3. Save or Update
    const existing = await ctx.db
      .query("wellnessProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const profileData = {
      userId: args.userId,
      personality_traits,
      mood_pattern,
      wellness_goals,
      energy_pattern,
      last_updated: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, profileData);
    } else {
      await ctx.db.insert("wellnessProfiles", profileData);
    }

    return profileData;
  },
});
