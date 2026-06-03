import { Outlet, NavLink } from 'react-router-dom';
import { useDashboardAuth } from '../components/AuthContext';
import { Activity, Users, AlertTriangle, LayoutDashboard, Calendar, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useDashboardAuth();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Activity color="#3B82F6" /> EMOTIFY
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>Clinical Command Center</p>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} /> Overview
          </NavLink>
          <NavLink to="/alerts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <AlertTriangle size={20} /> Live Alerts
          </NavLink>
          <NavLink to="/patients" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} /> Patient Directory
          </NavLink>
          <NavLink to="/sessions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Calendar size={20} /> Sessions
          </NavLink>
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
             <Settings size={20} /> Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="badge badge-green">System Online</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>{user?.full_name}</span>
              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
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
