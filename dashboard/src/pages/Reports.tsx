import { FileText, Download, Printer } from "lucide-react";

export default function Reports() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", color: "var(--text-primary)" }}>
            Clinical & Hospital Reports Generator
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            Generate official PDF, CSV, and Excel exports for hospital administration, audit compliance, and monthly clinical reviews.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Printer size={18} /> Print Official Summary
        </button>
      </div>

      <div className="grid-3">
        <div className="glass-panel hud-panel glass-panel-hover">
          <FileText size={32} color="var(--accent-primary)" style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>Patient Outcome Report</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Individual longitudinal progress, PHQ/GAD trends, and CBT session history.</p>
          <button className="btn btn-secondary" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}><Download size={14} /> Download PDF</button>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover">
          <FileText size={32} color="var(--success)" style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>Counsellor Workload Report</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Staff psychiatrist utilization, patient ratings, and session performance.</p>
          <button className="btn btn-secondary" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}><Download size={14} /> Download CSV</button>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover">
          <FileText size={32} color="var(--warning)" style={{ marginBottom: "12px" }} />
          <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>Hospital Audit & Compliance</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Institutional security logs, permission audits, and emergency escalations snapshot.</p>
          <button className="btn btn-secondary" style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}><Download size={14} /> Download Excel</button>
        </div>
      </div>
    </div>
  );
}
