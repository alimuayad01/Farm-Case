import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

// ─── Case Detail Modal ────────────────────────────────────────────────────────
function CaseModal({ c, templates, onClose, onDelete, onUpdate, excelMapping }) {
  const [reason, setReason] = useState(c.raw_data?.reason || "");
  const [farm, setFarm] = useState(c.farm || "");
  const [house, setHouse] = useState(c.house || "");
  const [age, setAge] = useState(c.raw_data?.age || "");
  const [savingReason, setSavingReason] = useState(false);
  const r = c?.raw_data || {};
  const condColor = r.condition === "ارتفاع" ? "#ef4444" : r.condition === "انخفاض" ? "#3b82f6" : "var(--text-primary)";

  const handleSave = async () => {
    setSavingReason(true);
    const updatedCase = { 
      ...c, 
      farm: farm.trim(), 
      house: house.trim(), 
      raw_data: { 
        ...r, 
        age: parseInt(age) || 0,
        reason 
      } 
    };
    await onUpdate(updatedCase);
    setSavingReason(false);
    showToast("✅ تم حفظ التعديلات بنجاح", "success");
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "650px", width: "95%", padding: "0", background: "var(--bg-secondary)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "15px 20px", background: "var(--bg-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
           <h3 className="font-bold text-lg m-0">📋 تفاصيل الحالة المسجلة</h3>
           <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--text-muted)", padding: "0 5px", lineHeight: 1 }}>✕</button>
        </div>
        
        <div style={{ padding: "20px", maxHeight: "80vh", overflowY: "auto" }}>
           {/* Grid Info */}
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: "var(--bg-tertiary)", borderRight: `5px solid ${condColor}` }}>
              <div className="flex flex-col gap-1">
                 <div className="text-xs text-muted">المزرعة والحظيرة</div>
                 <div className="flex gap-1 items-center font-bold text-sm">
                    مزرعة <input value={farm} onChange={e=>setFarm(e.target.value)} className="w-12 p-0.5 text-center border rounded bg-primary text-primary outline-none focus:border-accent-blue" />
                    / حظيرة <input value={house} onChange={e=>setHouse(e.target.value)} className="w-12 p-0.5 text-center border rounded bg-primary text-primary outline-none focus:border-accent-blue" />
                 </div>
              </div>
              <div><div className="text-xs text-muted mb-1">التاريخ والوقت</div><div className="font-bold text-sm">{c.date} | {c.time}</div></div>
              <div><div className="text-xs text-muted mb-1">نوع الحالة</div><div className="font-bold text-sm" style={{ color: condColor }}>{r.condition} <span className="opacity-70 text-xs">({r.rate}°)</span></div></div>
              <div className="flex flex-col gap-1">
                 <div className="text-xs text-muted">العمر</div>
                 <div className="flex gap-1 items-center font-bold text-sm">
                    <input value={age} onChange={e=>setAge(e.target.value)} className="w-12 p-0.5 text-center border rounded bg-primary text-primary outline-none focus:border-accent-blue" />
                    <span className="opacity-80">{['تربية','إنتاج','جدود','امهات البياض'].includes(r.f_type)?'أسبوع':'يوم'}</span>
                 </div>
              </div>
              <div><div className="text-xs text-muted mb-1">السيت بوينت</div><div className="font-bold text-sm">{r.set_point}°</div></div>
              <div><div className="text-xs text-muted mb-1">المعالجة</div><div className="font-bold text-sm">{r.duration}</div></div>
           </div>

           {/* Sensors/Details if available */}
           {r.sensor_mode === 'temp' && r.sensors && (
             <div className="mb-6">
                <div className="font-bold text-sm mb-3 text-muted">🌡️ قراءات الحساسات:</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                   {r.sensors.map((s, i) => (
                     <div key={i} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                        <div className="text-[10px] text-muted">ح {i+1}</div>
                        <div className="font-bold text-xs">{s.val}°</div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {(r.nh3 || r.co2 || r.hum || r.press) && (
             <div className="mb-6">
                <div className="font-bold text-sm mb-3 text-muted">🧪 القراءات الكيميائية:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                   {r.nh3 && <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}><div className="text-[10px] text-muted">NH3</div><div className="font-bold text-xs">{r.nh3} ppm</div></div>}
                   {r.co2 && <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}><div className="text-[10px] text-muted">CO2</div><div className="font-bold text-xs">{r.co2} ppm</div></div>}
                   {r.hum && <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}><div className="text-[10px] text-muted">رطوبة</div><div className="font-bold text-xs">{r.hum} %</div></div>}
                   {r.press && <div className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}><div className="text-[10px] text-muted">الضغط</div><div className="font-bold text-xs">{r.press} Pa</div></div>}
                </div>
             </div>
           )}

           {/* Reason Field */}
           <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                 <div className="font-bold text-sm text-muted">📝 سبب الحالة:</div>
                 {(reason !== (c.raw_data?.reason || "") || farm !== (c.farm || "") || house !== (c.house || "") || age != (r.age || "")) && (
                   <button onClick={handleSave} disabled={savingReason} className="text-[10px] bg-accent-blue text-white px-2 py-1 rounded">
                      {savingReason ? "جاري الحفظ..." : "حفظ التغيير"}
                   </button>
                 )}
              </div>
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="أضف سبب الحالة أو ملاحظاتك هنا..."
                className="w-full p-3 rounded-lg border focus:border-accent-blue outline-none text-sm"
                style={{ background: 'var(--bg-tertiary)', minHeight: '80px', fontFamily: 'inherit' }}
              />
           </div>

           <div className="font-bold text-sm mb-2 text-muted">📥 النسخ السريع:</div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildArabicText(c, templates)); showToast("تم نسخ الكليشة العربية", "success"); }} style={{ border: "1px solid var(--border)" }}>📱 عربي</button>
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildEnglishText(c, templates)); showToast("Copied EN", "success"); }} style={{ border: "1px solid var(--border)" }}>📱 EN</button>
              <button className="btn btn-ghost" onClick={() => { 
                const rows = getSheetRows(c, excelMapping?.typeMapping || excelMapping, excelMapping?.columnOrder);
                const tsv = rows.map(r => r.map(v => {
                  const s = String(v);
                  return s.includes("\n") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
                }).join("\t")).join("\n");
                navigator.clipboard.writeText(tsv);
                showToast("تم نسخ الإكسل", "success");
              }} style={{ border: "1px solid var(--border)" }}>📊 Excel</button>
           </div>

           <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-ghost text-muted hover:bg-tertiary flex-1" onClick={onClose} style={{ background: 'var(--bg-tertiary)' }}>إغلاق</button>
              <button className="btn btn-danger flex-1" onClick={() => window.confirm("هل أنت متأكد من حذف هذه الحالة نهائياً؟") && onDelete(c)}>🗑️ حذف</button>
           </div>
        </div>
      </div>
    </div>
  );
}

import ExcelSettingsModal from "../../components/ui/ExcelSettingsModal.jsx";


// ─── MAIN PAGE ───────────────────────────────────────────────────────────
export default function HistoryPage({ user }) {
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [excelMapping, setExcelMapping] = useState(null);
  const [showExcelSettings, setShowExcelSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      loadData("history", []),
      loadData("templates_config", null),
      loadData("settings/excel_mapping", null)
    ]).then(([h, t, m]) => {
      setHistory(h);
      setTemplates(t);
      setExcelMapping(m);
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
        <div className="flex justify-between w-full items-center flex-wrap gap-2">
           <div>
             <div className="page-title">📜 سجلي الشخصي</div>
             <div className="page-subtitle">الحالات التي سجلتها ({filtered.length})</div>
           </div>
           <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowExcelSettings(true)}>⚙️ إعدادات الإكسل</button>
              <input className="form-input" style={{ width: "200px" }} placeholder="--" value={search} onChange={e => setSearch(e.target.value)} />
           </div>
        </div>
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
          excelMapping={excelMapping}
          onClose={() => setDetail(null)} 
          onUpdate={async (updatedCase) => {
            const h = await loadData("history", []);
            const upd = h.map(x => x.timestamp === updatedCase.timestamp ? updatedCase : x);
            await saveData("history", upd);
            setHistory(upd);
            setDetail(updatedCase);
          }}
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

      {showExcelSettings && (
        <ExcelSettingsModal 
          mapping={excelMapping?.typeMapping || excelMapping} 
          columnOrder={excelMapping?.columnOrder}
          onClose={() => setShowExcelSettings(false)}
          onSave={async (newMap, newOrder) => {
            const nextMapping = { typeMapping: newMap, columnOrder: newOrder };
            await saveData("settings/excel_mapping", nextMapping);
            setExcelMapping(nextMapping);
            showToast("✅ تم حفظ إعدادات الإكسل", "success");
          }}
        />
      )}
    </div>
  );
}
