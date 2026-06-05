import { query } from "./_generated/server";

export const getDashboardOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const patients = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "patient"))
      .collect();
    
    // For dashboard overview, we count triages
    const triages = await ctx.db.query("triages").collect();
    
    // Alerts - count any unresolved/active alerts (pending or escalated)
    const alerts = await ctx.db
      .query("alerts")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "escalated"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();
    
    const severeCases = triages.filter(t => t.level === "severe").length;
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
      activeAlertsCount: alerts.length,
      trendData
    };
  },
});

export const getAlerts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("alerts").order("desc").take(50);
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

    const feed = [
      ...alerts.map(a => {
        const isSuicide = a.type === 'suicideRisk' || a.type === 'suicide';
        const isPsychosis = a.type === 'psychosisRisk' || a.type === 'psychosis';
        return { 
          id: a._id, 
          type: 'alert', 
          title: isSuicide 
            ? 'Suicide Risk Detected' 
            : isPsychosis 
            ? 'Psychosis Risk Detected' 
            : `Alert: ${a.type.charAt(0).toUpperCase() + a.type.slice(1).replace(/_/g, ' ')}`, 
          desc: `Status: ${a.status}`, 
          time: a.createdAt, 
          severity: isSuicide ? 'danger' : isPsychosis ? 'warning' : 'caution' 
        };
      }),
      ...emotionLogs.map(e => ({ 
        id: e._id, 
        type: 'emotion', 
        title: `Logged Emotion: ${e.emotion}`, 
        desc: `Intensity: ${e.intensity || e.postIntensity || 'N/A'}`, 
        time: e.createdAt, 
        severity: 'success' 
      })),
      ...microGoals.map(m => ({ 
        id: m._id, 
        type: 'goal', 
        title: `MicroGoal ${m.completed ? 'Completed' : 'Missed'}`, 
        desc: m.goal, 
        time: m.createdAt, 
        severity: m.completed ? 'success' : 'caution' 
      }))
    ];

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
