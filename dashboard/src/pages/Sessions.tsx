import { useState, useMemo } from "react";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Calendar, Clock, User, X, FileText, CheckCircle, AlertTriangle, Trash2, Edit2, ShieldAlert, ShieldCheck, Search, Filter, Check, RotateCcw, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

type TabStatus = "pending" | "waiting" | "accepted" | "rejected" | "completed";

export default function Sessions() {
  // Queries & Mutations
  const { results: appointments, status: queryStatus, loadMore } = usePaginatedQuery(
    api.appointments.listAllTwoWayAppointmentsPaginated,
    {},
    { initialNumItems: 20 }
  );

  const patients = useQuery(api.users.listPatients, {});
  const createAppointment = useMutation(api.appointments.createAppointmentRequest);
  const updateStatus = useMutation(api.appointments.updateAppointmentStatus);
  const requestReschedule = useMutation(api.appointments.requestReschedule);
  const deleteAppointment = useMutation(api.appointments.deleteAppointment);

  // States
  const [activeTab, setActiveTab] = useState<TabStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data processing
  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(appt => {
      const matchesTab = appt.status === activeTab;
      const matchesSearch = 
        appt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        appt.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [appointments, activeTab, searchQuery]);

  // Utility to convert 24h to 12h
  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;
    if (hours > 12) hours -= 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
  };

  // Modal Handlers
  const openCreateModal = () => {
    setSelectedPatientId(""); setTitle(""); setDate(""); setTime(""); setReason("");
    setError(""); setSuccessMsg("");
    setShowCreateModal(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !title || !date || !time || !reason) {
      setError("Please complete all required fields.");
      return;
    }

    const patient = patients?.find(p => p._id === selectedPatientId);
    if (!patient) return;

    setError(""); setSuccessMsg(""); setLoading(true);

    try {
      await createAppointment({
        userId: selectedPatientId as Id<"users">,
        title,
        createdBy: "admin",
        patientName: patient.full_name,
        date,
        time: formatTime12Hour(time),
        reason,
      });
      setSuccessMsg("Appointment request sent successfully!");
      setTimeout(() => setShowCreateModal(false), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (appointmentId: Id<"appointments">) => {
    try {
      await updateStatus({ appointmentId, status: "accepted" });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason) {
      setError("Rejection reason is mandatory.");
      return;
    }
    setLoading(true);
    try {
      await updateStatus({
        appointmentId: selectedAppointment._id,
        status: "rejected",
        rejectionReason
      });
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTime || !rescheduleDate) {
      setError("Both time and date are required.");
      return;
    }
    setLoading(true);
    try {
      await requestReschedule({
        appointmentId: selectedAppointment._id,
        newTime: formatTime12Hour(rescheduleTime),
        newDate: rescheduleDate
      });
      setShowRescheduleModal(false);
      setRescheduleTime("");
      setRescheduleDate("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointmentId: Id<"appointments">) => {
    if (!window.confirm("Are you sure you want to delete this appointment request? This action cannot be undone.")) return;
    try {
      await deleteAppointment({ appointmentId });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete appointment.");
    }
  };

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "waiting", label: "Waiting" },
    { id: "accepted", label: "Accepted" },
    { id: "rejected", label: "Rejected" },
    { id: "completed", label: "Completed" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="badge badge-green">Accepted</span>;
      case 'pending': return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)' }}>Pending</span>;
      case 'waiting': return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Waiting</span>;
      case 'rejected': return <span className="badge badge-red">Rejected</span>;
      case 'completed': return <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', border: '1px solid rgba(168, 85, 247, 0.3)' }}>Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const renderCloseButton = (onClose: () => void) => (
    <button type="button" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
      <X size={20} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Appointments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage two-way handshake appointment requests and scheduling.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Calendar size={18} /> New Request
        </button>
      </div>

      <div className="glass-panel hud-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header & Tabs */}
        <div style={{ borderBottom: '1px solid var(--border-color)', background: '#ffffff' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', background: 'var(--surface-base)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabStatus)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? '#ffffff' : 'transparent',
                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search patient or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-base)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', minHeight: '400px' }}>
          {queryStatus === "LoadingFirstPage" ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)' }}>
                <Calendar size={36} />
              </div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>No {activeTab} Appointments</h2>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Title & Reason</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{appt.patientName}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{appt.title}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{appt.reason}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{appt.date}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {appt.time}
                        </span>
                        {appt.status === 'waiting' && appt.rescheduleDate && (
                          <span style={{ fontSize: '0.8rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic', marginTop: '2px' }}>
                            <RotateCcw size={10} /> New: {appt.rescheduleDate} at {appt.rescheduleTime}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(appt.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        
                        {/* Pending & user created -> Admin can accept/reject/reschedule */}
                        {appt.status === 'pending' && appt.createdBy === 'user' && (
                          <>
                            <button className="btn btn-secondary" onClick={() => handleAccept(appt._id)} style={{ color: 'var(--success)' }}>
                              <Check size={14} /> Accept
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setSelectedAppointment(appt); setRescheduleDate(appt.date ?? ""); setShowRescheduleModal(true); }}>
                              <RotateCcw size={14} /> Reschedule
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setSelectedAppointment(appt); setShowRejectModal(true); }} style={{ color: 'var(--danger)' }}>
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}

                        {/* Waiting & user rescheduled -> Admin can accept/reject */}
                        {appt.status === 'waiting' && appt.rescheduledBy === 'user' && (
                          <>
                            <button className="btn btn-secondary" onClick={() => handleAccept(appt._id)} style={{ color: 'var(--success)' }}>
                              <Check size={14} /> Accept New Time
                            </button>
                            <button className="btn btn-secondary" onClick={() => { setSelectedAppointment(appt); setShowRejectModal(true); }} style={{ color: 'var(--danger)' }}>
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}

                        {appt.status === 'waiting' && appt.rescheduledBy === 'admin' && (
                           <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Awaiting User</span>
                        )}

                        {appt.status === 'pending' && appt.createdBy === 'admin' && (
                           <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Awaiting User</span>
                        )}
                        
                        <button className="btn btn-secondary" onClick={() => handleDelete(appt._id)} style={{ color: 'var(--danger)', padding: '4px 8px' }} title="Delete Appointment">
                           <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {queryStatus === "CanLoadMore" && (
            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => loadMore(20)}>
                Load More <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && createPortal(
        <div className="modal-overlay" style={overlayStyle}>
          <div className="glass-panel hud-panel" style={modalStyle}>
            {renderCloseButton(() => setShowCreateModal(false))}
            <h2>Create Appointment Request</h2>
            <form onSubmit={handleCreateAppointment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="hud-input">
                <option value="">Select Patient...</option>
                {patients?.map(p => <option key={p._id} value={p._id}>{p.full_name}</option>)}
              </select>
              <input type="text" placeholder="Title (e.g. Weekly Check-in)" value={title} onChange={(e) => setTitle(e.target.value)} className="hud-input" />
              <div style={{ display: 'flex', gap: '16px' }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="hud-input" style={{ flex: 1 }} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="hud-input" style={{ flex: 1 }} />
              </div>
              <textarea placeholder="Reason / Description" value={reason} onChange={(e) => setReason(e.target.value)} className="hud-input" rows={3}></textarea>
              
              {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
              {successMsg && <div style={{ color: 'var(--success)' }}>{successMsg}</div>}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>Send Request</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* REJECT MODAL */}
      {showRejectModal && createPortal(
        <div className="modal-overlay" style={overlayStyle}>
          <div className="glass-panel hud-panel" style={modalStyle}>
            {renderCloseButton(() => setShowRejectModal(false))}
            <h2 style={{ color: 'var(--danger)' }}>Reject Appointment</h2>
            <form onSubmit={handleRejectSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <textarea placeholder="Reason for rejection (mandatory)" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="hud-input" rows={3}></textarea>
              {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="submit" className="btn btn-danger" disabled={loading}>Confirm Reject</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && createPortal(
        <div className="modal-overlay" style={overlayStyle}>
          <div className="glass-panel hud-panel" style={modalStyle}>
            {renderCloseButton(() => setShowRescheduleModal(false))}
            <h2>Reschedule Appointment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Must be on the same day ({selectedAppointment?.date})</p>
            <form onSubmit={handleRescheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="hud-input" />
              {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>Request Reschedule</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(12px)",
  zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
};

const modalStyle: React.CSSProperties = {
  position: "relative", width: "100%", maxWidth: "500px", padding: "36px", borderRadius: "20px",
  background: "var(--card-bg)", display: "flex", flexDirection: "column", gap: "24px"
};
