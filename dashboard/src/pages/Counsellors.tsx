import { useState } from "react";
import { UserCheck, Plus, Phone, Mail, Award, Clock, Star, Activity } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Counsellors() {
  const counsellors = useQuery(api.dashboard.getCounsellors);
  const addCounsellor = useMutation(api.dashboard.addCounsellor);
  const updateStatus = useMutation(api.dashboard.updateCounsellorStatus);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("counsellor");
  const [maxWorkload, setMaxWorkload] = useState(15);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCounsellor({
        name,
        email,
        phone,
        role,
        availability: ["Mon-Fri (09:00 - 17:00)"],
        maxWorkload: Number(maxWorkload),
      });
      setShowAddModal(false);
      setName(""); setEmail(""); setPhone("");
    } catch (err: any) {
      alert(err.message || "Failed to add counsellor");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", color: "var(--text-primary)" }}>
            Clinical Counsellor Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            Staff psychiatrists, therapists, workload allocation, and patient assignment tracking.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={18} /> Add Counsellor
        </button>
      </div>

      <div className="grid-3">
        {counsellors === undefined ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading counsellors...</p>
        ) : counsellors.length === 0 ? (
          <div className="glass-panel hud-panel" style={{ gridColumn: "span 3", textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-secondary)" }}>No counsellors added yet. Click "Add Counsellor" to onboard staff.</p>
          </div>
        ) : (
          counsellors.map((c: any) => (
            <div key={c._id} className="glass-panel hud-panel glass-panel-hover" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)", fontWeight: 700 }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{c.name}</h3>
                    <span className="badge badge-blue" style={{ fontSize: "0.72rem", marginTop: "2px" }}>{c.role}</span>
                  </div>
                </div>
                <span className={`badge ${c.status === "active" ? "badge-green" : "badge-red"}`}>{c.status}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.88rem", color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={14} /> {c.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={14} /> {c.phone}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Star size={14} color="#f59e0b" /> Rating: <strong>{c.rating} / 5.0</strong></div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Activity size={14} /> Workload: <strong>{c.currentWorkload || 0} / {c.maxWorkload} Patients</strong></div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: "0.82rem" }}
                  onClick={() => updateStatus({ counsellorId: c._id, status: c.status === "active" ? "inactive" : "active" })}
                >
                  {c.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel hud-panel animate-fade-in" style={{ width: "100%", maxWidth: "500px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Onboard New Counsellor</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="hud-input" />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="hud-input" />
              <input type="text" placeholder="Mobile Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="hud-input" />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="hud-input">
                <option value="counsellor">Clinical Counsellor</option>
                <option value="senior_psychiatrist">Senior Psychiatrist</option>
                <option value="lead">Lead Therapist</option>
              </select>
              <input type="number" placeholder="Max Patient Workload" value={maxWorkload} onChange={(e) => setMaxWorkload(Number(e.target.value))} className="hud-input" />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Counsellor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
