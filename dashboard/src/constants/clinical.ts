import { RISK_LEVELS, type RiskLevelType } from "./enums";

export const CLINICAL_RISK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  [RISK_LEVELS.LOW]: {
    label: "Low Risk",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
  },
  [RISK_LEVELS.MODERATE]: {
    label: "Moderate Risk",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.25)",
  },
  [RISK_LEVELS.HIGH]: {
    label: "High Risk",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
  },
  [RISK_LEVELS.SEVERE]: {
    label: "Severe Risk",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.35)",
  },
  [RISK_LEVELS.CRITICAL]: {
    label: "Critical Risk",
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.18)",
    border: "rgba(220, 38, 38, 0.4)",
  },
};

export const COUNSELLOR_INFO = {
  LEAD_PSYCHOLOGIST: "Priyanka R.",
  LEAD_TITLE: "Founder & Lead Counselling Psychologist",
  CLINIC_NAME: "Intel Counselling",
  CLINIC_LOCATION: "Chennai, Tamil Nadu",
  WEBSITE: "https://intelcounselling.com/",
};
