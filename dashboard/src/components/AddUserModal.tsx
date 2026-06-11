import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Phone, Lock, Eye, EyeOff, RefreshCw, CheckCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AddUserModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const createUser = useMutation(api.users.createUser);

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("Password@123");
  const [status, setStatus] = useState("active");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUserInfo, setCreatedUserInfo] = useState<{ fullName: string; mobile: string; email?: string; pass: string } | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim() || !tempPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // Basic mobile validation
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      setError("Mobile number must be a valid 10-digit number.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createUser({
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim() || undefined,
        password: tempPassword.trim(),
        status,
        role: "patient",
      });

      // Save info to show in success step
      setCreatedUserInfo({
        fullName: fullName.trim(),
        mobile: mobileNumber.trim(),
        email: email.trim() || undefined,
        pass: tempPassword.trim(),
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create user. Mobile number may already exist.");
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
        {createdUserInfo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", alignItems: "center" }}>
            <div style={{
              padding: "16px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "50%",
              color: "var(--success)"
            }}>
              <CheckCircle size={48} color="#10B981" />
            </div>
            <div>
              <h2 style={{ color: "white", margin: "0 0 8px 0" }}>User Created Successfully</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                Please share the login credentials below with the user.
              </p>
            </div>

            <div style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              textAlign: "left",
              boxSizing: "border-box"
            }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Full Name</span>
                <span style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{createdUserInfo.fullName}</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Mobile Number</span>
                <span style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{createdUserInfo.mobile}</span>
              </div>
              {createdUserInfo.email && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Email Address</span>
                  <span style={{ color: "white", fontWeight: 600, fontSize: "1rem" }}>{createdUserInfo.email}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block" }}>Temporary Password</span>
                <span style={{ color: "#E0E7FF", fontWeight: 600, fontSize: "1.1rem", fontFamily: "monospace", background: "rgba(99, 102, 241, 0.15)", padding: "4px 8px", borderRadius: "6px", display: "inline-block" }}>
                  {createdUserInfo.pass}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px" }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "white", margin: "0 0 4px 0" }}>Add New User</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  Initialize a new user profile with secure temporary access.
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
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Temporary Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    readOnly
                    value={tempPassword}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "12px 76px 12px 38px",
                      borderRadius: "10px",
                      color: "#A5B4FC",
                      fontSize: "0.95rem",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
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
                  {loading ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
