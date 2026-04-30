import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    alias: v.string(),
    age: v.number(),
    campus: v.string(),
    department: v.string(),
    consentVersion: v.string(),
    consentTimestamp: v.number(),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    onboardingComplete: v.boolean(),
    screeningComplete: v.boolean(),
    biometricEnabled: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

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
