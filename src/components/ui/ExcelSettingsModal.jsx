import React, { useState } from "react";

export const DEFAULT_COL_MAP = [
  { id: "date", label: "Date (التاريخ)" },
  { id: "farm", label: "Farm Number (المزرعة)" },
  { id: "farm_type", label: "Farm Type (النوع: Broiler/Rearing)" },
  { id: "house", label: "House (الحظيرة)" },
  { id: "age", label: "Age (العمر)" },
  { id: "condition", label: "Condition (نوع الحالة / حرارة عالية...)" },
  { id: "time", label: "Start Time (وقت البداية)" },
  { id: "diff", label: "Temp Diff (الفرق عن المعدل)" },
  { id: "rate", label: "Rate/Value (المعدل أو قراءة الحساس)" },
  { id: "sp", label: "Set Point (السيت بوينت)" },
  { id: "unit", label: "Unit (الوحدة % أو °C)" },
  { id: "duration", label: "Process Time (وقت المعالجة)" },
  { id: "reason", label: "Reason (السبب)" }
];

export default function ExcelSettingsModal({ mapping, columnOrder, onSave, onClose }) {
  const [localMap, setLocalMap] = useState(mapping || { "مزرعة (تسمين)":"Broiler","إنتاج":"Production","تربية":"Rearing", "جدود":"Grandparents", "امهات البياض":"Layers Parents" });
  const [localOrder, setLocalOrder] = useState(columnOrder || DEFAULT_COL_MAP.map(c => c.id));
  const [activeTab, setActiveTab] = useState("columns");

  const moveCol = (index, dir) => {
    if (index + dir < 0 || index + dir >= localOrder.length) return;
    const n = [...localOrder];
    [n[index], n[index + dir]] = [n[index + dir], n[index]];
    setLocalOrder(n);
  };

  const handleSave = () => { onSave(localMap, localOrder); onClose(); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: "450px", padding: "0", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "15px 20px", background: "var(--bg-tertiary)", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
           <h3 className="font-bold">⚙️ إعدادات الإكسل (Excel Settings)</h3>
           <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:"1.2rem", color: "var(--text-muted)" }}>✕</button>
        </div>

        <div className="flex bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
          <button className={`flex-1 p-2 font-bold text-sm ${activeTab==="columns"?"text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]":"text-muted"}`} onClick={()=>setActiveTab("columns")}>ترتيب الخانات</button>
          <button className={`flex-1 p-2 font-bold text-sm ${activeTab==="mapping"?"text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]":"text-muted"}`} onClick={()=>setActiveTab("mapping")}>تسميات الأنواع</button>
        </div>

        <div style={{ padding: "14px 20px", overflowY: "auto", flex: 1 }}>
           {activeTab === "columns" ? (
             <div className="flex flex-col gap-2">
                <p className="text-xs text-muted mb-2 text-center">حدد ترتيب الأعمدة لكي تُلصق بالترتيب الذي تريده (الأسهم يمين/يسار للصعود والنزول)</p>
                {localOrder.map((colId, i) => {
                  const info = DEFAULT_COL_MAP.find(c => c.id === colId);
                  return (
                    <div key={colId} className="flex justify-between items-center p-2 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      <div className="flex gap-2">
                        <button disabled={i === 0} onClick={() => moveCol(i, -1)} style={{ padding: "2px 6px", cursor: i===0?"not-allowed":"pointer", opacity: i===0?.5:1 }}>⬆️</button>
                        <button disabled={i === localOrder.length-1} onClick={() => moveCol(i, 1)} style={{ padding: "2px 6px", cursor: i===localOrder.length-1?"not-allowed":"pointer", opacity: i===localOrder.length-1?.5:1 }}>⬇️</button>
                      </div>
                      <div className="text-sm font-bold">{info ? info.label : colId}</div>
                      <div className="text-xs bg-[var(--bg-tertiary)] px-2 rounded-md text-muted border border-[var(--border)]">{i + 1}</div>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="flex flex-col gap-3">
                <p className="text-xs text-muted mb-2">تخصيص أسماء الأنواع في الإكسل (مثل Rearing أو Broiler):</p>
                {Object.keys(localMap).map(key => (
                   <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-muted">{key}</label>
                      <input className="form-input text-sm p-2" value={localMap[key]} onChange={e => setLocalMap(prev => ({ ...prev, [key]: e.target.value }))} />
                   </div>
                ))}
             </div>
           )}
        </div>
        
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }} className="flex gap-2">
           <button className="btn btn-accent flex-1" onClick={handleSave}>✅ حفظ التغييرات</button>
           <button className="btn btn-ghost flex-1" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
