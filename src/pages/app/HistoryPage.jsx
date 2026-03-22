import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

// Helper for duration parsing
const getDurMins = (c) => {
  const r = c.raw_data || {};
  if (r.duration) {
    let m = 0;
    const hrs = r.duration.match(/(\d+)س/);
    const mins = r.duration.match(/(\d+)د|(\d+) دقيقة/);
    if (hrs) m += parseInt(hrs[1]) * 60;
    if (mins) m += parseInt(mins[1] || mins[2] || 0);
    return m;
  }
  if (r.start_h && r.end_h) {
    const sH = parseInt(r.start_h), sM = parseInt(r.start_m);
    const eH = parseInt(r.end_h), eM = parseInt(r.end_m);
    const startMins = (r.start_p === "PM" && sH !== 12 ? sH + 12 : r.start_p === "AM" && sH === 12 ? 0 : sH) * 60 + sM;
    const endMins = (r.end_p === "PM" && eH !== 12 ? eH + 12 : r.end_p === "AM" && eH === 12 ? 0 : eH) * 60 + eM;
    return endMins < startMins ? endMins + 1440 - startMins : endMins - startMins;
  }
  return 0;
};

// ─── Case Detail Modal ────────────────────────────────────────────────────────
function CaseModal({ c, user, onClose, onDelete }) {
  const r = c?.raw_data || {};
  const sensors = (r.sensors || []).filter(s => s.val);
  const avgN    = sensors.length ? sensors.reduce((a, s) => a + (s.val || 0), 0) / sensors.length : null;
  const rateN   = parseFloat(r.rate);
  const rateColor = isNaN(rateN) ? "var(--text-muted)" : rateN > 0 ? "#ef4444" : rateN < 0 ? "#3b82f6" : "#22c55e";
  const isChem  = !!(r.nh3 || r.co2 || r.hum || r.press);
  // User can delete their own cases in the History
  const canDelete = true;

  function copySheet() {
    const rows = getSheetRows(c);
    if (!rows.length) { showToast("لا بيانات", "error"); return; }
    navigator.clipboard.writeText(rows.map(r => r.join("\t")).join("\n"));
    showToast("📋 تم نسخ سطر الشيت", "success");
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "560px", padding: "16px", gap: "12px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontWeight: "900", fontSize: "1.05rem", margin: 0 }}>📋 تفاصيل الحالة</h2>
            <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {c.date} — {c.shift || ""} — 👤 {c.by_user}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "4px" }}>✖</button>
        </div>

        {/* Condition Banner */}
        <div style={{
          padding: "8px 12px", borderRadius: "8px",
          background: rateN > 0 ? "rgba(239,68,68,.08)" : rateN < 0 ? "rgba(59,130,246,.08)" : "var(--bg-tertiary)",
          border: `1px solid ${rateColor}`, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontWeight: "800", color: rateColor, fontSize: ".9rem" }}>
              {r.condition || "—"} {r.special ? `(${r.special})` : ""}
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px", fontWeight: "700" }}>
              {c.time} → {r.duration ? `مدة: ${r.duration}` : "مدة غير مسجلة"}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: rateColor, fontFamily: "monospace, Arial" }}>
              {!isNaN(rateN) ? `${rateN > 0 ? "+" : ""}${r.rate}°` : "—"}
            </div>
            {avgN !== null && <div style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>متوسط: {avgN.toFixed(2)}°</div>}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
          {[
            ["🏡 المزرعة", c.farm],
            ["🏠 الحظيرة", c.house],
            ["🐔 العمر", r.age ? `${r.age} يوم` : "—"],
            ["🏭 النوع", r.f_type || "—"],
            ["🌡️ التارگيت", r.set_point ? `${r.set_point}°` : "—"],
            ["📊 الشفت", c.shift || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "var(--bg-tertiary)", borderRadius: "6px", padding: "6px 10px" }}>
              <div style={{ fontSize: ".65rem", color: "var(--text-muted)", fontWeight: "700" }}>{k}</div>
              <div style={{ fontWeight: "800", marginTop: "1px", fontSize: ".85rem", fontFamily: "monospace, Arial" }}>{v || "—"}</div>
            </div>
          ))}
        </div>

        {/* Sensors */}
        {sensors.length > 0 && (
          <div>
            <div style={{ fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" }}>قراءات الحساسات</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {sensors.map((s, i) => (
                <span key={i} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px 10px", fontSize: ".78rem", fontWeight: "700", fontFamily: "monospace, Arial", color: "var(--text-primary)" }}>
                  T{i + 1}: {s.val}°
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chem values */}
        {isChem && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[["NH3", r.nh3, "ppm", "#a855f7"], ["CO2", r.co2, "ppm", "#6366f1"], ["رطوبة", r.hum, "%", "#3b82f6"], ["ضغط", r.press, "Pa", "#22c55e"]].filter(([, v]) => v).map(([k, v, u, color]) => (
              <span key={k} style={{ background: `${color}15`, border: `1px solid ${color}`, borderRadius: "6px", padding: "3px 10px", fontSize: ".78rem", fontWeight: "700", color, fontFamily: "monospace, Arial" }}>
                {k}: {v}
                <span style={{ fontSize: ".65rem", marginLeft: "2px", opacity: .8 }}>{u}</span>
              </span>
            ))}
          </div>
        )}

        {/* Additional Details instead of Copy Buttons */}
        <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "10px", marginTop: "4px", marginBottom: "8px" }}>
          <div style={{ fontSize: ".75rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px" }}>معلومات تفصيلية وتاريخية</div>
          <div style={{ fontSize: ".85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
             <div>موظف التسجيل: <span style={{ fontWeight: "800", color: "var(--accent-blue)" }}>{c.by_user}</span></div>
             <div>تاريخ الإنشاء: <span style={{ fontWeight: "800" }}>{new Date(c.timestamp * 1000).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })}</span></div>
             {r.special && <div style={{ color: "#f97316" }}>ملاحظة حالة: <span style={{ fontWeight: "800" }}>{r.special}</span></div>}
             {r.duration && <div>وقت المعالجة: <span style={{ fontWeight: "800", color: "#22c55e" }}>{r.duration}</span></div>}
          </div>
        </div>

        {/* Delete (if permitted) */}
        {canDelete && (
          <button className="btn btn-sm"
            style={{ marginTop: "4px", width: "100%", background: "rgba(239,68,68,.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", justifyContent: "center", padding: "8px", fontSize: ".85rem" }}
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
  const [fortyPlus, setFortyPlus] = useState(false); // New 40+ min filter

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
    // السجل مخصص فقط للحالات التي تم إنشاؤها من الحساب المفتوح حالياً
    if (h.by_user !== user.username) return false;

    const ts = h.timestamp || 0;
    if (dateFilter === "اليوم"      && ts < todayTs)                        return false;
    if (dateFilter === "أمس"        && (ts < yesterdayTs || ts >= todayTs)) return false;
    if (dateFilter === "آخر 7 أيام" && ts < sevenDaysTs)                   return false;
    
    if (fortyPlus && getDurMins(h) < 40) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return h.farm?.toLowerCase().includes(q) || h.house?.includes(q) || h.by_user?.toLowerCase().includes(q) || h.raw_data?.condition?.includes(q);
    }
    return true;
  });

  function copyAllToExcel() {
    let allRows = [];
    filtered.forEach(c => {
      const rows = getSheetRows(c);
      allRows.push(...rows);
    });
    if (!allRows.length) { showToast("⚠️ لا توجد بيانات لنسخها", "error"); return; }
    navigator.clipboard.writeText(allRows.map(r => r.join("\t")).join("\n"));
    showToast(`📋 تم نسخ ${allRows.length} اسطر شيت للـExcel`, "success");
  }

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
          <div style={{ fontWeight: "900", fontSize: "1.05rem" }}>📋 السجل التاريخي لحالاتي</div>
          <div style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{filtered.length} حالة مسجلة بـ {user.username}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <input className="form-input" placeholder="🔍 بحث بالمزرعة أو الحظيرة أو الحالة..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", background: "transparent", padding: 0, minWidth: "150px" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: "6px", borderLeft: "1px solid var(--border)", paddingLeft: "10px", marginLeft: "5px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {DATE_OPTS.map(opt => (
              <button key={opt} className={`btn btn-sm ${dateFilter === opt ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDateFilter(opt)} style={{ padding: "5px 10px", fontSize: ".78rem" }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 40+ min filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: fortyPlus ? "rgba(249,115,22,.15)" : "var(--bg-tertiary)", padding: "4px 10px", borderRadius: "100px", border: `1px solid ${fortyPlus ? "#f97316" : "var(--border)"}`, cursor: "pointer", transition: "all .2s" }}
             onClick={() => setFortyPlus(!fortyPlus)}>
          <input type="checkbox" checked={fortyPlus} onChange={()=>{}} style={{ cursor: "pointer", margin: 0 }} />
          <span style={{ fontSize: ".72rem", fontWeight: "700", color: fortyPlus ? "#f97316" : "var(--text-primary)" }}>فقط حالات الشيت (40+ دقيقة)</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div className="card table-card" style={{ margin: 0 }}>
          <div className="table-header-row" style={{ gridTemplateColumns: "70px 1.5fr 80px 100px 1fr 70px", position: "sticky", top: 0, zIndex: 10 }}>
            <span>الوقت</span><span>الحالة والمعدل</span><span>المزرعة</span><span>المدة المارّة</span><span>حالة التقييم</span><span>إجراءات</span>
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
                  style={{ gridTemplateColumns: "70px 1.5fr 80px 100px 1fr 70px", cursor: "pointer" }}
                  onClick={() => setDetail(c)}>
                  <span className="text-muted text-sm" style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: ".60rem" }}>{c.date || "-"}</span>
                    <span style={{ fontSize: ".72rem", fontWeight: "800", color: "var(--text-primary)" }}>{c.time || "-"}</span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "800", color: rateColor, fontSize: ".8rem" }}>{r.condition || "—"}{r.special ? ` (${r.special})` : ""}</span>
                    {!isNaN(rateNum) && <span style={{ fontSize: ".8rem", color: rateColor, fontFamily: "monospace, Arial", fontWeight: "900" }}>({rateNum > 0 ? "+" : ""}{r.rate}°)</span>}
                  </div>
                  <span style={{ fontFamily: "monospace, Arial", fontWeight: "900", fontSize: "1.05rem" }}>{c.farm || "—"}</span>
                  <span style={{ fontSize: ".7rem", color: "#f97316", fontWeight: "800" }}>{r.duration || "—"}</span>
                  <span>
                    {c.status === "rejected" ? <span className="badge badge-red" style={{ fontSize: ".7rem", padding: "3px 8px" }}>مرفوضة</span> : c.seen ? <span className="badge badge-green" style={{ fontSize: ".7rem", padding: "3px 8px" }}>✓ راجعها المدير</span> : <span className="badge badge-orange" style={{ fontSize: ".7rem", padding: "3px 8px" }}>بانتظار المدير</span>}
                  </span>
                  <button className="btn btn-sm btn-ghost" 
                    style={{ fontSize: ".75rem", padding: "4px 8px", color: "#ef4444", borderColor: "rgba(239,68,68,.3)" }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(c); }}>
                    🗑️ حذف
                  </button>
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
