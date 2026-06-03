import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, User, Phone, Calendar, Heart, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load patient user profile
  const patient = useQuery(api.users.getByClerkId, { clerkId: id || "" });
  // Load patient clinical test results
  const testResults = useQuery(api.screening.getAll, { userId: id || "" });

  if (patient === undefined || testResults === undefined) {
    return (
      <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Loading patient profile and clinical data...
      </div>
    );
  }

  if (patient === null) {
    return (
      <div style={{ display: "flex", minHeight: "60vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <p style={{ color: "var(--danger)", fontSize: "1.2rem" }}>Patient not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate("/patients")}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
      </div>
    );
  }

  // Format chart data
  const chartData = [...(testResults || [])]
    .reverse() // show oldest to newest
    .map((test) => {
      const date = new Date(test.createdAt);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        PHQ9: test.phq9_total,
        GAD7: test.gad7_total,
        PQ16: test.pq16_total,
        WSAS: test.wsas_total,
        ReQoL10: test.reqol10_total,
      };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate("/patients")} 
            style={{ padding: "8px 12px", borderRadius: "8px" }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: "2.2rem", margin: "0 0 4px 0", background: "linear-gradient(to right, #fff, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Patient Clinical State
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0 }}>
              Monitoring metrics, test results history, and risk trends.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Card Grid */}
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        {/* Left Column - General Info */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "24px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
              <User size={32} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ color: "white", fontSize: "1.4rem", margin: "0 0 6px 0" }}>{patient.full_name}</h2>
              <span className={`badge ${patient.status === "active" ? "badge-green" : "badge-red"}`}>
                {patient.status}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Phone size={18} color="var(--text-secondary)" />
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Mobile Number</span>
                <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>{patient.mobile_number}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Shield size={18} color="var(--text-secondary)" />
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Role</span>
                <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500, textTransform: "capitalize" }}>{patient.role}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Calendar size={18} color="var(--text-secondary)" />
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Enrolled On</span>
                <span style={{ color: "white", fontSize: "0.95rem", fontWeight: 500 }}>
                  {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Graphical Trends */}
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "1.2rem", color: "white", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
            Clinical Score Trends
          </h3>
          <div style={{ height: "300px", width: "100%" }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPHQ9" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGAD7" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white" }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" name="PHQ-9 (Depression)" dataKey="PHQ9" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPHQ9)" />
                  <Area type="monotone" name="GAD-7 (Anxiety)" dataKey="GAD7" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorGAD7)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                No screening test results recorded for this user yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabular Test Results */}
      <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Heart size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: "1.2rem", color: "white", margin: 0 }}>Historical Screening Tests</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Date</th>
                <th>PHQ-9 (Depression)</th>
                <th>GAD-7 (Anxiety)</th>
                <th>PQ-16 (Psychosis)</th>
                <th>WSAS (Functioning)</th>
                <th>ReQoL-10 (Quality of Life)</th>
                <th>Suicide Flag (Item 9)</th>
              </tr>
            </thead>
            <tbody>
              {testResults.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                    No completed screenings found.
                  </td>
                </tr>
              ) : (
                testResults.map((test) => (
                  <tr key={test._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "white" }}>
                        {new Date(test.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: test.phq9_total >= 10 ? "#EF4444" : "#10B981" }}>
                        {test.phq9_total} / 27
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: test.gad7_total >= 10 ? "#F59E0B" : "#10B981" }}>
                        {test.gad7_total} / 21
                      </span>
                    </td>
                    <td>{test.pq16_total} / 16</td>
                    <td>{test.wsas_total} / 40</td>
                    <td>{test.reqol10_total} / 40</td>
                    <td>
                      {test.phq9_item9_flag ? (
                        <span className="badge badge-red" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <AlertTriangle size={12} /> Yes (Score: {test.phq9_item9_score})
                        </span>
                      ) : (
                        <span className="badge badge-green">No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
