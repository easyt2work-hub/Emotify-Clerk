export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HOSPITAL_ADMIN: "hospital_admin",
  COUNSELLOR: "counsellor",
  PATIENT: "patient",
} as const;

export const RISK_LEVELS = {
  LOW: "low",
  MODERATE: "moderate",
  SEVERE: "severe",
  CRITICAL: "critical",
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  WAITING: "waiting",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
