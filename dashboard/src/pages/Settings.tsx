import { useState } from "react";
import { Settings, Shield, Bell, Key, Database, Lock } from "lucide-react";

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<"hospital" | "security" | "ai" | "notifications">("hospital");
  const [hospitalName, setHospitalName] = useState("Emotify Mental Health Institute");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordPolicy, setPasswordPolicy] = useState("strong");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          System & Enterprise Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Hospital branding, RBAC security policies, AI confidence thresholds, and backup configuration.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button className={`btn ${activeTab === "hospital" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("hospital")}>Hospital & Branding</button>
        <button className={`btn ${activeTab === "security" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("security")}>Security & Password Policy</button>
        <button className={`btn ${activeTab === "ai" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("ai")}>AI Thresholds & Risk Limits</button>
        <button className={`btn ${activeTab === "notifications" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("notifications")}>Notification Dispatch</button>
      </div>

      {activeTab === "hospital" && (
        <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3>Hospital Institution Details</h3>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", fontWeight: 600 }}>Hospital / Counselling Centre Name</label>
            <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="hud-input" style={{ maxWidth: "450px" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", fontWeight: 600 }}>Session Timeout (Minutes)</label>
            <input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="hud-input" style={{ maxWidth: "200px" }} />
          </div>
          <button className="btn btn-primary" style={{ width: "fit-content" }} onClick={() => alert("Settings saved successfully!")}>Save Hospital Settings</button>
        </div>
      )}

      {activeTab === "security" && (
        <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3>Role Based Access Control (RBAC) & Security</h3>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", fontWeight: 600 }}>Password Complexity Requirement</label>
            <select value={passwordPolicy} onChange={(e) => setPasswordPolicy(e.target.value)} className="hud-input" style={{ maxWidth: "300px" }}>
              <option value="strong">Strong (Min 8 chars, 1 number, 1 special char)</option>
              <option value="enterprise">Enterprise (Min 12 chars, 2FA required)</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: "fit-content" }} onClick={() => alert("Security policy updated!")}>Update Security Policy</button>
        </div>
      )}
    </div>
  );
}
