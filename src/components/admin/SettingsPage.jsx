import { useState, useEffect } from "react";
import { loadData, saveData } from "../../core/firebase.js";
import { DEFAULT_BROILER_TABLE } from "../../core/conditions.js";
import { showToast } from "../shared/Toast.jsx";

const FARM_TYPES = ["مزرعة (تسمين)", "إنتاج", "تربية", "جدود", "امهات البياض"];

export default function SettingsPage({ user }) {
  const [tables,   setTables]   = useState(null);   // { [farmType]: row[] }
  const [active,   setActive]   = useState(FARM_TYPES[0]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    loadData("settings/conditions", null).then(d => {
      if (d) setTables(d);
      else {
        // تهيئة افتراضية لجميع الأنواع
        const init = {};
        FARM_TYPES.forEach(t => { init[t] = JSON.parse(JSON.stringify(DEFAULT_BROILER_TABLE)); });
        setTables(init);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try { await saveData("settings/conditions", tables); showToast("✅ تم حفظ الإعدادات","success"); }
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
    const rows = t[active].map((r,i) => i===rowIdx ? { ...r, [field]: val===""||val==="-"?null:parseFloat(val)??null } : r);
    t[active] = rows;
    setTables(t);
  }

  function addRow() {
    const t = { ...tables };
    const rows = t[active];
    const last = rows[rows.length-1];
    const newFrom = last ? last.ageTo + 1 : 0;
    t[active] = [...rows, { ageFrom:newFrom, ageTo:newFrom+5, lowTemp:null, highTemp:1, lowRH:50, highRH:null, co2:null }];
    setTables(t);
  }

  function deleteRow(idx) {
    if (tables[active].length <= 1) { showToast("لا يمكن حذف آخر سطر","error"); return; }
    const t = { ...tables }; t[active] = t[active].filter((_,i)=>i!==idx); setTables(t);
  }

  function copyFromBroiler() {
    const t = { ...tables }; t[active] = JSON.parse(JSON.stringify(t["مزرعة (تسمين)"])); setTables(t);
    showToast("📋 تم النسخ من التسمين","success");
  }

  if (loading) return <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)" }}>⏳ جارٍ التحميل...</div>;

  const rows = tables?.[active] || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"12px" }}>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <div style={{ fontWeight:"900", fontSize:"1.05rem" }}>⚙️ إعدادات جدول الشروط</div>
          <div style={{ fontSize:".8rem", color:"var(--text-muted)" }}>تعديل حدود الانذار لكل نوع مزرعة وكل فئة عمرية</div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button className="btn btn-ghost btn-sm" onClick={resetToDefault}>🔄 افتراضي</button>
          {active !== "مزرعة (تسمين)" && <button className="btn btn-ghost btn-sm" onClick={copyFromBroiler}>📋 نسخ من تسمين</button>}
          <button className="btn btn-sm" style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff" }}
            onClick={handleSave} disabled={saving}>
            {saving?"⏳ حفظ...":"💾 حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {/* ─── Farm Type Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:"6px", flexShrink:0, flexWrap:"wrap" }}>
        {FARM_TYPES.map(t => (
          <button key={t} type="button" onClick={()=>setActive(t)}
            style={{
              padding:"6px 16px", borderRadius:"100px", border:`1px solid ${active===t?"#f59e0b":"var(--border)"}`,
              background:active===t?"rgba(245,158,11,.15)":"var(--bg-tertiary)",
              color:active===t?"#f59e0b":"var(--text-muted)", fontFamily:"var(--font-ar)",
              fontWeight:"700", fontSize:".82rem", cursor:"pointer", transition:"all .2s"
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ─── Legend ──────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", flexShrink:0 }}>
        {[
          { color:"#3b82f6", text:"lowTemp — انخفاض إذا Rate ≤ هذه القيمة" },
          { color:"#ef4444", text:"highTemp — ارتفاع إذا Rate ≥ هذه القيمة" },
          { color:"#22c55e", text:"lowRH% — تحذير رطوبة منخفضة" },
          { color:"#f97316", text:"highRH% — تحذير رطوبة مرتفعة" },
          { color:"#a855f7", text:"CO2 ppm — تحذير CO₂ مرتفع" },
        ].map(({ color, text }) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:".72rem", color:"var(--text-muted)" }}>
            <span style={{ width:"10px",height:"10px",borderRadius:"50%",background:color,flexShrink:0 }}/>
            {text}
          </div>
        ))}
        <div style={{ fontSize:".72rem", color:"var(--text-muted)" }}>اتركه فارغاً (—) للإهمال</div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".85rem" }}>
          <thead>
            <tr style={{ position:"sticky", top:0, background:"var(--bg-secondary)", zIndex:10 }}>
              {["من يوم","إلى يوم","⬇️ Low Rate","⬆️ High Rate","💧 Low RH%","🔴 High RH%","💨 CO2 ppm",""].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"center", fontWeight:"800", fontSize:".78rem",
                  color:"var(--text-muted)", borderBottom:"1px solid var(--border)", whiteSpace:"nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom:"1px solid var(--border)", transition:"background .15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--bg-tertiary)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                {/* Age From */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" value={row.ageFrom} onChange={e=>updateCell(i,"ageFrom",e.target.value)}
                    style={tdStyle} />
                </td>
                {/* Age To */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" value={row.ageTo} onChange={e=>updateCell(i,"ageTo",e.target.value)}
                    style={tdStyle} />
                </td>
                {/* Low Temp */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="0.5" value={row.lowTemp??""} placeholder="—"
                    onChange={e=>updateCell(i,"lowTemp",e.target.value)}
                    style={{ ...tdStyle, color:"#3b82f6", borderColor:"rgba(59,130,246,.3)" }} />
                </td>
                {/* High Temp */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="0.5" value={row.highTemp??""} placeholder="—"
                    onChange={e=>updateCell(i,"highTemp",e.target.value)}
                    style={{ ...tdStyle, color:"#ef4444", borderColor:"rgba(239,68,68,.3)" }} />
                </td>
                {/* Low RH */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="1" value={row.lowRH??""} placeholder="—"
                    onChange={e=>updateCell(i,"lowRH",e.target.value)}
                    style={{ ...tdStyle, color:"#22c55e", borderColor:"rgba(34,197,94,.3)" }} />
                </td>
                {/* High RH */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="1" value={row.highRH??""} placeholder="—"
                    onChange={e=>updateCell(i,"highRH",e.target.value)}
                    style={{ ...tdStyle, color:"#f97316", borderColor:"rgba(249,115,22,.3)" }} />
                </td>
                {/* CO2 */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="100" value={row.co2??""} placeholder="—"
                    onChange={e=>updateCell(i,"co2",e.target.value)}
                    style={{ ...tdStyle, color:"#a855f7", borderColor:"rgba(168,85,247,.3)" }} />
                </td>
                {/* Delete */}
                <td style={{ padding:"6px 8px", textAlign:"center" }}>
                  <button type="button" onClick={()=>deleteRow(i)}
                    style={{ background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"1.1rem",padding:"2px 6px",borderRadius:"6px",transition:"all .15s" }}
                    onMouseEnter={e=>{e.target.style.color="#ef4444";e.target.style.background="rgba(239,68,68,.1)"}}
                    onMouseLeave={e=>{e.target.style.color="var(--text-muted)";e.target.style.background="transparent"}}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add Row Button */}
        <button type="button" onClick={addRow}
          style={{
            marginTop:"10px", width:"100%", padding:"10px", borderRadius:"8px",
            border:"1px dashed var(--border)", background:"transparent",
            color:"var(--text-muted)", fontFamily:"var(--font-ar)", fontWeight:"700",
            fontSize:".85rem", cursor:"pointer", transition:"all .2s"
          }}
          onMouseEnter={e=>{e.target.style.background="var(--bg-tertiary)";e.target.style.borderColor="var(--accent-blue)"}}
          onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.borderColor="var(--border)"}}>
          ➕ إضافة فئة عمرية جديدة
        </button>
      </div>

      {/* ─── Preview Card ─────────────────────────────────────────────────────── */}
      <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"12px", flexShrink:0 }}>
        <div style={{ fontWeight:"800", fontSize:".82rem", marginBottom:"8px" }}>👁️ معاينة الجدول — {active}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {rows.map((row,i) => (
            <div key={i} style={{
              background:"var(--bg-tertiary)", borderRadius:"8px", padding:"8px 12px",
              fontSize:".72rem", lineHeight:"1.6", fontFamily:"Arial"
            }}>
              <div style={{ fontWeight:"800", color:"var(--text-primary)", marginBottom:"2px" }}>يوم {row.ageFrom}–{row.ageTo}</div>
              {row.lowTemp!==null  && <div style={{ color:"#3b82f6" }}>Low: {row.lowTemp}°</div>}
              {row.highTemp!==null && <div style={{ color:"#ef4444" }}>High: +{row.highTemp}°</div>}
              {row.lowRH!==null    && <div style={{ color:"#22c55e" }}>RH↓: {row.lowRH}%</div>}
              {row.highRH!==null   && <div style={{ color:"#f97316" }}>RH↑: {row.highRH}%</div>}
              {row.co2!==null      && <div style={{ color:"#a855f7" }}>CO₂: {row.co2}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tdStyle = {
  width:"72px", padding:"6px 8px", borderRadius:"6px", border:"1px solid var(--border)",
  background:"var(--bg-tertiary)", color:"var(--text-primary)", textAlign:"center",
  fontFamily:"Arial", fontSize:".85rem", fontWeight:"700", outline:"none",
  transition:"border-color .15s"
};
