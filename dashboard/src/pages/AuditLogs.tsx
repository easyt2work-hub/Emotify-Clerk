import { Shield, Clock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


export default function AuditLogs() {
  const auditLogs = useQuery(api.dashboard.getAuditLogs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          System Audit Trail
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Immutable logs of administrator actions, password resets, role changes, and rate limits.
        </p>
      </div>

      <div className="glass-panel hud-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", background: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <Shield size={20} color="var(--accent-primary)" />
            Audit Events
          </h2>
          <span className="hud-tag">SECURITY MONITOR</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="hud-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "16px 24px" }}>Timestamp</th>
                <th style={{ padding: "16px 24px" }}>Patient / User Name</th>
                <th style={{ padding: "16px 24px" }}>Action</th>
                <th style={{ padding: "16px 24px" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs === undefined ? (
                <tr>
                  <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    Loading audit records...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log: any) => {

                  const logDate = new Date(log.timestamp);
                  return (
                    <tr key={log._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#475569", whiteSpace: "nowrap" }}>
                        <Clock size={14} style={{ display: "inline", marginRight: "6px" }} />
                        {logDate.toLocaleDateString()} {logDate.toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {log.patientName || log.userId || "System / Admin"}
                      </td>

                      <td style={{ padding: "16px 24px" }}>
                        <span className="badge badge-blue" style={{ fontSize: "0.75rem" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: "0.9rem", color: "#334155" }}>
                        {log.details || "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
