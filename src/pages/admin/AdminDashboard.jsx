import { useState, useEffect, useMemo } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { showToast } from "../../components/ui/Toast.jsx";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";

// Helper for duration to minutes to parse duration text if needed
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
  // Fallback calculate
  if (r.start_h && r.end_h) {
    const sH = parseInt(r.start_h), sM = parseInt(r.start_m);
    const eH = parseInt(r.end_h), eM = parseInt(r.end_m);
    const startMins = (r.start_p === "PM" && sH !== 12 ? sH + 12 : r.start_p === "AM" && sH === 12 ? 0 : sH) * 60 + sM;
    const endMins = (r.end_p === "PM" && eH !== 12 ? eH + 12 : r.end_p === "AM" && eH === 12 ? 0 : eH) * 60 + eM;
    return endMins < startMins ? endMins + 1440 - startMins : endMins - startMins;
  }
  return 0;
};

// ─── Admin Case Detail Modal ────────────────────────────────────────────────────────
function AdminCaseModal({ c, onClose, onMarkSeen, onReject, onDelete }) {
  const r = c?.raw_data || {};
  const sensors = (r.sensors || []).filter(s => s.val);
  const avgN    = sensors.length ? sensors.reduce((a, s) => a + (s.val || 0), 0) / sensors.length : null;
  const rateN   = parseFloat(r.rate);
  const rateColor = isNaN(rateN) ? "var(--text-muted)" : rateN > 0 ? "#ef4444" : rateN < 0 ? "#3b82f6" : "#22c55e";
  const isChem  = !!(r.nh3 || r.co2 || r.hum || r.press);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "560px", padding: "16px", gap: "12px", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontWeight: "900", fontSize: "1.05rem", margin: 0 }}>📋 تفاصيل الحالة (إدارة)</h2>
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

        {/* C && Sensors */}
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
        <div style={{ background: "var(--bg-tertiary)", borderRadius: "8px", padding: "10px", marginBottom: "16px" }}>
          <div style={{ fontSize: ".75rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px" }}>معلومات تفصيلية وتاريخية</div>
          <div style={{ fontSize: ".85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
             <div>موظف التسجيل: <span style={{ fontWeight: "800", color: "var(--accent-blue)" }}>{c.by_user}</span></div>
             <div>تاريخ الإنشاء: <span style={{ fontWeight: "800" }}>{new Date(c.timestamp * 1000).toLocaleString("ar-IQ")}</span></div>
             {r.special && <div style={{ color: "#f97316" }}>ملاحظة حالة: <span style={{ fontWeight: "800" }}>{r.special}</span></div>}
             {r.duration && <div>الوقت المستغرق للمعالجة: <span style={{ fontWeight: "800", color: "#22c55e" }}>{r.duration}</span></div>}
          </div>
        </div>

        {/* Manager Actions */}
        <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "12px", marginTop: "4px" }}>
          <div style={{ fontSize: ".75rem", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px" }}>🛠️ صلاحيات الإدارة</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {!c.seen && c.status !== "rejected" ? (
               <button className="btn btn-success" onClick={() => onMarkSeen(c)} style={{ justifyContent: "center", padding: "8px", fontSize: ".85rem" }}>
                 ✓ اعتماد / تمت الرؤية
               </button>
            ) : (
               <button className="btn" disabled style={{ justifyContent: "center", background: "var(--bg-tertiary)", color: "var(--text-muted)", padding: "8px", fontSize: ".85rem", opacity: .7 }}>
                 {c.status === "rejected" ? "❌ الحالة مرفوضة" : "✓ حالة مقيمة ومعتمدة"}
               </button>
            )}

            {c.status !== "rejected" && (
              <button className="btn" 
                style={{ background: "rgba(249,115,22,.12)", color: "#f97316", border: "1px solid rgba(249,115,22,.3)", justifyContent: "center", padding: "8px", fontSize: ".85rem" }}
                onClick={() => onReject(c)}>
                ❌ رفض (إنذار)
              </button>
            )}
          </div>

          <button className="btn btn-danger" 
            style={{ width: "100%", marginTop: "6px", justifyContent: "center", padding: "8px", fontSize: ".85rem", background: "rgba(239,68,68,.1)", color: "#ef4444" }}
            onClick={() => onDelete(c)}>
            🗑️ كتم وحذف نهائي
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ─────────────────────────────────────────────────────────

const DATE_OPTS = ["اليوم", "أمس", "آخر 7 أيام", "كل الأيام"];

export default function AdminDashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [users,   setUsers]   = useState({});
  const [detail,  setDetail]  = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState("اليوم");
  const [shiftFilter, setShiftFilter] = useState("الكل");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [fortyPlus, setFortyPlus] = useState(false); // New 40+ min filter
  const [sortBy, setSortBy] = useState("time"); // "time", "farm", "status", "condition", "house"

  useEffect(() => {
    loadData("history", []).then(setHistory);
    loadData("users",   {}).then(setUsers);
  }, []);

  async function markSeen(c) {
    const updated = history.map(h => 
      (h.timestamp === c.timestamp && h.farm === c.farm) ? { ...h, seen: true, status: "approved" } : h
    );
    await saveData("history", updated);
    setHistory(updated);
    if (detail?.timestamp === c.timestamp) setDetail({ ...c, seen: true, status: "approved" });
    showToast("تم اعتماد الحالة", "success");
  }

  async function rejectCase(c) {
    if (!window.confirm("هل أنت متأكد من رفض هذه الحالة؟")) return;
    
    // Add rejection notification for user
    const userNotifsKey = `notifications_${c.by_user}`;
    const userNotifs = await loadData(userNotifsKey, []);
    await saveData(userNotifsKey, [
      ...userNotifs, 
      { 
        id: Date.now(),
        type: "rejection", 
        farm: c.farm, 
        house: c.house, 
        time: c.time, 
        date: c.date,
        message: "تم رفض الحالة المحولة من قبل المدير",
        timestamp: Date.now()/1000,
        read: false
      }
    ]);

    const updated = history.map(h => 
      (h.timestamp === c.timestamp && h.farm === c.farm) ? { ...h, status: "rejected", seen: true } : h
    );
    await saveData("history", updated);
    setHistory(updated);
    if (detail?.timestamp === c.timestamp) setDetail({ ...c, status: "rejected", seen: true });
    showToast("تم رفض الحالة وإرسال إشعار للموظف", "success");
  }

  async function deleteCase(c) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الحالة نهائياً؟")) return;
    const updated = history.filter(h => !(h.timestamp === c.timestamp && h.farm === c.farm));
    await saveData("history", updated);
    setHistory(updated);
    setDetail(null);
    showToast("تم الحذف بنجاح", "success");
  }

  // Helper for toggle sort
  const toggleSort = (s) => setSortBy(prev => prev === s ? "time" : s);

  // Filtering Logic
  const filteredCases = useMemo(() => {
    const nowTs = Date.now() / 1000;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime() / 1000;
    const yesterdayTs = todayTs - 86400;
    const sevenDaysTs = nowTs - 7 * 86400;

    let res = [...history];

    res = res.filter(h => {
      const ts = h.timestamp || 0;
      if (dateFilter === "اليوم"      && ts < todayTs)                        return false;
      if (dateFilter === "أمس"        && (ts < yesterdayTs || ts >= todayTs)) return false;
      if (dateFilter === "آخر 7 أيام" && ts < sevenDaysTs)                   return false;
      
      if (shiftFilter !== "الكل" && h.shift !== shiftFilter) return false;
      
      if (typeFilter !== "الكل") {
        const isChem = !!(h.raw_data?.nh3 || h.raw_data?.co2 || h.raw_data?.hum || h.raw_data?.press);
        if (typeFilter === "حرارية" && isChem) return false;
        if (typeFilter === "كيميائية" && !isChem) return false;
      }

      // Filter: only >= 40 minutes duration
      if (fortyPlus && getDurMins(h) < 40) return false;

      return true;
    });

    res.sort((a, b) => {
      if (sortBy === "farm") return (a.farm || "").localeCompare(b.farm || "", undefined, { numeric: true });
      if (sortBy === "house") return (a.house || "").localeCompare(b.house || "", undefined, { numeric: true });
      if (sortBy === "condition") return (a.raw_data?.condition || "").localeCompare(b.raw_data?.condition || "");
      if (sortBy === "status") {
        const sA = a.status === "rejected" ? -1 : a.seen ? 1 : 0;
        const sB = b.status === "rejected" ? -1 : b.seen ? 1 : 0;
        return sA - sB;
      }
      return (b.timestamp || 0) - (a.timestamp || 0); // time (default)
    });

    return res;
  }, [history, dateFilter, shiftFilter, typeFilter, fortyPlus, sortBy]);

  function copyAllToExcel() {
    let allRows = [];
    filteredCases.forEach(c => {
      const rows = getSheetRows(c);
      allRows.push(...rows);
    });
    if (!allRows.length) { showToast("⚠️ لا توجد بيانات لنسخها", "error"); return; }
    navigator.clipboard.writeText(allRows.map(r => r.join("\t")).join("\n"));
    showToast(`📋 تم نسخ ${allRows.length} اسطر شيت للـExcel`, "success");
  }

  const seenCases   = filteredCases.filter(h => h.seen);
  const unseenCases = filteredCases.filter(h => !h.seen);
  const userCount   = Object.keys(users).filter(k => users[k].role !== "admin").length;

  const CARDS = [
    { label: "الحالات المدرجة", value: filteredCases.length, icon: "📈", color: "#22c55e" },
    { label: "بانتظار التقييم", value: unseenCases.length,   icon: "🔴", color: "#ef4444" },
    { label: "تم تقييمها",      value: seenCases.length,     icon: "✅", color: "#3b82f6" },
    { label: "الموظفين",        value: userCount,            icon: "👥", color: "#a855f7" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <div>
          <div className="page-title">📊 نظرة عامة (لوحة المدير)</div>
          <div className="page-subtitle">مرحباً، {user.name || user.username}</div>
        </div>
        <button className="btn btn-sm" style={{ background: "transparent", color: "#6366f1", border: "1px dashed #6366f1", fontWeight: "800" }} onClick={copyAllToExcel}>
          📋 استخراج الحالات المفلترة كشيت (Excel)
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards" style={{ marginBottom: "16px" }}>
        {CARDS.map(c => (
          <div key={c.label} className="stat-card" style={{ background: c.color, padding: "14px" }}>
            <span className="stat-card-icon" style={{ fontSize: "1.4rem" }}>{c.icon}</span>
            <div className="stat-card-value" style={{ fontSize: "1.8rem" }}>{c.value}</div>
            <div className="stat-card-label" style={{ fontSize: ".75rem" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        
        {/* Date Filter */}
        <div style={{ display: "flex", gap: "5px", borderLeft: "1px solid var(--border)", paddingLeft: "10px", marginLeft: "5px" }}>
          {DATE_OPTS.map(opt => (
            <button key={opt} className={`btn btn-sm ${dateFilter === opt ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDateFilter(opt)} style={{ padding: "5px 10px", fontSize: ".78rem" }}>
              {opt}
            </button>
          ))}
        </div>

        {/* Shift Filter */}
        <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: ".8rem", height: "30px" }}
          value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
          <option value="الكل">كل الشفتات</option>
          <option value="A">شفت A</option>
          <option value="B">شفت B</option>
          <option value="C">شفت C</option>
          <option value="D">شفت D</option>
        </select>

        {/* Type Filter */}
        <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: ".8rem", height: "30px" }}
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="الكل">كل الأنواع</option>
          <option value="حرارية">حرارية فقط</option>
          <option value="كيميائية">كيميائية فقط</option>
        </select>

        {/* 40+ min filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", background: fortyPlus ? "rgba(249,115,22,.15)" : "var(--bg-tertiary)", padding: "4px 10px", borderRadius: "100px", border: `1px solid ${fortyPlus ? "#f97316" : "var(--border)"}`, cursor: "pointer", transition: "all .2s" }}
             onClick={() => setFortyPlus(!fortyPlus)}>
          <input type="checkbox" checked={fortyPlus} onChange={()=>{}} style={{ cursor: "pointer", margin: 0 }} />
          <span style={{ fontSize: ".72rem", fontWeight: "700", color: fortyPlus ? "#f97316" : "var(--text-primary)" }}>فقط حالات الشيت (40+ دقيقة)</span>
        </div>

      </div>

      {/* Cases Table */}
      <div className="card table-card" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 0 }}>
        
        {/* Table Header (Clickable for sort) */}
        <div className="table-header-row" style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1.5fr 1.5fr", position: "sticky", top: 0, zIndex: 10 }}>
          <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("time")} title="فرز بالوقت">
            الوقت {sortBy === "time" ? "⬇" : "⇅"}
          </span>
          <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("condition")} title="فرز بالحالة">
            نوع الحالة {sortBy === "condition" ? "⬇" : "⇅"}
          </span>
          <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("farm")} title="فرز برقم المزرعة">
            رقم المزرعة {sortBy === "farm" ? "⬇" : "⇅"}
          </span>
          <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("house")} title="فرز بالحظيرة">
            الحظيرة {sortBy === "house" ? "⬇" : "⇅"}
          </span>
          <span>الموظف</span>
          <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("status")} title="فرز بحالة الاعتماد">
            حالة الإجراء {sortBy === "status" ? "⬇" : "⇅"}
          </span>
        </div>

        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <div className="empty-state-title">لا توجد حالات متطابقة مع التصفية</div>
          </div>
        ) : (
          filteredCases.map((c, i) => (
            <div
              key={i}
              className={`table-row ${c.seen ? "seen" : "unseen"}`}
              style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1.5fr 1.5fr", cursor: "pointer" }}
              onClick={() => setDetail(c)}
            >
              <span className="text-muted text-sm" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: ".65rem" }}>{c.date || "-"}</span>
                <span style={{ fontSize: ".72rem", fontWeight: "800", color: "var(--text-primary)" }}>{c.time || "-"}</span>
                <span style={{ fontSize: ".6rem", color: "#f97316", fontWeight: "800" }}>{c.raw_data?.duration||""}</span>
              </span>
              <span className="font-bold" style={{ color: c.raw_data?.condition === "ارتفاع" ? "#ef4444" : c.raw_data?.condition === "انخفاض" ? "#3b82f6" : "#22c55e", fontSize: ".8rem" }}>
                {c.raw_data?.condition || "-"} {c.raw_data?.special ? `(${c.raw_data.special})` : ""}
              </span>
              <span style={{ fontFamily: "monospace, Arial", fontWeight: "900", fontSize: "1.05rem" }}>{c.farm || "-"}</span>
              <span style={{ fontFamily: "monospace, Arial", fontWeight: "800", fontSize: ".9rem" }}>{c.house || "-"}</span>
              <span className="text-blue font-bold text-sm">{c.by_user || "-"}</span>
              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {c.status === "rejected" ? (
                  <span className="badge badge-red" style={{ fontSize: ".7rem", padding: "3px 8px" }}>❌ مرفوضة</span>
                ) : c.seen ? (
                  <span className="badge badge-green" style={{ fontSize: ".7rem", padding: "3px 8px" }}>✓ معتمدة</span>
                ) : (
                  <span className="badge badge-orange" style={{ fontSize: ".7rem", padding: "3px 8px" }}>🔴 جديدة</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {detail && <AdminCaseModal c={detail} onClose={() => setDetail(null)} onMarkSeen={markSeen} onReject={rejectCase} onDelete={deleteCase} />}
    </div>
  );
}
