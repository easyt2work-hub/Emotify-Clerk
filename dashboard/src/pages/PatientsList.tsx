import { useState } from "react";
import { Users, UserPlus, Search, Edit2, ShieldAlert, ShieldCheck, BarChart2 } from "lucide-react";
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const handleToggleStatus = async (userId: any, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    if (confirm(`Are you sure you want to set this user to ${nextStatus.toUpperCase()}?`)) {
      try {
        await toggleStatus({ userId, status: nextStatus });
      } catch (err: any) {
        alert(err.message || "Failed to update status.");
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>User Directory</h1>
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

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '16px', padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search users by name or mobile number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px 12px 48px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
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
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Users size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'white', fontSize: '1.05rem', margin: 0 }}>{patient.full_name}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {patient._id}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px', color: '#CBD5E1' }}>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
