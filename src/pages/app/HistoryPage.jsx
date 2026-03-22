import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

// ─── Case Detail Modal ────────────────────────────────────────────────────────
function CaseModal({ c, templates, onClose, onDelete }) {
  const r = c?.raw_data || {};
  const condColor = r.condition === "ارتفاع" ? "red" : r.condition === "انخفاض" ? "blue" : "inherit";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "550px", padding: "0" }}>
        <div style={{ padding: "15px 20px", background: "var(--bg-tertiary)", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
           <h3 className="font-bold">📋 تفاصيل الحالة المسجلة</h3>
           <button onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "20px" }}>
           <div className="grid grid-cols-2 gap-4 mb-6" style={{ background: "var(--bg-primary)", padding: "15px", borderRadius: "10px", borderRight: `5px solid ${condColor}` }}>
              <div><div className="text-xs text-muted">المزرعة والحظيرة</div><div className="font-bold">مزرعة {c.farm} / حظيرة {c.house}</div></div>
              <div><div className="text-xs text-muted">التاريخ والوقت</div><div className="font-bold">{c.date} | {c.time}</div></div>
              <div><div className="text-xs text-muted">نوع الحالة</div><div className="font-bold" style={{ color: condColor }}>{r.condition} ({r.rate}°)</div></div>
              <div><div className="text-xs text-muted">العمر</div><div className="font-bold">{r.age} {r.f_type==='مزرعة (تسمين)'?'يوم':'أسبوع'}</div></div>
              <div><div className="text-xs text-muted">السيت بوينت</div><div className="font-bold">{r.set_point}°</div></div>
              <div><div className="text-xs text-muted">وقت المعالجة</div><div className="font-bold">{r.duration}</div></div>
           </div>

           <div className="grid grid-cols-3 gap-2 mb-6">
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildArabicText(c, templates)); showToast("تم نسخ الكليشة العربية", "success"); }} style={{ fontSize: ".7rem" }}>📋 نسخ عربي</button>
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildEnglishText(c, templates)); showToast("Copied EN", "success"); }} style={{ fontSize: ".7rem" }}>📋 نسخ EN</button>
              <button className="btn btn-ghost" onClick={() => { 
                const rows = getSheetRows(c);
                navigator.clipboard.writeText(rows.map(r => r.join("\t")).join("\n"));
                showToast("تم نسخ الإكسل", "success");
              }} style={{ fontSize: ".7rem" }}>📊 نسخ Excel</button>
           </div>

           <div className="flex gap-2">
              <button className="btn btn-danger flex-1" onClick={() => window.confirm("حذف الحالة نهائياً؟") && onDelete(c)}>🗑️ حذف السجل</button>
              <button className="btn btn-ghost" onClick={onClose}>إغلاق</button>
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────
export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      loadData("history", []),
      loadData("templates_config", null)
    ]).then(([h, t]) => {
      setHistory(h);
      setTemplates(t);
      setLoading(false);
    });
  }, []);

  const filtered = [...history].reverse().filter(item => {
    if (item.by_user !== user.username) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.farm?.toLowerCase().includes(q) || item.house?.includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="page-header">
        <div>
          <div className="page-title">📜 سجلي الشخصي</div>
          <div className="page-subtitle">الحالات التي سجلتها ({filtered.length})</div>
        </div>
        <input className="form-input" style={{ width: "200px" }} placeholder="🔍 بحث في مزارعي..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="empty-state">⏳ جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">📭 لم تقم بتسجيل أي حالات حتى الآن</div>
        ) : (
          <div className="card table-card p-0 overflow-hidden">
             <div className="table-header-row" style={{ gridTemplateColumns: "140px 100px 90px 1fr 100px 80px 60px" }}>
                <span>التاريخ</span>
                <span>المزرعة</span>
                <span>الحظيرة</span>
                <span>نوع الحالة</span>
                <span>المعدل</span>
                <span>الحالة</span>
                <span>عرض</span>
             </div>
             {filtered.map((item, i) => {
               const r = item.raw_data || {};
               return (
                 <div key={i} className="table-row" onClick={() => setDetail(item)} style={{ gridTemplateColumns: "140px 100px 90px 1fr 100px 80px 60px" }}>
                    <span className="text-xs">{item.date} {item.time}</span>
                    <span className="font-bold">مزرعة {item.farm}</span>
                    <span>{item.house}</span>
                    <span style={{ color: r.condition==='ارتفاع'?'red':'blue', fontWeight: "700" }}>{r.condition}</span>
                    <span className="font-bold">{r.rate}°</span>
                    <span>{item.seen ? "✅" : "⏳"}</span>
                    <button className="btn btn-ghost btn-sm">👁️</button>
                 </div>
               );
             })}
          </div>
        )}
      </div>

      {detail && (
        <CaseModal 
          c={detail} 
          templates={templates} 
          onClose={() => setDetail(null)} 
          onDelete={async (target) => {
            const h = await loadData("history", []);
            const upd = h.filter(x => x.timestamp !== target.timestamp);
            await saveData("history", upd);
            setHistory(upd);
            setDetail(null);
            showToast("تم الحذف بنجاح", "info");
          }} 
        />
      )}
    </div>
  );
}
