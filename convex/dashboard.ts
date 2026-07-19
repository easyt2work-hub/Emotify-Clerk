import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to resolve patient name dynamically by userId (clerkId or user _id)
async function getPatientName(ctx: any, userId: string): Promise<string> {
  let user = null;
  try {
    user = await ctx.db.get(userId as Id<"users">);
  } catch (e) {
    // Ignore conversion error if it's not a valid Id
  }
  if (!user) {
    user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", userId))
      .first();
  }
  return user ? (user.full_name || user.alias || "Unknown Patient") : "Unknown Patient";
}

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const patients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "patient"))
      .collect();
    
    // For dashboard overview, we count triages
    const triages = await ctx.db.query("triages").collect();
    
    // Alerts - count any unresolved/active alerts (pending or escalated or active)
    const pendingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    
    const escalatedAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", "escalated"))
      .collect();

    const activeAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const totalActiveAlerts = [...pendingAlerts, ...escalatedAlerts, ...activeAlerts];
    
    // Severe / Critical Risk: suicide_flag, psychosis_flag, and severe triage levels
    const severeCases = triages.filter(
      (t) => t.level === "severe" || t.level === "suicide_flag" || t.level === "psychosis_flag" || t.suicideFlag || t.psychosisFlag
    ).length;
    
    const suicideRisks = triages.filter(t => t.suicideFlag).length;
    const psychosisRisks = triages.filter(t => t.psychosisFlag).length;

    // Generate real trend data for the last 7 days based on triages
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 86399999;
      
      const dayTriages = triages.filter(t => t.createdAt >= startOfDay && t.createdAt <= endOfDay);
      trendData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        severe: dayTriages.filter(t => t.level === "severe" || t.suicideFlag || t.psychosisFlag).length,
        moderate: dayTriages.filter(t => t.level === "moderate").length,
        mild: dayTriages.filter(t => t.level === "mild").length,
      });
    }

    return {
      totalPatients: patients.length,
      severeCases,
      suicideRisks,
      psychosisRisks,
      activeAlertsCount: totalActiveAlerts.length,
      trendData
    };
  },
});

export const getAlerts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const alerts = await ctx.db.query("alerts").order("desc").take(50);
    const results = [];
    for (const alert of alerts) {
      const patientName = await getPatientName(ctx, alert.userId);
      results.push({
        ...alert,
        patientName,
      });
    }
    return results;
  }
});

export const getActivityFeed = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const alerts = await ctx.db.query("alerts").order("desc").take(15);
    const emotionLogs = await ctx.db.query("emotionLogs").order("desc").take(15);
    const microGoals = await ctx.db.query("microGoals").order("desc").take(15);

    const feed = [];

    for (const a of alerts) {
      const patientName = await getPatientName(ctx, a.userId);
      const isSuicide = a.type === 'suicideRisk' || a.type === 'suicide';
      const isPsychosis = a.type === 'psychosisRisk' || a.type === 'psychosis';
      feed.push({ 
        id: a._id, 
        type: 'alert', 
        title: isSuicide 
          ? `Suicide Risk Detected` 
          : isPsychosis 
          ? `Psychosis Risk Detected` 
          : `Alert: ${a.type.charAt(0).toUpperCase() + a.type.slice(1).replace(/_/g, ' ')}`, 
        desc: `Patient: ${patientName} • Status: ${a.status}`, 
        time: a.createdAt, 
        severity: isSuicide ? 'danger' : isPsychosis ? 'warning' : 'caution' 
      });
    }

    for (const e of emotionLogs) {
      const patientName = await getPatientName(ctx, e.userId);
      feed.push({ 
        id: e._id, 
        type: 'emotion', 
        title: `Logged Emotion: ${e.emotion}`, 
        desc: `Patient: ${patientName} • Intensity: ${e.intensity || e.postIntensity || 'N/A'}`, 
        time: e.createdAt, 
        severity: 'success' 
      });
    }

    for (const m of microGoals) {
      const patientName = await getPatientName(ctx, m.userId);
      feed.push({ 
        id: m._id, 
        type: 'goal', 
        title: `MicroGoal ${m.completed ? 'Completed' : 'Missed'}`, 
        desc: `Patient: ${patientName} • Goal: ${m.goal || m.goalTitle || 'N/A'}`, 
        time: m.createdAt, 
        severity: m.completed ? 'success' : 'caution' 
      });
    }

    feed.sort((a, b) => b.time - a.time);
    return feed.slice(0, 15);
  }
});

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateAlertStatus = mutation({
  args: { alertId: v.id("alerts"), status: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    
    await ctx.db.patch(args.alertId, {
      status: args.status,
      acknowledgedAt: Date.now(),
    });
  }
});

export const getPatientCbtAnalytics = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Resolve stable userId
    let user = null;
    try {
      user = await ctx.db.get(args.userId as Id<"users">);
    } catch (e) {}
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
        .first();
    }
    if (!user) return null;
    const resolvedUserId = user.clerkId || user._id;

    const sessions = await ctx.db
      .query("cbtSessions")
      .withIndex("by_userId", (q) => q.eq("userId", resolvedUserId))
      .order("desc")
      .collect();

    const completedSessions = sessions.filter(s => s.sessionStatus === "completed" || s.currentStep === "completed");
    const safetySessions = sessions.filter(s => s.sessionStatus === "safety_mode" || s.currentStep === "safety_mode");

    // 1. Thinking Style Trends
    const thinkingStyleTrends: Record<string, number> = {
      "I'm worried about what might happen": 0,
      "I'm being hard on myself": 0,
      "I keep blaming myself": 0,
      "I'm worried about what others think": 0,
      "I feel I should have done better": 0,
      "I feel stuck because I can't control things": 0,
    };
    completedSessions.forEach(s => {
      if (s.thinkingStyle && s.thinkingStyle in thinkingStyleTrends) {
        thinkingStyleTrends[s.thinkingStyle]++;
      }
    });

    // 2. Cognitive Distortion Trends
    const cognitiveDistortionTrends: Record<string, number> = {};
    completedSessions.forEach(s => {
      if (s.cbtDistortion) {
        cognitiveDistortionTrends[s.cbtDistortion] = (cognitiveDistortionTrends[s.cbtDistortion] || 0) + 1;
      }
    });

    // 3. Emotion Improvement & Belief Score
    let totalEmotionImprovement = 0;
    let totalBeliefScore = 0;
    let validEmotionCount = 0;
    let validBeliefCount = 0;

    completedSessions.forEach(s => {
      if (s.emotionBefore !== undefined && s.emotionAfter !== undefined) {
        totalEmotionImprovement += (s.emotionBefore - s.emotionAfter);
        validEmotionCount++;
      }
      if (s.beliefScore !== undefined) {
        totalBeliefScore += s.beliefScore;
        validBeliefCount++;
      }
    });

    const averageEmotionImprovement = validEmotionCount > 0 ? Number((totalEmotionImprovement / validEmotionCount).toFixed(1)) : 0;
    const averageBeliefScore = validBeliefCount > 0 ? Math.round(totalBeliefScore / validBeliefCount) : 0;

    // 4. Goals and Behavioural Activation
    const microGoals = await ctx.db
      .query("microGoals")
      .withIndex("by_userId", (q: any) => q.eq("userId", resolvedUserId))
      .collect();

    const recoveryPlansCount = completedSessions.filter(
      (s) => (s.recommendedGoals && s.recommendedGoals.length > 0) || s.recommendedGoal !== undefined
    ).length;

    const totalAcceptedGoals = microGoals.length;
    const completedGoalsCount = microGoals.filter((mg) => mg.completed).length;
    const skippedGoalsCount = microGoals.filter((mg) => mg.skipped).length;

    const goalCompletionRate = totalAcceptedGoals > 0 
      ? Math.round((completedGoalsCount / totalAcceptedGoals) * 100) 
      : 0;

    // Frequently Completed Goals
    const completedMap: Record<string, number> = {};
    microGoals.filter((mg) => mg.completed).forEach((mg) => {
      const title = mg.goalTitle || mg.goal || "Unknown Goal";
      completedMap[title] = (completedMap[title] || 0) + 1;
    });
    const frequentlyCompletedGoals = Object.entries(completedMap)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Frequently Skipped Goals
    const skippedMap: Record<string, number> = {};
    microGoals.filter((mg) => mg.skipped).forEach((mg) => {
      const title = mg.goalTitle || mg.goal || "Unknown Goal";
      skippedMap[title] = (skippedMap[title] || 0) + 1;
    });
    const frequentlySkippedGoals = Object.entries(skippedMap)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Behavioural Activation Trends (last 14 days)
    const behaviouralActivationTrends = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      const dayGoals = microGoals.filter((mg) => mg.createdAt >= startOfDay && mg.createdAt < endOfDay);
      behaviouralActivationTrends.push({
        date: dateStr,
        completed: dayGoals.filter((mg) => mg.completed).length,
        total: dayGoals.length
      });
    }

    // Most Effective Goal Categories
    const categoryMap: Record<string, number> = {};
    microGoals.filter((mg) => mg.completed).forEach((mg) => {
      const cat = mg.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const mostEffectiveGoalCategories = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Weekly/Monthly Progress
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const weeklyProgress = completedSessions.filter(s => s.timestamp >= oneWeekAgo).length;
    const monthlyProgress = completedSessions.filter(s => s.timestamp >= oneMonthAgo).length;

    // 6. Recovery Trend (oldest to newest for charts)
    const recoveryTrend = [...completedSessions]
      .reverse()
      .map(s => {
        const d = new Date(s.timestamp);
        return {
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          emotionBefore: s.emotionBefore ?? 0,
          emotionAfter: s.emotionAfter ?? 0,
          beliefScore: s.beliefScore ?? 0,
        };
      });

    // Consolidated Recovery Timeline
    const recoveryTimeline = [
      ...completedSessions.map((s) => ({
        type: "session",
        timestamp: s.timestamp,
        title: "Completed CBT Session",
        details: `Emotion: ${s.emotion || "Stress"} improved from ${s.emotionBefore ?? 0} to ${s.emotionAfter ?? 0}`
      })),
      ...microGoals.filter((mg) => mg.completed).map((mg) => ({
        type: "goal",
        timestamp: mg.completedAt || mg.createdAt,
        title: `Completed Goal: ${mg.goalTitle}`,
        details: `Earned +${mg.points || 25} XP in category ${mg.category}`
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    // 7. High Risk Alerts
    const highRiskAlerts = safetySessions.map(s => ({
      sessionId: s._id,
      timestamp: s.timestamp,
      riskFlags: s.riskFlags || [],
      situation: s.situation || "Unknown Situation",
    }));

    return {
      totalCbtSessions: completedSessions.length,
      thinkingStyleTrends,
      cognitiveDistortionTrends,
      emotionImprovement: averageEmotionImprovement,
      beliefImprovement: averageBeliefScore,
      goalCompletionRate,
      weeklyProgress,
      monthlyProgress,
      recoveryTrend,
      highRiskAlerts,
      sessionsHistory: sessions,
      recoveryPlansCount,
      frequentlyCompletedGoals,
      frequentlySkippedGoals,
      behaviouralActivationTrends,
      mostEffectiveGoalCategories,
      recoveryTimeline
    };
  }
});

export const listAllCbtSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const sessions = await ctx.db
      .query("cbtSessions")
      .order("desc")
      .take(50);

    const results = [];
    for (const session of sessions) {
      const patientName = await getPatientName(ctx, session.userId);
      results.push({
        ...session,
        patientName,
      });
    }
    return results;
  }
});
