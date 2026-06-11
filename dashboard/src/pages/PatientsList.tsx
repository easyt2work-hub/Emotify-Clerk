import { useState } from "react";
import { createPortal } from "react-dom";
import { Users, UserPlus, Search, Edit2, ShieldAlert, ShieldCheck, BarChart2, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";

export default function PatientsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom query fetching patient users from users table
  const patients = useQuery(api.users.listPatients, { search: searchTerm });
  const toggleStatus = useMutation(api.users.toggleUserStatus);
  const deleteUser = useMutation(api.users.deleteUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Custom confirmation modal state configurations
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleToggleStatus = async (userId: any, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    setConfirmConfig({
      title: currentStatus === "active" ? "Deactivate User Access" : "Activate User Access",
      message: `Are you sure you want to set this user status to ${nextStatus.toUpperCase()}? This will change their ability to log in to the console.`,
      confirmText: currentStatus === "active" ? "Deactivate" : "Activate",
      isDanger: currentStatus === "active",
      onConfirm: async () => {
        try {
          await toggleStatus({ userId, status: nextStatus });
        } catch (err: any) {
          alert(err.message || "Failed to update status.");
        }
      }
    });
  };

  const handleDeleteUser = async (userId: any, fullName?: string) => {
    const name = fullName || "Unknown User";
    setConfirmConfig({
      title: "Delete User Profile?",
      message: `Are you sure you want to permanently delete user "${name}"? This action is irreversible and will delete all clinical screenings, telemetry logs, and upcoming sessions.`,
      confirmText: "Delete Permanently",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteUser({ userId });
        } catch (err: any) {
          alert(err.message || "Failed to delete user.");
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>User Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage credentials, update access status, and monitor clinical state.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {showAddModal && (
        <AddUserModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            // refresh is automatic with Convex
          }} 
        />
      )}

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)} 
          onSuccess={() => {
            // refresh is automatic
          }} 
        />
      )}

      <div className="glass-panel hud-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '24px', borderBottom: '1px solid var(--glass-border)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1 }}>
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Search users by name or mobile number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="hud-tag">SECURE RECORDS</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Mobile Number</th>
                <th>Status</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients === undefined ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading directory...</td></tr>
              ) : !patients || !Array.isArray(patients) || patients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users found. Add a user to get started.</td></tr>
              ) : patients.map(patient => (
                <tr key={patient._id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <Users size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.05rem', margin: 0 }}>{patient.full_name}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {patient._id}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'Outfit, monospace', background: 'var(--surface-base)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                      {patient.mobile_number}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(patient.status || 'active') === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {patient.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {patient.role}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => navigate(`/patients/${patient._id}`)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="View clinical tests & charts"
                      >
                        <BarChart2 size={14} /> View State
                      </button>
                      <button 
                        onClick={() => setEditingUser(patient)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Edit user details"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(patient._id, patient.status || "active")} 
                        className={`btn ${(patient.status || "active") === 'active' ? 'btn-secondary' : 'btn-primary'}`} 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px', justifyContent: 'center' }}
                      >
                        {(patient.status || 'active') === 'active' ? (
                          <><ShieldAlert size={14} /> Deactivate</>
                        ) : (
                          <><ShieldCheck size={14} /> Activate</>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(patient._id, patient.full_name)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Delete user permanently"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmConfig && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(12px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="glass-panel hud-panel animate-fade-in" style={{
            width: "100%",
            maxWidth: "420px",
            padding: "36px",
            borderRadius: "20px",
            borderTop: `3px solid ${confirmConfig.isDanger ? "var(--danger)" : "var(--success)"}`,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "center",
            textAlign: "center"
          }}>
            <div style={{
              padding: "16px",
              background: confirmConfig.isDanger ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
              borderRadius: "50%",
              color: confirmConfig.isDanger ? "var(--danger)" : "var(--success)",
              border: `1px solid ${confirmConfig.isDanger ? "rgba(244, 63, 94, 0.25)" : "rgba(16, 185, 129, 0.25)"}`
            }}>
              {confirmConfig.isDanger ? <ShieldAlert size={36} /> : <ShieldCheck size={36} />}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {confirmConfig.title}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: 0, lineHeight: 1.5 }}>
                {confirmConfig.message}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: "12px" }}
                onClick={() => setConfirmConfig(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={confirmConfig.isDanger ? "btn btn-danger" : "btn btn-primary"}
                style={{ flex: 1, padding: "12px" }}
                onClick={() => {
                  confirmConfig.onConfirm();
                  setConfirmConfig(null);
                }}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
