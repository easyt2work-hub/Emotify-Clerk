import { Calendar } from "lucide-react";

export default function Sessions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sessions & Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage upcoming appointments and clinical reviews.</p>
        </div>
        <button className="btn btn-primary">
          <Calendar size={18} /> Schedule Session
        </button>
      </div>

      <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
         <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)' }}>
           <Calendar size={48} />
         </div>
         <h2 style={{ fontSize: '1.5rem' }}>No Upcoming Sessions</h2>
         <p style={{ color: 'var(--text-secondary)' }}>You have no clinical reviews scheduled for today.</p>
      </div>
    </div>
  );
}
