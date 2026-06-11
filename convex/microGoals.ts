import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- QUERIES ---

export const getTodayGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
      
    // Filter goals generated on the current calendar day
    return goals.filter((g) => g.createdAt >= startOfDay && g.createdAt < endOfDay);
  },
});

export const getGoalHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getWeeklySummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const allGoals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
      
    const recentGoals = allGoals.filter((g) => g.createdAt >= sevenDaysAgo);
    const completed = recentGoals.filter((g) => g.completed);
    
    const pointsEarned = completed.reduce((sum, g) => sum + g.points, 0);
    const totalCount = recentGoals.length;
    const completionRate = totalCount > 0 ? (completed.length / totalCount) * 100 : 0;
    
    return {
      completedCount: completed.length,
      pointsEarned,
      completionRate,
      totalCount,
    };
  },
});

export const getBadges = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return record ? record.totalPoints : 0;
  },
});

export const getStreak = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("streaks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return record 
      ? { currentStreak: record.currentStreak, longestStreak: record.longestStreak }
      : { currentStreak: 0, longestStreak: 0 };
  },
});

// For backward compatibility (legacy screens)
export const getByDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return goals.filter((g) => g.date === args.date || g.goalTitle !== undefined);
  },
});

export const getTotalPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return record ? record.totalPoints : 0;
  },
});

// --- MUTATIONS ---

export const createGoal = mutation({
  args: {
    userId: v.string(),
    goalId: v.string(),
    goalTitle: v.string(),
    goalDescription: v.string(),
    category: v.string(),
    difficulty: v.string(),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return await ctx.db.insert("microGoals", {
      ...args,
      completed: false,
      skipped: false,
      createdAt: Date.now(),
      // Legacy fields
      goal: args.goalTitle,
      date: todayStr,
    });
  },
});

export const scheduleGoal = mutation({
  args: {
    id: v.id("microGoals"),
    scheduledTime: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { scheduledTime: args.scheduledTime });
  },
});

export const completeGoal = mutation({
  args: { id: v.id("microGoals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    if (goal.completed) return;

    // 1. Mark complete
    await ctx.db.patch(args.id, { completed: true, completedAt: Date.now() });

    const userId = goal.userId;
    const pointsEarned = goal.points;

    // 2. Update points total
    const pointsRecord = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    let newTotalPoints = pointsEarned;
    if (pointsRecord) {
      newTotalPoints = pointsRecord.totalPoints + pointsEarned;
      await ctx.db.patch(pointsRecord._id, {
        totalPoints: newTotalPoints,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("points", {
        userId,
        totalPoints: newTotalPoints,
        updatedAt: Date.now(),
      });
    }

    // 3. Update streak
    const todayStr = new Date().toISOString().split('T')[0];
    const streakRecord = await ctx.db
      .query("streaks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    let currentStreak = 1;
    let longestStreak = 1;

    if (streakRecord) {
      const lastDate = streakRecord.lastCompletionDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === todayStr) {
        currentStreak = streakRecord.currentStreak;
        longestStreak = streakRecord.longestStreak;
      } else if (lastDate === yesterdayStr) {
        currentStreak = streakRecord.currentStreak + 1;
        longestStreak = Math.max(streakRecord.longestStreak, currentStreak);
      } else {
        currentStreak = 1;
        longestStreak = Math.max(streakRecord.longestStreak, currentStreak);
      }

      await ctx.db.patch(streakRecord._id, {
        currentStreak,
        longestStreak,
        lastCompletionDate: todayStr,
      });
    } else {
      await ctx.db.insert("streaks", {
        userId,
        currentStreak,
        longestStreak,
        lastCompletionDate: todayStr,
      });
    }

    // 4. Award Badges
    const allCompletedGoals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();
    
    const completedCount = allCompletedGoals.length;
    
    const existingBadges = await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    
    const hasBadge = (badgeId: string) => existingBadges.some((b) => b.badgeId === badgeId);

    const awardBadge = async (badgeId: string, badgeName: string) => {
      if (!hasBadge(badgeId)) {
        await ctx.db.insert("badges", {
          userId,
          badgeId,
          badgeName,
          earnedAt: Date.now(),
        });
      }
    };

    // Milestone Check in Badges
    if (completedCount >= 1) {
      await awardBadge("first_step", "First Step");
    }
    if (currentStreak >= 7) {
      await awardBadge("consistent", "Consistent");
    }
    if (newTotalPoints >= 100) {
      await awardBadge("calm_builder", "Calm Builder");
    }
    if (completedCount >= 30) {
      await awardBadge("strong_habit", "Strong Habit");
    }
    if (completedCount >= 50) {
      await awardBadge("momentum_master", "Momentum Master");
    }
  },
});

export const skipGoal = mutation({
  args: { id: v.id("microGoals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { skipped: true });
  },
});

export const rescheduleGoal = mutation({
  args: {
    id: v.id("microGoals"),
    scheduledTime: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      scheduledTime: args.scheduledTime,
      skipped: false,
    });
  },
});

// Legacy backward-compatibility mutation
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
      userId: args.userId,
      goalId: args.goalId,
      goalTitle: args.goal,
      goalDescription: "Small wellness activation goal",
      category: "mindfulness",
      difficulty: "easy",
      points: args.points,
      completed: false,
      skipped: false,
      createdAt: Date.now(),
      goal: args.goal,
      date: args.date,
    });
  },
});

export const markComplete = mutation({
  args: { id: v.id("microGoals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) return;
    await ctx.db.patch(args.id, { completed: true, completedAt: Date.now() });

    // Try to update points, streak, and badges
    const userId = goal.userId;
    const pointsRecord = await ctx.db
      .query("points")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const pointsEarned = goal.points;
    let newTotalPoints = pointsEarned;
    if (pointsRecord) {
      newTotalPoints = pointsRecord.totalPoints + pointsEarned;
      await ctx.db.patch(pointsRecord._id, {
        totalPoints: newTotalPoints,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("points", {
        userId,
        totalPoints: newTotalPoints,
        updatedAt: Date.now(),
      });
    }
  },
});

