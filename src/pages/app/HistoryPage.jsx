import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { isToday } from "../../utils/utils.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

// â”€â”€â”€ Case Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CaseModal({ c, user, onClose, onDelete }) {
  const r = c?.raw_data || {};
  const sensors = (r.sensors || []).filter(s => s.val);
  const avgN    = sensors.length ? sensors.reduce((a, s) => a + (s.val || 0), 0) / sensors.length : null;
  const rateN   = parseFloat(r.rate);
  const rateColor = isNaN(rateN) ? "var(--text-muted)" : rateN > 0 ? "#ef4444" : rateN < 0 ? "#3b82f6" : "#22c55e";
  const isChem  = !!(r.nh3 || r.co2 || r.hum || r.press);
  const canDelete = user?.role === "admin" || !!user?.canDelete;

  function copySheet() {
    const rows = getSheetRows(c);
    if (!rows.length) { showToast("Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª", "error"); return; }
    navigator.clipboard.writeText(rows.map(r => r.join("\t")).join("\n"));
    showToast("ðŸ“‹ ØªÙ… Ù†Ø³Ø® Ø³Ø·Ø± Ø§Ù„Ø´ÙŠØª", "success");
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "560px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontWeight: "900", fontSize: "1.1rem", margin: 0 }}>ðŸ“‹ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø§Ù„Ø©</h2>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {c.date} â€” {c.shift || ""} â€” ðŸ‘¤ {c.by_user}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>âœ–</button>
        </div>

        {/* Condition Banner */}
        <div style={{
          padding: "10px 16px", borderRadius: "10px", marginBottom: "14px",
          background: rateN > 0 ? "rgba(239,68,68,.1)" : rateN < 0 ? "rgba(59,130,246,.1)" : "var(--bg-tertiary)",
          border: `1px solid ${rateColor}`, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontWeight: "800", color: rateColor, fontSize: ".95rem" }}>
              {r.condition || "â€”"} {r.special ? `(${r.special})` : ""}
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {c.time} â†’ {r.duration ? `Ù…Ø¯Ø©: ${r.duration}` : "Ù…Ø¯Ø© ØºÙŠØ± Ù…Ø³Ø¬Ù„Ø©"}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: rateColor, fontFamily: "monospace, Arial" }}>
              {!isNaN(rateN) ? `${rateN > 0 ? "+" : ""}${r.rate}Â°` : "â€”"}
            </div>
            {avgN !== null && <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>Ù…ØªÙˆØ³Ø·: {avgN.toFixed(2)}Â°</div>}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          {[
            ["ðŸ¡ Ø§Ù„Ù…Ø²Ø±Ø¹Ø©", c.farm],
            ["ðŸ  Ø§Ù„Ø­Ø¸ÙŠØ±Ø©", c.house],
            ["ðŸ” Ø§Ù„Ø¹Ù…Ø±", r.age ? `${r.age} ÙŠÙˆÙ…` : "â€”"],
            ["ðŸ­ Ø§Ù„Ù†ÙˆØ¹", r.f_type || "â€”"],
            ["ðŸŒ¡ï¸ Ø§Ù„Ø³ÙŠØª Ø¨ÙˆÙŠÙ†Øª", r.set_point ? `${r.set_point}Â°` : "â€”"],
            ["ðŸ“Š Ø§Ù„Ø´ÙØª", c.shift || "â€”"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "9px 12px" }}>
              <div style={{ fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700" }}>{k}</div>
              <div style={{ fontWeight: "800", marginTop: "2px", fontSize: ".9rem" }}>{v || "â€”"}</div>
            </div>
          ))}
        </div>

        {/* Sensors */}
        {sensors.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "5px" }}>Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø§Øª</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {sensors.map((s, i) => (
                <span key={i} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "7px", padding: "4px 12px", fontSize: ".82rem", fontWeight: "700", fontFamily: "monospace, Arial" }}>
                  T{i + 1}: {s.val}Â°
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chem values */}
        {isChem && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {[["NH3", r.nh3, "ppm", "#a855f7"], ["CO2", r.co2, "ppm", "#6366f1"], ["Ø±Ø·ÙˆØ¨Ø©", r.hum, "%", "#3b82f6"], ["Ø¶ØºØ·", r.press, "Pa", "#22c55e"]].filter(([, v]) => v).map(([k, v, u, color]) => (
              <span key={k} style={{ background: `${color}15`, border: `1px solid ${color}`, borderRadius: "7px", padding: "4px 12px", fontSize: ".82rem", fontWeight: "700", color }}>
                {k}: {v} {u}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "14px" }}>
          <button className="btn btn-sm"
            style={{ background: "#25D366", color: "#fff", justifyContent: "center", padding: "10px" }}
            onClick={() => { navigator.clipboard.writeText(buildArabicText(c)); showToast("ðŸ“± Ù†ÙØ³Ø® Ø¹Ø±Ø¨ÙŠ", "success"); }}>
            ðŸ“± ÙˆØ§ØªØ³Ø§Ø¨ Ø¹Ø±Ø¨ÙŠ
          </button>
          <button className="btn btn-sm"
            style={{ background: "#22c55e", color: "#fff", justifyContent: "center", padding: "10px" }}
            onClick={() => { navigator.clipboard.writeText(buildEnglishText(c)); showToast("ðŸ“± Copied EN", "success"); }}>
            ðŸ“± English
          </button>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center", padding: "10px" }} onClick={copySheet}>
            ðŸ“‹ Excel Row
          </button>
        </div>

        {/* Delete (if permitted) */}
        {canDelete && (
          <button className="btn btn-sm"
            style={{ marginTop: "10px", width: "100%", background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", justifyContent: "center", padding: "10px" }}
            onClick={() => { if (window.confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø§Ù„Ø©ØŸ")) onDelete(c); }}>
            ðŸ—‘ï¸ Ø­Ø°Ù Ø§Ù„Ø­Ø§Ù„Ø© {user?.role !== "admin" ? "(Ø³ÙŠÙØ±Ø³Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù„Ù…Ø¯ÙŠØ±)" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main HistoryPage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DATE_OPTS = ["Ø§Ù„ÙŠÙˆÙ…", "Ø£Ù…Ø³", "Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù…", "ÙƒÙ„ Ø§Ù„Ø£ÙŠØ§Ù…"];

export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);
  const [search,  setSearch]  = useState("");
  const [dateFilter, setDateFilter] = useState("Ø§Ù„ÙŠÙˆÙ…");

  useEffect(() => {
    loadData("history", []).then(d => { setHistory(d); setLoading(false); });
  }, []);

  // Filtering
  const now = Date.now() / 1000;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime() / 1000;
  const yesterdayTs = todayTs - 86400;
  const sevenDaysTs = now - 7 * 86400;

  const filtered = [...history].reverse().filter(h => {
    const ts = h.timestamp || 0;
    if (dateFilter === "Ø§Ù„ÙŠÙˆÙ…"      && ts < todayTs)                        return false;
    if (dateFilter === "Ø£Ù…Ø³"        && (ts < yesterdayTs || ts >= todayTs)) return false;
    if (dateFilter === "Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù…" && ts < sevenDaysTs)                   return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return h.farm?.toLowerCase().includes(q) || h.house?.includes(q) || h.by_user?.toLowerCase().includes(q) || h.raw_data?.condition?.includes(q);
    }
    return true;
  });

  async function handleDelete(c) {
    const isAdmin = user?.role === "admin";
    const idx = history.findIndex(h => h.timestamp === c.timestamp && h.farm === c.farm);
    if (idx === -1) return;

    // If employee: notify admin
    if (!isAdmin) {
      const notif = { type: "delete_request", by: user.username, case: c, timestamp: Date.now() / 1000, read: false };
      const notifs = await loadData("admin_notifications", []);
      await saveData("admin_notifications", [...notifs, notif]);
    }

    const updated = history.filter((_, i) => i !== idx);
    await saveData("history", updated);
    setHistory(updated);
    setDetail(null);
    showToast(isAdmin ? "ðŸ—‘ï¸ ØªÙ… Ø§Ù„Ø­Ø°Ù" : "ðŸ—‘ï¸ ØªÙ… Ø§Ù„Ø­Ø°Ù â€” Ø£ÙØ±Ø³Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù„Ù…Ø¯ÙŠØ±", "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: "900", fontSize: "1.05rem" }}>ðŸ“‹ Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠ</div>
          <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{filtered.length} Ø­Ø§Ù„Ø©</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <input className="form-input" placeholder="ðŸ” Ø¨Ø­Ø« Ø¨Ø§Ù„Ù…Ø²Ø±Ø¹Ø© Ø£Ùˆ Ø§Ù„Ø­Ø¸ÙŠØ±Ø©..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", background: "transparent", padding: 0, minWidth: "150px" }} />
        <div style={{ display: "flex", gap: "5px" }}>
          {DATE_OPTS.map(opt => (
            <button key={opt} className={`btn btn-sm ${dateFilter === opt ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDateFilter(opt)} style={{ padding: "5px 10px", fontSize: ".78rem" }}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div className="card table-card" style={{ margin: 0 }}>
          <div className="table-header-row" style={{ gridTemplateColumns: "90px 1fr 80px 60px 100px 80px" }}>
            <span>Ø§Ù„ÙˆÙ‚Øª</span><span>Ø§Ù„Ø­Ø§Ù„Ø© ÙˆØ§Ù„Ù…Ø¹Ø¯Ù„</span><span>Ø§Ù„Ù…Ø²Ø±Ø¹Ø©</span><span>Ø­Ø¸ÙŠØ±Ø©</span><span>Ø§Ù„Ù…ÙˆØ¸Ù</span><span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
          </div>

          {loading ? (
            <div className="empty-state"><span className="empty-state-icon">â³</span><div>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><span className="empty-state-icon">ðŸ“­</span><div className="empty-state-title">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§Ù„Ø§Øª{search && " ÙÙŠ Ø§Ù„Ø¨Ø­Ø«"}</div></div>
          ) : (
            filtered.map((c, i) => {
              const r = c.raw_data || {};
              const rateNum = parseFloat(r.rate);
              const rateColor = isNaN(rateNum) ? "var(--text-muted)" : rateNum > 0 ? "#ef4444" : rateNum < 0 ? "#3b82f6" : "#22c55e";
              return (
                <div key={i} className="table-row"
                  style={{ gridTemplateColumns: "90px 1fr 80px 60px 100px 80px", cursor: "pointer" }}
                  onClick={() => setDetail(c)}>
                  <span className="text-muted" style={{ fontSize: ".78rem" }}>{c.time || "â€”"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "800" }}>{r.condition || "â€”"}{r.special ? ` (${r.special})` : ""}</span>
                    {!isNaN(rateNum) && <span style={{ fontSize: ".72rem", color: rateColor, fontFamily: "monospace, Arial", fontWeight: "700" }}>({rateNum > 0 ? "+" : ""}{r.rate}Â°)</span>}
                  </div>
                  <span style={{ fontFamily: "monospace, Arial", fontWeight: "700" }}>{c.farm || "â€”"}</span>
                  <span style={{ fontFamily: "monospace, Arial" }}>{c.house || "â€”"}</span>
                  <span style={{ color: "var(--accent-blue)", fontSize: ".82rem" }}>{c.by_user || "â€”"}</span>
                  <span>{c.seen ? <span className="badge badge-green">âœ“ Ø±Ø§Ø¬Ø¹Øª</span> : <span className="badge badge-red">Ø¬Ø¯ÙŠØ¯Ø©</span>}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {detail && <CaseModal c={detail} user={user} onClose={() => setDetail(null)} onDelete={handleDelete} />}
    </div>
  );
}
