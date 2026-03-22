import { useState, useEffect } from "react";
import { loadData, saveData, setDatabaseUrl, resetDatabaseUrl } from "../../services/firebase.js";
import { DEFAULT_BROILER_TABLE } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

export default function SettingsPage({ user }) {
  const [tables,   setTables]   = useState(null);
  const [generalSettings, setGeneralSettings] = useState({ allow_emp_farm_type: false });
  const [dbConfig, setDbConfig] = useState({ mode: "cloud", customUrl: "" });
  
  const active = "مزرعة (تسمين)";
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const url = localStorage.getItem("database_url");
    setDbConfig({ 
      mode: url ? "local" : "cloud", 
      customUrl: url || "http://localhost:3000" 
    });

    Promise.all([
      loadData("settings/conditions", null),
      loadData("settings/general", { allow_emp_farm_type: false })
    ]).then(([d, g]) => {
      setTables(d || { [active]: JSON.parse(JSON.stringify(DEFAULT_BROILER_TABLE)) });
      setGeneralSettings(g);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try { 
      // Handle Database Mode
      if (dbConfig.mode === "local") {
        setDatabaseUrl(dbConfig.customUrl);
      } else {
        resetDatabaseUrl();
      }

      await saveData("settings/conditions", tables); 
      await saveData("settings/general", generalSettings);
      showToast("✅ تم حفظ جميع الإعدادات","success"); 
      
      // Reload if DB mode changed to apply new URL
      setTimeout(() => window.location.reload(), 1000);
    }
    catch { showToast("❌ خطأ في الحفظ","error"); }
    setSaving(false);
  }

  function resetToDefault() {
    const t = { ...tables };
    t[active] = JSON.parse(JSON.stringify(DEFAULT_BROILER_TABLE));
    setTables(t);
    showToast("🔄 تمت إعادة الضبط الافتراضي","info");
  }

  function updateCell(rowIdx, field, val) {
    const t = { ...tables };
    const rows = (t[active] || []).map((r,i) => i===rowIdx ? { ...r, [field]: val===""||val==="-"?null:parseFloat(val)??null } : r);
    t[active] = rows;
    setTables(t);
  }

  if (loading) return <div className="empty-state">⏳ جارٍ التحميل...</div>;

  const rows = tables?.[active] || [];

  return (
    <div className="flex flex-col h-full gap-4 pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ إعدادات النظام وقاعدة البيانات</div>
          <div className="page-subtitle">تعديل حدود الإنذار، صلاحيات الموظفين، ونوع قاعدة البيانات</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={resetToDefault}>🔄 افتراضي</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving?"⏳ جاري الحفظ...":"💾 حفظ الإعدادات"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database Mode Card */}
        <div className="card">
           <h3 className="font-bold mb-3 flex items-center gap-2">🌐 وضع قاعدة البيانات</h3>
           <div className="flex gap-2 mb-4 bg-tertiary p-1 rounded" style={{ background:"var(--bg-tertiary)" }}>
              <button type="button" 
                className={`flex-1 btn btn-sm ${dbConfig.mode==='cloud'?'btn-primary':'btn-ghost'}`} 
                onClick={()=>setDbConfig({...dbConfig, mode:'cloud'})}>
                ☁️ سحابي (Firebase)
              </button>
              <button type="button" 
                className={`flex-1 btn btn-sm ${dbConfig.mode==='local'?'btn-primary':'btn-ghost'}`} 
                onClick={()=>setDbConfig({...dbConfig, mode:'local'})}>
                🏠 محلي (Local PC)
              </button>
           </div>
           
           {dbConfig.mode === "local" && (
             <div className="form-group">
                <label className="form-label">رابط الخادم المحلي (Local IP)</label>
                <input className="form-input" 
                  placeholder="مثلاً: http://192.168.1.50:3000" 
                  value={dbConfig.customUrl} 
                  onChange={e=>setDbConfig({...dbConfig, customUrl: e.target.value})}
                  dir="ltr" />
                <div className="text-xs text-muted mt-1">
                   استخدم رابط الكمبيوتر الرئيسي الذي يعمل كخادم (Node.js).
                </div>
             </div>
           )}
           <div className="text-xs mt-2 opacity-70">
              * ملاحظة: سيتم إعادة تحميل الصفحة عند تغيير هذا الإعداد.
           </div>
        </div>

        {/* Employee Permissions Card */}
        <div className="card">
           <h3 className="font-bold mb-3">🛠️ صلاحيات الموظفين</h3>
           <div className="flex items-center justify-between p-3 bg-tertiary rounded" style={{ background:"var(--bg-tertiary)" }}>
              <span className="text-sm font-bold">تغيير نوع المزرعة من قبل الموظف</span>
              <input type="checkbox" style={{ scale:"1.2", cursor:"pointer" }}
                checked={generalSettings.allow_emp_farm_type}
                onChange={(e) => setGeneralSettings({ ...generalSettings, allow_emp_farm_type: e.target.checked })} />
           </div>
        </div>
      </div>

      {/* Conditions Table Card */}
      <div className="card" style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        <h3 className="font-bold mb-4">🌡️ حدود الإنذار (جدول شروط التسمين)</h3>
        <table className="w-full text-right" style={{ borderCollapse:"collapse" }}>
          <thead>
            <tr className="table-header-row" style={{ gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr 50px", display:"grid" }}>
               <th>من يوم</th><th>إلى يوم</th><th>🌡️ انخفاض</th><th>🌡️ ارتفاع</th><th>💧 رطوبة↓</th><th>💧 رطوبة↑</th><th>💨 CO2</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="table-row" style={{ gridTemplateColumns: "1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr 1.5fr 50px", display:"grid" }}>
                <td><input className="form-input text-sm p-1" type="number" value={row.ageFrom} onChange={e=>updateCell(i,"ageFrom",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1" type="number" value={row.ageTo} onChange={e=>updateCell(i,"ageTo",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1 text-blue" type="number" step="0.5" value={row.lowTemp??""} placeholder="—" onChange={e=>updateCell(i,"lowTemp",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1 text-red" type="number" step="0.5" value={row.highTemp??""} placeholder="—" onChange={e=>updateCell(i,"highTemp",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1 text-green" type="number" step="1" value={row.lowRH??""} placeholder="—" onChange={e=>updateCell(i,"lowRH",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1 text-orange" type="number" step="1" value={row.highRH??""} placeholder="—" onChange={e=>updateCell(i,"highRH",e.target.value)} /></td>
                <td><input className="form-input text-sm p-1 text-purple" type="number" step="100" value={row.co2??""} placeholder="—" onChange={e=>updateCell(i,"co2",e.target.value)} /></td>
                <td className="flex items-center justify-center">
                   <button className="text-muted" style={{ background:"none", border:"none", cursor:"pointer" }} onClick={()=>{
                      if(rows.length > 1) {
                         const t = {...tables}; t[active] = rows.filter((_,idx)=>idx!==i); setTables(t);
                      }
                   }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost w-full mt-4" onClick={()=>{
          const t = {...tables};
          const last = rows[rows.length-1];
          const start = last ? last.ageTo+1 : 0;
          t[active] = [...rows, { ageFrom:start, ageTo:start+5, lowTemp:null, highTemp:1, lowRH:50, highRH:null, co2:null }];
          setTables(t);
        }}>➕ إضافة فئة عمرية جديدة</button>
      </div>
    </div>
  );
}
