import React from "react";
import { CLINICAL_RISK_CONFIG } from "../constants/clinical";

interface ClinicalBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export const ClinicalBadge: React.FC<ClinicalBadgeProps> = ({ level, size = "md", pulse = false }) => {
  const normalizedKey = (level || "low").toLowerCase();
  const config = CLINICAL_RISK_CONFIG[normalizedKey] || CLINICAL_RISK_CONFIG["low"];

  const sizeStyles = {
    sm: { padding: "2px 8px", fontSize: "0.72rem" },
    md: { padding: "4px 12px", fontSize: "0.82rem" },
    lg: { padding: "6px 16px", fontSize: "0.9rem" },
  }[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "20px",
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        ...sizeStyles,
      }}
    >
      {pulse && (
        <span
          className={normalizedKey === "severe" || normalizedKey === "critical" ? "live-pulse-red" : "live-pulse-green"}
          style={{ width: "7px", height: "7px", borderRadius: "50%", background: config.color }}
        />
      )}
      {config.label}
    </span>
  );
};
