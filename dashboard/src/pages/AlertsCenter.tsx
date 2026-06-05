import { AlertTriangle, ShieldAlert, Clock, Activity, Target } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AlertsCenter() {
  const alerts = useQuery(api.dashboard.getAlerts);
  const updateAlertStatus = useMutation(api.dashboard.updateAlertStatus);

  const isAlertActive = (status: string) => status === 'active' || status === 'pending' || status === 'escalated';
  const suicideAlerts = alerts?.filter(a => (a.type === 'suicideRisk' || a.type === 'suicide') && isAlertActive(a.status)) || [];
  const psychosisAlerts = alerts?.filter(a => (a.type === 'psychosisRisk' || a.type === 'psychosis') && isAlertActive(a.status)) || [];
  const deteriorationAlerts = alerts?.filter(a => a.type !== 'suicideRisk' && a.type !== 'suicide' && a.type !== 'psychosisRisk' && a.type !== 'psychosis' && isAlertActive(a.status)) || [];

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
        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Live Alerts Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Real-time triage and emergency escalations from the clinical engine.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '8px' }}>
        <div className="glass-panel hud-panel animate-fade-in delay-1" style={{ borderTop: '2px solid var(--danger)', background: 'rgba(239, 68, 68, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <ShieldAlert size={18} />
              Suicide Risk
            </h3>
            <span className="hud-tag" style={{ color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.25)', fontSize: '0.6rem', padding: '2px 6px' }}>CLASS A</span>
          </div>
          <p className="hud-num" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>{suicideAlerts.length}</p>
        </div>
        <div className="glass-panel hud-panel animate-fade-in delay-2" style={{ borderTop: '2px solid var(--warning)', background: 'rgba(249, 115, 22, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ color: '#c2410c', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <AlertTriangle size={18} />
              Psychosis Risk
            </h3>
            <span className="hud-tag" style={{ color: 'var(--warning)', background: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.25)', fontSize: '0.6rem', padding: '2px 6px' }}>CLASS B</span>
          </div>
          <p className="hud-num" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{psychosisAlerts.length}</p>
        </div>
        <div className="glass-panel hud-panel animate-fade-in delay-3" style={{ borderTop: '2px solid var(--caution)', background: 'rgba(234, 179, 8, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ color: '#a16207', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Activity size={18} />
              Deterioration
            </h3>
            <span className="hud-tag" style={{ color: 'var(--caution)', background: 'rgba(234, 179, 8, 0.08)', borderColor: 'rgba(234, 179, 8, 0.25)', fontSize: '0.6rem', padding: '2px 6px' }}>CLASS C</span>
          </div>
          <p className="hud-num" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--caution)', lineHeight: 1 }}>{deteriorationAlerts.length}</p>
        </div>
      </div>

      <div className="glass-panel hud-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             <Target size={20} color="var(--accent-primary)"/>
             Emergency Queue
          </h2>
          <span className="hud-tag">LIVE STREAMS</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {alerts === undefined ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading alerts...</div>
          ) : alerts.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--success)' }}>All clear! No active alerts in the system.</div>
          ) : alerts.map((alert) => {
             const isRed = alert.type === 'suicideRisk' || alert.type === 'suicide';
             const isOrange = alert.type === 'psychosisRisk' || alert.type === 'psychosis';
             const strokeColor = isRed ? 'var(--danger)' : isOrange ? 'var(--warning)' : 'var(--caution)';
             const colorVar = isRed ? '#b91c1c' : isOrange ? '#c2410c' : '#a16207';
             const bgLight = isRed ? 'rgba(239, 68, 68, 0.1)' : isOrange ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 179, 8, 0.1)';
             const isActive = isAlertActive(alert.status);

             return (
               <div key={alert._id} style={{ 
                 padding: '24px', 
                 borderBottom: '1px solid var(--border-color)',
                 display: 'flex', 
                 gap: '24px', 
                 alignItems: 'flex-start',
                 background: isActive ? 'var(--surface-base)' : 'transparent',
                 opacity: isActive ? 1 : 0.6,
                 transition: 'all 0.3s ease-in-out'
               }}
               className="alert-queue-item"
               >
                  <div style={{ padding: '16px', background: bgLight, borderRadius: '50%', color: strokeColor, border: `1px solid ${strokeColor}`, boxShadow: `0 0 16px ${bgLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {isRed ? <ShieldAlert size={26} /> : <AlertTriangle size={26} />}
                  </div>
                  <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <h3 style={{ color: colorVar, fontSize: '1.2rem', fontWeight: 650 }}>
                         {isRed 
                           ? 'Suicide Risk Detected' 
                           : isOrange 
                           ? 'Psychosis Risk Detected' 
                           : alert.type === 'counselor_request'
                           ? 'Counselor Request'
                           : alert.type.charAt(0).toUpperCase() + alert.type.slice(1).replace(/_/g, ' ')}
                       </h3>
                       <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                         <Clock size={13} />
                         {new Date(alert.createdAt).toLocaleString()}
                       </span>
                     </div>
                     <p style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                       Patient <strong style={{ color: 'var(--text-primary)' }}>{alert.userId}</strong> triggered an automated clinical alert. 
                       Status: <span style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', padding: '3px 8px', background: isActive ? 'rgba(244, 63, 94, 0.1)' : 'var(--surface-hover)', border: isActive ? '1px solid rgba(244,63,94,0.2)' : '1px solid var(--border-color)', color: isActive ? '#b91c1c' : 'var(--text-secondary)', borderRadius: '6px', marginLeft: '6px' }}>{alert.status}</span>
                     </p>
                     {isActive && (
                       <div style={{ display: 'flex', gap: '12px' }}>
                         <button onClick={() => handleEmergencyProtocol(alert._id)} className="btn btn-primary" style={{ background: colorVar, color: '#ffffff', border: 'none', boxShadow: `0 4px 16px ${bgLight}` }}>
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
