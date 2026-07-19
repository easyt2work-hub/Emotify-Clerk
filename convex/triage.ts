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
    wsas_total: v.number(),
    reqol10_total: v.number(),
    phq9_item9_score: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    await checkRateLimit(ctx, userId, "journal_write", 5, 60000);

    // Validation
    const { phq9_total, gad7_total, pq16_total, wsas_total, reqol10_total, phq9_item9_score } = args;
    if (phq9_total < 0 || gad7_total < 0 || pq16_total < 0 || wsas_total < 0 || reqol10_total < 0 || phq9_item9_score < 0) {
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
    } else if (phq9_total >= 15 || gad7_total >= 15 || wsas_total > 20 || reqol10_total < 15) {
      level = "severe";
      requiresAlert = true;
      alertType = "severe";
    } else if (
      (phq9_total >= 10 && phq9_total <= 14) ||
      (gad7_total >= 10 && gad7_total <= 14) ||
      (wsas_total >= 11 && wsas_total <= 20) ||
      (reqol10_total >= 15 && reqol10_total <= 25)
    ) {
      level = "moderate";
    } else {
      level = "mild";
    }

    // Monitoring: check for escalation or improvement relative to previous WSAS
    const previousScreening = await ctx.db
      .query("screenings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(2); // Take 2 because the current one is already inserted or about to be

    if (previousScreening.length > 1) {
      const last = previousScreening[1]; // The one before the current submission
      if (wsas_total > last.wsas_total + 5) {
        // Escalate alert if WSAS worsens significantly
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

/** Get latest triage for a user */
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
