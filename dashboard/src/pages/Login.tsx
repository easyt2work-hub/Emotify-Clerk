import { useState } from "react";
import { useDashboardAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { Activity, Lock, Phone, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useDashboardAuth();
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    const res = await login(mobileNumber, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100vw",
      background: "radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.15), transparent), #0B0F19",
      color: "white",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "40px",
        borderRadius: "24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            padding: "16px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))",
            borderRadius: "16px",
            color: "var(--accent-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255, 255, 255, 0.05)"
          }}>
            <Activity size={32} color="#3B82F6" />
          </div>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: 700,
            background: "linear-gradient(to right, #ffffff, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0
          }}>EMOTIFY</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>Clinical Command Console</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Mobile Number</label>
            <div style={{ position: "relative" }}>
              <Phone size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type="text"
                placeholder="1234567890"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "14px 14px 14px 48px",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "14px 48px 14px 48px",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "10px",
              color: "#FCA5A5",
              fontSize: "0.875rem",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {loading ? "Authenticating..." : "Access Command Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
