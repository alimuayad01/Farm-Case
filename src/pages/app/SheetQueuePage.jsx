import { useState, useEffect, useMemo } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { getSheetRows } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

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
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });

  const todayStr = useMemo(() => new Date().toLocaleDateString("en-GB"), []);

  useEffect(() => {
    loadData("history", []).then(history => {
      const todaySheetItems = history.filter(c => c.date === todayStr && c.sent_to_sheet === true);
      setItems(todaySheetItems.map(item => ({ ...item, reason: item.reason || "" })));
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
        <div className="flex gap-2">
           <button className="btn btn-ghost" onClick={() => setShowArchive(true)} style={{ color: "var(--accent-orange)", borderColor: "var(--accent-orange)" }}>📦 المؤرشفة</button>
           <button className="btn btn-primary" onClick={() => {
             const rows = sortedItems.map(c => getSheetRows(c).map(r => [...r, c.reason].join("\t")).join("\n")).join("\n");
             navigator.clipboard.writeText(rows).then(() => showToast("تم النسخ!", "success"));
           }}>📋 نسخ للـ Excel</button>
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
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget && setEditingItem(null)}>
           <div className="modal" style={{ maxWidth: "600px" }}>
              <div className="flex justify-between mb-4"><h3 className="font-bold">📝 تعديل بيانات الحالة</h3><button onClick={()=>setEditingItem(null)}>✕</button></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input className="form-input" value={editingItem.farm} onChange={e=>setEditingItem({...editingItem, farm:e.target.value})} placeholder="رقم المزرعة" />
                <input className="form-input" value={editingItem.house} onChange={e=>setEditingItem({...editingItem, house:e.target.value})} placeholder="رقم الحظيرة" />
                <textarea className="form-input col-span-2" value={editingItem.reason} onChange={e=>setEditingItem({...editingItem, reason:e.target.value})} placeholder="توثيق السبب..." style={{ height: "100px" }} />
              </div>
              <button className="btn btn-primary w-full" onClick={() => {
                 const history = loadData("history", []).then(h => {
                   const upd = h.map(x => x.timestamp === editingItem.timestamp ? editingItem : x);
                   saveData("history", upd);
                   setItems(items.map(i => i.timestamp === editingItem.timestamp ? editingItem : i));
                   setEditingItem(null);
                   showToast("تم الحفظ", "success");
                 });
              }}>حفظ التعديلات</button>
           </div>
        </div>
      )}

      {showArchive && <ArchiveModal todayStr={todayStr} onRestore={restoreCase} onClose={() => setShowArchive(false)} />}
    </div>
  );
}
