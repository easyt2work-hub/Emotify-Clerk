import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create a new alert */
export const createAlert = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🚨 ALERT TRIGGERED — User: ${args.userId}, Type: ${args.type}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`📋 Status: PENDING — Counselor notification required`);

    return await ctx.db.insert("alerts", {
      userId: args.userId,
      type: args.type,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/** Acknowledge an alert */
export const acknowledgeAlert = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
    });
  },
});

/** Get pending alerts for a user */
export const getPending = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

/** Get all alerts for a user */
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
