import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimiter";

/** Run triage logic and save result, checking for escalation/improvement */
export const processTriage = mutation({
  args: {
    userId: v.optional(v.string()),
    phq9_total: v.number(),
    gad7_total: v.number(),
    pq16_total: v.number(),
    wsas_total: v.optional(v.number()),
    reqol10_total: v.optional(v.number()),
    phq9_item9_score: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    const { phq9_total, gad7_total, pq16_total, phq9_item9_score } = args;
    if (phq9_total < 0 || gad7_total < 0 || pq16_total < 0 || phq9_item9_score < 0) {
      throw new Error("Scores cannot be negative.");
    }

    let level: string = "mild";
    let suicideFlag = false;
    let psychosisFlag = false;
    let requiresAlert = false;
    let alertType: string | undefined = undefined;

    // Logic from utils/triage.ts
    if (phq9_item9_score > 0) {
      level = "suicide_flag";
      suicideFlag = true;
      requiresAlert = true;
      alertType = "suicide";
    } else if (pq16_total >= 6) {
      level = "psychosis_flag";
      psychosisFlag = true;
      requiresAlert = true;
      alertType = "psychosis";
    } else if (phq9_total >= 15 || gad7_total >= 15) {
      level = "severe";
      requiresAlert = true;
      alertType = "severe";
    } else if (
      (phq9_total >= 10 && phq9_total <= 14) ||
      (gad7_total >= 10 && gad7_total <= 14)
    ) {
      level = "moderate";
    } else {
      level = "mild";
    }

    // Monitoring: check for escalation relative to previous screening (PHQ-9 or GAD-7)
    const previousScreening = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(2);

    if (previousScreening.length > 1) {
      const last = previousScreening[1];
      if (phq9_total > last.phq9_total + 5 || gad7_total > last.gad7_total + 5) {
        requiresAlert = true;
        alertType = "escalation";
      }
    }

    const triageId = await ctx.db.insert("triages", {
      userId,
      level,
      suicideFlag,
      psychosisFlag,
      createdAt: Date.now(),
    });

    if (requiresAlert) {
      await ctx.db.insert("alerts", {
        userId,
        type: alertType || "general",
        status: "pending",
        createdAt: Date.now(),
      });
    }

    return { level, triageId };
  },
});

/** Get latest triage for a specific user (used by admin or given userId) */
export const getLatestByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const triages = await ctx.db
      .query("triages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);
    return triages[0] ?? null;
  },
});

/** Admin / Counsellor mutation to trigger a screening test requirement for any patient */
export const triggerScreeningTest = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const triageId = await ctx.db.insert("triages", {
      userId: args.userId,
      level: "force_retest",
      suicideFlag: false,
      psychosisFlag: false,
      createdAt: Date.now(),
    });

    return { success: true, triageId };
  },
});

/** Admin mutation to unblock a severe patient with 3 actions */
export const unblockPatient = mutation({
  args: {
    userId: v.string(),
    action: v.union(v.literal("switch_moderate"), v.literal("switch_low"), v.literal("force_retest")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    let newLevel = "mild";
    if (args.action === "switch_moderate") {
      newLevel = "moderate";
    } else if (args.action === "switch_low") {
      newLevel = "mild";
    } else if (args.action === "force_retest") {
      newLevel = "force_retest";
    }

    const triageId = await ctx.db.insert("triages", {
      userId: args.userId,
      level: newLevel,
      suicideFlag: false,
      psychosisFlag: false,
      createdAt: Date.now(),
    });

    // Resolve any pending alerts for this patient
    const pendingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const alert of pendingAlerts) {
      await ctx.db.patch(alert._id, { status: "resolved" });
    }

    // Auto record audit log for clinical safety compliance
    await ctx.db.insert("auditLogs", {
      userId: identity.subject,
      action: "UNBLOCK_PATIENT",
      details: `Unblocked patient ${args.userId} with action '${args.action}'. New level set to '${newLevel}'.`,
      timestamp: Date.now(),
    });

    return { success: true, newLevel, triageId };
  },
});

/** Get latest triage for current user */
export const getLatest = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const triages = await ctx.db
      .query("triages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return triages[0] ?? null;
  },
});

