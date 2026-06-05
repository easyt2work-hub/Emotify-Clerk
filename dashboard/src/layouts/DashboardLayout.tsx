import { Outlet, NavLink } from 'react-router-dom';
import { useDashboardAuth } from '../components/AuthContext';
import { Activity, Users, AlertTriangle, LayoutDashboard, Calendar, Settings, LogOut } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardLayout() {
  const { user, logout } = useDashboardAuth();
  
  // Real-time telemetry connection for clinical engine status
  const alerts = useQuery(api.dashboard.getAlerts);
  const hasCritical = alerts?.some(a => a.type === 'suicideRisk' && a.status === 'active');
  const hasWarning = alerts?.some(a => a.status === 'active' && a.type !== 'suicideRisk');
  
  const orbClass = hasCritical ? "orb-red" : hasWarning ? "orb-orange" : "orb-green";
  const orbLabel = hasCritical ? "CRITICAL TRIAGE" : hasWarning ? "WARNING STATUS" : "CONSOLE SAFE";
  const labelColor = hasCritical ? "var(--danger)" : hasWarning ? "var(--warning)" : "var(--success)";

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.6rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
            <Activity color="#6366f1" size={26} /> EMOTIFY
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>Console HUD</p>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={18} /> Overview
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <AlertTriangle size={18} /> Live Alerts
          </NavLink>
          <NavLink to="/patients" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={18} /> Patient Directory
          </NavLink>
          <NavLink to="/sessions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Calendar size={18} /> Sessions
          </NavLink>
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--sidebar-text)', cursor: 'pointer', transition: 'color 0.2s', fontWeight: 600, fontSize: '0.9rem' }}
               onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
               onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sidebar-text)'}
          >
             <Settings size={18} /> Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 750, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Console HUD</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 0, 0, 0.02)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <span className={`pulse-orb ${orbClass}`} style={{ marginRight: '4px' }}></span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: labelColor, fontFamily: 'Outfit, sans-serif' }}>
                {orbLabel}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600 }}>{user?.full_name}</span>
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
