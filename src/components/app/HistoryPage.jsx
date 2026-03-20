import { useState, useEffect } from "react";
import { loadData, saveData } from "../../core/firebase.js";
import { isToday } from "../../core/utils.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../core/conditions.js";
import { showToast } from "../shared/Toast.jsx";

// ─── Case Detail Modal ────────────────────────────────────────────────────────
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
    if (!rows.length) { showToast("لا بيانات", "error"); return; }
    navigator.clipboard.writeText(rows.map(r => r.join("\t")).join("\n"));
    showToast("📋 تم نسخ سطر الشيت", "success");
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "560px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontWeight: "900", fontSize: "1.1rem", margin: 0 }}>📋 تفاصيل الحالة</h2>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {c.date} — {c.shift || ""} — 👤 {c.by_user}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✖</button>
        </div>

        {/* Condition Banner */}
        <div style={{
          padding: "10px 16px", borderRadius: "10px", marginBottom: "14px",
          background: rateN > 0 ? "rgba(239,68,68,.1)" : rateN < 0 ? "rgba(59,130,246,.1)" : "var(--bg-tertiary)",
          border: `1px solid ${rateColor}`, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontWeight: "800", color: rateColor, fontSize: ".95rem" }}>
              {r.condition || "—"} {r.special ? `(${r.special})` : ""}
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {c.time} → {r.duration ? `مدة: ${r.duration}` : "مدة غير مسجلة"}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: rateColor, fontFamily: "monospace, Arial" }}>
              {!isNaN(rateN) ? `${rateN > 0 ? "+" : ""}${r.rate}°` : "—"}
            </div>
            {avgN !== null && <div style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>متوسط: {avgN.toFixed(2)}°</div>}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          {[
            ["🏡 المزرعة", c.farm],
            ["🏠 الحظيرة", c.house],
            ["🐔 العمر", r.age ? `${r.age} يوم` : "—"],
            ["🏭 النوع", r.f_type || "—"],
            ["🌡️ السيت بوينت", r.set_point ? `${r.set_point}°` : "—"],
            ["📊 الشفت", c.shift || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "9px 12px" }}>
              <div style={{ fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700" }}>{k}</div>
              <div style={{ fontWeight: "800", marginTop: "2px", fontSize: ".9rem" }}>{v || "—"}</div>
            </div>
          ))}
        </div>

        {/* Sensors */}
        {sensors.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "5px" }}>قراءات الحساسات</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {sensors.map((s, i) => (
                <span key={i} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "7px", padding: "4px 12px", fontSize: ".82rem", fontWeight: "700", fontFamily: "monospace, Arial" }}>
                  T{i + 1}: {s.val}°
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chem values */}
        {isChem && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {[["NH3", r.nh3, "ppm", "#a855f7"], ["CO2", r.co2, "ppm", "#6366f1"], ["رطوبة", r.hum, "%", "#3b82f6"], ["ضغط", r.press, "Pa", "#22c55e"]].filter(([, v]) => v).map(([k, v, u, color]) => (
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
            onClick={() => { navigator.clipboard.writeText(buildArabicText(c)); showToast("📱 نُسخ عربي", "success"); }}>
            📱 واتساب عربي
          </button>
          <button className="btn btn-sm"
            style={{ background: "#22c55e", color: "#fff", justifyContent: "center", padding: "10px" }}
            onClick={() => { navigator.clipboard.writeText(buildEnglishText(c)); showToast("📱 Copied EN", "success"); }}>
            📱 English
          </button>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center", padding: "10px" }} onClick={copySheet}>
            📋 Excel Row
          </button>
        </div>

        {/* Delete (if permitted) */}
        {canDelete && (
          <button className="btn btn-sm"
            style={{ marginTop: "10px", width: "100%", background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", justifyContent: "center", padding: "10px" }}
            onClick={() => { if (window.confirm("هل أنت متأكد من حذف هذه الحالة؟")) onDelete(c); }}>
            🗑️ حذف الحالة {user?.role !== "admin" ? "(سيُرسل إشعار للمدير)" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main HistoryPage ─────────────────────────────────────────────────────────
const DATE_OPTS = ["اليوم", "أمس", "آخر 7 أيام", "كل الأيام"];

export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState(null);
  const [search,  setSearch]  = useState("");
  const [dateFilter, setDateFilter] = useState("اليوم");

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
    if (dateFilter === "اليوم"      && ts < todayTs)                        return false;
    if (dateFilter === "أمس"        && (ts < yesterdayTs || ts >= todayTs)) return false;
    if (dateFilter === "آخر 7 أيام" && ts < sevenDaysTs)                   return false;
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
    showToast(isAdmin ? "🗑️ تم الحذف" : "🗑️ تم الحذف — أُرسل إشعار للمدير", "success");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "12px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: "900", fontSize: "1.05rem" }}>📋 السجل التاريخي</div>
          <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{filtered.length} حالة</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <input className="form-input" placeholder="🔍 بحث بالمزرعة أو الحظيرة..."
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
            <span>الوقت</span><span>الحالة والمعدل</span><span>المزرعة</span><span>حظيرة</span><span>الموظف</span><span>الحالة</span>
          </div>

          {loading ? (
            <div className="empty-state"><span className="empty-state-icon">⏳</span><div>جاري التحميل...</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><span className="empty-state-icon">📭</span><div className="empty-state-title">لا توجد حالات{search && " في البحث"}</div></div>
          ) : (
            filtered.map((c, i) => {
              const r = c.raw_data || {};
              const rateNum = parseFloat(r.rate);
              const rateColor = isNaN(rateNum) ? "var(--text-muted)" : rateNum > 0 ? "#ef4444" : rateNum < 0 ? "#3b82f6" : "#22c55e";
              return (
                <div key={i} className="table-row"
                  style={{ gridTemplateColumns: "90px 1fr 80px 60px 100px 80px", cursor: "pointer" }}
                  onClick={() => setDetail(c)}>
                  <span className="text-muted" style={{ fontSize: ".78rem" }}>{c.time || "—"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "800" }}>{r.condition || "—"}{r.special ? ` (${r.special})` : ""}</span>
                    {!isNaN(rateNum) && <span style={{ fontSize: ".72rem", color: rateColor, fontFamily: "monospace, Arial", fontWeight: "700" }}>({rateNum > 0 ? "+" : ""}{r.rate}°)</span>}
                  </div>
                  <span style={{ fontFamily: "monospace, Arial", fontWeight: "700" }}>{c.farm || "—"}</span>
                  <span style={{ fontFamily: "monospace, Arial" }}>{c.house || "—"}</span>
                  <span style={{ color: "var(--accent-blue)", fontSize: ".82rem" }}>{c.by_user || "—"}</span>
                  <span>{c.seen ? <span className="badge badge-green">✓ راجعت</span> : <span className="badge badge-red">جديدة</span>}</span>
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
