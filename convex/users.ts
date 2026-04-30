import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Create or update user profile after onboarding */
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    alias: v.string(),
    age: v.number(),
    campus: v.string(),
    department: v.string(),
    consentVersion: v.string(),
    consentTimestamp: v.number(),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        alias: args.alias,
        age: args.age,
        campus: args.campus,
        department: args.department,
        consentVersion: args.consentVersion,
        consentTimestamp: args.consentTimestamp,
        emergencyContactName: args.emergencyContactName,
        emergencyContactPhone: args.emergencyContactPhone,
        onboardingComplete: true,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      ...args,
      onboardingComplete: true,
      screeningComplete: false,
      biometricEnabled: false,
      createdAt: Date.now(),
    });
  },
});

/** Get user by Clerk ID */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

/** Mark screening as complete */
export const markScreeningComplete = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { screeningComplete: true });
    }
  },
});

/** Toggle biometric preference */
export const toggleBiometric = mutation({
  args: { clerkId: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { biometricEnabled: args.enabled });
    }
  },
});

/** Update user profile fields */
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    alias: v.optional(v.string()),
    age: v.optional(v.number()),
    campus: v.optional(v.string()),
    department: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) return;

    const updates: Record<string, unknown> = {};
    if (args.alias !== undefined) updates.alias = args.alias;
    if (args.age !== undefined) updates.age = args.age;
    if (args.campus !== undefined) updates.campus = args.campus;
    if (args.department !== undefined) updates.department = args.department;
    if (args.emergencyContactName !== undefined) updates.emergencyContactName = args.emergencyContactName;
    if (args.emergencyContactPhone !== undefined) updates.emergencyContactPhone = args.emergencyContactPhone;

    await ctx.db.patch(user._id, updates);
  },
});

/** Update last login timestamp */
export const updateLastLogin = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }
  },
});
