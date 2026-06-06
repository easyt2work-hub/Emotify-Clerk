import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Phone } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface UserType {
  _id: string;
  full_name: string;
  mobile_number: string;
  email?: string;
  status: string;
}

export default function EditUserModal({ user, onClose, onSuccess }: { user: UserType, onClose: () => void, onSuccess: () => void }) {
  const editUser = useMutation(api.users.editUser);

  const [fullName, setFullName] = useState(user.full_name);
  const [mobileNumber, setMobileNumber] = useState(user.mobile_number);
  const [email, setEmail] = useState(user.email || "");
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      setError("Mobile number must be a valid 10-digit number.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await editUser({
        userId: user._id as any,
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim() || undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(3, 8, 18, 0.75)",
      backdropFilter: "blur(12px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "500px",
        padding: "36px",
        borderRadius: "20px",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        background: "rgba(8, 18, 38, 0.98)",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "white", margin: "0 0 4px 0" }}>Edit User</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
              Update credentials and active status for the user profile.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%"
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "12px 12px 12px 38px",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Email Address (Optional)</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "12px 12px 12px 16px",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Mobile Number (Unique)</label>
            <div style={{ position: "relative" }}>
              <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="text"
                placeholder="10-digit number"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "12px 12px 12px 38px",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Status</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {["active", "inactive"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1px solid ${status === s ? "var(--accent-primary)" : "rgba(255,255,255,0.05)"}`,
                    background: status === s ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.02)",
                    color: status === s ? "white" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    textTransform: "capitalize"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              color: "#FCA5A5",
              fontSize: "0.85rem",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
