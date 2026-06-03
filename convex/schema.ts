import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Custom authentication fields
    full_name: v.optional(v.string()),
    email: v.optional(v.string()),
    mobile_number: v.optional(v.string()),
    password_hash: v.optional(v.string()),
    role: v.optional(v.string()), // "admin" | "patient"
    status: v.optional(v.string()), // "active" | "inactive"
    is_first_login: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    failedLoginAttempts: v.optional(v.number()),
    lockoutUntil: v.optional(v.number()),
    createdAt: v.optional(v.number()), // For backward compatibility with existing DB records



    // Existing fields made optional for backward compatibility
    clerkId: v.optional(v.string()),
    alias: v.optional(v.string()),
    age: v.optional(v.number()),
    campus: v.optional(v.string()),
    department: v.optional(v.string()),
    consentVersion: v.optional(v.string()),
    consentTimestamp: v.optional(v.number()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    screeningComplete: v.optional(v.boolean()),
    biometricEnabled: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_mobile_number", ["mobile_number"]),

  refreshTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  otps: defineTable({
    mobile_number: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_mobile_number", ["mobile_number"]),

  authKeys: defineTable({
    privateKeyJwk: v.string(), // JSON string
    publicKeyJwk: v.string(), // JSON string
    createdAt: v.number(),
  }),


  screenings: defineTable({
    userId: v.string(),
    phq9_total: v.number(),
    gad7_total: v.number(),
    pq16_total: v.number(),
    wsas_total: v.number(),
    reqol10_total: v.number(),
    phq9_item9_flag: v.boolean(),
    phq9_item9_score: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  triages: defineTable({
    userId: v.string(),
    level: v.string(),
    suicideFlag: v.boolean(),
    psychosisFlag: v.boolean(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  alerts: defineTable({
    userId: v.string(),
    type: v.string(),
    status: v.string(),
    createdAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  emotionLogs: defineTable({
    userId: v.string(),
    emotion: v.string(),
    bodyRegions: v.array(v.string()),
    intensity: v.optional(v.number()), // legacy
    preIntensity: v.optional(v.number()),
    postIntensity: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  jpmrLogs: defineTable({
    userId: v.string(),
    preIntensity: v.number(),
    postIntensity: v.number(),
    duration: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  microGoals: defineTable({
    userId: v.string(),
    goalId: v.string(),
    goal: v.string(),
    completed: v.boolean(),
    points: v.number(),
    date: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  reframes: defineTable({
    userId: v.string(),
    situation: v.string(),
    originalThought: v.string(),
    thinkingTrap: v.string(),
    guidedAnswers: v.array(v.string()),
    newThought: v.string(),
    preIntensity: v.number(),
    postIntensity: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  followUps: defineTable({
    userId: v.string(),
    type: v.string(),
    dueDate: v.number(),
    completed: v.boolean(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  wellnessProfiles: defineTable({
    userId: v.string(),
    personality_traits: v.array(v.string()),
    mood_pattern: v.string(),
    wellness_goals: v.array(v.string()),
    energy_pattern: v.string(),
    last_updated: v.number(),
  }).index("by_userId", ["userId"]),
});
