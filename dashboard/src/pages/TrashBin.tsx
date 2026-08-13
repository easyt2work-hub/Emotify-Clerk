import { Trash2, RotateCcw, ShieldAlert } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TrashBin() {
  const items = useQuery(api.dashboard.getTrashItems);
  const restore = useMutation(api.dashboard.restoreTrashItem);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          Soft-Delete Trash & Recovery Hub
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Recover deleted patient profiles, appointments, or clinical records before permanent deletion.
        </p>
      </div>

      <div className="glass-panel hud-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)", background: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <Trash2 size={20} color="var(--accent-primary)" />
            Soft-Deleted Records Queue
          </h2>
          <span className="hud-tag">RECOVERY CONSOLE</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="hud-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>
                <th style={{ padding: "16px 24px" }}>Item Type</th>
                <th style={{ padding: "16px 24px" }}>Item ID</th>
                <th style={{ padding: "16px 24px" }}>Deleted By</th>
                <th style={{ padding: "16px 24px" }}>Deletion Timestamp</th>
                <th style={{ padding: "16px 24px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items === undefined ? (
                <tr>
                  <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>Loading trash bin...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>Trash bin is empty. No deleted items found.</td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <span className="badge badge-orange">{item.itemType}</span>
                    </td>
                    <td style={{ padding: "16px 24px", fontFamily: "monospace", fontSize: "0.85rem" }}>{item.itemId}</td>
                    <td style={{ padding: "16px 24px", fontWeight: 600 }}>{item.deletedBy || "Admin"}</td>
                    <td style={{ padding: "16px 24px", fontSize: "0.85rem", color: "#475569" }}>
                      {new Date(item.deletedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button className="btn btn-secondary" style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }} onClick={() => restore({ trashId: item._id })}>
                        <RotateCcw size={14} /> Restore Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
