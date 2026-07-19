import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, User, Phone, Calendar, Heart, Shield, TrendingUp, AlertTriangle, 
  Brain, Smile, CheckCircle, HelpCircle, MessageSquare, Award, Clock, ArrowRight 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Tab state: "screenings" | "cbt"
  const [activeTab, setActiveTab] = useState<"screenings" | "cbt">("screenings");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Load patient user profile
  const patient = useQuery(api.users.getByClerkId, { clerkId: id || "" });
  // Load patient clinical test results
  const testResults = useQuery(api.screening.getAll, { userId: id || "" });
  // Load patient CBT therapy session records
  const cbtAnalytics = useQuery(api.dashboard.getPatientCbtAnalytics, { userId: id || "" });

  if (patient === undefined || testResults === undefined || cbtAnalytics === undefined) {
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

  // Format chart data for screenings
  const chartData = [...(testResults || [])]
    .reverse()
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

  // Parse CBT thinking traps stats for Bar Chart
  const thinkingTrapChartData = cbtAnalytics 
    ? Object.keys(cbtAnalytics.thinkingStyleTrends).map(key => ({
        name: key.replace("I'm worried about ", "Worried about ").replace("I feel I should have ", "Should have ").replace("I feel stuck because ", "Stuck / "),
        Sessions: cbtAnalytics.thinkingStyleTrends[key]
      }))
    : [];

  const barColors = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
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
            <h1 style={{ fontSize: "2.2rem", margin: "0 0 4px 0", color: "var(--text-primary)" }}>
              {patient.full_name} — Clinical Directory
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0 }}>
              Status: <span style={{ fontWeight: 600, color: patient.status === "active" ? "var(--success)" : "var(--danger)" }}>{patient.status}</span> • Clerk ID: {patient.clerkId || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("screenings")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "screenings" ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.08)",
            color: activeTab === "screenings" ? "white" : "var(--text-secondary)",
            fontWeight: 650,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Clinical Assessments (PHQ-9 / GAD-7)
        </button>
        <button
          onClick={() => setActiveTab("cbt")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "cbt" ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.08)",
            color: activeTab === "cbt" ? "white" : "var(--text-secondary)",
            fontWeight: 650,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🧠 AI CBT & Recovery Plans
        </button>
      </div>

      {/* RENDER TAB 1: CLINICAL assessments */}
      {activeTab === "screenings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            {/* Left Column - General Info */}
            <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "24px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(37, 99, 235, 0.15)" }}>
                  <User size={32} color="var(--accent-primary)" />
                </div>
                <div>
                  <h2 style={{ color: "var(--text-primary)", fontSize: "1.4rem", margin: "0 0 6px 0" }}>{patient.full_name}</h2>
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
                    <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 500 }}>{patient.mobile_number}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Shield size={18} color="var(--text-secondary)" />
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Role</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 500, textTransform: "capitalize" }}>{patient.role}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Calendar size={18} color="var(--text-secondary)" />
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Enrolled On</span>
                    <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 500 }}>
                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Graphical Trends */}
            <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <TrendingUp size={20} color="var(--accent-primary)" />
                  Clinical Score Trends
                </h3>
                <span className="hud-tag">TELEMETRY</span>
              </div>
              <div style={{ height: "300px", width: "100%" }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPHQ9" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGAD7" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "var(--text-primary)" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" name="PHQ-9 (Depression)" dataKey="PHQ9" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPHQ9)" />
                      <Area type="monotone" name="GAD-7 (Anxiety)" dataKey="GAD7" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorGAD7)" />
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
          <div className="glass-panel hud-panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "10px", justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Heart size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Historical Screening Tests</h3>
              </div>
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
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {new Date(test.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: test.phq9_total >= 10 ? "var(--danger)" : "var(--success)" }}>
                            {test.phq9_total} / 27
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: test.gad7_total >= 10 ? "var(--warning)" : "var(--success)" }}>
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
      )}

      {/* RENDER TAB 2: AI CBT THERAPY ANALYTICS */}
      {activeTab === "cbt" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {cbtAnalytics === null ? (
            <div style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", color: "var(--text-secondary)" }}>
              No CBT therapy analytics or history registered for this student yet.
            </div>
          ) : (
            <>
              {/* CBT STATS SUMMARY CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "20px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total CBT Sessions</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Brain size={24} color="#6366f1" />
                    <span style={{ fontSize: "1.8rem", fontWeight: 750, color: "var(--text-primary)" }}>{cbtAnalytics.totalCbtSessions}</span>
                  </div>
                </div>

                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "20px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Avg Tension Reduction</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Smile size={24} color="#10b981" />
                    <span style={{ fontSize: "1.8rem", fontWeight: 750, color: "var(--success)" }}>
                      {cbtAnalytics.emotionImprovement > 0 ? `-${cbtAnalytics.emotionImprovement}` : "0"}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>pts (0-10)</span>
                  </div>
                </div>

                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "20px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Reframe Belief Score</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle size={24} color="#3b82f6" />
                    <span style={{ fontSize: "1.8rem", fontWeight: 750, color: "var(--text-primary)" }}>{cbtAnalytics.beliefImprovement}%</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>avg belief</span>
                  </div>
                </div>

                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "20px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Goal Activation Rate</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Award size={24} color="#f59e0b" />
                    <span style={{ fontSize: "1.8rem", fontWeight: 750, color: "var(--text-primary)" }}>{cbtAnalytics.goalCompletionRate}%</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>completion</span>
                  </div>
                </div>
              </div>

              {/* CBT DUAL CHARTS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Recovery Progress Chart */}
                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrendingUp size={18} color="var(--accent-primary)" />
                    CBT Emotion Improvement Trend
                  </h3>
                  <div style={{ height: "260px", width: "100%" }}>
                    {cbtAnalytics.recoveryTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cbtAnalytics.recoveryTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorBefore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                          <Tooltip
                            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "var(--text-primary)" }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Area type="monotone" name="Emotion Before" dataKey="emotionBefore" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBefore)" />
                          <Area type="monotone" name="Emotion After" dataKey="emotionAfter" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAfter)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        Not enough data points yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Thinking Style Frequencies */}
                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Brain size={18} color="var(--accent-primary)" />
                    Thinking Styles Frequency
                  </h3>
                  <div style={{ height: "260px", width: "100%" }}>
                    {thinkingTrapChartData.some(d => d.Sessions > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={thinkingTrapChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "var(--text-primary)" }}
                          />
                          <Bar dataKey="Sessions" radius={[6, 6, 0, 0]}>
                            {thinkingTrapChartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={barColors[idx % barColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        No thinking traps logged yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

                </div>
              </div>

              {/* BEHAVIOURAL ACTIVATION & MICRO-GOALS SUMMARY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <Award size={20} color="var(--accent-primary)" />
                    Behavioral Activation & Micro-Goals
                  </h3>
                  <span className="hud-tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>ACTIVATION</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Recovery Plans Created</span>
                    <span style={{ fontSize: "1.6rem", fontWeight: 750, color: "var(--text-primary)" }}>{cbtAnalytics.recoveryPlansCount}</span>
                  </div>
                  <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Frequently Completed Goal</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--success)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cbtAnalytics.frequentlyCompletedGoals?.[0]?.title || "None yet"}
                    </span>
                  </div>
                  <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "16px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Frequently Skipped Goal</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--danger)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cbtAnalytics.frequentlySkippedGoals?.[0]?.title || "None yet"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
                  {/* BA Trends Chart */}
                  <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "1.0rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <TrendingUp size={16} color="var(--accent-primary)" />
                      14-Day Goal Completion Activity
                    </h4>
                    <div style={{ height: "230px", width: "100%" }}>
                      {cbtAnalytics.behaviouralActivationTrends.some(t => t.total > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cbtAnalytics.behaviouralActivationTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "var(--text-primary)" }} />
                            <Legend verticalAlign="top" height={36} />
                            <Bar name="Goals Scheduled" dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar name="Goals Completed" dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                          No goals scheduled in the last 14 days.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frequently Completed / Skipped list */}
                  <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-primary)" }}>🔥 Top Completed Goal Categories</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {cbtAnalytics.mostEffectiveGoalCategories.length === 0 ? (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic" }}>No categories tracked yet.</span>
                        ) : (
                          cbtAnalytics.mostEffectiveGoalCategories.slice(0, 4).map((cat) => (
                            <span key={cat.category} className="badge badge-green" style={{ fontSize: "0.8rem", padding: "4px 8px" }}>
                              {cat.category}: {cat.count}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <h4 style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-primary)" }}>⚠️ Frequently Skipped Micro-Goals</h4>
                      <ul style={{ margin: 0, paddingLeft: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {cbtAnalytics.frequentlySkippedGoals.length === 0 ? (
                          <li style={{ fontStyle: "italic", listStyleType: "none", marginLeft: "-16px" }}>No goals skipped yet.</li>
                        ) : (
                          cbtAnalytics.frequentlySkippedGoals.slice(0, 3).map((g, idx) => (
                            <li key={idx} style={{ color: "var(--text-primary)" }}>
                              "{g.title}" <strong style={{ color: "var(--danger)" }}>({g.count} skips)</strong>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Consolidated Recovery Milestones Timeline */}
                <div className="glass-panel hud-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "1.0rem", margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={16} color="var(--accent-primary)" />
                    Unified Patient Recovery Timeline
                  </h4>
                  <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "8px" }}>
                    {cbtAnalytics.recoveryTimeline.length === 0 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "16px" }}>
                        No cbt or goal milestones logged yet.
                      </span>
                    ) : (
                      cbtAnalytics.recoveryTimeline.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "1.1rem", padding: "4px" }}>
                            {item.type === "session" ? "🧠" : "🎯"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{item.title}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>{item.details}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* HIGH RISK TRIGGERS */}
              {cbtAnalytics.highRiskAlerts.length > 0 && (
                <div className="glass-panel hud-panel" style={{ borderLeft: "4px solid var(--danger)", background: "rgba(239, 68, 68, 0.05)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, color: "var(--danger)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={18} /> High-Risk Safety Mode Activations ({cbtAnalytics.highRiskAlerts.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {cbtAnalytics.highRiskAlerts.map((alert, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px" }}>
                        <div>
                          <span style={{ fontWeight: 650, color: "var(--text-primary)" }}>Session Triggered: {alert.situation}</span>
                          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                            {alert.riskFlags.map((flag: string) => (
                              <span key={flag} className="badge badge-red" style={{ fontSize: "0.75rem", padding: "2px 6px" }}>{flag}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", alignSelf: "center" }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HISTORICAL CBT SESSIONS LIST */}
              <div className="glass-panel hud-panel" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Brain size={20} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Historical AI CBT Sessions</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Core Thought</th>
                        <th>Trap Style</th>
                        <th>CBT distortion</th>
                        <th>Tension Delta</th>
                        <th>Reframe belief</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Dialogue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cbtAnalytics.sessionsHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}>
                            No CBT sessions logged for this student.
                          </td>
                        </tr>
                      ) : (
                        cbtAnalytics.sessionsHistory.map((s) => (
                          <tr key={s._id}>
                            <td>{new Date(s.timestamp).toLocaleDateString()}</td>
                            <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ fontWeight: 550, color: "var(--text-primary)" }}>"{s.automaticThought || "N/A"}"</span>
                            </td>
                            <td>{s.thinkingStyle || "N/A"}</td>
                            <td>{s.cbtDistortion ? <span className="badge badge-purple">{s.cbtDistortion}</span> : "N/A"}</td>
                            <td>
                              {s.emotionBefore !== undefined && s.emotionAfter !== undefined ? (
                                <span style={{ fontWeight: 600, color: s.emotionBefore > s.emotionAfter ? "var(--success)" : "var(--text-secondary)" }}>
                                  {s.emotionBefore} → {s.emotionAfter} (-{s.emotionBefore - s.emotionAfter})
                                </span>
                              ) : "N/A"}
                            </td>
                            <td>{s.beliefScore !== undefined ? `${s.beliefScore}%` : "N/A"}</td>
                            <td>
                              <span className={`badge ${s.sessionStatus === "completed" ? "badge-green" : s.sessionStatus === "safety_mode" ? "badge-red" : "badge-orange"}`}>
                                {s.sessionStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "4px 10px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                onClick={() => setSelectedSession(s)}
                              >
                                <MessageSquare size={12} /> View transcript
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* DIALOGUE TRANSCRIPT VIEWER MODAL */}
      {selectedSession && createPortal(
        <div className="modal-overlay" style={overlayStyle}>
          <div className="glass-panel hud-panel" style={{ ...modalStyle, maxWidth: "700px" }}>
            {/* Modal Close Button */}
            <button 
              onClick={() => setSelectedSession(null)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "1.4rem", margin: "0 0 4px 0", color: "var(--text-primary)" }}>CBT Session Dialogue Transcript</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 0 16px 0" }}>
              Date: {new Date(selectedSession.timestamp).toLocaleString()} • Status: <span style={{ fontWeight: 600 }}>{selectedSession.sessionStatus}</span>
            </p>

            {/* Session Clinical Summary Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Situation Analyzed</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{selectedSession.situation || "Unknown"}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Cognitive Distortion (Internal)</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 600 }}>{selectedSession.cbtDistortion || "N/A"}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Automatic Thought</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontStyle: "italic" }}>"{selectedSession.automaticThought || "N/A"}"</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Thinking Style</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{selectedSession.thinkingStyle || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Reframe Balanced Thought</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 550 }}>"{selectedSession.balancedThought || "N/A"}"</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Belief Rating</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 600 }}>{selectedSession.beliefScore !== undefined ? `${selectedSession.beliefScore}%` : "N/A"}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Recommended Goals in Recovery Plan</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
                  {selectedSession.recommendedGoals && selectedSession.recommendedGoals.length > 0 ? (
                    <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {selectedSession.recommendedGoals.map((g: any) => {
                        const isChosen = selectedSession.selectedGoalIds?.includes(g.id);
                        return (
                          <li key={g.id} style={{ color: isChosen ? "var(--success)" : "var(--text-secondary)", fontWeight: isChosen ? 600 : 400 }}>
                            {g.title} {isChosen && "✓ (Selected)"}
                          </li>
                        );
                      })}
                    </ul>
                  ) : selectedSession.recommendedGoal ? (
                    `🎯 ${selectedSession.recommendedGoal.title} ${selectedSession.goalCompletion ? "(Accepted)" : "(Skipped)"}`
                  ) : (
                    "None"
                  )}
                </span>
              </div>
            </div>

            {/* Chat Transcript Panel */}
            <h3 style={{ fontSize: "1.1rem", margin: "16px 0 8px 0", color: "var(--text-primary)" }}>Counselor Dialogue</h3>
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "14px", border: "1px solid var(--border-color)", borderRadius: "12px", background: "#f8fafc" }}>
              {selectedSession.conversation?.map((msg: any, idx: number) => {
                const isUser = msg.role === "user";
                return (
                  <div key={idx} style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: isUser ? "var(--accent-primary)" : "#ffffff",
                    border: isUser ? "none" : "1px solid #e2e8f0",
                    color: isUser ? "white" : "var(--text-primary)",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}>
                    <strong style={{ display: "block", fontSize: "0.75rem", color: isUser ? "rgba(255,255,255,0.7)" : "var(--text-secondary)", marginBottom: "2px" }}>
                      {isUser ? "Student" : "Compassionate AI Counselor"}
                    </strong>
                    <span style={{ fontSize: "0.92rem", lineHeight: 1.4 }}>{msg.content}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSession(null)}>Close Transcript</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(12px)",
  zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
};

const modalStyle: React.CSSProperties = {
  position: "relative", width: "100%", padding: "32px", borderRadius: "20px",
  background: "var(--card-bg)", display: "flex", flexDirection: "column", gap: "16px"
};
