import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Activity, AlertTriangle, BrainCircuit, HeartPulse, TrendingUp, Download, Clock, ShieldAlert, CheckCircle2, Calendar, UserPlus, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LoadingState, EmptyState } from "../components/UIComponents";
import EnrollPatientModal from "../components/EnrollPatientModal";

export default function Overview() {
  const data = useQuery(api.dashboard.getDashboardOverview);
  const feed = useQuery(api.dashboard.getActivityFeed);
  const allAppointments = useQuery(api.appointments.listAllTwoWayAppointments);

  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAppointments = allAppointments?.filter((a: any) => a.date === todayStr) || [];
  const chartData = data?.trendData?.length ? data.trendData : [];

  const handleExportReport = () => {
    window.print();
  };

  if (data === undefined || feed === undefined) {
    return <LoadingState message="Connecting to institutional telemetry..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Top Header Bar with Quick Action Hub */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-pulse-green"></span> Live monitoring of institutional mental health metrics
          </p>
        </div>

        {/* Quick Action Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowEnrollModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              fontWeight: 700
            }}
          >
            <UserPlus size={18} /> + Add Patient / Rapid Triage
          </button>
        </div>
      </div>

      {/* Metric Cards with Glassmorphism Soft Depth & Live Pulse Animations */}
      <div className="grid-3">
        <div className="glass-panel hud-panel glass-panel-hover glass-soft-depth animate-fade-in delay-1" style={{ borderTop: '3px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', color: 'var(--accent-primary)' }}>
              <HeartPulse size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span className="badge badge-blue">Active Base</span>
              <span className="hud-tag" style={{ fontSize: '0.65rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-pulse-green"></span> LIVE SYNC
              </span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Enrolled Patients</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{data?.totalPatients ?? 0}</p>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover glass-soft-depth animate-fade-in delay-2" style={{ borderTop: '3px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '14px', color: 'var(--danger)' }}>
              <AlertTriangle size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span className="badge badge-red">{data?.severeCases || 0} Critical</span>
              <span className="hud-tag" style={{ fontSize: '0.65rem', padding: '3px 8px', color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-pulse-red"></span> TRIAGE: ALERT
              </span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Severe / Critical Risk</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            {data?.severeCases ?? 0}
          </p>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover glass-soft-depth animate-fade-in delay-3" style={{ borderTop: '3px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '14px', color: 'var(--warning)' }}>
              <BrainCircuit size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span className="badge badge-orange">{data?.activeAlertsCount || 0} Open</span>
              <span className="hud-tag" style={{ fontSize: '0.65rem', padding: '3px 8px', color: 'var(--warning)', background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-pulse-green"></span> SYNC: LIVE
              </span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Clinical Alerts</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{data?.activeAlertsCount ?? 0}</p>
        </div>
      </div>

      {showEnrollModal && <EnrollPatientModal onClose={() => setShowEnrollModal(false)} />}

      <div className="grid-2">
        <div className="glass-panel hud-panel animate-fade-in delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <TrendingUp size={20} color="var(--accent-primary)" />
              Severity Trends (Last 7 Days)
            </h3>
            <span className="hud-tag">TELEMETRY</span>
          </div>
          <div style={{ height: '320px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSevere" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMod" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="severe" name="Severe Triage" stroke="#f43f5e" fillOpacity={1} fill="url(#colorSevere)" strokeWidth={3} />
                  <Area type="monotone" dataKey="moderate" name="Moderate Triage" stroke="#f97316" fillOpacity={1} fill="url(#colorMod)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No Telemetry Data" description="Longitudinal severity trends will render as assessments are logged." />
            )}
          </div>
        </div>

        <div className="glass-panel hud-panel animate-fade-in delay-3" style={{ display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Activity size={20} color="var(--accent-tertiary)" />
              Live Activity Feed
             </h3>
             <span className="badge badge-green">
               <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
               Live Sync
             </span>
           </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
            {feed.length === 0 ? (
              <EmptyState title="No Activity Logs" description="Recent patient check-ins and clinical alerts will stream here." />
            ) : feed.map((item: any) => (
              <div key={item.id} style={{ 
                padding: '16px 20px', 
                background: 'var(--surface-base)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                borderLeft: `4px solid var(--${item.severity})`,
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.type === 'alert' && <ShieldAlert size={16} color={`var(--${item.severity})`} />}
                    {item.type === 'emotion' && <Activity size={16} color={`var(--${item.severity})`} />}
                    {item.type === 'goal' && <CheckCircle2 size={16} color={`var(--${item.severity})`} />}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel hud-panel animate-fade-in delay-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Calendar size={20} color="var(--accent-secondary)" />
            Today's Handshake Schedule ({todaysAppointments.length})
          </h3>
          <span className="hud-tag">SCHEDULE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todaysAppointments.length === 0 ? (
            <EmptyState title="No Appointments Today" description="There are no clinical sessions scheduled for today." />
          ) : (
            todaysAppointments.map((appt: any) => (
              <div key={appt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-base)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: '10px' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>{appt.patientName} — {appt.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reason: {appt.reason || "Routine Check-in"}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{appt.time}</span>
                  <span className="badge badge-green">{appt.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
