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
      background: "radial-gradient(circle at 50% 50%, #4c1d95 0%, #3b0764 100%)",
      color: "var(--text-primary)",
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
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            padding: "16px",
            background: "rgba(37, 99, 235, 0.08)",
            borderRadius: "16px",
            color: "var(--accent-primary)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(37, 99, 235, 0.15)"
          }}>
            <Activity size={32} color="var(--accent-primary)" />
          </div>
          <h1 style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            background: "linear-gradient(to right, var(--accent-primary), var(--accent-tertiary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
            letterSpacing: "-0.03em"
          }}>EMOTIFY</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>Clinical Command Console</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Mobile Number</label>
            <div className="input-with-icon">
              <Phone size={18} className="input-icon" />
              <input
                type="text"
                placeholder="1234567890"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "48px" }}
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
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "10px",
              color: "#b91c1c",
              fontSize: "0.875rem",
              fontWeight: 600,
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
              fontWeight: 650,
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
