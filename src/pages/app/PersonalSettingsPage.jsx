/**
 * PersonalSettingsPage.jsx
 * Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù…Ø¸Ù‡Ø± Ø´Ø®ØµÙŠØ© â€” ØªÙØ­ÙØ¸ ÙÙŠ localStorage
 */
import { useState, useEffect } from "react";
import { showToast } from "../../components/ui/Toast.jsx";

const PREFS_KEY = "farmcase_prefs";
const FONTS     = ["Tajawal", "Cairo", "IBM Plex Arabic", "Noto Kufi Arabic", "Readex Pro"];
const ACCENTS   = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#a855f7","#06b6d4","#ec4899","#f97316"];
const RADII     = [{ v:"4px",l:"Ø­Ø§Ø¯"},{v:"8px",l:"Ù…ØªÙˆØ³Ø·"},{v:"14px",l:"Ø¯Ø§Ø¦Ø±ÙŠ"},{v:"20px",l:"Ù…ÙƒØ¯ÙˆØ± Ø¬Ø¯Ø§Ù‹"}];

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

export function applyPrefs() {
  const p = loadPrefs();
  if (p.accent)    document.documentElement.style.setProperty("--accent-blue", p.accent);
  if (p.radius)    document.documentElement.style.setProperty("--radius-md", p.radius);
  if (p.fontSize)  document.documentElement.style.setProperty("--font-size-base", p.fontSize + "px");
  if (p.fontAr)    document.documentElement.style.setProperty("--font-ar", `"${p.fontAr}", Tajawal, sans-serif`);
}

export default function PersonalSettingsPage() {
  const [prefs, setPrefs] = useState({ accent:"#3b82f6", radius:"8px", fontSize:14, fontAr:"Tajawal", theme:"dark" });

  useEffect(() => {
    const saved = loadPrefs();
    setPrefs(p => ({ ...p, ...saved }));
  }, []);

  function update(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next); savePrefs(next); applyPrefs();
  }

  function reset() {
    const def = { accent:"#3b82f6", radius:"8px", fontSize:14, fontAr:"Tajawal", theme:"dark" };
    setPrefs(def); savePrefs(def); applyPrefs();
    showToast("ðŸ”„ ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª", "info");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"14px" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <div style={{ fontWeight:"900", fontSize:"1.05rem" }}>ðŸŽ¨ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©</div>
          <div style={{ fontSize:".78rem", color:"var(--text-muted)" }}>ØªØ®ØµÙŠØµ Ù…Ø¸Ù‡Ø± Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ â€” ØªÙØ­ÙØ¸ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset}>ðŸ”„ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¶Ø¨Ø·</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"12px" }}>

        {/* Color Theme */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>ðŸŒ™ Ø§Ù„Ù…Ø¸Ù‡Ø±</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù„ÙŠÙ„ÙŠ / Ø§Ù„Ù†Ù‡Ø§Ø±ÙŠ</div>
          <div style={{ display:"flex", gap:"8px" }}>
            {[{id:"dark",label:"ðŸŒ™ Ø¯Ø§ÙƒÙ†"},{id:"light",label:"â˜€ï¸ ÙØ§ØªØ­"}].map(({id,label}) => (
              <button key={id} type="button"
                onClick={() => { update("theme", id); document.documentElement.setAttribute("data-theme", id); }}
                style={{ flex:1, padding:"12px", borderRadius:"10px", border:`1.5px solid ${prefs.theme===id?"var(--accent-blue)":"var(--border)"}`, background:prefs.theme===id?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.theme===id?"var(--accent-blue)":"var(--text-muted)", fontFamily:"var(--font-ar)", fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".9rem" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>ðŸŽ¨ Ù„ÙˆÙ† Ø§Ù„ØªØ£ÙƒÙŠØ¯</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>Ù„ÙˆÙ† Ø§Ù„Ø£Ø²Ø±Ø§Ø± ÙˆØ§Ù„Ø¥Ø·Ø§Ø±Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©</div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {ACCENTS.map(c => (
              <button key={c} type="button" onClick={() => update("accent", c)}
                style={{ width:"36px", height:"36px", borderRadius:"50%", background:c, border:`3px solid ${prefs.accent===c?"#fff":"transparent"}`, cursor:"pointer", boxShadow: prefs.accent===c?`0 0 10px ${c}`:"none", transition:"all .2s" }} />
            ))}
            <input type="color" value={prefs.accent} onChange={e => update("accent", e.target.value)}
              style={{ width:"36px", height:"36px", borderRadius:"50%", border:"2px solid var(--border)", cursor:"pointer", padding:0, background:"transparent" }} />
          </div>
        </div>

        {/* Border Radius */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>â¬œ Ø´ÙƒÙ„ Ø§Ù„Ø­ÙˆØ§Ù</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>Ø­Ø¯Ø© Ø£Ùˆ Ø¯Ø§Ø¦Ø±ÙŠØ© Ø§Ù„Ø¨Ø·Ø§Ù‚Ø§Øª ÙˆØ§Ù„Ø£Ø²Ø±Ø§Ø±</div>
          <div style={{ display:"flex", gap:"8px" }}>
            {RADII.map(({v,l}) => (
              <button key={v} type="button" onClick={() => update("radius", v)}
                style={{ flex:1, padding:"10px 6px", borderRadius:v, border:`1.5px solid ${prefs.radius===v?"var(--accent-blue)":"var(--border)"}`, background:prefs.radius===v?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.radius===v?"var(--accent-blue)":"var(--text-muted)", fontFamily:"var(--font-ar)", fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".78rem" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>ðŸ“ Ø­Ø¬Ù… Ø§Ù„Ø®Ø·</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>Ø§Ù„Ø­Ø¬Ù… Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ù„Ù†ØµÙˆØµ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ â€” Ø§Ù„Ø­Ø§Ù„ÙŠ: {prefs.fontSize}px</div>
          <input type="range" min="11" max="18" step="1" value={prefs.fontSize}
            onChange={e => update("fontSize", parseInt(e.target.value))}
            style={{ width:"100%", accentColor:"var(--accent-blue)" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:".68rem", color:"var(--text-muted)", marginTop:"4px" }}>
            <span>ØµØºÙŠØ± (11)</span><span>Ù…ØªÙˆØ³Ø· (14)</span><span>ÙƒØ¨ÙŠØ± (18)</span>
          </div>
        </div>

        {/* Arabic Font */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>Ø­Ø±Ù Ù†ÙˆØ¹ Ø§Ù„Ø®Ø· Ø§Ù„Ø¹Ø±Ø¨ÙŠ</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>Ø§Ø®ØªØ± Ø§Ù„Ø®Ø· Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ Ù„Ùƒ</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            {FONTS.map(f => (
              <button key={f} type="button" onClick={() => update("fontAr", f)}
                style={{ padding:"12px 10px", borderRadius:"8px", border:`1.5px solid ${prefs.fontAr===f?"var(--accent-blue)":"var(--border)"}`, background:prefs.fontAr===f?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.fontAr===f?"var(--accent-blue)":"var(--text-muted)", fontFamily:`"${f}", Tajawal, sans-serif`, fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".88rem" }}>
                Ù†Ø¸Ø§Ù… Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø²Ø§Ø±Ø¹ â€” {f}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:"var(--bg-secondary)", border:"2px dashed var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"10px" }}>ðŸ‘ï¸ Ù…Ø¹Ø§ÙŠÙ†Ø© Ù…Ø¨Ø§Ø´Ø±Ø©</div>
          <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
            <button className="btn btn-sm btn-primary">Ø²Ø± Ø£Ø³Ø§Ø³ÙŠ</button>
            <button className="btn btn-sm btn-ghost">Ø²Ø± Ø«Ø§Ù†ÙˆÙŠ</button>
            <span className="badge badge-green">Ù†Ø´Ø·</span>
            <span className="badge badge-red">Ø®Ø·Ø£</span>
          </div>
          <div style={{ fontFamily:`"${prefs.fontAr}", Tajawal, sans-serif`, fontSize:`${prefs.fontSize}px`, lineHeight:1.7 }}>
            ØªØ³Ø¬ÙŠÙ„ Ø­Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© â€” Ù…Ø²Ø±Ø¹Ø© Ø±Ù‚Ù… 15 â€” Ø­Ø¸ÙŠØ±Ø© 3 â€” Ø§Ù„Ø¹Ù…Ø± 25 ÙŠÙˆÙ…
          </div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginTop:"4px" }}>Ø§Ù„Ù…Ø¸Ù‡Ø±: {prefs.theme} | Ø§Ù„Ø®Ø·: {prefs.fontAr} | Ø§Ù„Ø­Ø¬Ù…: {prefs.fontSize}px | Ø§Ù„Ø­ÙˆØ§Ù: {prefs.radius}</div>
        </div>
      </div>
    </div>
  );
}
