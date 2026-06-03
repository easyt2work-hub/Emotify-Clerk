import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./authHelpers";

export const getPatients = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "patient"))
      .collect();
  },
});

export const createPatient = mutation({
  args: {
    fullName: v.string(),
    dob: v.optional(v.string()),
    age: v.number(),
    gender: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    initialRiskLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const tempPassword = Math.random().toString(36).slice(-8);
    const password_hash = await hashPassword(tempPassword);

    const id = await ctx.db.insert("users", {
      full_name: args.fullName,
      email: args.email,
      mobile_number: args.phone,
      password_hash,
      role: "patient",
      status: "active",
      is_first_login: true,
      created_at: Date.now(),
      updated_at: Date.now(),
      onboardingComplete: false,
      screeningComplete: false,
      biometricEnabled: false,
    });

    return { id, patientId: id, tempPassword };
  },
});
