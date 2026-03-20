import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { DEFAULT_BROILER_TABLE } from "../../utils/conditions.js";
import { showToast } from "../../components/ui/Toast.jsx";

const FARM_TYPES = ["Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)", "Ø¥Ù†ØªØ§Ø¬", "ØªØ±Ø¨ÙŠØ©", "Ø¬Ø¯ÙˆØ¯", "Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶"];

export default function SettingsPage({ user }) {
  const [tables,   setTables]   = useState(null);   // { [farmType]: row[] }
  const [active,   setActive]   = useState(FARM_TYPES[0]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    loadData("settings/conditions", null).then(d => {
      if (d) setTables(d);
      else {
        // ØªÙ‡ÙŠØ¦Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹
        const init = {};
        FARM_TYPES.forEach(t => { init[t] = JSON.parse(JSON.stringify(DEFAULT_BROILER_TABLE)); });
        setTables(init);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try { await saveData("settings/conditions", tables); showToast("âœ… ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª","success"); }
    catch { showToast("âŒ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸","error"); }
    setSaving(false);
  }

  function resetToDefault() {
    const t = { ...tables };
    t[active] = JSON.parse(JSON.stringify(DEFAULT_BROILER_TABLE));
    setTables(t);
    showToast("ðŸ”„ ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¶Ø¨Ø· Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ","info");
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
    if (tables[active].length <= 1) { showToast("Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ø¢Ø®Ø± Ø³Ø·Ø±","error"); return; }
    const t = { ...tables }; t[active] = t[active].filter((_,i)=>i!==idx); setTables(t);
  }

  function copyFromBroiler() {
    const t = { ...tables }; t[active] = JSON.parse(JSON.stringify(t["Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)"])); setTables(t);
    showToast("ðŸ“‹ ØªÙ… Ø§Ù„Ù†Ø³Ø® Ù…Ù† Ø§Ù„ØªØ³Ù…ÙŠÙ†","success");
  }

  if (loading) return <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)" }}>â³ Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...</div>;

  const rows = tables?.[active] || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"12px" }}>

      {/* â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <div style={{ fontWeight:"900", fontSize:"1.05rem" }}>âš™ï¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø´Ø±ÙˆØ·</div>
          <div style={{ fontSize:".8rem", color:"var(--text-muted)" }}>ØªØ¹Ø¯ÙŠÙ„ Ø­Ø¯ÙˆØ¯ Ø§Ù„Ø§Ù†Ø°Ø§Ø± Ù„ÙƒÙ„ Ù†ÙˆØ¹ Ù…Ø²Ø±Ø¹Ø© ÙˆÙƒÙ„ ÙØ¦Ø© Ø¹Ù…Ø±ÙŠØ©</div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button className="btn btn-ghost btn-sm" onClick={resetToDefault}>ðŸ”„ Ø§ÙØªØ±Ø§Ø¶ÙŠ</button>
          {active !== "Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)" && <button className="btn btn-ghost btn-sm" onClick={copyFromBroiler}>ðŸ“‹ Ù†Ø³Ø® Ù…Ù† ØªØ³Ù…ÙŠÙ†</button>}
          <button className="btn btn-sm" style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff" }}
            onClick={handleSave} disabled={saving}>
            {saving?"â³ Ø­ÙØ¸...":"ðŸ’¾ Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª"}
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ Farm Type Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€â”€ Legend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", flexShrink:0 }}>
        {[
          { color:"#3b82f6", text:"lowTemp â€” Ø§Ù†Ø®ÙØ§Ø¶ Ø¥Ø°Ø§ Rate â‰¤ Ù‡Ø°Ù‡ Ø§Ù„Ù‚ÙŠÙ…Ø©" },
          { color:"#ef4444", text:"highTemp â€” Ø§Ø±ØªÙØ§Ø¹ Ø¥Ø°Ø§ Rate â‰¥ Ù‡Ø°Ù‡ Ø§Ù„Ù‚ÙŠÙ…Ø©" },
          { color:"#22c55e", text:"lowRH% â€” ØªØ­Ø°ÙŠØ± Ø±Ø·ÙˆØ¨Ø© Ù…Ù†Ø®ÙØ¶Ø©" },
          { color:"#f97316", text:"highRH% â€” ØªØ­Ø°ÙŠØ± Ø±Ø·ÙˆØ¨Ø© Ù…Ø±ØªÙØ¹Ø©" },
          { color:"#a855f7", text:"CO2 ppm â€” ØªØ­Ø°ÙŠØ± COâ‚‚ Ù…Ø±ØªÙØ¹" },
        ].map(({ color, text }) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:".72rem", color:"var(--text-muted)" }}>
            <span style={{ width:"10px",height:"10px",borderRadius:"50%",background:color,flexShrink:0 }}/>
            {text}
          </div>
        ))}
        <div style={{ fontSize:".72rem", color:"var(--text-muted)" }}>Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ (â€”) Ù„Ù„Ø¥Ù‡Ù…Ø§Ù„</div>
      </div>

      {/* â”€â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".85rem" }}>
          <thead>
            <tr style={{ position:"sticky", top:0, background:"var(--bg-secondary)", zIndex:10 }}>
              {["Ù…Ù† ÙŠÙˆÙ…","Ø¥Ù„Ù‰ ÙŠÙˆÙ…","â¬‡ï¸ Low Rate","â¬†ï¸ High Rate","ðŸ’§ Low RH%","ðŸ”´ High RH%","ðŸ’¨ CO2 ppm",""].map(h => (
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
                  <input type="number" step="0.5" value={row.lowTemp??""} placeholder="â€”"
                    onChange={e=>updateCell(i,"lowTemp",e.target.value)}
                    style={{ ...tdStyle, color:"#3b82f6", borderColor:"rgba(59,130,246,.3)" }} />
                </td>
                {/* High Temp */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="0.5" value={row.highTemp??""} placeholder="â€”"
                    onChange={e=>updateCell(i,"highTemp",e.target.value)}
                    style={{ ...tdStyle, color:"#ef4444", borderColor:"rgba(239,68,68,.3)" }} />
                </td>
                {/* Low RH */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="1" value={row.lowRH??""} placeholder="â€”"
                    onChange={e=>updateCell(i,"lowRH",e.target.value)}
                    style={{ ...tdStyle, color:"#22c55e", borderColor:"rgba(34,197,94,.3)" }} />
                </td>
                {/* High RH */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="1" value={row.highRH??""} placeholder="â€”"
                    onChange={e=>updateCell(i,"highRH",e.target.value)}
                    style={{ ...tdStyle, color:"#f97316", borderColor:"rgba(249,115,22,.3)" }} />
                </td>
                {/* CO2 */}
                <td style={{ padding:"6px 8px" }}>
                  <input type="number" step="100" value={row.co2??""} placeholder="â€”"
                    onChange={e=>updateCell(i,"co2",e.target.value)}
                    style={{ ...tdStyle, color:"#a855f7", borderColor:"rgba(168,85,247,.3)" }} />
                </td>
                {/* Delete */}
                <td style={{ padding:"6px 8px", textAlign:"center" }}>
                  <button type="button" onClick={()=>deleteRow(i)}
                    style={{ background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"1.1rem",padding:"2px 6px",borderRadius:"6px",transition:"all .15s" }}
                    onMouseEnter={e=>{e.target.style.color="#ef4444";e.target.style.background="rgba(239,68,68,.1)"}}
                    onMouseLeave={e=>{e.target.style.color="var(--text-muted)";e.target.style.background="transparent"}}>
                    ðŸ—‘ï¸
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
          âž• Ø¥Ø¶Ø§ÙØ© ÙØ¦Ø© Ø¹Ù…Ø±ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©
        </button>
      </div>

      {/* â”€â”€â”€ Preview Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"12px", flexShrink:0 }}>
        <div style={{ fontWeight:"800", fontSize:".82rem", marginBottom:"8px" }}>ðŸ‘ï¸ Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø¬Ø¯ÙˆÙ„ â€” {active}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {rows.map((row,i) => (
            <div key={i} style={{
              background:"var(--bg-tertiary)", borderRadius:"8px", padding:"8px 12px",
              fontSize:".72rem", lineHeight:"1.6", fontFamily:"Arial"
            }}>
              <div style={{ fontWeight:"800", color:"var(--text-primary)", marginBottom:"2px" }}>ÙŠÙˆÙ… {row.ageFrom}â€“{row.ageTo}</div>
              {row.lowTemp!==null  && <div style={{ color:"#3b82f6" }}>Low: {row.lowTemp}Â°</div>}
              {row.highTemp!==null && <div style={{ color:"#ef4444" }}>High: +{row.highTemp}Â°</div>}
              {row.lowRH!==null    && <div style={{ color:"#22c55e" }}>RHâ†“: {row.lowRH}%</div>}
              {row.highRH!==null   && <div style={{ color:"#f97316" }}>RHâ†‘: {row.highRH}%</div>}
              {row.co2!==null      && <div style={{ color:"#a855f7" }}>COâ‚‚: {row.co2}</div>}
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
