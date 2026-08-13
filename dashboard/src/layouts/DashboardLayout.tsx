import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDashboardAuth } from '../components/AuthContext';
import { 
  Activity, Users, AlertTriangle, LayoutDashboard, Calendar, Settings, LogOut, 
  FileText, BrainCircuit, Bell, Trash2 
} from 'lucide-react';


import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function DashboardLayout() {
  const { user, logout } = useDashboardAuth();
  const navigate = useNavigate();
  
  // Real-time telemetry connection for clinical engine status
  const alerts = useQuery(api.dashboard.getAlerts);
  const unreadRequestsCount = 0;


  const hasCritical = alerts?.some((a: any) => a.type === 'suicideRisk' && a.status === 'active');
  const hasWarning = alerts?.some((a: any) => a.status === 'active' && a.type !== 'suicideRisk');
  
  const orbClass = hasCritical ? "orb-red" : hasWarning ? "orb-orange" : "orb-green";
  const orbLabel = hasCritical ? "CRITICAL TRIAGE" : hasWarning ? "WARNING STATUS" : "CONSOLE SAFE";
  const labelColor = hasCritical ? "var(--danger)" : hasWarning ? "var(--warning)" : "var(--success)";

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar" style={{ overflowY: 'auto' }}>
        <div className="sidebar-header">
          <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.6rem', letterSpacing: '-0.03em', fontWeight: 800 }}>
            <Activity color="#6366f1" size={26} /> EMOTIFY
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>Enterprise HUD</p>
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


          <NavLink to="/screenings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FileText size={18} /> Screening Centre
          </NavLink>
          <NavLink to="/ai-monitoring" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BrainCircuit size={18} /> AI Monitoring
          </NavLink>
          <NavLink to="/notifications" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Bell size={18} /> Notifications
          </NavLink>
        </nav>
      </aside>


      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 750, letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', color: 'var(--text-primary)' }}>EMOTIFY ADMIN DASHBOARD</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              onClick={() => {
                if (hasCritical) {
                  navigate('/alerts');
                }
              }}
              role={hasCritical ? "button" : undefined}
              tabIndex={hasCritical ? 0 : undefined}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                background: hasCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.02)', 
                padding: '6px 14px', 
                borderRadius: '10px', 
                border: hasCritical ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(0, 0, 0, 0.05)',
                cursor: hasCritical ? 'pointer' : 'default',
                userSelect: 'none',
                transition: 'all 0.2s ease'
              }}
            >
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

