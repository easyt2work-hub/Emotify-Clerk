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
