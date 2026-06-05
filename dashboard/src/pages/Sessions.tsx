import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Calendar, Clock, User, X, FileText, CheckCircle, AlertTriangle, Trash2, Edit2, ShieldAlert, ShieldCheck } from "lucide-react";
import { createPortal } from "react-dom";

export default function Sessions() {
  // Queries & Mutations
  const appointments = useQuery(api.appointments.listAllAppointments);
  const patients = useQuery(api.users.listPatients, {});
  const scheduleSession = useMutation(api.appointments.createAppointment);
  const cancelSession = useMutation(api.appointments.cancelAppointment);
  const updateSession = useMutation(api.appointments.updateAppointment);

  // States
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Timestamp formatting and parsing utilities
  const getLocalDateString = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    setSelectedPatientId("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const openEditModal = (appt: any) => {
    setEditingAppointment(appt);
    setSelectedPatientId(appt.userId);
    setDate(getLocalDateString(appt.startTime));
    setStartTime(getLocalTimeString(appt.startTime));
    setEndTime(getLocalTimeString(appt.endTime));
    setDescription(appt.description || "");
    setError("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !date || !startTime || !endTime) {
      setError("Please complete all required fields.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const startTimestamp = new Date(`${date}T${startTime}`).getTime();
      const endTimestamp = new Date(`${date}T${endTime}`).getTime();

      if (startTimestamp >= endTimestamp) {
        throw new Error("Invalid time: Start time must be before end time.");
      }

      if (editingAppointment) {
        // Edit Mode
        await updateSession({
          appointmentId: editingAppointment._id,
          userId: selectedPatientId as Id<"users">,
          startTime: startTimestamp,
          endTime: endTimestamp,
          description: description.trim() || undefined,
        });
        setSuccessMsg("Session updated successfully!");
      } else {
        // Create Mode
        await scheduleSession({
          userId: selectedPatientId as Id<"users">,
          startTime: startTimestamp,
          endTime: endTimestamp,
          description: description.trim() || undefined,
        });
        setSuccessMsg("Session scheduled successfully!");
      }

      // Reset form
      setSelectedPatientId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setDescription("");
      setEditingAppointment(null);
      
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg("");
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Failed to save session.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (appointmentId: any, patientName: string) => {
    setConfirmConfig({
      title: "Cancel Scheduled Session?",
      message: `Are you sure you want to cancel the upcoming clinical appointment review slot for ${patientName}?`,
      confirmText: "Cancel Appointment",
      isDanger: true,
      onConfirm: async () => {
        try {
          await cancelSession({ appointmentId });
        } catch (err: any) {
          setError(err.message || "Failed to cancel session.");
        }
      }
    });
  };

  const setDatePreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDate(d.toISOString().split('T')[0]);
  };

  const setTimePreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Sessions & Calendar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage clinical reviews, calendar timelines, and double-booking slot validation.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Calendar size={18} /> Schedule Session
        </button>
      </div>

      <div className="glass-panel hud-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Clock size={20} color="var(--accent-primary)"/>
             Upcoming Session Slots
          </h2>
          <span className="hud-tag">TELEMETRY CALENDAR</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {appointments === undefined ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sessions...</div>
          ) : appointments.length === 0 ? (
            <div style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={36} />
              </div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>No Scheduled Sessions</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No clinical reviews exist in the system database.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Mobile Number</th>
                  <th>Date & Time Slot</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const dateStr = new Date(appt.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  const startStr = new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endStr = new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={appt._id} style={{ opacity: appt.status === 'cancelled' ? 0.5 : 1 }}>
                      <td style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{appt.patientName}</td>
                      <td>
                        <span style={{ fontFamily: 'Outfit, monospace', background: 'var(--surface-base)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                          {appt.patientPhone}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dateStr}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {startStr} - {endStr}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appt.description || "-"}
                      </td>
                      <td>
                        <span className={`badge ${appt.status === 'scheduled' ? 'badge-green' : 'badge-red'}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {appt.status === 'scheduled' && (
                            <>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => openEditModal(appt)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--accent-primary)', borderColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleCancelSession(appt._id, appt.patientName)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Trash2 size={14} /> Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule / Edit Session Dialog modal portal */}
      {showModal && createPortal(
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
          <div className="glass-panel hud-panel" style={{
            width: "100%",
            maxWidth: "500px",
            padding: "36px",
            borderRadius: "20px",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            background: "var(--card-bg)",
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                  {editingAppointment ? "Edit Scheduled Session" : "Schedule New Session"}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  {editingAppointment ? "Modify the clinical appointment review parameters." : "Assign a clinical appointment review slot to a patient."}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Select Patient */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Select Patient</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", color: "var(--text-secondary)", pointerEvents: "none" }} />
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "12px 12px 12px 38px",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      outline: "none",
                      appearance: "none",
                      boxSizing: "border-box"
                    }}
                    disabled={!!editingAppointment} // lock user choice during edit
                  >
                    <option value="" style={{ background: "#ffffff", color: "var(--text-secondary)" }}>Choose patient...</option>
                    {patients?.map((patient) => (
                      <option key={patient._id} value={patient._id} style={{ background: "#ffffff", color: "var(--text-primary)" }}>
                        {patient.full_name} ({patient.mobile_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Date & Presets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Date</label>
                <div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="hud-input"
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      className={`preset-btn ${date === new Date().toISOString().split('T')[0] ? 'active' : ''}`} 
                      onClick={() => setDatePreset(0)}
                    >
                      Today
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'active' : ''}`} 
                      onClick={() => setDatePreset(1)}
                    >
                      Tomorrow
                    </button>
                    <button 
                      type="button" 
                      className={`preset-btn ${date === new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] ? 'active' : ''}`} 
                      onClick={() => setDatePreset(3)}
                    >
                      In 3 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Slots & Presets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="hud-input"
                    />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="hud-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    className={`preset-btn ${startTime === "09:00" && endTime === "10:00" ? 'active' : ''}`} 
                    onClick={() => setTimePreset("09:00", "10:00")}
                  >
                    09:00 AM
                  </button>
                  <button 
                    type="button" 
                    className={`preset-btn ${startTime === "11:00" && endTime === "12:00" ? 'active' : ''}`} 
                    onClick={() => setTimePreset("11:00", "12:00")}
                  >
                    11:00 AM
                  </button>
                  <button 
                    type="button" 
                    className={`preset-btn ${startTime === "14:00" && endTime === "15:00" ? 'active' : ''}`} 
                    onClick={() => setTimePreset("14:00", "15:00")}
                  >
                    02:00 PM
                  </button>
                  <button 
                    type="button" 
                    className={`preset-btn ${startTime === "16:00" && endTime === "17:00" ? 'active' : ''}`} 
                    onClick={() => setTimePreset("16:00", "17:00")}
                  >
                    04:00 PM
                  </button>
                </div>
              </div>

              {/* Description / Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Session Notes (Optional)</label>
                <div style={{ position: "relative" }}>
                  <FileText size={16} style={{ position: "absolute", left: "12px", top: "16px", color: "var(--text-secondary)", pointerEvents: "none" }} />
                  <textarea
                    placeholder="E.g., Monthly psychiatric review, follow-up screening discussion..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "12px 12px 12px 38px",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
              </div>

              {/* Error Warning */}
              {error && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  borderRadius: "8px",
                  color: "#FCA5A5",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Notification */}
              {successMsg && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "8px",
                  color: "#A7F3D0",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <CheckCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ padding: "10px 24px" }}
                >
                  {loading ? "Saving..." : (editingAppointment ? "Save Changes" : "Schedule Slot")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Dialog Modal portal */}
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
