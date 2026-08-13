export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HOSPITAL_ADMIN: "hospital_admin",
  COUNSELLOR: "counsellor",
  PATIENT: "patient",
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const RISK_LEVELS = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  SEVERE: "severe",
  CRITICAL: "critical",
} as const;

export type RiskLevelType = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  WAITING: "waiting",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type AppointmentStatusType = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];

export const UNBLOCK_ACTIONS = {
  SWITCH_MODERATE: "switch_moderate",
  SWITCH_LOW: "switch_low",
  FORCE_RETEST: "force_retest",
} as const;

export type UnblockActionType = typeof UNBLOCK_ACTIONS[keyof typeof UNBLOCK_ACTIONS];
