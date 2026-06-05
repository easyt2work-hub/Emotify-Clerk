import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Activity, AlertTriangle, BrainCircuit, HeartPulse, TrendingUp, Download, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const data = useQuery(api.dashboard.getDashboardOverview);
  const feed = useQuery(api.dashboard.getActivityFeed);

  // Use real trend data if available, else empty
  const chartData = data?.trendData?.length ? data.trendData : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Live monitoring of institutional mental health metrics</p>
        </div>
        <button className="btn btn-secondary">
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="grid-3">
        <div className="glass-panel hud-panel glass-panel-hover animate-fade-in delay-1" style={{ borderTop: '2px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', color: 'var(--accent-primary)' }}>
              <HeartPulse size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-blue">Active Base</span>
              <span className="hud-tag" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>SYS: ONLINE</span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Enrolled Patients</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{data ? data.totalPatients : '...'}</p>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover animate-fade-in delay-2" style={{ borderTop: '2px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '14px', color: 'var(--danger)' }}>
              <AlertTriangle size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-red">{data?.suicideRisks || 0} Critical</span>
              <span className="hud-tag" style={{ fontSize: '0.6rem', padding: '2px 6px', color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.25)' }}>TRIAGE: ALERT</span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Severe / Critical Risk</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            {data ? data.severeCases : '...'}
          </p>
        </div>

        <div className="glass-panel hud-panel glass-panel-hover animate-fade-in delay-3" style={{ borderTop: '2px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '14px', color: 'var(--warning)' }}>
              <BrainCircuit size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span className="badge badge-orange">{data?.activeAlertsCount || 0} Open</span>
              <span className="hud-tag" style={{ fontSize: '0.6rem', padding: '2px 6px', color: 'var(--warning)', background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.25)' }}>SYNC: LIVE</span>
            </div>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Clinical Alerts</h3>
          <p className="hud-num" style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>{data ? data.activeAlertsCount : '...'}</p>
        </div>
      </div>

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
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="severe" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorSevere)" />
                  <Area type="monotone" dataKey="moderate" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMod)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Waiting for clinical data...
              </div>
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
            {!feed ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading feed...</p>
            ) : feed.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No recent activity.</p>
            ) : feed.map((item) => (
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
    </div>
  );
}
