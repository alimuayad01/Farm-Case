import { useState, useEffect, useMemo } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

// ─── Case Detail Modal (Shared style with History) ──────────────────────────
function SheetCaseModal({ c, templates, onClose, removeFromSheet, onUpdate, excelMapping }) {
  const [reason, setReason] = useState(c.reason || "");
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
      reason, 
      raw_data: { 
        ...r, 
        age: parseInt(age) || 0 
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
           <h3 className="font-bold text-lg m-0">📝 مراجعة وتعديل بيانات الشيت</h3>
           <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--text-muted)", padding: "0 5px", lineHeight: 1 }}>✕</button>
        </div>
        
        <div style={{ padding: "20px", maxHeight: "80vh", overflowY: "auto" }}>
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

           {(r.sensors || r.nh3 || r.co2 || r.hum || r.press) && (
             <div className="mb-6 p-3 rounded-lg border border-dashed border-border opacity-80 scale-95 origin-right">
                <div className="text-xs font-bold mb-2">📊 تفاصيل الحساسات (القراءة فقط):</div>
                <div className="grid grid-cols-4 gap-2">
                   {r.sensors?.slice(0,4).map((s,i) => <div key={i} className="text-[10px]">ح{i+1}: {s.val}°</div>)}
                   {r.nh3 && <div className="text-[10px]">NH3: {r.nh3}</div>}
                   {r.hum && <div className="text-[10px]">رطوبة: {r.hum}</div>}
                </div>
             </div>
           )}

           {/* Reason Field - Editable */}
           <div className="mb-6">
               <div className="flex justify-between items-center mb-2">
                 <div className="font-bold text-sm text-muted">📝 سبب الحالة (يظهر في الإكسل):</div>
                 {(reason !== (c.reason || "") || farm !== (c.farm || "") || house !== (c.house || "") || age != (r.age || "")) && (
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

           <div className="font-bold text-sm mb-2 text-muted">📥 النسخ السريع لهذا السطر:</div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildArabicText(c, templates)); showToast("تم نسخ الكليشة العربية", "success"); }} style={{ border: "1px solid var(--border)" }}>📱 عربي</button>
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(buildEnglishText(c, templates)); showToast("Copied EN", "success"); }} style={{ border: "1px solid var(--border)" }}>📱 EN</button>
              <button className="btn btn-ghost" onClick={() => { 
                const rows = getSheetRows(c, excelMapping?.typeMapping || excelMapping, excelMapping?.columnOrder);
                navigator.clipboard.writeText(rows.map(r => r.join("\t")).join("\n"));
                showToast("تم النسخ لهذا السطر", "success");
              }} style={{ border: "1px solid var(--border)" }}>📊 Excel</button>
           </div>

           <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn btn-ghost text-muted hover:bg-tertiary flex-1" onClick={onClose} style={{ background: 'var(--bg-tertiary)' }}>إغلاق</button>
              <button className="btn btn-danger flex-1" onClick={() => window.confirm("إزالة هذه الحالة من قائمة الشيت اليومية؟") && removeFromSheet(c.timestamp, true)}>📦 أرشفة</button>
           </div>
        </div>
      </div>
    </div>
  );
}

import ExcelSettingsModal from "../../components/ui/ExcelSettingsModal.jsx";

// ─── Archived Cases Modal ──────────────────────────────────────────────────

function ArchiveModal({ todayStr, onRestore, onClose }) {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData("history", []).then(h => {
      // الحالات التي سجلت اليوم والمشاركة أصلاً في "تاريخ الحالات" ولكن تم أرشفتها (sent_to_sheet=false)
      // أو بس الحالات اللي انلغى تفعيلها للقائمة
      const filtered = h.filter(c => c.date === todayStr && c.sent_to_sheet === false);
      setArchived(filtered.reverse());
      setLoading(false);
    });
  }, [todayStr]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "700px", padding: "0" }}>
         <div style={{ padding: "15px 20px", background: "var(--bg-tertiary)", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-bold">📦 الحالات المؤرشفة</h2>
            <button onClick={onClose}>✕</button>
         </div>
         <div style={{ padding: "20px", maxHeight: "400px", overflowY: "auto" }}>
            {loading ? <div className="text-center">جاري التحميل...</div> : archived.length === 0 ? <div className="text-center opacity-60">لا توجد حالات مؤرشفة</div> : (
              <table style={{ width: "100%", textAlign: "right", fontSize: ".85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "8px" }}>المزرعة</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map(c => (
                    <tr key={c.timestamp} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px" }}>مزرعة {c.farm}/{c.house}</td>
                      <td>{c.time}</td>
                      <td style={{ color: c.raw_data.condition==='ارتفاع'?'red':'blue' }}>{c.raw_data.condition}</td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => onRestore(c.timestamp)}>إعادة للقائمة</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
         </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────
export default function SheetQueuePage({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [excelMapping, setExcelMapping] = useState(null);
  const [showExcelSettings, setShowExcelSettings] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });

  const todayStr = useMemo(() => new Date().toLocaleDateString("en-GB"), []);

  useEffect(() => {
    Promise.all([
      loadData("history", []),
      loadData("settings/excel_mapping", null),
      loadData("templates_config", null)
    ]).then(([history, mapping, tmps]) => {
      const todaySheetItems = history.filter(c => c.date === todayStr && c.sent_to_sheet === true);
      setItems(todaySheetItems.map(item => ({ ...item, reason: item.reason || "" })));
      setExcelMapping(mapping);
      setTemplates(tmps);
      setLoading(false);
    });
  }, [todayStr]);

  const sortedItems = useMemo(() => {
    let s = [...items];
    if (sortConfig.key) {
      s.sort((a,b) => {
        let aV, bV;
        const rA = a.raw_data || {}; const rB = b.raw_data || {};
        switch (sortConfig.key) {
          case "farm": aV = parseInt(a.farm?.replace(/\D/g, "") || 0); bV = parseInt(b.farm?.replace(/\D/g, "") || 0); break;
          case "house": aV = parseInt(a.house || 0); bV = parseInt(b.house || 0); break;
          case "age": aV = parseFloat(rA.age || 0); bV = parseFloat(rB.age || 0); break;
          default: aV = a[sortConfig.key] || ""; bV = b[sortConfig.key] || "";
        }
        if (aV < bV) return sortConfig.direction === "asc" ? -1 : 1;
        if (aV > bV) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return s;
  }, [items, sortConfig]);

  const requestSort = (key) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc" });
  const getSortIcon = (key) => sortConfig.key !== key ? " ↕ " : (sortConfig.direction === "asc" ? " ↑ " : " ↓ ");

  async function restoreCase(timestamp) {
    const history = await loadData("history", []);
    const updated = history.map(h => h.timestamp === timestamp ? { ...h, sent_to_sheet: true } : h);
    await saveData("history", updated);
    const restored = updated.find(h => h.timestamp === timestamp);
    setItems([...items, { ...restored, reason: restored.reason || "" }]);
    setShowArchive(false);
    showToast("✅ تمت الإعادة للقائمة", "success");
  }

  async function removeFromSheet(timestamp, isArchive = true) {
    const history = await loadData("history", []);
    let newHistory;
    if (isArchive) {
      newHistory = history.map(h => h.timestamp === timestamp ? { ...h, sent_to_sheet: false } : h);
      showToast("📦 تمت الأرشفة", "info");
    } else {
      newHistory = history.filter(h => h.timestamp !== timestamp);
      showToast("🗑️ تم الحذف النهائي", "danger");
    }
    await saveData("history", newHistory);
    setItems(items.filter(i => i.timestamp !== timestamp));
    setEditingItem(null);
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="page-header">
        <div><div className="page-title">📊 تاريخ الحالات </div><div className="page-subtitle">إدارة ومراجعة الحالات المختارة لليوم</div></div>
        <div className="flex gap-2 items-center">
           <button className="btn btn-ghost btn-sm" onClick={() => setShowExcelSettings(true)}>⚙️ إعدادات الإكسل</button>
           <button className="btn btn-ghost" onClick={() => setShowArchive(true)} style={{ color: "var(--accent-orange)", borderColor: "var(--accent-orange)" }}>📦 المؤرشفة</button>
           <button className="btn btn-primary" onClick={() => {
             const rows = sortedItems.map(c => getSheetRows(c, excelMapping?.typeMapping || excelMapping, excelMapping?.columnOrder).map(r => r.join("\t")).join("\n")).join("\n");
             navigator.clipboard.writeText(rows).then(() => showToast("تم نسخ كافة الحالات!", "success"));
           }}>📋 نسخ كل الشيت</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? <div className="empty-state">جاري التحميل...</div> : items.length === 0 ? <div className="empty-state">📭 قائمة اليوم فارغة حالياً</div> : (
          <div className="card table-card p-0" style={{ minWidth: "1280px" }}>
             <div className="table-header-row" style={{ gridTemplateColumns: "130px 90px 80px 70px 100px 120px 110px 110px 1fr 180px" }}>
                <span className="cursor-pointer" onClick={()=>requestSort("timestamp")}>التاريخ {getSortIcon("timestamp")}</span>
                <span className="cursor-pointer" onClick={()=>requestSort("farm")}>المزرعة {getSortIcon("farm")}</span>
                <span className="cursor-pointer" onClick={()=>requestSort("house")}>الحظيرة {getSortIcon("house")}</span>
                <span className="cursor-pointer" onClick={()=>requestSort("age")}>العمر {getSortIcon("age")}</span>
                <span className="cursor-pointer" onClick={()=>requestSort("condition")}>نوع الحالة {getSortIcon("condition")}</span>
                <span className="cursor-pointer" onClick={()=>requestSort("set_point")}>السيت بوينت {getSortIcon("set_point")}</span>
                <span>البداية</span>
                <span>المعالجة</span>
                <span style={{ color: "var(--accent-orange)" }}>السبب</span>
                <span>إجراءات</span>
             </div>
             {sortedItems.map(item => {
               const r = item.raw_data || {};
               return (
                 <div key={item.timestamp} className="table-row" onClick={() => setEditingItem({ ...item })} style={{ gridTemplateColumns: "130px 90px 80px 70px 100px 120px 110px 110px 1fr 180px", cursor: "pointer" }}>
                    <span style={{ fontFamily: "monospace", fontSize: ".72rem" }}>{item.date}</span>
                    <span className="font-bold">{item.farm?.replace(/\D/g, "")}</span>
                    <span className="font-bold">{item.house}</span>
                    <span className="opacity-80">{r.age}</span>
                    <span style={{ color: r.condition==='ارتفاع'?'red':'blue', fontWeight: "700" }}>{r.condition}</span>
                    <span>{r.set_point}°</span>
                    <span className="text-xs">{item.time}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--accent-green)" }}>{r.duration}</span>
                    <div style={{ color:"var(--accent-orange)", fontSize:".8rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.reason || "..."}</div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                       <button className="btn btn-ghost btn-sm" onClick={() => removeFromSheet(item.timestamp, true)} style={{ fontSize: ".62rem", color: "var(--accent-orange)", borderRadius: "8px", border: "1px solid var(--accent-orange)50" }}>أرشفة</button>
                       <button className="btn btn-ghost btn-sm text-red" onClick={() => window.confirm("حذف؟") && removeFromSheet(item.timestamp, false)} style={{ fontSize: ".62rem", borderRadius: "8px", border: "1px solid var(--accent-red)50" }}>حذف</button>
                    </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>

      {editingItem && (
        <SheetCaseModal 
           c={editingItem} 
           templates={templates}
           excelMapping={excelMapping}
           onClose={() => setEditingItem(null)}
           removeFromSheet={removeFromSheet}
           onUpdate={async (updated) => {
              const h = await loadData("history", []);
              const upd = h.map(x => x.timestamp === updated.timestamp ? updated : x);
              await saveData("history", upd);
              setItems(items.map(i => i.timestamp === updated.timestamp ? updated : i));
              setEditingItem(updated);
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

      {showArchive && <ArchiveModal todayStr={todayStr} onRestore={restoreCase} onClose={() => setShowArchive(false)} />}
    </div>
  );
}
