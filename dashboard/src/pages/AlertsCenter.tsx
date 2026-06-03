import { AlertTriangle, ShieldAlert, Clock, Activity, Target } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AlertsCenter() {
  const alerts = useQuery(api.dashboard.getAlerts);
  const updateAlertStatus = useMutation(api.dashboard.updateAlertStatus);

  const suicideAlerts = alerts?.filter(a => a.type === 'suicideRisk' && a.status === 'active') || [];
  const psychosisAlerts = alerts?.filter(a => a.type === 'psychosisRisk' && a.status === 'active') || [];
  const deteriorationAlerts = alerts?.filter(a => a.type !== 'suicideRisk' && a.type !== 'psychosisRisk' && a.status === 'active') || [];

  const handleAcknowledge = async (alertId: any) => {
    try {
      await updateAlertStatus({ alertId, status: 'resolved' });
    } catch (e) {
      console.error(e);
      alert("Failed to acknowledge alert.");
    }
  };

  const handleEmergencyProtocol = async (alertId: any) => {
    alert("Emergency protocol initiated! Escalation notifications dispatched to rapid response team.");
    try {
      await updateAlertStatus({ alertId, status: 'escalated' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--danger)' }}>Live Alerts Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Real-time triage and emergency escalations from the clinical engine.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '8px' }}>
        <div className="glass-panel animate-fade-in delay-1" style={{ borderTop: '2px solid var(--danger)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(10, 15, 30, 0.6) 100%)' }}>
          <h3 style={{ color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldAlert size={20} />
            Suicide Risk (RED)
          </h3>
          <p style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--danger)', lineHeight: 1 }}>{suicideAlerts.length}</p>
        </div>
        <div className="glass-panel animate-fade-in delay-2" style={{ borderTop: '2px solid var(--warning)', background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, rgba(10, 15, 30, 0.6) 100%)' }}>
          <h3 style={{ color: '#FDBA74', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={20} />
            Psychosis Risk (ORANGE)
          </h3>
          <p style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{psychosisAlerts.length}</p>
        </div>
        <div className="glass-panel animate-fade-in delay-3" style={{ borderTop: '2px solid var(--caution)', background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.05) 0%, rgba(10, 15, 30, 0.6) 100%)' }}>
          <h3 style={{ color: '#FDE047', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={20} />
            Deterioration (YELLOW)
          </h3>
          <p style={{ fontSize: '3.5rem', fontWeight: 700, color: 'var(--caution)', lineHeight: 1 }}>{deteriorationAlerts.length}</p>
        </div>
      </div>

      <div className="glass-panel animate-fade-in delay-3" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Target size={22} color="var(--accent-primary)"/>
             Emergency Queue
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {alerts === undefined ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading alerts...</div>
          ) : alerts.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--success)' }}>All clear! No active alerts in the system.</div>
          ) : alerts.map((alert) => {
             const isRed = alert.type === 'suicideRisk';
             const isOrange = alert.type === 'psychosisRisk';
             const colorVar = isRed ? 'var(--danger)' : isOrange ? 'var(--warning)' : 'var(--caution)';
             const bgLight = isRed ? 'rgba(239, 68, 68, 0.1)' : isOrange ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 179, 8, 0.1)';

             return (
               <div key={alert._id} style={{ 
                 padding: '24px', 
                 borderBottom: '1px solid var(--glass-border)',
                 display: 'flex', 
                 gap: '24px', 
                 alignItems: 'flex-start',
                 background: alert.status === 'active' ? 'rgba(255,255,255,0.02)' : 'transparent',
                 opacity: alert.status === 'active' ? 1 : 0.6
               }}>
                  <div style={{ padding: '16px', background: bgLight, borderRadius: '50%', color: colorVar, border: `1px solid ${colorVar}` }}>
                    {isRed ? <ShieldAlert size={28} /> : <AlertTriangle size={28} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h3 style={{ color: colorVar, fontSize: '1.2rem', fontWeight: 600 }}>{alert.type === 'suicideRisk' ? 'Suicide Risk Detected' : alert.type}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ marginBottom: '16px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      Patient <strong style={{ color: 'white' }}>{alert.userId}</strong> triggered an automated clinical alert. 
                      Status: <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginLeft: '4px' }}>{alert.status}</span>
                    </p>
                    {alert.status === 'active' && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleEmergencyProtocol(alert._id)} className="btn btn-primary" style={{ background: colorVar, boxShadow: `0 4px 14px ${bgLight}` }}>
                          {isRed ? 'Initiate Emergency Protocol' : 'Review Assessment'}
                        </button>
                        <button onClick={() => handleAcknowledge(alert._id)} className="btn btn-secondary">Acknowledge</button>
                      </div>
                    )}
                  </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}
