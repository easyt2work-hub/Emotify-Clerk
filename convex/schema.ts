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
    biometricToken: v.optional(v.string()),

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
    .index("by_mobile_number", ["mobile_number"])
    .index("by_role", ["role"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  appointments: defineTable({
    userId: v.id("users"),
    startTime: v.optional(v.number()), // Kept optional for backward compatibility
    endTime: v.optional(v.number()), // Kept optional for backward compatibility
    description: v.optional(v.string()),
    status: v.string(), // "pending" | "waiting" | "accepted" | "rejected" | "completed" | "scheduled" | "cancelled"
    createdAt: v.number(),
    
    // New fields for two-way system
    title: v.optional(v.string()),
    createdBy: v.optional(v.string()), // "admin" | "user"
    patientName: v.optional(v.string()),
    date: v.optional(v.string()), // YYYY-MM-DD
    time: v.optional(v.string()), // 12-hour format
    reason: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    rescheduledBy: v.optional(v.string()), // "admin" | "user"
    rescheduleDate: v.optional(v.string()),
    rescheduleTime: v.optional(v.string()),
    feedback: v.optional(v.string()),
    rating: v.optional(v.number()),
    attended: v.optional(v.string()), // "yes" | "no"
    isFeedbackCompleted: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_startTime", ["startTime"]),


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
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

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
    completed: v.optional(v.boolean()),
    durationSeconds: v.optional(v.number()),
    preIntensity: v.number(),
    postIntensity: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    duration: v.optional(v.number()), // Legacy
  }).index("by_userId", ["userId"]),

  microGoals: defineTable({
    userId: v.string(),
    goalId: v.string(),
    goalTitle: v.string(),
    goalDescription: v.string(),
    category: v.string(),
    difficulty: v.string(),
    points: v.number(),
    scheduledTime: v.optional(v.number()),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    skipped: v.boolean(),
    createdAt: v.number(),
    // Legacy fields for backward compatibility
    goal: v.optional(v.string()),
    date: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  points: defineTable({
    userId: v.string(),
    totalPoints: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  badges: defineTable({
    userId: v.string(),
    badgeId: v.string(),
    badgeName: v.string(),
    earnedAt: v.number(),
  }).index("by_userId", ["userId"]),

  streaks: defineTable({
    userId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastCompletionDate: v.string(), // YYYY-MM-DD
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

  reframeLogs: defineTable({
    userId: v.string(),
    situation_text: v.string(),
    thought_original: v.string(),
    thinking_trap_choice: v.string(),
    guided_answers: v.array(v.string()),
    reframe_text: v.string(),
    pre_reframe_intensity: v.number(),
    post_reframe_intensity: v.number(),
    improvement_percentage: v.number(),
    saved_reframe_flag: v.boolean(),
    favorite: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  counsellorRequests: defineTable({
    user_id: v.string(),
    thought_original: v.optional(v.string()),
    situation_text: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_user_id", ["user_id"]),

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

  emotionMaps: defineTable({
    userId: v.string(),
    emotionLabel: v.string(),
    selectedRegions: v.array(v.string()),
    bodyRatings: v.array(
      v.object({
        region: v.string(),
        intensity: v.number(),
      })
    ),
    averageIntensity: v.number(),
    suggestedAction: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),
});
